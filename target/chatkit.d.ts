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
    createRole(name: string, scope: string, permissions: Array<string>): Promise<IncomingMessage>;
    /**
     * This method manages the token for http library and pusher platform
     * communication
     */
    private getServerToken();
}
