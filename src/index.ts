export type ParsedCookies = Record<string, string>;
export type RawCookies = string;
export type Cookies = ParsedCookies|RawCookies;

export interface Request<
    CDATA extends Cookies = Cookies
> extends ICommunication {
      cookies?: CDATA
};

export interface ICommunication {
    getHeader : (key: string) => string|Array<string>;
};

export interface Response extends ICommunication {
    setHeader : (key: string, value: string) => void;
};

export interface Id {
    value : string;
};

export type { BaseStorage } from './base';
export type { ClientStorage } from './client';
export type { ServerStorage } from './server';

export type { StorageRef } from './helper/ref';

export {
    discardStorage as discardClientStorage,
    getStorage as getClientStorage
} from './client';

export {
    discardStorage as discardServerStorage,
    getStorage as getServerStorage
} from './server';
