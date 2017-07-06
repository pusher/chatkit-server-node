export type RoleScope = 'global' | 'room';

// All possible permissions
export const JOIN_PUBLIC_ROOM = "join_public_room";
export const JOIN_PRIVATE_ROOM = "join_private_room";
export const LEAVE_ROOM = "leave_room";
export const ADD_ROOM_MEMBER = "add_room_member";
export const REMOVE_ROOM_MEMBER = "remove_room_member";
export const CREATE_ROOM = "create_room";
export const DELETE_ROOM = "delete_room";
export const UPDATE_ROOM = "update_room";
export const ADD_MESSAGE = "add_message";
export const CREATE_TYPING_EVENT = "create_typing_event";
export const SUBSCRIBE_PRESENCE = "subscribe_presence";
export const UPDATE_USER = "update_user";
export const GET_USER = "get_user";
export const GET_ROOM = "get_room";
export const GET_USER_ROOMS = "get_user_rooms";
export const JOIN_ROOM = "join_room";

export const validPermissions = [
  JOIN_PUBLIC_ROOM,
  JOIN_PRIVATE_ROOM,
  LEAVE_ROOM,
  ADD_ROOM_MEMBER,
  REMOVE_ROOM_MEMBER,
  CREATE_ROOM,
  DELETE_ROOM,
  UPDATE_ROOM,
  ADD_MESSAGE,
  CREATE_TYPING_EVENT,
  SUBSCRIBE_PRESENCE,
  UPDATE_USER,
  GET_USER,
  GET_ROOM,
  GET_USER_ROOMS,
  JOIN_ROOM
];
