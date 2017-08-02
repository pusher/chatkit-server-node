"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// All possible permissions
exports.JOIN_ROOM = "join_room";
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
exports.GET_ROOM_MESSAGES = "get_room_messages";
exports.GET_USER = "get_user";
exports.GET_ROOM = "get_room";
exports.GET_USER_ROOMS = "get_user_rooms";
exports.validRoomPermissions = [
    exports.JOIN_ROOM,
    exports.LEAVE_ROOM,
    exports.ADD_ROOM_MEMBER,
    exports.REMOVE_ROOM_MEMBER,
    exports.DELETE_ROOM,
    exports.UPDATE_ROOM,
    exports.ADD_MESSAGE,
    exports.CREATE_TYPING_EVENT,
    exports.SUBSCRIBE_PRESENCE,
    exports.GET_ROOM_MESSAGES,
];
exports.validGlobalPermissions = [
    exports.JOIN_ROOM,
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
    exports.GET_ROOM_MESSAGES,
    exports.GET_USER,
    exports.GET_ROOM,
    exports.GET_USER_ROOMS,
];
//# sourceMappingURL=permissions.js.map