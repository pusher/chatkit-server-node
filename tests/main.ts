import tape from "tape"
import { get } from "got"

import {
  default as Client,
  AuthenticationResponse,
  ErrorResponse,
} from "../src/index"

import { INSTANCE_LOCATOR, INSTANCE_KEY } from "./config/production"

const TEST_TIMEOUT = 15 * 1000
const DELETE_RESOURCES_PAUSE = 0

let instanceLocator: string
let key: string

let clientConfig = {
  instanceLocator: INSTANCE_LOCATOR,
  key: INSTANCE_KEY,
}

// README
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
    .then(() => client.deleteUser({ userId: user.id }))
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
  const pair1 = [randomUser(), randomUser()].sort(compareBy("id"))
  const pair2 = [randomUser(), randomUser()].sort(compareBy("id"))

  Promise.all(pair1.map(user => client.createUser(user)))
    .then(() => resolveAfter(1000))
    .then(() => Promise.all(pair2.map(user => client.createUser(user))))
    .then(([{ created_at }]) =>
      client
        .getUsers({ limit: 2 })
        .then(res => {
          t.is(res.length, 2)
          res.sort(compareBy("id"))
          for (let i = 0; i < 2; i++) {
            resemblesUser(t, res[i], pair1[i])
          }
          return client.getUsers({ fromTimestamp: created_at })
        })
        .then(res => {
          t.is(res.length, 2)
          res.sort(compareBy("id"))
          for (let i = 0; i < 2; i++) {
            resemblesUser(t, res[i], pair2[i])
          }
          end()
        }),
    )
    .catch(fail)
})

