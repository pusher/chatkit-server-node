// @format

import * as tape from "tape"

import * as config from "./config/production"
import {
  default as Client,
  AuthenticationResponse,
  ErrorResponse,
} from "../src/index"

test("createUser", (t, client, end, fail) => {
  const user = randomUser()

  client
    .createUser(user)
    .then(res => {
      resemblesUser(t, res, user)
      end()
    })
    .catch(fail)
})

test("createUsers", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()

  client
    .createUsers({ users: [alice, bob] })
    .then(res => {
      t.is(res.length, 2)
      resemblesUser(t, res[0], alice)
      resemblesUser(t, res[1], bob)
      end()
    })
    .catch(fail)
})

test("uptadeUser", (t, client, end, fail) => {
  const user = randomUser()

  const updates = {
    id: user.id,
    name: randomString(),
    avatarURL: `https://${randomString()}`,
    customData: { foo: randomString(), edited: true },
  }

  client
    .createUser(user)
    .then(() => client.updateUser(updates))
    // FIXME why do we get the user back from a create, but not an update?
    .then(() => client.getUser({ id: user.id }))
    .then(res => {
      resemblesUser(t, res, updates)
      end()
    })
    .catch(fail)
})

test("deleteUser", (t, client, end, fail) => {
  const user = randomUser()

  client
    .createUser(user)
    .then(() => client.deleteUser({ userId: user.id })) // FIXME userId -> id
    .then(() => {
      client
        .getUser({ id: user.id })
        .then(() => fail("expected getUser to fail"))
        .catch(err => {
          t.is(err.status, 404)
          t.is(err.error, "services/chatkit/not_found/user_not_found")
          end()
        })
    })
    .catch(fail)
})

test("getUser", (t, client, end, fail) => {
  const user = randomUser()

  client
    .createUser(user)
    .then(() => client.getUser({ id: user.id }))
    .then(res => {
      resemblesUser(t, res, user)
      end()
    })
    .catch(fail)
})

test("getUsers", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()
  const carol = randomUser()
  const dave = randomUser()

  const users = [alice, bob, carol, dave].sort((x, y) => compare(x.id, y.id))

  Promise.all(users.map(user => client.createUser(user)))
    // FIXME getUsers should take the same pagination params as the API
    .then(() => client.getUsers())
    .then(res => {
      t.is(res.length, 4)
      res.sort((x: any, y: any) => compare(x.id, y.id))
      for (let i = 0; i < 4; i++) {
        resemblesUser(t, res[i], users[i])
      }
      end()
    })
    .catch(fail)
})

// FIXME I think this should be getUsersById
test("getUsersByIds", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()
  const carol = randomUser()
  const dave = randomUser()

  Promise.all([alice, bob, carol, dave].map(user => client.createUser(user)))
    .then(() => client.getUsersByIds({ userIds: [alice.id, carol.id] })) // FIXME userIds -> ids
    .then(res => {
      t.is(res.length, 2)

      // FIXME users should be returned in the order they were asked for
      if (res[0].id !== alice.id) {
        resemblesUser(t, res[1], alice)
        resemblesUser(t, res[0], carol)
      } else {
        resemblesUser(t, res[0], alice)
        resemblesUser(t, res[1], carol)
      }

      end()
    })
    .catch(fail)
})

test("createRoom", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()
  const carol = randomUser()

  const roomOpts = {
    creatorId: alice.id,
    name: randomString(),
    isPrivate: true,
    userIds: [bob.id, carol.id],
  }

  Promise.all([alice, bob, carol].map(user => client.createUser(user)))
    .then(() => client.createRoom(roomOpts))
    .then(res => {
      resemblesRoom(t, res, roomOpts)
      end()
    })
    .catch(fail)
})

