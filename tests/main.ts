// @format

import * as tape from "tape"

import * as config from "./config/production"
import {
  default as Client,
  AuthenticationResponse,
  ErrorResponse,
} from "../src/index"

// README
//
// To run the tests, `./config/production.ts` must be provided, see
// `./config/example.ts`. To run any single test in isolation, replace
// `test(...)` with `testOnly(...)`.
//
// Explanation of parameters passed in to each test:
//
// - `t` is the tape test handle, see https://github.com/substack/tape
//
// - `client` is an instantiated Chatkit server client (uhh...)
//
// - `end()` must be called at the end of the happy path of each test, failure
//   to do so will result in a timeout.
//
// - `fail(err)` fails the test immediately with an error. It is an error to
//   also call `end()`

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
  // FIXME getUsers should take the same pagination params as the API
  const alice = randomUser()
  const bob = randomUser()
  const carol = randomUser()
  const dave = randomUser()

  const users = [alice, bob, carol, dave].sort(compareBy("id"))

  Promise.all(users.map(user => client.createUser(user)))
    .then(() => client.getUsers())
    .then(res => {
      t.is(res.length, 4)
      res.sort(compareBy("id"))
      for (let i = 0; i < 4; i++) {
        resemblesUser(t, res[i], users[i])
      }
      end()
    })
    .catch(fail)
})

test("getUsersByIds", (t, client, end, fail) => {
  // FIXME I think this should be getUsersById
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
      resemblesRoom(t, res, {
        creatorId: alice.id,
        name: roomOpts.name,
        isPrivate: true,
        memberIds: [alice.id, bob.id, carol.id],
      })
      end()
    })
    .catch(fail)
})

test("updateRoom", (t, client, end, fail) => {
  const user = randomUser()

  const roomOpts = { creatorId: user.id, name: randomString() }

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
        )
        .then(res => {
          resemblesRoom(t, res, {
            id: room.id,
            creatorId: user.id,
            name: updatedName,
            isPrivate: true,
            memberIds: [user.id],
          })
          end()
        }),
    )
    .catch(fail)
})

test("deleteRoom", (t, client, end, fail) => {
  const user = randomUser()

  const roomOpts = { creatorId: user.id, name: randomString() }

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

test("getRoom", (t, client, end, fail) => {
  const user = randomUser()

  const roomOpts = { creatorId: user.id, name: randomString() }

  client
    .createUser(user)
    .then(() => client.createRoom(roomOpts))
    .then(room =>
      client
        .getRoom({
          userId: user.id, // FIXME unnecessary, remove
          roomId: room.id, // FIXME roomId -> id
        })
        .then(res => {
          resemblesRoom(t, res, {
            id: room.id,
            creatorId: user.id,
            name: roomOpts.name,
            memberIds: [user.id],
          })
          end()
        }),
    )
    .catch(fail)
})

test("getRooms", (t, client, end, fail) => {
  // FIXME getUsers should take the same pagination params as the API
  const user = randomUser()

  const roomOpts = [
    { creatorId: user.id, name: randomString() },
    { creatorId: user.id, name: randomString() },
    { creatorId: user.id, name: randomString() },
  ].sort(compareBy("name"))

  client
    .createUser(user)
    .then(() =>
      Promise.all(roomOpts.map(ro => client.createRoom(ro))).then(rooms =>
        client.getRooms({ userId: user.id }).then(res => {
          rooms.sort(compareBy("name"))
          res.sort(compareBy("name"))

          t.is(res.length, 3)
          for (let i = 0; i < 3; i++) {
            resemblesRoom(t, res[i], {
              id: rooms[i].id,
              creatorId: user.id,
              name: roomOpts[i].name,
            })
          }
          end()
        }),
      ),
    )
    .catch(fail)
})

test("getUserRooms", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()

  Promise.all([alice, bob].map(user => client.createUser(user)))
    .then(() =>
      Promise.all([
        client.createRoom({
          creatorId: bob.id,
          name: randomString(),
        }),
        client.createRoom({
          creatorId: alice.id,
          name: randomString(),
          userIds: [bob.id],
        }),
        client.createRoom({
          creatorId: alice.id,
          name: randomString(),
        }),
      ]),
    )
    .then(([roomA, roomB, roomC]) =>
      client.getUserRooms({ userId: bob.id }).then(res => {
        // bob is only a member of the first two rooms
        const expectedRooms = [roomA, roomB].sort(compareBy("id"))
        res.sort(compareBy("id"))

        t.is(res.length, 2)
        for (let i = 0; i < 2; i++) {
          resemblesRoom(t, res[i], {
            id: expectedRooms[i].id,
            creatorId: expectedRooms[i].created_by_id,
            name: expectedRooms[i].name,
          })
        }
        end()
      }),
    )
    .catch(fail)
})

test("getUserJoinableRooms", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()

  Promise.all([alice, bob].map(user => client.createUser(user)))
    .then(() =>
      Promise.all([
        client.createRoom({
          creatorId: alice.id,
          name: randomString(),
          userIds: [bob.id],
        }),
        client.createRoom({
          creatorId: alice.id,
          name: randomString(),
        }),
        client.createRoom({
          creatorId: alice.id,
          name: randomString(),
          isPrivate: true,
        }),
      ]),
    )
    .then(([roomA, roomB, roomC]) =>
      client.getUserJoinableRooms({ userId: bob.id }).then(res => {
        // roomB is the only room that bob can join
        t.is(res.length, 1)
        resemblesRoom(t, res[0], {
          id: roomB.id,
          creatorId: roomB.created_by_id,
          name: roomB.name,
        })
        end()
      }),
    )
    .catch(fail)
})

