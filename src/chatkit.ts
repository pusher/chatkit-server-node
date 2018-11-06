import {
  AuthenticateOptions,
  AuthenticatePayload,
  AuthenticationResponse,
  BaseClient,
  Instance,
  InstanceOptions,
  SDKInfo,
  TokenWithExpiry,
} from '@pusher/platform-node';

import { getCurrentTimeInSeconds } from './utils';
import packageJSON from '../package.json';

export interface AuthenticationOptions {
  userId: string;
  authPayload?: AuthenticatePayload;
}

export interface UserIdOptions {
  userId: string;
}

export interface GetRoomOptions {
  roomId: string;
}

export interface SendMessageOptions extends UserIdOptions {
  roomId: string;
  text: string;
  attachment?: AttachmentOptions;
}

export interface AttachmentOptions {
  resourceLink: string;
  type: string;
}

export interface DeleteMessageOptions {
  id: string;
}

export interface DeleteUserOptions extends UserIdOptions {}
export interface GetUserRoomOptions extends UserIdOptions {}
export interface GetUserJoinableRoomOptions extends UserIdOptions {}
export interface GetUserRolesOptions extends UserIdOptions {}
export interface RemoveGlobalRoleForUserOptions extends UserIdOptions {}

export interface GetRoomsOptions {
  fromId?: string;
  includePrivate?: boolean
}

export interface GetUserOptions {
  id: string;
}

export interface GetUsersOptions {
  fromTimestamp?: string;
  limit?: number;
}

export interface RemoveRoomRoleForUserOptions extends UserIdOptions {
  roomId: string;
}

export interface BasicAssignRoleToUserOptions {
  userId: string;
  name: string;
}

export interface AssignGlobalRoleToUserOptions extends BasicAssignRoleToUserOptions {}

export interface AssignRoleToUserOptions extends BasicAssignRoleToUserOptions {
  roomId?: string;
}

export interface AssignRoomRoleToUserOptions extends BasicAssignRoleToUserOptions {
  roomId: string;
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
  name: string;
  permissionsToAdd?: Array<string>;
  permissionsToRemove?: Array<string>;
}

export interface GetPermissionsOptions {
  name: string;
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

export interface SetReadCursorOptions {
  userId: string;
  roomId: string;
  position: number;
}

export interface GetReadCursorOptions {
  userId: string;
  roomId: string;
}

export interface GetReadCursorsForUserOptions {
  userId: string;
}

  export interface GetReadCursorsForRoomOptions {
  roomId: string;
}

export interface GetRoomMessagesOptions {
  direction?: string;
  initialId?: string;
  limit?: number;
  roomId: string;
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

export interface UpdateRoomOptions {
  id: string;
  name?: string;
  isPrivate?: boolean;
}

export interface DeleteRoomOptions {
  id: string;
}

export interface AddUsersToRoomOptions {
  roomId: string;
  userIds: Array<string>;
}

export interface RemoveUsersFromRoomOptions {
  roomId: string;
  userIds: Array<string>;
}

export interface UpdateRolePermissionsOptions {
  add_permissions?: Array<string>;
  remove_permissions?: Array<string>;
}

export interface CreateUsersOptions {
  users: Array<User>;
}

export interface GetUsersByIdOptions {
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
  cursorsInstance: Instance;
  instanceLocator: string;

  private tokenWithExpiry?: TokenWithExpiryAt;

  constructor(options: Options) {
    const { instanceLocator, key, port, host, client } = options;

    const sdkInfo = new SDKInfo({
      productName: 'chatkit',
      version: packageJSON.version,
    });

    const instanceOptions = {
      locator: instanceLocator,
      key,
      port,
      host,
      client,
      sdkInfo,
    }

    const apiInstanceOptions = {
      ...instanceOptions,
      serviceName: 'chatkit',
      serviceVersion: 'v2',
    }

    const authorizerInstanceOptions = {
      ...instanceOptions,
      serviceName: 'chatkit_authorizer',
      serviceVersion: 'v2',
    }

    const cursorsInstanceOptions = {
      ...instanceOptions,
      serviceName: 'chatkit_cursors',
      serviceVersion: 'v2',
    }

    this.instanceLocator = instanceLocator;
    this.apiInstance = new Instance(apiInstanceOptions);
    this.authorizerInstance = new Instance(authorizerInstanceOptions);
    this.cursorsInstance = new Instance(cursorsInstanceOptions);
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

  getUser(options: GetUserOptions): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(options.id)}`,
      jwt: this.getServerToken(),
    }).then(({ body }) => JSON.parse(body))
  }

  getUsers(options: GetUsersOptions = {}): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/users`,
      qs: {
        from_ts: options.fromTimestamp,
        limit: options.limit,
      },
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getUsersById(options: GetUsersByIdOptions): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/users_by_ids`,
      qs: {
        id: options.userIds,
      },
      useQuerystring: true,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  // Room interactions

  getRoom(options: GetRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
    });

    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms/${encodeURIComponent(options.roomId)}`,
      jwt: jwt.token,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  sendMessage(options: SendMessageOptions): Promise<any> {
    let messagePayload: any = { text: options.text };

    if (options.attachment) {
      messagePayload.attachment = {
        resource_link: options.attachment.resourceLink,
        type: options.attachment.type,
      }
    }

    return this.apiInstance.request({
      method: 'POST',
      path: `/rooms/${encodeURIComponent(options.roomId)}/messages`,
      jwt: this.generateAccessToken({
        su: true,
        userId: options.userId,
      }).token,
      body: messagePayload,
    }).then(({ body }) => JSON.parse(body))
  }

