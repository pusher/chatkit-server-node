import {
  Instance,
  InstanceOptions,
  AuthenticationResponse,
  AuthenticateOptions,
  BaseClient,
  TokenWithExpiry
} from 'pusher-platform-node';

import {
  validRoomPermissions,
  validGlobalPermissions
} from './permissions';
import { getCurrentTimeInSeconds } from './utils';

export interface TokenWithExpiryAt {
  token: string;
  expiresAt: number;
};

export interface AuthenticatePayload {
  grant_type?: string;
  refresh_token?: string;
};

export interface AccessTokenOptions {
  grant_type?: string;
  refresh_token?: string;
};

export interface Options {
  instanceLocator: string;
  key: string;

  port?: number;
  host?: string;
  client?: BaseClient;
};

export interface GeneralRequestOptions {
  method: string;
  path: string;
  jwt?: string;
  qs?: object;
}

export interface GetRoomMessagesOptions {
  initial_id?: string;
  direction?: string;
  limit?: number;
}

export interface CreateRoomOptions {
  name: string;
  isPrivate?: boolean;
  userIds?: Array<string>;
}

export interface UpdateRolePermissionsOptions {
  add_permissions?: Array<string>;
  remove_permissions?: Array<string>;
}

const TOKEN_EXPIRY_LEEWAY = 30;

export default class Chatkit {
  apiInstance: Instance;
  authorizerInstance: Instance;
  instanceLocator: string;

  private tokenWithExpiry?: TokenWithExpiryAt;

  constructor(options: Options) {
    const { instanceLocator, key, port, host, client } = options;

    const apiInstanceOptions = ({
      locator: instanceLocator,
      key,
      port,
      host,
      client,
      serviceName: 'chatkit',
      serviceVersion: 'v1',
    })

    const authorizerInstanceOptions = ({
      locator: instanceLocator,
      key,
      port,
      host,
      client,
      serviceName: 'chatkit_authorizer',
      serviceVersion: 'v1',
    })

    this.instanceLocator = instanceLocator;
    this.apiInstance = new Instance(apiInstanceOptions);
    this.authorizerInstance = new Instance(authorizerInstanceOptions);
  }

  // Token generation

  authenticate(authPayload: AuthenticatePayload, userId: string): AuthenticationResponse {
    return this.apiInstance.authenticate(authPayload, { userId });
  }

  generateAccessToken(authOptions: AuthenticateOptions): TokenWithExpiry {
    return this.apiInstance.generateAccessToken(authOptions);
  }

  // User interactions

