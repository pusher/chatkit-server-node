import { Instance, AuthenticationResponse, BaseClient } from 'pusher-platform-node';
export interface TokenWithExpiry {
    token: string;
    expiresAt: number;
}
export interface AuthenticatePayload {
    grant_type?: string;
    refresh_token?: string;
}
export interface Options {
    instance: string;
    key: string;
    port?: number;
    host?: string;
    client?: BaseClient;
}
export default class ChatKit {
    apiInstance: Instance;
    authorizerInstance: Instance;
    private tokenWithExpiry?;
    constructor(options: Options);
    authenticate(authPayload: AuthenticatePayload, userId: string): AuthenticationResponse;
    createUser(id: string, name: string): Promise<void>;
    deleteUser(id: string): Promise<void>;
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
    getRoles(): Promise<any>;
    /**
     * This method manages the token for http library and pusher platform
     * communication
     */
    private getServerToken();
}