  deleteMessage(options: DeleteMessageOptions): Promise<void> {
    return this.apiInstance.request({
      method: 'DELETE',
      path: `/messages/${options.id}`,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  getRoomMessages(options: GetRoomMessagesOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
    });

    const { initialId, ...optionsMinusInitialId } = options;
    let qs: GetRoomMessagesOptionsPayload = optionsMinusInitialId;
    if (initialId) { qs['initial_id'] = initialId; }

    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms/${encodeURIComponent(options.roomId)}/messages`,
      jwt: jwt.token,
      qs: qs,
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getRooms(options: GetRoomsOptions = {}): Promise<any> {
    return this.apiInstance.request({
      method: 'GET',
      path: `/rooms`,
      jwt: this.getServerToken(),
      qs: {
        from_id: options.fromId,
        include_private: options.includePrivate,
      }
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

  updateRoom(options: UpdateRoomOptions): Promise<void> {
    const body: any = {}
    if (options.name) {
      body.name = options.name
    }
    if (options.isPrivate) {
      body.private = options.isPrivate
    }
    return this.apiInstance.request({
      method: 'PUT',
      path: `/rooms/${options.id}`,
      jwt: this.getServerToken(),
      body,
    }).then(() => {})
  }

  deleteRoom(options: DeleteRoomOptions): Promise<void> {
    return this.apiInstance.request({
      method: 'DELETE',
      path: `/rooms/${options.id}`,
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  addUsersToRoom(options: AddUsersToRoomOptions): Promise<void> {
    return this.apiInstance.request({
      method: 'PUT',
      path: `/rooms/${encodeURIComponent(options.roomId)}/users/add`,
      jwt: this.getServerToken(),
      body: { user_ids: options.userIds },
    }).then(() => {})
  }

  removeUsersFromRoom(options: RemoveUsersFromRoomOptions): Promise<void> {
    return this.apiInstance.request({
      method: 'PUT',
      path: `/rooms/${encodeURIComponent(options.roomId)}/users/remove`,
      jwt: this.getServerToken(),
      body: { user_ids: options.userIds },
    }).then(() => {})
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
      body: { name: options.name, room_id: options.roomId },
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
      path: `/roles/${options.name}/scope/global/permissions`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  getPermissionsForRoomRole(options: GetPermissionsOptions): Promise<any> {
    return this.authorizerInstance.request({
      method: 'GET',
      path: `/roles/${options.name}/scope/room/permissions`,
      jwt: this.getServerToken(),
    }).then((res) => {
      return JSON.parse(res.body);
    })
  }

  updatePermissionsForGlobalRole(options: UpdatePermissionsOptions): Promise<any> {
    return this.updatePermissionsForRole(
      options.name,
      'global',
      options.permissionsToAdd || [],
      options.permissionsToRemove || []
    )
  }

  updatePermissionsForRoomRole(options: UpdatePermissionsOptions): Promise<any> {
    return this.updatePermissionsForRole(
      options.name,
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

  // Cursors

  setReadCursor(options: SetReadCursorOptions): Promise<void> {
    return this.cursorsInstance.request({
      method: 'PUT',
      path: `/cursors/0/rooms/${encodeURIComponent(options.roomId)}/users/${encodeURIComponent(options.userId)}`,
      body: { position: options.position },
      jwt: this.getServerToken(),
    }).then(() => {})
  }

  getReadCursor(options: GetReadCursorOptions): Promise<any> {
    return this.cursorsInstance.request({
      method: 'GET',
      path: `/cursors/0/rooms/${encodeURIComponent(options.roomId)}/users/${encodeURIComponent(options.userId)}`,
      jwt: this.getServerToken(),
    }).then(({ body }) => JSON.parse(body))
  }

  getReadCursorsForUser(options: GetReadCursorsForUserOptions): Promise<any> {
    return this.cursorsInstance.request({
      method: 'GET',
      path: `/cursors/0/users/${encodeURIComponent(options.userId)}`,
      jwt: this.getServerToken(),
    }).then(({ body }) => JSON.parse(body))
  }

  getReadCursorsForRoom(options: GetReadCursorsForRoomOptions): Promise<any> {
    return this.cursorsInstance.request({
      method: 'GET',
      path: `/cursors/0/rooms/${encodeURIComponent(options.roomId)}`,
      jwt: this.getServerToken(),
    }).then(({ body }) => JSON.parse(body))
  }

  // General requests

  apiRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken();
    return this.apiInstance.request(options);
  }

  authorizerRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken();
    return this.authorizerInstance.request(options);
  }

  cursorsRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken();
    return this.cursorsInstance.request(options);
  }

  private updatePermissionsForRole(
    name: string,
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
      path: `/roles/${name}/scope/${scope}/permissions`,
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
