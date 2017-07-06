/// <reference types="node" />
import { IncomingMessage } from 'http';
import { App as PusherService, BaseClient } from 'pusher-platform-node';
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
    constructor(pusherServiceConfig: Options);
    createUser(id: string, name: string): Promise<IncomingMessage>;
    createRoomRole(name: string, permissions: Array<string>): Promise<IncomingMessage>;
    createGlobalRole(name: string, permissions: Array<string>): Promise<IncomingMessage>;
    private createRole(name, scope, permissions);
    deleteGlobalRole(roleName: string): Promise<any>;
    deleteRoomRole(roleName: string): Promise<any>;
    assignGlobalRoleToUser(userId: string, roleName: string): Promise<any>;
    assignRoomRoleToUser(userId: string, roleName: string, roomId: number): Promise<any>;
    getUserRoles(userId: string): Promise<any>;
    removeGlobalRoleForUser(userId: string): Promise<any>;
    removeRoomRoleForUser(userId: string, roomId: number): Promise<any>;
    getPermissionsForGlobalRole(roleName: string): Promise<any>;
    getPermissionsForRoomRole(roleName: string): Promise<any>;
    /**
     * This method manages the token for http library and pusher platform
     * communication
     */
    private getServerToken();
}
