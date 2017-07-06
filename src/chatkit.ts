import { Readable } from 'stream';
import { IncomingMessage } from 'http';
import {
  App as PusherService,
  BaseClient,
  readJSON,
  writeJSON
} from 'pusher-platform-node';

import { JOIN_PUBLIC_ROOM, JOIN_PRIVATE_ROOM, LEAVE_ROOM,
  ADD_ROOM_MEMBER, REMOVE_ROOM_MEMBER, CREATE_ROOM, DELETE_ROOM,
  UPDATE_ROOM, ADD_MESSAGE, CREATE_TYPING_EVENT, SUBSCRIBE_PRESENCE,
  UPDATE_USER, GET_USER, GET_ROOM, GET_USER_ROOMS, JOIN_ROOM
} from './permissions';
import { RoleScope, validPermissions } from './permissions';
import { getCurrentTimeInSeconds } from './utils';
import { ClientError } from './errors';

import { defaultCluster, cacheExpiryTolerance } from './constants';

// export interface TokenWithExpiry {
//   token: string;
//   expiresIn: number;
// };

// export interface AuthorizePayload {
//   path: string;
//   action: ActionType;
//   grant_type: string;
// };

// const authorize = async (
//   payload: AuthorizePayload,
//   hasPermissionCallback: (action: ActionType, b: string) => Promise<bool> | bool,
//   supplyFeedIdToCallback: bool = false
// ): Promise<any> => {
//   if (typeof hasPermissionCallback !== 'function') {
//     throw new Error('HasPermission must be a function');
//   }

//   if (!payload) {
//     throw new ClientError('Payload must be provided');
//   }

//   const { action, path }: {action: ActionType; path: string; } = payload;

//   if (!action || !path) {
//     throw new ClientError('Must provide "action" and "path" in the request body');
//   }

//   if (clientPermissionTypes.indexOf(action)) {
//     throw new ClientError(`Action must be one of ${JSON.stringify(clientPermissionTypes)}`);
//   }

//   const hasPermission = await hasPermissionCallback(action, path);

//   if (!hasPermission) {
//     throw new ClientError('Forbidden');
//   }

//   return pusherService.authenticate({ body: payload }, getFeedsPermissionClaims(action, path));
// };

export interface Options {
  cluster: string;
  appId: string;
  appKey: string;
  client?: BaseClient;
};

export default class ChatKit {
  pusherService: PusherService;

  private apiBasePath = 'services/chat_api/v1';
  private authorizerBasePath = 'services/chat_api_authorizer/v1';

  constructor(pusherServiceConfig: Options) {
    this.pusherService = new PusherService(pusherServiceConfig);
  }

  // Token generation

  // ** TODO **


  // User interactions

  createUser(id: string, name: string): Promise<IncomingMessage> {
    return this.pusherService.request({
      method: 'POST',
      path: `${this.apiBasePath}/users`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ id, name }),
    })
  }


  // Authorizer interactions

  createRoomRole(name: string, permissions: Array<string>): Promise<IncomingMessage> {
    return this.createRole(name, 'room', permissions)
  }

  createGlobalRole(name: string, permissions: Array<string>): Promise<IncomingMessage> {
    return this.createRole(name, 'global', permissions)
  }

  private createRole(name: string, scope: string, permissions: Array<string>): Promise<IncomingMessage> {
    permissions.forEach((perm) => {
      if (validPermissions.indexOf(perm) < 0) {
        throw new Error(`Permission value "${perm}" is invalid`);
      }
    })

    return this.pusherService.request({
      method: 'POST',
      path: `${this.authorizerBasePath}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ scope, name, permissions }),
    })
  }

  deleteGlobalRole(roleName: string): Promise<any> {
    return this.pusherService.request({
      method: 'DELETE',
      path: `${this.authorizerBasePath}/roles/${roleName}/scope/global`,
    })
  }

  deleteRoomRole(roleName: string): Promise<any> {
    return this.pusherService.request({
      method: 'DELETE',
      path: `${this.authorizerBasePath}/roles/${roleName}/scope/room`,
    })
  }

  assignGlobalRoleToUser(userId: string, roleName: string): Promise<any> {
    return this.pusherService.request({
      method: 'POST',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ name: roleName }),
    })
  }

  assignRoomRoleToUser(userId: string, roleName: string, roomId: number): Promise<any> {
    return this.pusherService.request({
      method: 'POST',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ name: roleName, room_id: roomId }),
    })
  }

  getUserRoles(userId: string): Promise<any> {
    return this.pusherService.request({
      method: 'GET',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
    }).then((res) => {
      return readJSON(res)
    })
  }

  removeGlobalRoleForUser(userId: string): Promise<any> {
    return this.pusherService.request({
      method: 'PUT',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
    })
  }

  removeRoomRoleForUser(userId: string, roomId: number): Promise<any> {
    return this.pusherService.request({
      method: 'PUT',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ room_id: roomId }),
    })
  }

  getPermissionsForGlobalRole(roleName: string): Promise<any> {
   return this.pusherService.request({
      method: 'GET',
      path: `${this.authorizerBasePath}/roles/${roleName}/scope/global/permissions"`,
    }).then((res) => {
      return readJSON(res)
    })
  }

  getPermissionsForRoomRole(roleName: string): Promise<any> {
   return this.pusherService.request({
      method: 'GET',
      path: `${this.authorizerBasePath}/roles/${roleName}/scope/room/permissions"`,
    }).then((res) => {
      return readJSON(res)
    })
  }


  /**
   * This method manages the token for http library and pusher platform
   * communication
   */
  private getServerToken(): string {
    // let tokenWithExpirationTime: TokenWithExpiry = {
    //   token: '',
    //   expiresIn: 0
    // };

    // const {token, expiresIn} = tokenWithExpirationTime;
    // // If token exists and is still valid just return it..
    // if (token && expiresIn > getCurrentTimeInSeconds()) {
    //   return token;
    // }
    // // Otherwise generate new token and its expiration time
    // const {token, expires_in} = this.pusherService.generateSuperuserJWT();

    // tokenWithExpirationTime = {
    //   token,
    //   expiresIn: getCurrentTimeInSeconds() + expires_in - cacheExpiryTolerance
    // };

    return this.pusherService.generateSuperuserJWT().jwt;
  };
};
