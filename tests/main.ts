// @format

import * as tape from "tape"

import * as config from "./config/production"
import {
  default as Client,
  AuthenticationResponse,
  ErrorResponse,
} from "../src/index"

function test(
  msg: string,
  cb: (t: any, pass: () => void, fail: (err: string) => void) => void,
): void {
  tape(msg, { timeout: 10 * 1000 }, t => {
    cb(
      t,
      () =>
        deleteResources()
          .then(() => t.end())
          .catch(err => t.fail(err)),
      err =>
        deleteResources()
          .then(() => t.fail(err))
          .catch(() => t.fail(err)),
    )
  })
}

function deleteResources(): Promise<void> {
  const client = newClient()
  return client.apiRequest({
    method: "DELETE",
    path: "/resources",
    jwt: client.generateAccessToken({ su: true }).token,
  })
}

test("createUser", (t, pass, fail) => {
  const user = randomUser()

  newClient()
    .createUser(user)
    .then(res => {
      t.is(res.id, user.id)
      t.is(res.name, user.name)
      t.is(res.avatar_url, user.avatarURL) // FIXME naming
      t.is(res.custom_data, user.customData) // FIXME naming
      // TODO timestamps
      pass()
    })
    .catch(fail)
})

function newClient(): Client {
  return new Client({
    instanceLocator: config.INSTANCE_LOCATOR,
    key: config.INSTANCE_KEY,
  })
}

function randomUser(): User {
  return {
    id: randomString(),
    name: randomString(),
  }
}

function randomString(): string {
  return Math.random()
    .toString(36)
    .substring(2)
}

// TYPES (these should probably live in the SDK proper)

type User = {
  id: string
  name: string
  avatarURL?: string
  customData?: any
}
