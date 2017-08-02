"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pusher_platform_node_1 = require("pusher-platform-node");
var permissions_1 = require("./permissions");
var utils_1 = require("./utils");
;
;
;
;
var TOKEN_EXPIRY_LEEWAY = 30;
var ChatKit = (function () {
    function ChatKit(options) {
        var instanceId = options.instanceId, key = options.key, port = options.port, host = options.host, client = options.client;
        var apiInstanceOptions = ({
            instanceId: instanceId,
            key: key,
            port: port,
            host: host,
            client: client,
            serviceName: 'chatkit',
            serviceVersion: 'v1',
        });
        var authorizerInstanceOptions = ({
            instanceId: instanceId,
            key: key,
            port: port,
            host: host,
            client: client,
            serviceName: 'chatkit_authorizer',
            serviceVersion: 'v1',
        });
        this.apiInstance = new pusher_platform_node_1.Instance(apiInstanceOptions);
        this.authorizerInstance = new pusher_platform_node_1.Instance(authorizerInstanceOptions);
    }
    // Token generation
    ChatKit.prototype.authenticate = function (authPayload, userId) {
        return this.apiInstance.authenticate(authPayload, { userId: userId });
    };
    ChatKit.prototype.generateAccessToken = function (authOptions) {
        return this.apiInstance.generateAccessToken(authOptions);
    };
    // User interactions
    ChatKit.prototype.createUser = function (id, name) {
        return this.apiInstance.request({
            method: 'POST',
            path: "/users",
            headers: {
                'Content-Type': 'application/json'
            },
            body: { id: id, name: name },
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.deleteUser = function (id) {
        return this.apiInstance.request({
            method: 'DELETE',
            path: "/users/" + id,
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.getUsers = function () {
        return this.apiInstance.request({
            method: 'GET',
            path: "/users",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    // Room interactions
    ChatKit.prototype.getRooms = function () {
        return this.apiInstance.request({
            method: 'GET',
            path: "/rooms",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    // Authorizer interactions
    ChatKit.prototype.createRoomRole = function (name, permissions) {
        permissions.forEach(function (perm) {
            if (permissions_1.validRoomPermissions.indexOf(perm) < 0) {
                throw new Error("Permission value \"" + perm + "\" is invalid");
            }
        });
        return this.createRole(name, 'room', permissions);
    };
    ChatKit.prototype.createGlobalRole = function (name, permissions) {
        permissions.forEach(function (perm) {
            if (permissions_1.validGlobalPermissions.indexOf(perm) < 0) {
                throw new Error("Permission value \"" + perm + "\" is invalid");
            }
        });
        return this.createRole(name, 'global', permissions);
    };
    ChatKit.prototype.createRole = function (name, scope, permissions) {
        return this.authorizerInstance.request({
            method: 'POST',
            path: "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: { scope: scope, name: name, permissions: permissions },
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.deleteGlobalRole = function (roleName) {
        return this.authorizerInstance.request({
            method: 'DELETE',
            path: "/roles/" + roleName + "/scope/global",
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.deleteRoomRole = function (roleName) {
        return this.authorizerInstance.request({
            method: 'DELETE',
            path: "/roles/" + roleName + "/scope/room",
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.assignGlobalRoleToUser = function (userId, roleName) {
        return this.authorizerInstance.request({
            method: 'POST',
            path: "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: { name: roleName },
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.assignRoomRoleToUser = function (userId, roleName, roomId) {
        return this.authorizerInstance.request({
            method: 'POST',
            path: "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: { name: roleName, room_id: roomId },
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.getUserRoles = function (userId) {
        return this.authorizerInstance.request({
            method: 'GET',
            path: "/users/" + userId + "/roles",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    ChatKit.prototype.removeGlobalRoleForUser = function (userId) {
        return this.authorizerInstance.request({
            method: 'PUT',
            path: "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.removeRoomRoleForUser = function (userId, roomId) {
        return this.authorizerInstance.request({
            method: 'PUT',
            path: "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: { room_id: roomId },
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.getPermissionsForGlobalRole = function (roleName) {
        return this.authorizerInstance.request({
            method: 'GET',
            path: "/roles/" + roleName + "/scope/global/permissions",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    ChatKit.prototype.getPermissionsForRoomRole = function (roleName) {
        return this.authorizerInstance.request({
            method: 'GET',
            path: "/roles/" + roleName + "/scope/room/permissions",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    ChatKit.prototype.getRoles = function () {
        return this.authorizerInstance.request({
            method: 'GET',
            path: "/roles",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    // General requests
    ChatKit.prototype.apiRequest = function (options) {
        var method = options.method, path = options.path;
        var jwt = options.jwt || this.getServerToken();
        return this.apiInstance.request({
            method: method,
            path: path,
            jwt: jwt,
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    ChatKit.prototype.authorizerRequest = function (options) {
        var method = options.method, path = options.path;
        var jwt = options.jwt || this.getServerToken();
        return this.authorizerInstance.request({
            method: method,
            path: path,
            jwt: jwt,
        }).then(function (res) {
            return JSON.parse(res.body);
        });
    };
    /**
     * This method manages the token for http library and pusher platform
     * communication
     */
    ChatKit.prototype.getServerToken = function () {
        if (this.tokenWithExpiry && this.tokenWithExpiry.expiresAt > utils_1.getCurrentTimeInSeconds()) {
            return this.tokenWithExpiry.token;
        }
        // Otherwise generate new token and its expiration time
        var tokenWithExpiresIn = this.apiInstance.generateAccessToken({ su: true });
        this.tokenWithExpiry = {
            token: tokenWithExpiresIn.token,
            expiresAt: utils_1.getCurrentTimeInSeconds() + tokenWithExpiresIn.expires_in - TOKEN_EXPIRY_LEEWAY,
        };
        return this.tokenWithExpiry.token;
    };
    ;
    return ChatKit;
}());
exports.default = ChatKit;
;
//# sourceMappingURL=chatkit.js.map