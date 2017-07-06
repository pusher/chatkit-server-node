"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pusher_platform_node_1 = require("pusher-platform-node");
var utils_1 = require("./utils");
;
var ChatKit = (function () {
    function ChatKit(pusherServiceConfig) {
        this.apiBasePath = 'services/chat_api/v1';
        this.authorizerBasePath = 'services/chat_api_authorizer/v1';
        this.pusherService = new pusher_platform_node_1.App(pusherServiceConfig);
    }
    ChatKit.prototype.createUser = function (id, name) {
        return this.pusherService.request({
            method: 'POST',
            path: this.apiBasePath + "/users",
            headers: {
                'Content-Type': 'application/json'
            },
            body: utils_1.jsonToReadable({ id: id, name: name }),
        });
    };
    ChatKit.prototype.createRole = function (name, scope, permissions) {
        return this.pusherService.request({
            method: 'POST',
            path: this.authorizerBasePath + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: utils_1.jsonToReadable({ scope: scope, name: name, permissions: permissions }),
        });
    };
    /**
     * This method manages the token for http library and pusher platform
     * communication
     */
    ChatKit.prototype.getServerToken = function () {
        // let tokenWithExpirationTime: TokenWithExpiry = {
        //   token: '',
        //   expiresIn: 0
        // };
        // const {token, expiresIn} = tokenWithExpirationTime;
        // // If token exists and is still valid just return it..
        // if (token && expiresIn > getCurrentTimeInSeconds()) {
        //   return token;
        // }
        // // Otherwise generate new token and its expiration time
        // const {token, expires_in} = this.pusherService.generateSuperuserJWT();
        // tokenWithExpirationTime = {
        //   token,
        //   expiresIn: getCurrentTimeInSeconds() + expires_in - cacheExpiryTolerance
        // };
        var t = this.pusherService.generateSuperuserJWT();
        var token = 'test';
        return token;
    };
    ;
    return ChatKit;
}());
exports.default = ChatKit;
;
//# sourceMappingURL=chatkit.js.map