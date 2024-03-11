import { DEL_MARKER } from '../constants';

import { Base } from '../base';

import { StorageRef } from '../helper/ref';

const DEFAULT_OBJ = {};
const toString = Object.prototype.toString;

export class ServerStorage extends Base {
    /* istanbul ignore next */ 
	/** @type {Base["getItem"]} */
	getItem( key, request = DEFAULT_OBJ ){
		switch( toString.call( request.cookies ) ) {
            case '[object Object]': return request.cookies[ key ];
            case '[object String]': return getFromRawCookies( key, request.cookies );
        }
        const cookies = request.getHeader?.( 'Cookie' );
        if( toString.call( cookies ) === '[object String]' ) {
            return getFromRawCookies( key, cookies );
        }
	}
	/* istanbul ignore next */
	/** @type {Base["removeItem"]} */
	removeItem( key, value, response = DEFAULT_OBJ ) {
        /* istanbul ignore next */ 
		if( typeof response.setHeader === 'undefined' ) { return }
		response.setHeader( 'Set-Cookie', `${ key }=${ value }; max-age=0` );
		response.setHeader( 'Set-Cookie', `${ DEL_MARKER }${ key }=1` );
	}
	/* istanbul ignore next */
	/** @type {Base["setItem"]} */
	setItem( key, value, response = DEFAULT_OBJ ) {
		/* istanbul ignore next */ 
		if( typeof response.setHeader === 'undefined' ) { return }
		response.setHeader( 'Set-Cookie', `${ key }=${ value }` );
		response.setHeader( 'Set-Cookie', `${ DEL_MARKER }${ key }=1; max-age=0` );
	}
};

/** @type {Id} */
const instanceId = { value: undefined };

/** @type {StorageRef<ServerStorage>} */ export const storage = new StorageRef( instanceId );

/**
 * Discards current storage singleton instance. To get 
 * a new one, simply call getStorage(...) afterwards.
 */
export const discardStorage = () => { storage.reset( instanceId ) }

/**
 * **Singleton**
 *
 * @returns {StorageRef<ServerStorage>}
 */
export const getStorage = () => {
	typeof storage.current === 'undefined' &&
	storage.set( new ServerStorage(), instanceId );
	return storage;
};

/**
 * @param {string} key
 * @param {import("..").RawCookies} source
 * @return {string|undefined}
 */
function getFromRawCookies( key, source ) {
    const cookie = source
        .split( ';' )
        .find( c => c.startsWith( `${ key }=` ) );
    /* istanbul ignore else */
    if( cookie ) { return cookie.split( '=' )[ 1 ] }
}

/** @typedef {import("..").Id} Id */
/** @typedef {import("..").Cookies} Cookies */
/** @typedef {import("..").Response} Response */