test("getUsersById", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()
  const carol = randomUser()
  const dave = randomUser()

  Promise.all([alice, bob, carol, dave].map(user => client.createUser(user)))
    .then(() => client.getUsersById({ userIds: [alice.id, carol.id] }))
    .then(res => {
      t.is(res.length, 2)

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
    customData: { foo: 42 },
  }

  Promise.all([alice, bob, carol].map(user => client.createUser(user)))
    .then(() => client.createRoom(roomOpts))
    .then(res => {
      resemblesRoom(t, res, {
        creatorId: alice.id,
        name: roomOpts.name,
        isPrivate: true,
        memberIds: [alice.id, bob.id, carol.id],
        customData: { foo: 42 },
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
        .updateRoom({
          id: room.id,
          name: updatedName,
          isPrivate: true,
          customData: { bar: "baz" },
        })
        .then(() =>
          client.getRoom({
            roomId: room.id,
          }),
        )
        .then(res => {
          resemblesRoom(t, res, {
            id: room.id,
            creatorId: user.id,
            name: updatedName,
            isPrivate: true,
            memberIds: [user.id],
            customData: { bar: "baz" },
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
      client.deleteRoom({ id: room.id }).then(() =>
        client
          .getRoom({
            roomId: room.id,
          })
          .then(() => fail("expected getRoom to fail"))
          .catch(err => {
            t.is(err.status, 404)
            t.is(err.error, "services/chatkit/not_found/room_not_found")
            end()
          }),
      ),
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
          roomId: room.id,
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
  const user = randomUser()

  const roomNames: Array<string> = []
  for (let i = 0; i < 10; i++) {
    roomNames.push(randomString())
  }

  client
    .createUser(user)
    .then(() =>
      Promise.all(
        roomNames.map(name =>
          client.createRoom({ creatorId: user.id, name, isPrivate: true }),
        ),
      ).then(rooms => {
        const roomIds = rooms.map(r => r.id).sort()
        return client
          .getRooms()
          .then(res => {
            t.is(res.length, 0)
          })
          .then(() => client.getRooms({ includePrivate: true }))
          .then(res => {
            t.deepEqual(res.map((r: any) => r.id).sort(), roomIds)
            end()
          })
      }),
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
            roomId: room.id,
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
            roomId: room.id,
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
              roomId: room.id,
            })
            .then(res => {
              t.is(res.length, 1)
              t.is(res[0].id, messageId)
              t.is(res[0].user_id, user.id)
              t.is(res[0].room_id, room.id)
              t.is(res[0].text, messageText)
              end()
            }),
        ),
    )
    .catch(fail)
})

test("sendSimpleMessage", (t, client, end, fail) => {
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
        .sendSimpleMessage({
          userId: user.id,
          roomId: room.id,
          text: messageText,
        })
        .then(({ message_id: messageId }) =>
          client
            .getRoomMessages({
              roomId: room.id,
            })
            .then(res => {
              t.is(res.length, 1)
              t.is(res[0].id, messageId)
              t.is(res[0].user_id, user.id)
              t.is(res[0].room_id, room.id)
              t.is(res[0].text, messageText)
              end()
            }),
        ),
    )
    .catch(fail)
})

test("sendMultipartMessage (url, v3 to v2)", (t, client, end, fail) => {
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
        .sendMultipartMessage({
          userId: user.id,
          roomId: room.id,
          parts: [
            { type: "text/plain", content: messageText },
            { type: "image/kitten", url: "https://placekitten.com/200/300" },
          ],
        })
        .then(({ message_id: messageId }) =>
          client
            .getRoomMessages({
              roomId: room.id,
            })
            .then(res => {
              t.is(res.length, 1)
              t.is(res[0].id, messageId)
              t.is(res[0].user_id, user.id)
              t.is(res[0].room_id, room.id)
              t.is(res[0].text, messageText)
              t.is(
                res[0].attachment.resource_link,
                "https://placekitten.com/200/300",
              )
              t.is(res[0].attachment.type, "image")
              end()
            }),
        ),
    )
    .catch(fail)
})

test("sendMultipartMessage (attachment, v3 to v2)", (t, client, end, fail) => {
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
        .sendMultipartMessage({
          userId: user.id,
          roomId: room.id,
          parts: [
            { type: "text/plain", content: messageText },
            {
              type: "application/json",
              file: Buffer.from(JSON.stringify({ hello: "world" })),
              name: "file:///with/slashes and spaces.json",
              customData: { foo: "bar" },
            },
          ],
        })
        .then(({ message_id: messageId }) =>
          client
            .getRoomMessages({
              roomId: room.id,
            })
            .then(res => {
              t.is(res.length, 1)
              t.is(res[0].id, messageId)
              t.is(res[0].user_id, user.id)
              t.is(res[0].room_id, room.id)
              t.is(res[0].text, messageText)
              t.is(res[0].attachment.type, "file")
              t.ok(res[0].attachment.resource_link)
              return get(res[0].attachment.resource_link).then(res => {
                t.deepEqual(JSON.parse(res.body), { hello: "world" })
                end()
              })
            }),
        ),
    )
    .catch(fail)
})

test("sendMessage with attachment", (t, client, end, fail) => {
  const user = randomUser()
  const messageText = randomString()
  const attachmentLink = "https://placekitten.com/200/300"
  const attachmentType = "image"

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
          attachment: {
            resourceLink: attachmentLink,
            type: attachmentType,
          },
        })
        .then(({ message_id: messageId }) =>
          client
            .getRoomMessages({
              roomId: room.id,
            })
            .then(res => {
              t.is(res.length, 1)
              t.is(res[0].id, messageId)
              t.is(res[0].user_id, user.id)
              t.is(res[0].room_id, room.id)
              t.is(res[0].text, messageText)
              t.is(res[0].attachment.resource_link, attachmentLink)
              t.is(res[0].attachment.type, attachmentType)
              end()
            }),
        ),
    )
    .catch(fail)
})

