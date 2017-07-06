"use strict";
// import { Readable } from 'stream';
// import { IncomingMessage } from 'http';
Object.defineProperty(exports, "__esModule", { value: true });
// export const jsonToReadable = (json: Object): Readable => {
//   const s = new Readable();
//   s.push(JSON.stringify(json));
//   s.push(null);
//   return s;
// };
exports.getCurrentTimeInSeconds = function () { return Math.floor(Date.now() / 1000); };
//# sourceMappingURL=utils.js.map