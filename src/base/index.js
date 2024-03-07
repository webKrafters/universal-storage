export class Base {
	/**
	 * @param {string} key
	 * @param {Request<CDATA>} [req]
	 * @returns {string}
	 * @template {Cookies} [CDATA=Cookies]
	 */
	getItem( key, req ) {}
	/**
	 * @param {string} key
	 * @param {T} [value]
	 * @param {Response} [response]
	 * @template [T]
	 */
	removeItem( key, value, response ) {}
	/**
	 * @param {string} key
	 * @param {T} value
	 * @param {Response} [response]
	 * @template [T]
	 */
	setItem( key, value, response ) {}
}


/** @typedef {import("..").Cookies} Cookies */
/**
 * @typedef {import("..").Request<CDATA>} Request
 * @template {Cookies} [CDATA=Cookies]
 */
/** @typedef {import("..").Response} Response */