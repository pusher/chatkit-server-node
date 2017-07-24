import {
  Instance,
  InstanceOptions,
  AuthenticationResponse,
  BaseClient
} from 'pusher-platform-node';

import {
  validRoomPermissions,
  validGlobalPermissions
} from './permissions';
import { getCurrentTimeInSeconds } from './utils';

export interface TokenWithExpiry {
  token: string;
  expiresAt: number;
};

export interface AuthenticatePayload {
  grant_type?: string;
  refresh_token?: string;
}

export interface Options {
  instance: string
  key: string;

  port?: number;
  host?: string;
  client?: BaseClient;
}

const TOKEN_EXPIRY_LEEWAY = 30;

export default class ChatKit {
  apiInstance: Instance;
  authorizerInstance: Instance;

  private tokenWithExpiry?: TokenWithExpiry;

  constructor(options: Options) {
    const { instance, key, port, host, client } = options;

    const apiInstanceOptions = ({
      instance,
      key,
      port,
      host,
      client,
      serviceName: 'chatkit',
      serviceVersion: 'v1',
    })

    const authorizerInstanceOptions = ({
      instance,
      key,
      port,
      host,
      client,
      serviceName: 'chatkit_authorizer',
      serviceVersion: 'v1',
    })

    this.apiInstance = new Instance(apiInstanceOptions);
    this.authorizerInstance = new Instance(authorizerInstanceOptions);
  }

  // Token generation

  authenticate(authPayload: AuthenticatePayload, userId: string): AuthenticationResponse {
    return this.apiInstance.authenticate(authPayload, { userId });
  }


  // User interactions

  createUser(id: string, name: string): Promise<void> {
    return this.apiInstance.request({
      method: 'POST',
      path: `/users`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { id, name },
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

  removeGlobalRoleForUser(userId: string): Promise<void> {
    return this.authorizerInstance.request({
      method: 'PUT',
      path: `/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  removeRoomRoleForUser(userId: string, roomId: number): Promise<void> {
    return this.authorizerInstance.request({
      method: 'PUT',
      path: `/users/${userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { room_id: roomId },
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
