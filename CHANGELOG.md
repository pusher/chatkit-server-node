# Change Log

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