  createUser(id: string, name: string, avatarURL?: string, customData?: any): Promise<void> {
    return this.apiInstance.request({
      method: 'POST',
      path: `/users`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        id,
        name,
        avatar_url: avatarURL,
        custom_data: customData,
       },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  deleteUser(id: string): Promise<void> {
    return this.apiInstance.request({
      method: 'DELETE',
      path: `/users/${id}`,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  getUsers(): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/users`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getUsersByIds(userIds: Array<string>): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/users_by_ids`,
      qs: {
        user_ids: userIds.join(','),
      },
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  // Room interactions

  getRoom(roomId: number): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms/${roomId}`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getRoomMessages(roomId: number, initialId: string, direction: string, limit: number): Promise<any> {
    let qs: GetRoomMessagesOptions = {};
    if (initialId) { qs['initial_id'] = initialId; }
    if (direction) { qs['direction'] = direction; }
    if (limit) { qs['limit'] = limit; }

    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms/${roomId}/messages`,
      jwt: this.getServerToken(),
      qs: qs,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getRooms(): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  createRoom(userId: string, options: CreateRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      userId: userId,
      su: true,
    });

    const { name, isPrivate, userIds } = options;

    let roomPayload: any = {
      name,
      private: isPrivate || false,
    }

    if (userIds && userIds.length !== 0) {
      roomPayload['user_ids'] = userIds;
    }

    return this.apiInstance.request({
      method: 'POST',
      path: '/rooms',
      jwt: jwt.token,
      body: roomPayload,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  // Authorizer interactions

  createRoomRole(name: string, permissions: Array<string>): Promise<void> {
    permissions.forEach((perm) => {
      if (validRoomPermissions.indexOf(perm) < 0) {
        throw new Error(`Permission value "${perm}" is invalid`);
      }
    })
    return this.createRole(name, 'room', permissions)
  }

  createGlobalRole(name: string, permissions: Array<string>): Promise<void> {
    permissions.forEach((perm) => {
      if (validGlobalPermissions.indexOf(perm) < 0) {
        throw new Error(`Permission value "${perm}" is invalid`);
      }
    })
    return this.createRole(name, 'global', permissions)
  }

  private createRole(name: string, scope: string, permissions: Array<string>): Promise<void> {
    return this.authorizerInstance.request({
      method: 'POST',
      path: `/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { scope, name, permissions },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  deleteGlobalRole(roleName: string): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/roles/${roleName}/scope/global`,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  deleteRoomRole(roleName: string): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/roles/${roleName}/scope/room`,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  assignGlobalRoleToUser(userId: string, roleName: string): Promise<void> {
    return this.assignRoleToUser(userId, roleName);
  }

  assignRoomRoleToUser(
    userId: string,
    roleName: string,
    roomId: number,
  ): Promise<void> {
    return this.assignRoleToUser(userId, roleName, roomId);
  }

  private assignRoleToUser(
    userId: string,
    roleName: string,
    roomId?: number,
  ): Promise<void> {
    return this.authorizerInstance.request({
      method: 'PUT',
      path: `/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { name: roleName, room_id: roomId },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  getUserRoles(userId: string): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/users/${userId}/roles`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  removeGlobalRoleForUser(userId: string): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  removeRoomRoleForUser(userId: string, roomId: number): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      qs: { room_id: roomId },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  getPermissionsForGlobalRole(roleName: string): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/roles/${roleName}/scope/global/permissions`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getPermissionsForRoomRole(roleName: string): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/roles/${roleName}/scope/room/permissions`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  updatePermissionsForGlobalRole(
    roleName: string,
    permissionsToAdd: Array<string>,
    permissionsToRemove: Array<string>,
  ): Promise<any> {
    var permsToCheck: Array<string> = permissionsToAdd.concat(permissionsToRemove)
    permsToCheck.forEach((perm: string) => {
      if (validGlobalPermissions.indexOf(perm) < 0) {
        throw new Error(`Permission value "${perm}" is invalid`);
      }
    })

    return this.updatePermissionsForRole(roleName, 'global', permissionsToAdd, permissionsToRemove)
  }

  updatePermissionsForRoomRole(
    roleName: string,
    permissionsToAdd: Array<string>,
    permissionsToRemove: Array<string>,
  ): Promise<any> {
    var permsToCheck: Array<string> = permissionsToAdd.concat(permissionsToRemove)
    permsToCheck.forEach((perm: string) => {
      if (validRoomPermissions.indexOf(perm) < 0) {
        throw new Error(`Permission value "${perm}" is invalid`);
      }
    })

    return this.updatePermissionsForRole(roleName, 'room', permissionsToAdd, permissionsToRemove)
  }

  getRoles(): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/roles`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }


  // General requests

  apiRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken();
    return this.apiInstance.request(options).then((res) => {
      return JSON.parse(res.body);
    });
  }

  authorizerRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken();
    return this.authorizerInstance.request(options).then((res) => {
      return JSON.parse(res.body);
    });
  }

  private updatePermissionsForRole(
    roleName: string,
    scope: string,
    permissionsToadd: Array<string>,
    permissionsToRemove: Array<string>,
  ): Promise<any> {
    if (permissionsToadd.length === 0 && permissionsToRemove.length === 0) {
      throw new Error(`Either permissionsToAdd or permissionsToRemove is required`);
    }

    let body: UpdateRolePermissionsOptions = {};
    if (permissionsToadd.length > 0) {
      body['add_permissions'] = permissionsToadd
    }

    if (permissionsToRemove.length > 0) {
      body['remove_permissions'] = permissionsToRemove
    }

    return this.authorizerInstance.request({
      method: 'PUT',
      path: `/roles/${roleName}/scope/${scope}/permissions`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body,
      jwt: this.getServerToken(),
    }).then(() => {})
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
    const tokenWithExpiresIn = this.apiInstance.generateAccessToken({ su: true });

    this.tokenWithExpiry = {
      token: tokenWithExpiresIn.token,
      expiresAt: getCurrentTimeInSeconds() + tokenWithExpiresIn.expires_in - TOKEN_EXPIRY_LEEWAY,
    }

    return this.tokenWithExpiry.token;
  };
};