test("getRoomMessages", (t, client, end, fail) => {
  const user = randomUser()
  const messageTextA = randomString()
  const messageTextB = randomString()
  const messageTextC = randomString()
  const messageTextD = randomString()

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
          text: messageTextA,
        })
        .then(() =>
          client.sendMessage({
            userId: user.id,
            roomId: room.id,
            text: messageTextB,
          }),
        )
        .then(() =>
          client.sendMessage({
            userId: user.id,
            roomId: room.id,
            text: messageTextC,
          }),
        )
        .then(() =>
          client.sendMessage({
            userId: user.id,
            roomId: room.id,
            text: messageTextD,
          }),
        )
        .then(() =>
          client.getRoomMessages({
            roomId: room.id,
            limit: 2,
          }),
        )
        .then(res => {
          t.is(res.length, 2)
          t.is(res[0].text, messageTextD)
          t.is(res[1].text, messageTextC)

          return client.getRoomMessages({
            roomId: room.id,
            initialId: res[1].id,
          })
        })
        .then(res => {
          t.is(res.length, 2)
          t.is(res[0].text, messageTextB)
          t.is(res[1].text, messageTextA)
          end()
        }),
    )
    .catch(fail)
})

test("fetchMultipartMessages", (t, client, end, fail) => {
  const user = randomUser()
  const messageTextA = randomString()
  const messageTextB = randomString()
  const messageTextC = randomString()
  const messageTextD = randomString()

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
        .sendSimpleMessage({
          userId: user.id,
          roomId: room.id,
          text: messageTextA,
        })
        .then(() =>
          client.sendSimpleMessage({
            userId: user.id,
            roomId: room.id,
            text: messageTextB,
          }),
        )
        .then(() =>
          client.sendSimpleMessage({
            userId: user.id,
            roomId: room.id,
            text: messageTextC,
          }),
        )
        .then(() =>
          client.sendSimpleMessage({
            userId: user.id,
            roomId: room.id,
            text: messageTextD,
          }),
        )
        .then(() =>
          client.fetchMultipartMessages({
            roomId: room.id,
            limit: 2,
          }),
        )
        .then(res => {
          t.is(res.length, 2)
          t.is(res[0].parts.length, 1)
          t.is(res[0].parts[0].type, "text/plain")
          t.is(res[0].parts[0].content, messageTextD)
          t.is(res[1].parts.length, 1)
          t.is(res[1].parts[0].type, "text/plain")
          t.is(res[1].parts[0].content, messageTextC)

          return client.fetchMultipartMessages({
            roomId: room.id,
            initialId: res[1].id,
          })
        })
        .then(res => {
          t.is(res.length, 2)
          t.is(res[0].parts.length, 1)
          t.is(res[0].parts[0].type, "text/plain")
          t.is(res[0].parts[0].content, messageTextB)
          t.is(res[1].parts.length, 1)
          t.is(res[1].parts[0].type, "text/plain")
          t.is(res[1].parts[0].content, messageTextA)
          end()
        }),
    )
    .catch(fail)
})

test("deleteMessage", (t, client, end, fail) => {
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
        .then(({ message_id: id }) => client.deleteMessage({ id }))
        .then(() =>
          client
            .getRoomMessages({
              roomId: room.id,
            })
            .then(res => {
              t.is(res.length, 1)
              t.is(res[0].room_id, room.id)
              t.is(res[0].user_id, user.id)
              t.is(res[0].text, "DELETED")
              end()
            }),
        ),
    )
    .catch(fail)
})

test("setReadCursor & getReadCursor", (t, client, end, fail) => {
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
        .setReadCursor({
          userId: user.id,
          roomId: room.id,
          position: 42,
        })
        .then(() =>
          client.getReadCursor({
            userId: user.id,
            roomId: room.id,
          }),
        )
        .then(res => {
          t.is(res.position, 42)
          t.is(res.room_id, room.id)
          t.is(res.cursor_type, 0)
          t.is(res.user_id, user.id)
          end()
        }),
    )
    .catch(fail)
})

