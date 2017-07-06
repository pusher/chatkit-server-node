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

export interface TokenWithExpiry {
  token: string;
  expiresAt: number;
};

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

const TOKEN_EXPIRY_LEEWAY = 30;

export default class ChatKit {
  pusherService: PusherService;

  private apiBasePath = 'services/chat_api/v1';
  private authorizerBasePath = 'services/chat_api_authorizer/v1';

  private tokenWithExpiry?: TokenWithExpiry;

  constructor(pusherServiceConfig: Options) {
    this.pusherService = new PusherService(pusherServiceConfig);
  }

  // Token generation

  // ** TODO **


  // User interactions

  createUser(id: string, name: string): Promise<void> {
    return this.pusherService.request({
      method: 'POST',
      path: `${this.apiBasePath}/users`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ id, name }),
    }).then(() => {})
  }


  // Authorizer interactions

  createRoomRole(name: string, permissions: Array<string>): Promise<void> {
    return this.createRole(name, 'room', permissions)
  }

  createGlobalRole(name: string, permissions: Array<string>): Promise<void> {
    return this.createRole(name, 'global', permissions)
  }

  private createRole(name: string, scope: string, permissions: Array<string>): Promise<void> {
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
    }).then(() => {})
  }

  deleteGlobalRole(roleName: string): Promise<void> {
    return this.pusherService.request({
      method: 'DELETE',
      path: `${this.authorizerBasePath}/roles/${roleName}/scope/global`,
    }).then(() => {})
  }

  deleteRoomRole(roleName: string): Promise<void> {
    return this.pusherService.request({
      method: 'DELETE',
      path: `${this.authorizerBasePath}/roles/${roleName}/scope/room`,
    }).then(() => {})
  }

  assignGlobalRoleToUser(userId: string, roleName: string): Promise<void> {
    return this.pusherService.request({
      method: 'POST',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ name: roleName }),
    }).then(() => {})
  }

  assignRoomRoleToUser(userId: string, roleName: string, roomId: number): Promise<void> {
    return this.pusherService.request({
      method: 'POST',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ name: roleName, room_id: roomId }),
    }).then(() => {})
  }

  getUserRoles(userId: string): Promise<any> {
    return this.pusherService.request({
      method: 'GET',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
    }).then((res) => {
      return readJSON(res)
    })
  }

  removeGlobalRoleForUser(userId: string): Promise<void> {
    return this.pusherService.request({
      method: 'PUT',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(() => {})
  }

  removeRoomRoleForUser(userId: string, roomId: number): Promise<void> {
    return this.pusherService.request({
      method: 'PUT',
      path: `${this.authorizerBasePath}/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: writeJSON({ room_id: roomId }),
    }).then(() => {})
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
    if (this.tokenWithExpiry && this.tokenWithExpiry.expiresAt > getCurrentTimeInSeconds()) {
      return this.tokenWithExpiry.token;
    }

    // Otherwise generate new token and its expiration time
    const tokenWithExpiresIn = this.pusherService.generateSuperuserJWT();

    this.tokenWithExpiry = {
      token: tokenWithExpiresIn.jwt,
      expiresAt: getCurrentTimeInSeconds() + tokenWithExpiresIn.expires_in - TOKEN_EXPIRY_LEEWAY,
    }

    return this.tokenWithExpiry.token;
  };
};
