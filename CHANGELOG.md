# Changelog

## [v0.9.1] 2018-01-26

### Additions

- Added `getRoomMessages` example

### Changes

- `getRooms` now requires a `userId` parameter, which is used to generate the token that the request is made with
- Updated `getRooms` example
- Bumped pusher-platform-node dependency to 0.11.1

## [v0.9.0] 2018-01-16

### Additions

- Added `updateGlobalRoomPermissions` example

### Changes

- When using `createUser` the promise that is returned now resolves with the JSON response from the API (which contains the user information), if the request succeeds


### Removals

- Removed permissions constants and permissions checking from the SDK. The API will return a sensible error if you provide an invalid permission name

## [v0.8.3] 2018-01-04

### Additions

- Support cursors permissions "cursors:read:get" and "cursors:read:set"

## [v0.8.0] 2017-12-19

### Changes

- Don't parse response in apiRequest (since it isn't always JSON)

## [v0.7.2] 2017-12-11

### Changes

- Add the `file:get` and `file:create` permissions to the list of supported permissions

## [v0.7.1] 2017-11-23

### Fixes

- Correctly type the user id array in `getUsersByIds` as `Array<string>` instead of `Array<number>`

## [v0.7.0] 2017-11-20

### Changes

- `assignRoomRoleToUser` and `assignGlobalRoleToUser` now work regardless of whether or not a role has previously been assigned for a user

### Removals

- `reassignRoomRoleForUser` and `reassignGlobalRoleForUser` were removed

## [v0.6.0] 2017-11-16

### Additions

- Adds functionality to update permissions for existing roles by introducing two new functions: `updatePermissionsForRoomRole` and `updatePermissionsForGlobalRole`.

## [v0.5.2] 2017-11-10

### Fixes

- Make `createRoom` work if `userIds` isn't provided or is an empty array when creating a room.

### Changes

- Make the response in the success case of room creation into an appropriate object from the body's JSON as opposed to an `IncomingMessage` object.

## [v0.5.1] 2017-11-10

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
