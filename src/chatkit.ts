import {
  AuthenticationResponse,
  AuthenticateOptions,
  AuthenticatePayload,
  BaseClient,
  Instance,
  InstanceOptions,
  TokenWithExpiry,
} from 'pusher-platform-node';

import { getCurrentTimeInSeconds } from './utils';

export interface AuthenticationOptions {
  userId: string;
  authPayload?: AuthenticatePayload;
}

export interface UserIdOptions {
  userId: string;
}

export interface GetRoomOptions extends UserIdOptions {
  roomId: number;
}

export interface DeleteUserOptions extends UserIdOptions {}
export interface GetUserRoomOptions extends UserIdOptions {}
export interface GetRoomsOptions extends UserIdOptions {}
export interface GetUserJoinableRoomOptions extends UserIdOptions {}
export interface GetUserRolesOptions extends UserIdOptions {}
export interface RemoveGlobalRoleForUserOptions extends UserIdOptions {}

export interface RemoveRoomRoleForUserOptions extends UserIdOptions {
  roomId: number;
}

export interface BasicAssignRoleToUserOptions {
  userId: string;
  roleName: string;
}

export interface AssignGlobalRoleToUserOptions extends BasicAssignRoleToUserOptions {}

export interface AssignRoleToUserOptions extends BasicAssignRoleToUserOptions {
  roomId?: number;
}

export interface AssignRoomRoleToUserOptions extends BasicAssignRoleToUserOptions {
  roomId: number;
}

export interface DeleteRoleOptions {
  name: string;
}

export interface CreateRoleOptions {
  name: string;
  permissions: Array<string>;
}

export interface CreateScopedRoleOptions extends CreateRoleOptions {
  scope: string;
}

export interface UpdatePermissionsOptions {
  roleName: string;
  permissionsToAdd?: Array<string>;
  permissionsToRemove?: Array<string>;
}

export interface GetPermissionsOptions {
  roleName: string;
}

export interface TokenWithExpiryAt {
  token: string;
  expiresAt: number;
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

export interface GetRoomMessagesOptions extends UserIdOptions {
  direction?: string;
  initialId?: string;
  limit?: number;
  roomId: number;
}

export interface GetRoomMessagesOptionsPayload {
  initial_id?: string;
  direction?: string;
  limit?: number;
}

export interface CreateUserOptions {
  id: string;
  name: string;
  avatarURL?: string;
  customData?: any;
}

export interface UpdateUserOptions {
  id: string;
  name?: string;
  avatarURL?: string;
  customData?: any;
}

export interface CreateRoomOptions {
  creatorId: string;
  name: string;
  isPrivate?: boolean;
  userIds?: Array<string>;
}

export interface UpdateRolePermissionsOptions {
  add_permissions?: Array<string>;
  remove_permissions?: Array<string>;
}

export interface CreateUsersOptions {
  users: Array<User>;
}

export interface GetUsersByIdsOptions {
  userIds: Array<string>;
}

export interface User {
  id: string;
  name: string;
  avatarURL?: string;
  customData?: any;
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

  authenticate(options: AuthenticationOptions): AuthenticationResponse {
    const { userId, authPayload } = options;
    return this.apiInstance.authenticate(
      authPayload || { grant_type: 'client_credentials' },
      { userId }
    );
  }

  // Used internally - not designed to be used externally
  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    return this.apiInstance.generateAccessToken(options);
  }

  // User interactions

