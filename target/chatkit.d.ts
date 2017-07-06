import { App as PusherService, BaseClient } from 'pusher-platform-node';
export interface TokenWithExpiry {
    token: string;
    expiresAt: number;
}
export interface Options {
    cluster: string;
    appId: string;
    appKey: string;
    client?: BaseClient;
}
export default class ChatKit {
    pusherService: PusherService;
    private apiBasePath;
    private authorizerBasePath;
    private tokenWithExpiry?;
    constructor(pusherServiceConfig: Options);
    createUser(id: string, name: string): Promise<void>;
    createRoomRole(name: string, permissions: Array<string>): Promise<void>;
    createGlobalRole(name: string, permissions: Array<string>): Promise<void>;
    private createRole(name, scope, permissions);
    deleteGlobalRole(roleName: string): Promise<void>;
    deleteRoomRole(roleName: string): Promise<void>;
    assignGlobalRoleToUser(userId: string, roleName: string): Promise<void>;
    assignRoomRoleToUser(userId: string, roleName: string, roomId: number): Promise<void>;
    getUserRoles(userId: string): Promise<any>;
    removeGlobalRoleForUser(userId: string): Promise<void>;
    removeRoomRoleForUser(userId: string, roomId: number): Promise<void>;
    getPermissionsForGlobalRole(roleName: string): Promise<any>;
    getPermissionsForRoomRole(roleName: string): Promise<any>;
    /**
     * This method manages the token for http library and pusher platform
     * communication
     */
    private getServerToken();
}
