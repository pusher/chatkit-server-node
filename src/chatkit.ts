import { put } from "got"

import {
  AuthenticateOptions,
  AuthenticatePayload,
  AuthenticationResponse,
  BaseClient,
  Instance,
  InstanceOptions,
  SDKInfo,
  TokenWithExpiry,
} from "@pusher/platform-node"

import { getCurrentTimeInSeconds } from "./utils"
import packageJSON from "../package.json"

export interface AuthenticationOptions {
  userId: string
  authPayload?: AuthenticatePayload
}

export interface UserIdOptions {
  userId: string
}

export interface GetRoomOptions {
  roomId: string
}

export interface SendMessageOptions extends UserIdOptions {
  roomId: string
  text: string
  attachment?: AttachmentOptions
}

export interface SendMultipartMessageOptions {
  roomId: string
  userId: string
  parts: Array<NewPart>
}

export type NewPart = NewInlinePart | NewURLPart | NewAttachmentPart

export interface NewInlinePart {
  type: string
  content: string
}

export interface NewURLPart {
  type: string
  url: string
}

export interface NewAttachmentPart {
  type: string
  file: Buffer
  name?: string
  customData?: any
}

export interface AttachmentOptions {
  resourceLink: string
  type: string
}

export interface DeleteMessageOptions {
  id: string
}

export interface DeleteUserOptions extends UserIdOptions {}
export interface GetUserRoomOptions extends UserIdOptions {}
export interface GetUserJoinableRoomOptions extends UserIdOptions {}
export interface GetUserRolesOptions extends UserIdOptions {}
export interface RemoveGlobalRoleForUserOptions extends UserIdOptions {}

export interface GetRoomsOptions {
  fromId?: string
  includePrivate?: boolean
}

export interface GetUserOptions {
  id: string
}

export interface GetUsersOptions {
  fromTimestamp?: string
  limit?: number
}

export interface RemoveRoomRoleForUserOptions extends UserIdOptions {
  roomId: string
}

export interface BasicAssignRoleToUserOptions {
  userId: string
  name: string
}

export interface AssignGlobalRoleToUserOptions
  extends BasicAssignRoleToUserOptions {}

export interface AssignRoleToUserOptions extends BasicAssignRoleToUserOptions {
  roomId?: string
}

export interface AssignRoomRoleToUserOptions
  extends BasicAssignRoleToUserOptions {
  roomId: string
}

export interface DeleteRoleOptions {
  name: string
}

export interface CreateRoleOptions {
  name: string
  permissions: Array<string>
}

export interface CreateScopedRoleOptions extends CreateRoleOptions {
  scope: string
}

export interface UpdatePermissionsOptions {
  name: string
  permissionsToAdd?: Array<string>
  permissionsToRemove?: Array<string>
}

export interface GetPermissionsOptions {
  name: string
}

export interface TokenWithExpiryAt {
  token: string
  expiresAt: number
}

export interface Options {
  instanceLocator: string
  key: string

  port?: number
  host?: string
  client?: BaseClient
}

export interface GeneralRequestOptions {
  method: string
  path: string
  jwt?: string
  qs?: object
}

export interface SetReadCursorOptions {
  userId: string
  roomId: string
  position: number
}

export interface GetReadCursorOptions {
  userId: string
  roomId: string
}

export interface GetReadCursorsForUserOptions {
  userId: string
}

export interface GetReadCursorsForRoomOptions {
  roomId: string
}

export type GetRoomMessagesOptions = FetchMultipartMessagesOptions

export interface FetchMultipartMessagesOptions {
  direction?: string
  initialId?: string
  limit?: number
  roomId: string
}

interface FetchMessagesOptions extends FetchMultipartMessagesOptions {
  serverInstance: Instance
}

interface FetchMessagesPayload {
  initial_id?: string
  direction?: string
  limit?: number
}

export interface CreateUserOptions {
  id: string
  name: string
  avatarURL?: string
  customData?: any
}