  createUser(options: CreateUserOptions): Promise<any> {
    const { id, name } = options;
    return this.apiInstance.request({
      method: 'POST',
      path: `/users`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        id,
        name,
        avatar_url: options.avatarURL,
        custom_data: options.customData,
      },
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  createUsers(options: CreateUsersOptions): Promise<any> {
    const users = options.users.map(user => {
      const { id, name } = user;
      return {
        id,
        name,
        avatar_url: user.avatarURL,
        custom_data: user.customData,
      }
    });

    return this.apiInstance.request({
      method: 'POST',
      path: `/batch_users`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        users
      },
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  updateUser(options: UpdateUserOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.id,
    });

    let updatePayload: any = {};
    if (options.name) { updatePayload.name = options.name };
    if (options.avatarURL) { updatePayload.avatar_url = options.avatarURL };
    if (options.customData) { updatePayload.custom_data = options.customData };

    return this.apiInstance.request({
      method: 'PUT',
      path: `/users/${options.id}`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: updatePayload,
      jwt: jwt.token,
    }).then(() => {})
  }

  deleteUser(options: DeleteUserOptions): Promise<void> {
    return this.apiInstance.request({
      method: 'DELETE',
      path: `/users/${options.userId}`,
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

  getUsersByIds(options: GetUsersByIdsOptions): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/users_by_ids`,
      qs: {
        user_ids: options.userIds.join(','),
      },
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  // Room interactions

  getRoom(options: GetRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.userId,
    });

    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms/${options.roomId}`,
      jwt: jwt.token,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getRoomMessages(options: GetRoomMessagesOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.userId,
    });

    const { initialId, ...optionsMinusInitialId } = options;
    let qs: GetRoomMessagesOptionsPayload = optionsMinusInitialId;
    if (initialId) { qs['initial_id'] = initialId; }

    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms/${options.roomId}/messages`,
      jwt: jwt.token,
      qs: qs,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getRooms(options: GetRoomsOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.userId,
    });

    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms`,
      jwt: jwt.token,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getUserRooms(options: GetUserRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.userId,
    });

    return this.apiInstance.request({
      method: 'GET',
      path: `/users/${options.userId}/rooms`,
      jwt: jwt.token,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getUserJoinableRooms(options: GetUserJoinableRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.userId,
    });

    return this.apiInstance.request({
      method: 'GET',
      path: `/users/${options.userId}/rooms`,
      qs: { joinable: true },
      jwt: jwt.token,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  createRoom(options: CreateRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.creatorId,
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

  createRoomRole(options: CreateRoleOptions): Promise<void> {
    return this.createRole({
      ...options,
      scope: 'room',
    });
  }

  createGlobalRole(options: CreateRoleOptions): Promise<void> {
    return this.createRole({
      ...options,
      scope: 'global',
    });
  }

  private createRole(options: CreateScopedRoleOptions): Promise<void> {
    return this.authorizerInstance.request({
      method: 'POST',
      path: `/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: options,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  deleteGlobalRole(options: DeleteRoleOptions): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/roles/${options.name}/scope/global`,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  deleteRoomRole(options: DeleteRoleOptions): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/roles/${options.name}/scope/room`,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  assignGlobalRoleToUser(options: AssignGlobalRoleToUserOptions): Promise<void> {
    return this.assignRoleToUser(options);
  }

  assignRoomRoleToUser(options: AssignRoomRoleToUserOptions): Promise<void> {
    return this.assignRoleToUser(options);
  }

  private assignRoleToUser(options: AssignRoleToUserOptions): Promise<void> {
    return this.authorizerInstance.request({
      method: 'PUT',
      path: `/users/${options.userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { name: options.roleName, room_id: options.roomId },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  getUserRoles(options: GetUserRolesOptions): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/users/${options.userId}/roles`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  removeGlobalRoleForUser(options: RemoveGlobalRoleForUserOptions): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/users/${options.userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  removeRoomRoleForUser(options: RemoveRoomRoleForUserOptions): Promise<void> {
    return this.authorizerInstance.request({
      method: 'DELETE',
      path: `/users/${options.userId}/roles`,
      headers: {
        'Content-Type': 'application/json'
      },
      qs: { room_id: options.roomId },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  getPermissionsForGlobalRole(options: GetPermissionsOptions): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/roles/${options.roleName}/scope/global/permissions`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getPermissionsForRoomRole(options: GetPermissionsOptions): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/roles/${options.roleName}/scope/room/permissions`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  updatePermissionsForGlobalRole(options: UpdatePermissionsOptions): Promise<any> {
    return this.updatePermissionsForRole(
      options.roleName,
      'global',
      options.permissionsToAdd || [],
      options.permissionsToRemove || []
    )
  }

  updatePermissionsForRoomRole(options: UpdatePermissionsOptions): Promise<any> {
    return this.updatePermissionsForRole(
      options.roleName,
      'room',
      options.permissionsToAdd || [],
      options.permissionsToRemove || []
     )
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
    return this.apiInstance.request(options);
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
    permissionsToadd: Array<string> = [],
    permissionsToRemove: Array<string>  = [],
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
