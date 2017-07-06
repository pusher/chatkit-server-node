"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
exports.jsonToReadable = function (json) {
    var s = new stream_1.Readable();
    s.push(JSON.stringify(json));
    s.push(null);
    return s;
};
exports.getCurrentTimeInSeconds = function () { return Math.floor(Date.now() / 1000); };
//# sourceMappingURL=utils.js.map