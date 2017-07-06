import {Readable} from 'stream';
import { IncomingMessage } from 'http';

export const jsonToReadable = (json: Object): Readable => {
  const s = new Readable();
  s.push(JSON.stringify(json));
  s.push(null);
  return s;
};

export const getCurrentTimeInSeconds = (): number => Math.floor(Date.now() / 1000);