export interface UpdateUserOptions {
  id: string
  name?: string
  avatarURL?: string
  customData?: any
}

export interface CreateRoomOptions {
  creatorId: string
  name: string
  isPrivate?: boolean
  userIds?: Array<string>
  customData?: object
}

export interface UpdateRoomOptions {
  id: string
  name?: string
  isPrivate?: boolean
  customData?: object
}

export interface DeleteRoomOptions {
  id: string
}

export interface AddUsersToRoomOptions {
  roomId: string
  userIds: Array<string>
}

export interface RemoveUsersFromRoomOptions {
  roomId: string
  userIds: Array<string>
}

export interface UpdateRolePermissionsOptions {
  add_permissions?: Array<string>
  remove_permissions?: Array<string>
}

export interface CreateUsersOptions {
  users: Array<User>
}

export interface GetUsersByIdOptions {
  userIds: Array<string>
}

export interface AsyncDeleteRoomOptions {
  roomId: string
}

export interface AsyncDeleteUserOptions {
  userId: string
}

export interface User {
  id: string
  name: string
  avatarURL?: string
  customData?: any
}

const TOKEN_EXPIRY_LEEWAY = 30

export default class Chatkit {
  serverInstanceV2: Instance
  serverInstanceV3: Instance
  authorizerInstance: Instance
  cursorsInstance: Instance
  schedulerInstance: Instance
  instanceLocator: string

  private tokenWithExpiry?: TokenWithExpiryAt

  constructor(options: Options) {
    const { instanceLocator, key, port, host, client } = options

    const sdkInfo = new SDKInfo({
      productName: "chatkit",
      version: packageJSON.version,
    })

    const instanceOptions = {
      locator: instanceLocator,
      key,
      port,
      host,
      client,
      sdkInfo,
    }

    const serverInstanceOptions = (version: string) => ({
      ...instanceOptions,
      serviceName: "chatkit",
      serviceVersion: version,
    })

    const authorizerInstanceOptions = {
      ...instanceOptions,
      serviceName: "chatkit_authorizer",
      serviceVersion: "v2",
    }

    const cursorsInstanceOptions = {
      ...instanceOptions,
      serviceName: "chatkit_cursors",
      serviceVersion: "v2",
    }

    const schedulerInstanceOptions = {
      ...instanceOptions,
      serviceName: "chatkit_scheduler",
      serviceVersion: "v1",
    }

    this.instanceLocator = instanceLocator
    this.serverInstanceV2 = new Instance(serverInstanceOptions("v2"))
    this.serverInstanceV3 = new Instance(serverInstanceOptions("v3"))
    this.authorizerInstance = new Instance(authorizerInstanceOptions)
    this.cursorsInstance = new Instance(cursorsInstanceOptions)
    this.schedulerInstance = new Instance(schedulerInstanceOptions)
  }

  // Token generation

  authenticate(options: AuthenticationOptions): AuthenticationResponse {
    const { userId, authPayload } = options
    return this.serverInstanceV3.authenticate(
      authPayload || { grant_type: "client_credentials" },
      { userId },
    )
  }

