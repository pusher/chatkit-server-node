import tape from "tape"

import { validateProperties } from "../../target/src/utils.js"
import { RemoveRoomRoleForUserOptions } from "../../target/src/chatkit.js"

const TEST_TIMEOUT = 200

function test(name, f) {
  tape(name, t => {
    t.timeoutAfter(TEST_TIMEOUT)
    f(t)
  })
}

test("validateProperties", t => {
  validateProperties({userId: "foo", roomId: "bar"}, RemoveRoomRoleForUserOptions)
  t.end()
})

test("validatePropertiesUndefinedFails", t => {
  t.throws(
    () => validateProperties({user: "foo", roomId: "bar"}, RemoveRoomRoleForUserOptions),
    RegExp('Invalid value undefined supplied to : RemoveRoomRoleForUserOptions/userId: NonEmptyString'))
  t.end()
})

test("validatePropertiesNullFails", t => {
  t.throws(
    () => validateProperties({userId: "foo", roomId: null}, RemoveRoomRoleForUserOptions),
    RegExp('Invalid value null supplied to : RemoveRoomRoleForUserOptions/roomId: NonEmptyString'))
  t.end();
})

test("validatePropertiesEmptyFails", t => {
  t.throws(
    () => validateProperties({userId: "foo", roomId: ""}, RemoveRoomRoleForUserOptions),
    RegExp('Invalid value "" supplied to : RemoveRoomRoleForUserOptions/roomId: NonEmptyString'))
  t.end();
})

test("validatePropertiesWrongTypeFails", t => {
  t.throws(
    () => validateProperties({userId: "foo", roomId: 42}, RemoveRoomRoleForUserOptions),
    RegExp('Invalid value 42 supplied to : RemoveRoomRoleForUserOptions/roomId: NonEmptyString'))
  t.end();
})