test("getReadCursorsForUser", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()

  Promise.all([alice, bob].map(u => client.createUser(u)))
    .then(() =>
      Promise.all(
        [alice, bob].map(u =>
          client.createRoom({
            creatorId: u.id,
            name: randomString(),
            userIds: [alice.id, bob.id],
          }),
        ),
      ),
    )
    .then(([room1, room2]) =>
      Promise.all([
        client.setReadCursor({
          userId: alice.id,
          roomId: room1.id,
          position: 111,
        }),
        client.setReadCursor({
          userId: alice.id,
          roomId: room2.id,
          position: 222,
        }),
        client.setReadCursor({
          userId: bob.id,
          roomId: room1.id,
          position: 333,
        }),
        client.setReadCursor({
          userId: bob.id,
          roomId: room2.id,
          position: 444,
        }),
      ])
        .then(() =>
          client.getReadCursorsForUser({
            userId: alice.id,
          }),
        )
        .then(res => {
          t.deepEqual(res.map((c: any) => c.position).sort(), [111, 222])
          end()
        }),
    )
    .catch(fail)
})

test("getReadCursorsForRoom", (t, client, end, fail) => {
  const alice = randomUser()
  const bob = randomUser()

  Promise.all([alice, bob].map(u => client.createUser(u)))
    .then(() =>
      Promise.all(
        [alice, bob].map(u =>
          client.createRoom({
            creatorId: u.id,
            name: randomString(),
            userIds: [alice.id, bob.id],
          }),
        ),
      ),
    )
    .then(([room1, room2]) =>
      Promise.all([
        client.setReadCursor({
          userId: alice.id,
          roomId: room1.id,
          position: 111,
        }),
        client.setReadCursor({
          userId: alice.id,
          roomId: room2.id,
          position: 222,
        }),
        client.setReadCursor({
          userId: bob.id,
          roomId: room1.id,
          position: 333,
        }),
        client.setReadCursor({
          userId: bob.id,
          roomId: room2.id,
          position: 444,
        }),
      ])
        .then(() =>
          client.getReadCursorsForRoom({
            roomId: room1.id,
          }),
        )
        .then(res => {
          t.deepEqual(res.map((c: any) => c.position).sort(), [111, 333])
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
    fail: (err: any) => void,
  ) => void,
): void {
  const client = new Client(clientConfig)

  tape(msg, t => {
    t.timeoutAfter(TEST_TIMEOUT)
    cb(
      t,
      client,
      () =>
        deleteResources(client)
          .then(() => t.end())
          .catch(err => t.end(err)),
      err =>
        deleteResources(client)
          .then(() => t.end(err))
          .catch(() => t.end(err)),
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
  const client = new Client(clientConfig)

  tape.only(msg, t => {
    t.timeoutAfter(10 * 1000)
    cb(
      t,
      client,
      () =>
        deleteResources(client)
          .then(() => t.end())
          .catch(err => t.end(err)),
      err =>
        deleteResources(client)
          .then(() => t.end(err))
          .catch(() => t.end(err)),
    )
  })
}

function deleteResources(client: Client): Promise<void> {
  return (
    client
      .apiRequest({
        method: "DELETE",
        path: "/resources",
        jwt: client.generateAccessToken({ su: true }).token,
      })
      // DELETE /resources happens asynchronously, so pause for a moment to
      // give it a chance to finish.
      .then(() => resolveAfter(DELETE_RESOURCES_PAUSE))
  )
}

function resolveAfter(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

function resemblesUser(t: any, actual: any, expected: User): void {
  t.is(actual.id, expected.id)
  t.is(actual.name, expected.name)
  t.is(actual.avatar_url, expected.avatarURL)
  t.deepEquals(actual.custom_data, expected.customData)
}

function resemblesRoom(t: any, actual: any, expected: any): void {
  if (expected.id) {
    t.is(actual.id, expected.id)
  } else {
    t.is(typeof actual.id, "string")
  }
  t.is(actual.created_by_id, expected.creatorId)
  t.is(actual.name, expected.name)
  t.is(actual.private, !!expected.isPrivate)
  if (expected.memberIds) {
    t.deepEquals(actual.member_user_ids.sort(), expected.memberIds.sort())
  }
  if (expected.customData) {
    t.deepEquals(actual.custom_data, expected.customData)
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
