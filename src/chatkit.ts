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
  instanceId: string;
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

const TOKEN_EXPIRY_LEEWAY = 30;

export default class ChatKit {
  apiInstance: Instance;
  authorizerInstance: Instance;
  instanceId: string;

  private tokenWithExpiry?: TokenWithExpiryAt;

  constructor(options: Options) {
    const { instanceId, key, port, host, client } = options;

    const apiInstanceOptions = ({
      instanceId,
      key,
      port,
      host,
      client,
      serviceName: 'chatkit',
      serviceVersion: 'v1',
    })

    const authorizerInstanceOptions = ({
      instanceId,
      key,
      port,
      host,
      client,
      serviceName: 'chatkit_authorizer',
      serviceVersion: 'v1',
    })

    this.instanceId = instanceId;
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

  getUsersByIds(userIds: Array<number>): Promise<any> {
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

  createRoom(userId: string, name: string): Promise<any> {
    const actualInstanceId = this.instanceId.split(':')[2];
    const jwt = this.generateAccessToken({ userId: actualInstanceId });

    return this.apiInstance.request({
      method: 'POST',
      path: '/rooms',
      jwt: jwt.token,
      body: { name },
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
    return this.authorizerInstance.request({
      method: 'POST',
      path: `/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { name: roleName },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  assignRoomRoleToUser(userId: string, roleName: string, roomId: number): Promise<void> {
    return this.authorizerInstance.request({
      method: 'POST',
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

  reassignGlobalRoleForUser(userId: string, roleName: string): Promise<void> {
    return this.authorizerInstance.request({
      method: 'PUT',
      path: `/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { name: roleName },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  reassignRoomRoleForUser(userId: string, roleName: string, roomId: number): Promise<void> {
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