  // Used internally - not designed to be used externally
  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    return this.serverInstanceV3.generateAccessToken(options)
  }

  // User interactions

  createUser(options: CreateUserOptions): Promise<any> {
    const { id, name } = options
    return this.serverInstanceV3
      .request({
        method: "POST",
        path: `/users`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id,
          name,
          avatar_url: options.avatarURL,
          custom_data: options.customData,
        },
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  createUsers(options: CreateUsersOptions): Promise<any> {
    const users = options.users.map(user => {
      const { id, name } = user
      return {
        id,
        name,
        avatar_url: user.avatarURL,
        custom_data: user.customData,
      }
    })

    return this.serverInstanceV3
      .request({
        method: "POST",
        path: `/batch_users`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          users,
        },
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  updateUser(options: UpdateUserOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.id,
    })

    let updatePayload: any = {}
    if (options.name) {
      updatePayload.name = options.name
    }
    if (options.avatarURL) {
      updatePayload.avatar_url = options.avatarURL
    }
    if (options.customData) {
      updatePayload.custom_data = options.customData
    }

    return this.serverInstanceV3
      .request({
        method: "PUT",
        path: `/users/${options.id}`,
        headers: {
          "Content-Type": "application/json",
        },
        body: updatePayload,
        jwt: jwt.token,
      })
      .then(() => {})
  }

  deleteUser(options: DeleteUserOptions): Promise<void> {
    return this.serverInstanceV3
      .request({
        method: "DELETE",
        path: `/users/${options.userId}`,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  getUser(options: GetUserOptions): Promise<any> {
    return this.serverInstanceV3
      .request({
        method: "GET",
        path: `/users/${encodeURIComponent(options.id)}`,
        jwt: this.getServerToken(),
      })
      .then(({ body }) => JSON.parse(body))
  }

  getUsers(options: GetUsersOptions = {}): Promise<any> {
    return this.serverInstanceV3
      .request({
        method: "GET",
        path: `/users`,
        qs: {
          from_ts: options.fromTimestamp,
          limit: options.limit,
        },
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  getUsersById(options: GetUsersByIdOptions): Promise<any> {
    return this.serverInstanceV3
      .request({
        method: "GET",
        path: `/users_by_ids`,
        qs: {
          id: options.userIds,
        },
        useQuerystring: true,
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  // Room interactions

  getRoom(options: GetRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
    })

    return this.serverInstanceV3
      .request({
        method: "GET",
        path: `/rooms/${encodeURIComponent(options.roomId)}`,
        jwt: jwt.token,
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  sendMessage(options: SendMessageOptions): Promise<any> {
    let messagePayload: any = { text: options.text }

    if (options.attachment) {
      messagePayload.attachment = {
        resource_link: options.attachment.resourceLink,
        type: options.attachment.type,
      }
    }

    return this.serverInstanceV2
      .request({
        method: "POST",
        path: `/rooms/${encodeURIComponent(options.roomId)}/messages`,
        jwt: this.generateAccessToken({
          su: true,
          userId: options.userId,
        }).token,
        body: messagePayload,
      })
      .then(({ body }) => JSON.parse(body))
  }

  sendSimpleMessage(options: SendMessageOptions): Promise<any> {
    return this.sendMultipartMessage({
      roomId: options.roomId,
      userId: options.userId,
      parts: [{ type: "text/plain", content: options.text }],
    })
  }

  sendMultipartMessage(options: SendMultipartMessageOptions): Promise<any> {
    if (options.parts.length === 0) {
      return Promise.reject(
        new TypeError("message must contain at least one part"),
      )
    }

    return Promise.all(
      options.parts.map(
        (part: any) =>
          part.file
            ? this.uploadAttachment({
                userId: options.userId,
                roomId: options.roomId,
                part,
              })
            : part,
      ),
    )
      .then(parts =>
        this.serverInstanceV3.request({
          method: "POST",
          path: `/rooms/${encodeURIComponent(options.roomId)}/messages`,
          jwt: this.generateAccessToken({
            su: true,
            userId: options.userId,
          }).token,
          body: { parts },
        }),
      )
      .then(({ body }) => JSON.parse(body))
  }

  private uploadAttachment({
    userId,
    roomId,
    part: { type, name, customData, file },
  }: {
    userId: string
    roomId: string
    part: any
  }): Promise<{ type: string; attachment: { id: string } }> {
    return this.serverInstanceV3
      .request({
        method: "POST",
        path: `/rooms/${encodeURIComponent(roomId)}/attachments`,
        jwt: this.generateAccessToken({
          su: true,
          userId,
        }).token,
        body: {
          content_type: type,
          content_length: file.length,
          name,
          custom_data: customData,
        },
      })
      .then(({ body }) => {
        const {
          attachment_id: attachmentId,
          upload_url: uploadURL,
        } = JSON.parse(body)
        return put(uploadURL, {
          body: file,
          headers: {
            "content-type": type,
          },
        }).then(() => ({ type, attachment: { id: attachmentId } }))
      })
  }

  deleteMessage(options: DeleteMessageOptions): Promise<void> {
    return this.serverInstanceV3
      .request({
        method: "DELETE",
        path: `/messages/${options.id}`,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  getRoomMessages(options: GetRoomMessagesOptions): Promise<any> {
    return this.fetchMessages({
      ...options,
      serverInstance: this.serverInstanceV2,
    })
  }

  fetchMultipartMessages(options: FetchMultipartMessagesOptions): Promise<any> {
    return this.fetchMessages({
      ...options,
      serverInstance: this.serverInstanceV3,
    })
  }

  private fetchMessages(options: FetchMessagesOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
    })

    const { initialId, ...optionsMinusInitialId } = options
    let qs: FetchMessagesPayload = optionsMinusInitialId
    if (initialId) {
      qs["initial_id"] = initialId
    }

    return options.serverInstance
      .request({
        method: "GET",
        path: `/rooms/${encodeURIComponent(options.roomId)}/messages`,
        jwt: jwt.token,
        qs: qs,
      })
      .then(res => JSON.parse(res.body))
  }

  getRooms(options: GetRoomsOptions = {}): Promise<any> {
    return this.serverInstanceV3
      .request({
        method: "GET",
        path: `/rooms`,
        jwt: this.getServerToken(),
        qs: {
          from_id: options.fromId,
          include_private: options.includePrivate,
        },
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  getUserRooms(options: GetUserRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.userId,
    })

    return this.serverInstanceV3
      .request({
        method: "GET",
        path: `/users/${options.userId}/rooms`,
        jwt: jwt.token,
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  getUserJoinableRooms(options: GetUserJoinableRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.userId,
    })

    return this.serverInstanceV3
      .request({
        method: "GET",
        path: `/users/${options.userId}/rooms`,
        qs: { joinable: true },
        jwt: jwt.token,
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  createRoom(options: CreateRoomOptions): Promise<any> {
    const jwt = this.generateAccessToken({
      su: true,
      userId: options.creatorId,
    })

    const { name, isPrivate, userIds, customData } = options

    let roomPayload: any = {
      name,
      private: isPrivate || false,
    }

    if (userIds && userIds.length !== 0) {
      roomPayload["user_ids"] = userIds
    }

    if (customData) {
      roomPayload.custom_data = customData
    }

    return this.serverInstanceV3
      .request({
        method: "POST",
        path: "/rooms",
        jwt: jwt.token,
        body: roomPayload,
      })
      .then(res => {
        return JSON.parse(res.body)
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
    if (options.customData) {
      body.custom_data = options.customData
    }
    return this.serverInstanceV3
      .request({
        method: "PUT",
        path: `/rooms/${options.id}`,
        jwt: this.getServerToken(),
        body,
      })
      .then(() => {})
  }

  deleteRoom(options: DeleteRoomOptions): Promise<void> {
    return this.serverInstanceV3
      .request({
        method: "DELETE",
        path: `/rooms/${options.id}`,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  addUsersToRoom(options: AddUsersToRoomOptions): Promise<void> {
    return this.serverInstanceV3
      .request({
        method: "PUT",
        path: `/rooms/${encodeURIComponent(options.roomId)}/users/add`,
        jwt: this.getServerToken(),
        body: { user_ids: options.userIds },
      })
      .then(() => {})
  }

  removeUsersFromRoom(options: RemoveUsersFromRoomOptions): Promise<void> {
    return this.serverInstanceV3
      .request({
        method: "PUT",
        path: `/rooms/${encodeURIComponent(options.roomId)}/users/remove`,
        jwt: this.getServerToken(),
        body: { user_ids: options.userIds },
      })
      .then(() => {})
  }

  // Authorizer interactions

  createRoomRole(options: CreateRoleOptions): Promise<void> {
    return this.createRole({
      ...options,
      scope: "room",
    })
  }

  createGlobalRole(options: CreateRoleOptions): Promise<void> {
    return this.createRole({
      ...options,
      scope: "global",
    })
  }

  private createRole(options: CreateScopedRoleOptions): Promise<void> {
    return this.authorizerInstance
      .request({
        method: "POST",
        path: `/roles`,
        headers: {
          "Content-Type": "application/json",
        },
        body: options,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  deleteGlobalRole(options: DeleteRoleOptions): Promise<void> {
    return this.authorizerInstance
      .request({
        method: "DELETE",
        path: `/roles/${options.name}/scope/global`,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  deleteRoomRole(options: DeleteRoleOptions): Promise<void> {
    return this.authorizerInstance
      .request({
        method: "DELETE",
        path: `/roles/${options.name}/scope/room`,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  assignGlobalRoleToUser(
    options: AssignGlobalRoleToUserOptions,
  ): Promise<void> {
    return this.assignRoleToUser(options)
  }

  assignRoomRoleToUser(options: AssignRoomRoleToUserOptions): Promise<void> {
    return this.assignRoleToUser(options)
  }

  private assignRoleToUser(options: AssignRoleToUserOptions): Promise<void> {
    return this.authorizerInstance
      .request({
        method: "PUT",
        path: `/users/${options.userId}/roles`,
        headers: {
          "Content-Type": "application/json",
        },
        body: { name: options.name, room_id: options.roomId },
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  getUserRoles(options: GetUserRolesOptions): Promise<any> {
    return this.authorizerInstance
      .request({
        method: "GET",
        path: `/users/${options.userId}/roles`,
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  removeGlobalRoleForUser(
    options: RemoveGlobalRoleForUserOptions,
  ): Promise<void> {
    return this.authorizerInstance
      .request({
        method: "DELETE",
        path: `/users/${options.userId}/roles`,
        headers: {
          "Content-Type": "application/json",
        },
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  removeRoomRoleForUser(options: RemoveRoomRoleForUserOptions): Promise<void> {
    return this.authorizerInstance
      .request({
        method: "DELETE",
        path: `/users/${options.userId}/roles`,
        headers: {
          "Content-Type": "application/json",
        },
        qs: { room_id: options.roomId },
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  getPermissionsForGlobalRole(options: GetPermissionsOptions): Promise<any> {
    return this.authorizerInstance
      .request({
        method: "GET",
        path: `/roles/${options.name}/scope/global/permissions`,
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  getPermissionsForRoomRole(options: GetPermissionsOptions): Promise<any> {
    return this.authorizerInstance
      .request({
        method: "GET",
        path: `/roles/${options.name}/scope/room/permissions`,
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  updatePermissionsForGlobalRole(
    options: UpdatePermissionsOptions,
  ): Promise<any> {
    return this.updatePermissionsForRole(
      options.name,
      "global",
      options.permissionsToAdd || [],
      options.permissionsToRemove || [],
    )
  }

  updatePermissionsForRoomRole(
    options: UpdatePermissionsOptions,
  ): Promise<any> {
    return this.updatePermissionsForRole(
      options.name,
      "room",
      options.permissionsToAdd || [],
      options.permissionsToRemove || [],
    )
  }

  getRoles(): Promise<any> {
    return this.authorizerInstance
      .request({
        method: "GET",
        path: `/roles`,
        jwt: this.getServerToken(),
      })
      .then(res => {
        return JSON.parse(res.body)
      })
  }

  // Cursors

  setReadCursor(options: SetReadCursorOptions): Promise<void> {
    return this.cursorsInstance
      .request({
        method: "PUT",
        path: `/cursors/0/rooms/${encodeURIComponent(
          options.roomId,
        )}/users/${encodeURIComponent(options.userId)}`,
        body: { position: options.position },
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  getReadCursor(options: GetReadCursorOptions): Promise<any> {
    return this.cursorsInstance
      .request({
        method: "GET",
        path: `/cursors/0/rooms/${encodeURIComponent(
          options.roomId,
        )}/users/${encodeURIComponent(options.userId)}`,
        jwt: this.getServerToken(),
      })
      .then(({ body }) => JSON.parse(body))
  }

  getReadCursorsForUser(options: GetReadCursorsForUserOptions): Promise<any> {
    return this.cursorsInstance
      .request({
        method: "GET",
        path: `/cursors/0/users/${encodeURIComponent(options.userId)}`,
        jwt: this.getServerToken(),
      })
      .then(({ body }) => JSON.parse(body))
  }

  getReadCursorsForRoom(options: GetReadCursorsForRoomOptions): Promise<any> {
    return this.cursorsInstance
      .request({
        method: "GET",
        path: `/cursors/0/rooms/${encodeURIComponent(options.roomId)}`,
        jwt: this.getServerToken(),
      })
      .then(({ body }) => JSON.parse(body))
  }

  asyncDeleteRoom(options: AsyncDeleteRoomOptions): Promise<void> {
    return this.schedulerInstance
      .request({
        method: "PUT",
        path: `/rooms/${encodeURIComponent(options.roomId)}`,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  getDeleteRoomStatus(options: AsyncDeleteRoomOptions): Promise<any> {
    return this.schedulerInstance
      .request({
        method: "GET",
        path: `/rooms/${encodeURIComponent(options.roomId)}`,
        jwt: this.getServerToken(),
      })
      .then(res => JSON.parse(res.body))
  }

  asyncDeleteUser(options: AsyncDeleteUserOptions): Promise<void> {
    return this.schedulerInstance
      .request({
        method: "PUT",
        path: `/users/${encodeURIComponent(options.userId)}`,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  getDeleteUserStatus(options: AsyncDeleteUserOptions): Promise<any> {
    return this.schedulerInstance
      .request({
        method: "GET",
        path: `/users/${encodeURIComponent(options.userId)}`,
        jwt: this.getServerToken(),
      })
      .then(res => JSON.parse(res.body))
  }

  // General requests

  apiRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken()
    return this.serverInstanceV3.request(options)
  }

  authorizerRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken()
    return this.authorizerInstance.request(options)
  }

  cursorsRequest(options: GeneralRequestOptions): Promise<any> {
    options.jwt = options.jwt || this.getServerToken()
    return this.cursorsInstance.request(options)
  }

  private updatePermissionsForRole(
    name: string,
    scope: string,
    permissionsToadd: Array<string> = [],
    permissionsToRemove: Array<string> = [],
  ): Promise<any> {
    if (permissionsToadd.length === 0 && permissionsToRemove.length === 0) {
      throw new Error(
        `Either permissionsToAdd or permissionsToRemove is required`,
      )
    }

    let body: UpdateRolePermissionsOptions = {}
    if (permissionsToadd.length > 0) {
      body["add_permissions"] = permissionsToadd
    }

    if (permissionsToRemove.length > 0) {
      body["remove_permissions"] = permissionsToRemove
    }

    return this.authorizerInstance
      .request({
        method: "PUT",
        path: `/roles/${name}/scope/${scope}/permissions`,
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
        jwt: this.getServerToken(),
      })
      .then(() => {})
  }

  /**
   * This method manages the token for http library and pusher platform
   * communication
   */
  private getServerToken(): string {
    if (
      this.tokenWithExpiry &&
      this.tokenWithExpiry.expiresAt > getCurrentTimeInSeconds()
    ) {
      return this.tokenWithExpiry.token
    }

    // Otherwise generate new token and its expiration time
    const tokenWithExpiresIn = this.serverInstanceV3.generateAccessToken({
      su: true,
    })

    this.tokenWithExpiry = {
      token: tokenWithExpiresIn.token,
      expiresAt:
        getCurrentTimeInSeconds() +
        tokenWithExpiresIn.expires_in -
        TOKEN_EXPIRY_LEEWAY,
    }

    return this.tokenWithExpiry.token
  }
}
