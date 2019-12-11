# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/pusher/chatkit-server-node/compare/2.2.0...HEAD)

## [2.4.0](https://github.com/pusher/chatkit-server-node/compare/2.2.0...2.4.0)

### Additions
- Adds message editing via `edit{Simple,Multipart,}Message`.

## 2.3.0 Yanked

## [2.2.0](https://github.com/pusher/chatkit-server-node/compare/2.1.1...2.2.0)

### Additions

- Support for fetching a message by its message ID, via `fetchMultipartMessage`.

## [2.1.1](https://github.com/pusher/chatkit-server-node/compare/2.1.0...2.1.1)

- Fix `updateRoom` privacy not updating when `isPrivate` value is `false`

## [2.1.0](https://github.com/pusher/chatkit-server-node/compare/2.0.1...2.1.0)

### Additions

- Support for `PushNotificationTitleOverride` attribute in the Room model

### Changes

- Bump minimum lodash version for security concerns

## [2.0.1](https://github.com/pusher/chatkit-server-node/compare/2.0.0...2.0.1)

### Fixes

- Don't send unnecessary query parameters in fetch messages methods

## [2.0.0](https://github.com/pusher/chatkit-server-node/compare/1.3.0...2.0.0)

### Additions

- Support for user specified room IDs. Provide an `id` parameter to the
  `createRoom` method.

### Changes

- The `deleteMessage` method now _requires_ a room ID parameter, `roomID`, and
  the `id` parameter has been renamed to `messageId` to avoid ambiguity.

