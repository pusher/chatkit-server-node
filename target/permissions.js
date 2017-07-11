"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// All possible permissions
exports.JOIN_PUBLIC_ROOM = "join_public_room";
exports.JOIN_PRIVATE_ROOM = "join_private_room";
exports.LEAVE_ROOM = "leave_room";
exports.ADD_ROOM_MEMBER = "add_room_member";
exports.REMOVE_ROOM_MEMBER = "remove_room_member";
exports.CREATE_ROOM = "create_room";
exports.DELETE_ROOM = "delete_room";
exports.UPDATE_ROOM = "update_room";
exports.ADD_MESSAGE = "add_message";
exports.CREATE_TYPING_EVENT = "create_typing_event";
exports.SUBSCRIBE_PRESENCE = "subscribe_presence";
exports.UPDATE_USER = "update_user";
exports.GET_USER = "get_user";
exports.GET_USERS = "get_users";
exports.GET_ROOM = "get_room";
exports.GET_ROOMS = "get_rooms";
exports.GET_USER_ROOMS = "get_user_rooms";
exports.JOIN_ROOM = "join_room";
exports.validPermissions = [
    exports.JOIN_PUBLIC_ROOM,
    exports.JOIN_PRIVATE_ROOM,
    exports.LEAVE_ROOM,
    exports.ADD_ROOM_MEMBER,
    exports.REMOVE_ROOM_MEMBER,
    exports.CREATE_ROOM,
    exports.DELETE_ROOM,
    exports.UPDATE_ROOM,
    exports.ADD_MESSAGE,
    exports.CREATE_TYPING_EVENT,
    exports.SUBSCRIBE_PRESENCE,
    exports.UPDATE_USER,
    exports.GET_USER,
    exports.GET_USERS,
    exports.GET_ROOM,
    exports.GET_ROOMS,
    exports.GET_USER_ROOMS,
    exports.JOIN_ROOM
];
// TODO: export a room set and a global set of valid permissions
// separately
//# sourceMappingURL=permissions.js.map