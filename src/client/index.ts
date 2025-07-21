import type { BaseStorage, Id } from '..';

type This = typeof globalThis;

interface Context {
    localStorage : BaseStorage;
    setTimeout : (
        handler : ( ...args: Array<unknown> ) => void,
        timeout? : number,
        ...args : Array<unknown>
    ) => number;
    XMLHttpRequest : This["XMLHttpRequest"];
};

import { DEL_MARKER } from '../constants';

import { BaseStorage as Base } from '../base';

import { StorageRef } from '../helper/ref';

const jsCookie = require( 'js-cookie' );

/* istanbul ignore next */
const ctx = (
    typeof window !== 'undefined'
    ? window
    : typeof self !== 'undefined'
        ? self
        : typeof global !== 'undefined'
            ? global
            : {}
) as Context;

/* istanbul ignore next */
if( !ctx.localStorage ) { ctx.localStorage = new Base() }
/* istanbul ignore next */
if( !ctx.setTimeout ) {
    ctx.setTimeout = ( cb, t, ...args ) => {
        cb( ...args );
        return 1;
    };
}

export class ClientStorage extends Base {
    private _localStorage : BaseStorage;
    constructor( localStorageImplementation = ctx.localStorage ) {
        super();
        this._localStorage = localStorageImplementation;
    }
    get localStorage() { return this._localStorage }
    getItem( key : string ) : string {
        let val = jsCookie.get( key );
        if( typeof val !== 'undefined' ) {
            ctx.setTimeout( () => this._localStorage.setItem( key, val ), 0 );
            return val;
        }
        val = this._localStorage.getItem( key );
        /* istanbul ignore next */
        if( typeof val === 'undefined' ) { return null };
        ctx.setTimeout( () => jsCookie.set( key, val ), 0 );
        return val;
    }
    removeItem( key : string ) {
        jsCookie.remove( key, { path: '/' } );
        this._localStorage.removeItem( key );
    }
    setItem( key : string, value : unknown ) {
        const val = `${ value }`;
        jsCookie.set( key, val, { path: '/' } );
        this._localStorage.setItem( key, val );
    }
};

const instanceId : Id = { value: undefined };

export const storage : StorageRef<ClientStorage> =
    new StorageRef( instanceId );

let sendXhr : XMLHttpRequest["send"];

/**
 * Discards current storage singleton instance. To get 
 * a new one, simply call getStorage(...) afterwards.
 */
export function discardStorage() {
    storage.reset( instanceId );
    if( !sendXhr ) { return }
    // istanbul ignore next
    ctx.XMLHttpRequest.prototype.send = sendXhr;
    // istanbul ignore next
    sendXhr = undefined;
}

/** **Singleton** */
export function getStorage(
    localStorageImplementation? : BaseStorage
) : StorageRef<ClientStorage> {
    if( typeof storage.current !== 'undefined' ) {
        return storage
    }
    storage.set(
        new ClientStorage( localStorageImplementation ),
        instanceId
    );
    const localStorage = storage.current!.localStorage;
    const delCookieKeyOffset = DEL_MARKER.length;
    const synchronizeWithServer = () => {
        for( let k in jsCookie.get() ) {
            if( k.length <= delCookieKeyOffset || !k.startsWith( DEL_MARKER ) ) { continue }
            localStorage.removeItem( k.slice( delCookieKeyOffset ) );
            jsCookie.remove( k, { path: '/' } );
        }
    };
    startServerWatch( synchronizeWithServer );
    synchronizeWithServer();
    return storage;
}

/* istanbul ignore next */
function startServerWatch( onResponse : ()=>void ) {
    if( typeof ctx.XMLHttpRequest === 'undefined' ) { return }
    let timer;
    sendXhr = ctx.XMLHttpRequest.prototype.send;
    const runSync = () => {
        onResponse();
        timer = null;
    };
    const scheduleSync = () => {
        if( timer ) { return }
        timer = ctx.setTimeout( runSync , 250 );
    };
    function orderServerSync() {
        /* istanbul ignore next */
        this.readyState === ctx.XMLHttpRequest.DONE && scheduleSync();
    }
    ctx.XMLHttpRequest.prototype.send = function( ...args ) {
        this.addEventListener( 'readystatechange', orderServerSync );
        sendXhr.apply( this, args );
    };
}