test("addUsersToRoom", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()

  Promise.all([alice, bob].map(user => client.createUser(user)))
    .then(() =>
      client.createRoom({
        creatorId: alice.id,
        name: randomString(),
      }),
    )
    .then(room =>
      client
        .addUsersToRoom({ roomId: room.id, userIds: [bob.id] })
        .then(() =>
          client.getRoom({
            userId: alice.id, // FIXME unnecessary, remove
            roomId: room.id, // FIXME roomId -> id
          }),
        )
        .then(res => {
          resemblesRoom(t, res, {
            id: room.id,
            creatorId: alice.id,
            name: room.name,
            memberIds: [alice.id, bob.id],
          })
          end()
        }),
    )
    .catch(fail)
})

test("removeUsersFromRoom", (t, client, end, fail) => {
  const user = randomUser()

  client
    .createUser(user)
    .then(() =>
      client.createRoom({
        creatorId: user.id,
        name: randomString(),
      }),
    )
    .then(room =>
      client
        .removeUsersFromRoom({ roomId: room.id, userIds: [user.id] })
        .then(() =>
          client.getRoom({
            userId: user.id, // FIXME unnecessary, remove
            roomId: room.id, // FIXME roomId -> id
          }),
        )
        .then(res => {
          resemblesRoom(t, res, {
            id: room.id,
            creatorId: user.id,
            name: room.name,
            memberIds: [],
          })
          end()
        }),
    )
    .catch(fail)
})

test("sendMessage", (t, client, end, fail) => {
  const user = randomUser()
  const messageText = randomString()

  client
    .createUser(user)
    .then(() =>
      client.createRoom({
        creatorId: user.id,
        name: randomString(),
      }),
    )
    .then(room =>
      client
        .sendMessage({
          userId: user.id,
          roomId: room.id,
          text: messageText,
        })
        .then(({ message_id: messageId }) =>
          client
            .getRoomMessages({
              userId: user.id, // FIXME remove
              roomId: room.id,
            })
            .then(res => {
              t.is(res.length, 1)
              t.is(res[0].id, messageId)
              t.is(res[0].room_id, room.id)
              t.is(res[0].text, messageText)
              end()
            }),
        ),
    )
    .catch(fail)
})

function test(
  msg: string,
  cb: (
    t: any,
    client: Client,
    end: () => void,
    fail: (err: any) => void,
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
          .catch(err => t.end(JSON.stringify(err))),
      err =>
        deleteResources(client)
          .then(() => t.end(JSON.stringify(err)))
          .catch(() => t.end(JSON.stringify(err))),
    )
  })
}

// Only run this test, all others will be ignored.
function testOnly(
  msg: string,
  cb: (
    t: any,
    client: Client,
    end: () => void,
    fail: (err: any) => void,
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
          .catch(err => t.end(JSON.stringify(err))),
      err =>
        deleteResources(client)
          .then(() => t.end(JSON.stringify(err)))
          .catch(() => t.end(JSON.stringify(err))),
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
}

function resemblesRoom(t: any, actual: any, expected: any): void {
  // FIXME the SDK should do these naming translations
  // It would be nice if we exported User and Room types
  if (expected.id) {
    t.is(actual.id, expected.id)
  } else {
    t.is(typeof actual.id, "number")
  }
  t.is(actual.created_by_id, expected.creatorId)
  t.is(actual.name, expected.name)
  t.is(actual.private, !!expected.isPrivate)
  if (expected.memberIds) {
    t.deepEquals(actual.member_user_ids.sort(), expected.memberIds.sort())
  }
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

function compareBy(key: string) {
  return (x: any, y: any) => (x[key] > y[key] ? 1 : x[key] < y[key] ? -1 : 0)
}

type User = {
  id: string
  name: string
  avatarURL?: string
  customData?: any
}