[1.3.0](https://github.com/pusher/chatkit-server-ruby/compare/1.2.0...1.3.0) - 2019-06-24

### Changed

- Unread counts. No new methods are added, but `getUserRooms` now include `unread_count` and `last_message_at` in the response

## [1.2.0](https://github.com/pusher/chatkit-server-node/compare/1.1.0...1.2.0)

### Additions

- Async deletion methods. `asyncDeleteUser`, `getDeleteUserStatus`,
  `asyncDeleteRoom`, `getDeleteRoomStatus`. The `deleteRoom` and `deleteUser`
  methods should be considered deprecated, and will be removed in a future
  version.

## [1.1.0](https://github.com/pusher/chatkit-server-node/compare/1.0.6...1.1.0)

### Changes

- Multipart message support: `sendSimpleMessage`, `sendMultipartMessage`,
  `fetchMultipartMessages` all deal in the multipart message format.

## [1.0.6](https://github.com/pusher/chatkit-server-node/compare/1.0.5...1.0.6)

- Keep HTTP connections alive.

## [1.0.5](https://github.com/pusher/chatkit-server-node/compare/1.0.4...1.0.5)

- Upgrade dependencies to avoid vulnerabilities

## [1.0.4](https://github.com/pusher/chatkit-server-node/compare/1.0.3...1.0.4)

### Additions

- `CreateRoom` and `UpdateRoom` both now support the `customData` option.

## [1.0.3](https://github.com/pusher/chatkit-server-node/compare/1.0.2...1.0.3) - 2018-11-06

- Update pusher platform node dependency for vulnerabilities in transient deps

## [1.0.2](https://github.com/pusher/chatkit-server-node/compare/1.0.1...1.0.2)

### Changes

- Bump pusher-platform-node dependency to 0.15.0
- Clean up npm package to only include what is necessary

## [1.0.1](https://github.com/pusher/chatkit-server-node/compare/1.0.0...1.0.1)

### Fixes

- 1.0.0 was published empty, so 1.0.1 is an identical release, but not empty

## [1.0.0](https://github.com/pusher/chatkit-server-node/compare/0.12.1...1.0.0)

### Breaking Changes

- room IDs are now strings
- `getUsersByIds` is now `getUsersById`
- `GetUsersByIdsOptions` is now `GetUsersByIdOptions`
- Every mention of `roleName` is now just `name`

### Nonbreaking Changes

- `getRoom`, `getRooms` and `getRoomMessages` no longer require a `userId`
- `getRooms` now takes `includePrivate` and `fromID` parameters for looking up private rooms and paginating by ID

### Additions

- The following new methods:
  - `getUser`
  - `sendMessage`
  - `deleteMessage`
  - `updateRoom`
  - `deleteRoom`
  - `addUsersToRoom`
  - `removeUsersFromRoom`
  - `setReadCursor`
  - `getReadCursor`
  - `getReadCursorsForUser`
  - `getReadCursorsForRoom`
  - `cursorsRequest`

See the documentation for details on usage.

## [0.12.2](https://github.com/pusher/chatkit-server-node/compare/0.12.1...0.12.2) - 2018-07-23

### Changes

- Bump jsonwebtoken dependency to 8.3.0

## [0.12.1](https://github.com/pusher/chatkit-server-node/compare/0.12.0...0.12.1) - 2018-04-24

### Changes

- The package name has been changed to `@pusher/chatkit-server`

## [0.12.0](https://github.com/pusher/chatkit-server-node/compare/0.11.2...0.12.0) - 2018-04-23

### Changes

- Bump pusher-platform-node dependency to 0.13.0
- `authenticate` now returns an object like this:

```js
{
    "status": 200,
    "headers": {
        "Some-Header": "some-value"
    },
    "body": {
        "access_token": "an.access.token",
        "token_type": "bearer",
        "expires_in": 86400
    }
}
```

where:

- `status` is the suggested HTTP response status code,
- `headers` are the suggested response headers,
- `body` holds the token payload.

If there's an error with the authentication process then the return value will be the same but with a different `body`. For example:

```js
{
    "status": 422,
    "headers": {
        "Some-Header": "some-value"
    },
    "body": {
        "error": "token_provider/invalid_grant_type",
        "error_description": "The grant_type provided, some-invalid-grant-type, is unsupported"
    }
}
```

- Authentication no longer returns refresh tokens.

If your client devices are running the:

- Swift SDK - (**breaking change**) you must be using version `>= 0.8.0` of [chatkit-swift](https://github.com/pusher/chatkit-swift).
- Android SDK - you won't be affected regardless of which version you are running.
- JS SDK - you won't be affected regardless of which version you are running.

## [0.11.2](https://github.com/pusher/chatkit-server-node/compare/0.11.1...0.11.2) - 2018-04-17

### Additions

- Added `update_user` function and example

## [0.11.1](https://github.com/pusher/chatkit-server-node/compare/0.11.0...0.11.1) - 2018-04-10

### Fixes

- Fix `createUser` to work with `avatarURL` and `customData`

## [0.11.0](https://github.com/pusher/chatkit-server-node/compare/0.10.0...0.11.0) - 2018-04-09

### Changes

- All functions now take a single object as their only argument. Check the [documentation](https://docs.pusher.com/chatkit/reference/server-node) for specifics on how to make calls using the new format.

Some examples:

`authenticate` used to be called like this:

```js
chatkit.authenticate("my-user-id", { grant_type: "client_credentials" })
```

and the new version is called like this:

```js
chatkit.authenticate({
  userId: "my-user-id",
  authPayload: { grant_type: "client_credentials" },
})
```

`createUser` used to be called like this:

```js
chatkit.createRoom("ham", "New room")
```

and the new version is called like this:

```js
chatkit.createRoom({
  creatorId: "ham",
  name: "New room",
})
```

- `authenticate` no longer requires the `grant_type` to be specified. If no value for it is provided then it will take a default value of `client_credentials` (which was already the implicit default provided by clients)

## [0.10.0](https://github.com/pusher/chatkit-server-node/compare/0.9.2...0.10.0) - 2018-03-12

### Changes

- Update jsonwebtoken dependency

### Additions

- Added support for `getUserRooms`
- Added support for `getUserJoinableRooms`
- Added support for `createUsers`

## [0.9.2](https://github.com/pusher/chatkit-server-node/compare/0.9.1...0.9.2) - 2018-02-08

### Changes

- `getRoomMessages` now has a signature of `getRoomMessages(userId: string, roomId: number, options: GetRoomMessagesOptions = {})`

### Fixes

- `getRoomMessages` now generates a valid token when provided with an appropriate `userId` as the first parameter

## [0.9.1](https://github.com/pusher/chatkit-server-node/compare/0.9.0...0.9.1) - 2018-01-26

### Additions

- Added `getRoomMessages` example

### Changes

- `getRooms` now requires a `userId` parameter, which is used to generate the token that the request is made with
- Updated `getRooms` example
- Bumped pusher-platform-node dependency to 0.11.1

## [0.9.0](https://github.com/pusher/chatkit-server-node/compare/0.8.3...0.9.0) - 2018-01-16

### Additions

- Added `updateGlobalRoomPermissions` example

### Changes

- When using `createUser` the promise that is returned now resolves with the JSON response from the API (which contains the user information), if the request succeeds

### Removals

- Removed permissions constants and permissions checking from the SDK. The API will return a sensible error if you provide an invalid permission name

## [0.8.3](https://github.com/pusher/chatkit-server-node/compare/0.8.2...0.8.3) - 2018-01-04

### Additions

- Support cursors permissions "cursors:read:get" and "cursors:read:set"

## [0.8.0](https://github.com/pusher/chatkit-server-node/compare/0.7.2...0.8.0) - 2017-12-19

### Changes

- Don't parse response in apiRequest (since it isn't always JSON)

## [0.7.2](https://github.com/pusher/chatkit-server-node/compare/0.7.1...0.7.2) - 2017-12-11

### Changes

- Add the `file:get` and `file:create` permissions to the list of supported permissions

## [0.7.1](https://github.com/pusher/chatkit-server-node/compare/0.7.0...0.7.1) - 2017-11-23

### Fixes

- Correctly type the user id array in `getUsersByIds` as `Array<string>` instead of `Array<number>`

## [0.7.0](https://github.com/pusher/chatkit-server-node/compare/0.6.0...0.7.0) - 2017-11-20

### Changes

- `assignRoomRoleToUser` and `assignGlobalRoleToUser` now work regardless of whether or not a role has previously been assigned for a user

### Removals

- `reassignRoomRoleForUser` and `reassignGlobalRoleForUser` were removed

## [0.6.0](https://github.com/pusher/chatkit-server-node/compare/0.5.2...0.6.0) - 2017-11-16

### Additions

- Adds functionality to update permissions for existing roles by introducing two new functions: `updatePermissionsForRoomRole` and `updatePermissionsForGlobalRole`.

## [0.5.2](https://github.com/pusher/chatkit-server-node/compare/0.5.1...0.5.2) - 2017-11-10

### Fixes

- Make `createRoom` work if `userIds` isn't provided or is an empty array when creating a room.

### Changes

- Make the response in the success case of room creation into an appropriate object from the body's JSON as opposed to an `IncomingMessage` object.

## [0.5.1](https://github.com/pusher/chatkit-server-node/compare/0.5.0...0.5.1) - 2017-11-10

### Changes

- `createRoom` now takes a `CreateRoomOptions` object as its second parameter. This allows creating private rooms and adding users to a room at the point of creation. This looks like:

```js
chatkit.createRoom(
  'user_id_creating_room',
  {
    name: 'my room',
    isPrivate: true,
    userIds: ['some_other_user', 'and_another']
  }
).then(() => {
  ...
}
```