test("updateRoom", (t, client, end, fail) => {
  const user = randomUser()

  const roomOpts = {
    creatorId: user.id,
    name: randomString(),
  }

  const updatedName = randomString()

  client
    .createUser(user)
    .then(() => client.createRoom(roomOpts))
    .then(room =>
      client
        .updateRoom({ id: room.id, name: updatedName, isPrivate: true })
        .then(() =>
          client.getRoom({
            userId: user.id, // FIXME unnecessary, remove
            roomId: room.id, // FIXME roomId -> id
          }),
        ),
    )
    .then(room => {
      resemblesRoom(t, room, {
        creatorId: user.id,
        name: updatedName,
        isPrivate: true,
        userIds: [],
      })
      end()
    })
    .catch(fail)
})

test("deleteRoom", (t, client, end, fail) => {
  const user = randomUser()

  const roomOpts = {
    creatorId: user.id,
    name: randomString(),
  }

  client
    .createUser(user)
    .then(() => client.createRoom(roomOpts))
    .then(room =>
      client
        .deleteRoom({ id: room.id })
        .then(() =>
          client.getRoom({
            userId: user.id, // FIXME unnecessary, remove
            roomId: room.id, // FIXME roomId -> id
          }),
        )
        .then(() => fail("expected getRoom to fail"))
        .catch(err => {
          t.is(err.status, 404)
          t.is(err.error, "services/chatkit/not_found/room_not_found")
          end()
        }),
    )
    .catch(fail)
})

function test(
  msg: string,
  cb: (
    t: any,
    client: Client,
    end: () => void,
    fail: (err: string) => void,
  ) => void,
): void {
  const client = new Client({
    instanceLocator: config.INSTANCE_LOCATOR,
    key: config.INSTANCE_KEY,
  })

  tape(msg, t => {
    t.timeoutAfter(10 * 1000)
    cb(
      t,
      client,
      () =>
        deleteResources(client)
          .then(() => t.end())
          .catch(err => t.fail(JSON.stringify(err))),
      err =>
        deleteResources(client)
          .then(() => t.fail(JSON.stringify(err)))
          .catch(() => t.fail(JSON.stringify(err))),
    )
  })
}

function testOnly(
  msg: string,
  cb: (
    t: any,
    client: Client,
    end: () => void,
    fail: (err: string) => void,
  ) => void,
): void {
  const client = new Client({
    instanceLocator: config.INSTANCE_LOCATOR,
    key: config.INSTANCE_KEY,
  })

  tape.only(msg, t => {
    t.timeoutAfter(10 * 1000)
    cb(
      t,
      client,
      () =>
        deleteResources(client)
          .then(() => t.end())
          .catch(err => t.fail(JSON.stringify(err))),
      err =>
        deleteResources(client)
          .then(() => t.fail(JSON.stringify(err)))
          .catch(() => t.fail(JSON.stringify(err))),
    )
  })
}

function deleteResources(client: Client): Promise<void> {
  return client.apiRequest({
    method: "DELETE",
    path: "/resources",
    jwt: client.generateAccessToken({ su: true }).token,
  })
}

function resemblesUser(t: any, actual: any, expected: User): void {
  // FIXME the SDK should do these naming translations
  // It would be nice if we exported User and Room types
  t.is(actual.id, expected.id)
  t.is(actual.name, expected.name)
  t.is(actual.avatar_url, expected.avatarURL)
  t.deepEquals(actual.custom_data, expected.customData)
  // TODO timestamps
}

function resemblesRoom(t: any, actual: any, expected: any): void {
  // FIXME the SDK should do these naming translations
  // It would be nice if we exported User and Room types
  t.is(typeof actual.id, "number")
  t.is(actual.created_by_id, expected.creatorId)
  t.is(actual.name, expected.name)
  t.is(actual.private, expected.isPrivate)
  t.deepEquals(
    actual.member_user_ids.sort(),
    [expected.creatorId, ...expected.userIds].sort(),
  )
  // TODO timestamps
}

function randomUser(): User {
  return {
    id: randomString(),
    name: randomString(),
    avatarURL: `https://${randomString()}`,
    customData: { foo: randomString() },
  }
}

function randomString(): string {
  return Math.random()
    .toString(36)
    .substring(2)
}

function compare(x: any, y: any): number {
  return x > y ? 1 : x < y ? -1 : 0
}

type User = {
  id: string
  name: string
  avatarURL?: string
  customData?: any
}
