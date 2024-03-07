export { Base as BaseStorage } from './base';
export {
    discardStorage as discardClientStorage,
    getStorage as getClientStorage
} from './client';
export {
    discardStorage as discardServerStorage,
    getStorage as getServerStorage
} from './server';

/**
 * @typedef {import("./base").Base & P} LocalStorageType
 * @template [P={}]
 */
/** @typedef {{[x:string]: string }} ParsedCookies */
/** @typedef {string} RawCookies */
/** @typedef {ParsedCookies|RawCookies} Cookies */
/**
 * @typedef {{[x:string]:*} & {
 *      cookies?: CDATA,
 *      getHeader?: (key:string) => string|Array<string>
 * }} Request 
 * @template {Cookies} [CDATA=Cookies]
 */
/**
 * @typedef {{[x:string]:*} & {
* 		setHeader?: (key: string, value: string) => void
* 		getHeader?: (key: string) => string|Array<string>
* }} Response
*/
/**
 * @typedef Id
 * @property {string} Id.value
 */