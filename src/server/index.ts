import { DEL_MARKER } from '../constants';

import { Cookies, Id, ParsedCookies, RawCookies, Request, Response } from '..';

import { BaseStorage } from '../base';

import { StorageRef } from '../helper/ref';

const DEFAULT_REQ : Request<ParsedCookies> = {
	getHeader: undefined as ((key: string) => string | Array<string>),
	cookies: {}
};

const DEFAULT_RES : Response = {
	getHeader: undefined as ((key: string) => string | Array<string>),
	setHeader: undefined as ((key: string, value: string) => void)
};

const toString = Object.prototype.toString;

export class ServerStorage extends BaseStorage { 
	getItem<C extends Cookies>(
		key : string,
		request? : Request<C>
	) : string {
		const req : Request<Cookies> = request ?? DEFAULT_REQ;
		switch( toString.call( req.cookies ) ) {
            case '[object Object]': return req.cookies[ key ] ?? null;
            case '[object String]': return getFromRawCookies( key, req.cookies as RawCookies );
        }
        const cookies = req.getHeader?.( 'Cookie' );
        if( toString.call( cookies ) === '[object String]' ) {
            return getFromRawCookies( key, cookies as RawCookies );
        }
		// istanbul ignore next
		return null;
	}
	removeItem(
		key : String,
		value : unknown,
		response : Response = DEFAULT_RES
	) {
        if( typeof response.setHeader === 'undefined' ) { return }
		response.setHeader( 'Set-Cookie', `${ key }=${ value }; max-age=0` );
		response.setHeader( 'Set-Cookie', `${ DEL_MARKER }${ key }=1` );
	}
	
	setItem(
		key : string,
		value : unknown,
		response : Response = DEFAULT_RES
	) {
		if( typeof response.setHeader === 'undefined' ) { return }
		response.setHeader( 'Set-Cookie', `${ key }=${ value }` );
		response.setHeader( 'Set-Cookie', `${ DEL_MARKER }${ key }=1; max-age=0` );
	}
};

const instanceId : Id = { value: undefined };

export const storage : StorageRef<ServerStorage> = new StorageRef( instanceId );

/**
 * Discards current storage singleton instance. To get 
 * a new one, simply call getStorage(...) afterwards.
 */
export function discardStorage(){ storage.reset( instanceId ) }

/** **Singleton** */
export function getStorage() : StorageRef<ServerStorage> {
	typeof storage.current === 'undefined' &&
	storage.set( new ServerStorage(), instanceId );
	return storage;
};

function getFromRawCookies(
	key : string,
	source : RawCookies
) : string | null {
    const cookie = source
        .split( ';' )
        .find( c => c.startsWith( `${ key }=` ) );
    if( cookie ) { return cookie.split( '=' )[ 1 ] }
	/* istanbul ignore next */
	return null;
}
