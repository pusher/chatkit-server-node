"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pusher_platform_node_1 = require("pusher-platform-node");
var permissions_1 = require("./permissions");
var utils_1 = require("./utils");
;
;
var TOKEN_EXPIRY_LEEWAY = 30;
var ChatKit = (function () {
    function ChatKit(pusherServiceConfig) {
        this.apiBasePath = 'services/chat_api/v1';
        this.authorizerBasePath = 'services/chat_api_authorizer/v1';
        this.pusherService = new pusher_platform_node_1.App(pusherServiceConfig);
    }
    // Token generation
    // ** TODO **
    // User interactions
    ChatKit.prototype.createUser = function (id, name) {
        return this.pusherService.request({
            method: 'POST',
            path: this.apiBasePath + "/users",
            headers: {
                'Content-Type': 'application/json'
            },
            body: pusher_platform_node_1.writeJSON({ id: id, name: name }),
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.deleteUser = function (id) {
        return this.pusherService.request({
            method: 'DELETE',
            path: this.apiBasePath + "/users/" + id,
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    // Authorizer interactions
    ChatKit.prototype.createRoomRole = function (name, permissions) {
        return this.createRole(name, 'room', permissions);
    };
    ChatKit.prototype.createGlobalRole = function (name, permissions) {
        return this.createRole(name, 'global', permissions);
    };
    ChatKit.prototype.createRole = function (name, scope, permissions) {
        permissions.forEach(function (perm) {
            if (permissions_1.validPermissions.indexOf(perm) < 0) {
                throw new Error("Permission value \"" + perm + "\" is invalid");
            }
        });
        return this.pusherService.request({
            method: 'POST',
            path: this.authorizerBasePath + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: pusher_platform_node_1.writeJSON({ scope: scope, name: name, permissions: permissions }),
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.deleteGlobalRole = function (roleName) {
        return this.pusherService.request({
            method: 'DELETE',
            path: this.authorizerBasePath + "/roles/" + roleName + "/scope/global",
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.deleteRoomRole = function (roleName) {
        return this.pusherService.request({
            method: 'DELETE',
            path: this.authorizerBasePath + "/roles/" + roleName + "/scope/room",
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.assignGlobalRoleToUser = function (userId, roleName) {
        return this.pusherService.request({
            method: 'POST',
            path: this.authorizerBasePath + "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: pusher_platform_node_1.writeJSON({ name: roleName }),
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.assignRoomRoleToUser = function (userId, roleName, roomId) {
        return this.pusherService.request({
            method: 'POST',
            path: this.authorizerBasePath + "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: pusher_platform_node_1.writeJSON({ name: roleName, room_id: roomId }),
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.getUserRoles = function (userId) {
        return this.pusherService.request({
            method: 'GET',
            path: this.authorizerBasePath + "/users/" + userId + "/roles",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return pusher_platform_node_1.readJSON(res);
        });
    };
    ChatKit.prototype.removeGlobalRoleForUser = function (userId) {
        return this.pusherService.request({
            method: 'PUT',
            path: this.authorizerBasePath + "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.removeRoomRoleForUser = function (userId, roomId) {
        return this.pusherService.request({
            method: 'PUT',
            path: this.authorizerBasePath + "/users/" + userId + "/roles",
            headers: {
                'Content-Type': 'application/json'
            },
            body: pusher_platform_node_1.writeJSON({ room_id: roomId }),
            jwt: this.getServerToken(),
        }).then(function () { });
    };
    ChatKit.prototype.getPermissionsForGlobalRole = function (roleName) {
        return this.pusherService.request({
            method: 'GET',
            path: this.authorizerBasePath + "/roles/" + roleName + "/scope/global/permissions\"",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return pusher_platform_node_1.readJSON(res);
        });
    };
    ChatKit.prototype.getPermissionsForRoomRole = function (roleName) {
        return this.pusherService.request({
            method: 'GET',
            path: this.authorizerBasePath + "/roles/" + roleName + "/scope/room/permissions\"",
            jwt: this.getServerToken(),
        }).then(function (res) {
            return pusher_platform_node_1.readJSON(res);
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
        var tokenWithExpiresIn = this.pusherService.generateSuperuserJWT();
        this.tokenWithExpiry = {
            token: tokenWithExpiresIn.jwt,
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