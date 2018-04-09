# Changelog

## [0.11.0] 2018-04-09

### Changes

- All functions now take a single object as their only argument. Check the [documentation](https://docs.pusher.com/chatkit/reference/server-node) for specifics on how to make calls using the new format.

Some examples:

`authenticate` used to be called like this:

```js
chatkit.authenticate('my-user-id', { grant_type: 'client_credentials' });
```

and the new version is called like this:

```js
chatkit.authenticate({
  userId: 'my-user-id',
  authPayload: { grant_type: 'client_credentials' }
});
```

`createUser` used to be called like this:

```js
chatkit.createRoom('ham', 'New room');
```

and the new version is called like this:

```js
chatkit.createRoom({
  creatorId: 'ham',
  name: 'New room'
})
```

- `authenticate` no longer requires the `grant_type` to be specified. If no value for it is provided then it will take a default value of `client_credentials` (which was already the implicit default provided by clients)

## [0.10.0] 2018-03-12

### Changes

- Update jsonwebtoken dependency

### Additions

- Added support for `getUserRooms`
- Added support for `getUserJoinableRooms`
- Added support for `createUsers`

## [0.9.2] 2018-02-08

### Changes

- `getRoomMessages` now has a signature of `getRoomMessages(userId: string, roomId: number, options: GetRoomMessagesOptions = {})`

### Fixes

- `getRoomMessages` now generates a valid token when provided with an appropriate `userId` as the first parameter

## [0.9.1] 2018-01-26

### Additions

- Added `getRoomMessages` example

### Changes

- `getRooms` now requires a `userId` parameter, which is used to generate the token that the request is made with
- Updated `getRooms` example
- Bumped pusher-platform-node dependency to 0.11.1

## [0.9.0] 2018-01-16

### Additions

- Added `updateGlobalRoomPermissions` example

### Changes

- When using `createUser` the promise that is returned now resolves with the JSON response from the API (which contains the user information), if the request succeeds

### Removals

- Removed permissions constants and permissions checking from the SDK. The API will return a sensible error if you provide an invalid permission name

## [0.8.3] 2018-01-04

### Additions

- Support cursors permissions "cursors:read:get" and "cursors:read:set"

## [0.8.0] 2017-12-19

### Changes

- Don't parse response in apiRequest (since it isn't always JSON)

## [0.7.2] 2017-12-11

### Changes

- Add the `file:get` and `file:create` permissions to the list of supported permissions

## [0.7.1] 2017-11-23

### Fixes

- Correctly type the user id array in `getUsersByIds` as `Array<string>` instead of `Array<number>`

## [0.7.0] 2017-11-20

### Changes

- `assignRoomRoleToUser` and `assignGlobalRoleToUser` now work regardless of whether or not a role has previously been assigned for a user

### Removals

- `reassignRoomRoleForUser` and `reassignGlobalRoleForUser` were removed

## [0.6.0] 2017-11-16

### Additions

- Adds functionality to update permissions for existing roles by introducing two new functions: `updatePermissionsForRoomRole` and `updatePermissionsForGlobalRole`.

## [0.5.2] 2017-11-10

### Fixes

- Make `createRoom` work if `userIds` isn't provided or is an empty array when creating a room.

### Changes

- Make the response in the success case of room creation into an appropriate object from the body's JSON as opposed to an `IncomingMessage` object.

## [0.5.1] 2017-11-10

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
