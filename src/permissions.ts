// All possible permissions
export const JOIN_ROOM = "room:join";
export const LEAVE_ROOM = "room:leave";
export const ADD_ROOM_MEMBER = "room:members:add";
export const REMOVE_ROOM_MEMBER = "room:members:remove";
export const CREATE_ROOM = "room:create";
export const DELETE_ROOM = "room:delete";
export const UPDATE_ROOM = "room:update";
export const CREATE_MESSAGE = "message:create";
export const CREATE_TYPING_EVENT = "room:typing_indicator:create";
export const SUBSCRIBE_PRESENCE = "presence:subscribe";
export const UPDATE_USER = "user:update";
export const GET_ROOM_MESSAGES = "room:messages:get";
export const GET_USER = "user:get";
export const GET_ROOM = "room:get";
export const GET_USER_ROOMS = "user:rooms:get";
export const GET_FILE = "file:get";
export const CREATE_FILE = "file:create";

export const validRoomPermissions = [
  JOIN_ROOM,
  LEAVE_ROOM,
  ADD_ROOM_MEMBER,
  REMOVE_ROOM_MEMBER,
  DELETE_ROOM,
  UPDATE_ROOM,
  CREATE_MESSAGE,
  CREATE_TYPING_EVENT,
  GET_ROOM_MESSAGES,
  GET_FILE,
  CREATE_FILE,
];

export const validGlobalPermissions = [
  JOIN_ROOM,
  LEAVE_ROOM,
  ADD_ROOM_MEMBER,
  REMOVE_ROOM_MEMBER,
  CREATE_ROOM,
  DELETE_ROOM,
  UPDATE_ROOM,
  CREATE_MESSAGE,
  CREATE_TYPING_EVENT,
  SUBSCRIBE_PRESENCE,
  UPDATE_USER,
  GET_ROOM_MESSAGES,
  GET_USER,
  GET_ROOM,
  GET_USER_ROOMS,
  GET_FILE,
  CREATE_FILE,
];
