import { DEL_MARKER } from '../constants';

import { Base } from '../base';

import { StorageRef } from '../helper/ref';

const jsCookie = require( 'js-cookie' );

/* istanbul ignore next */
const ctx = typeof window !== 'undefined'
    ? window
    : typeof self !== 'undefined'
        ? self
        : typeof global !== 'undefined'
            ? global
            : {};

/* istanbul ignore next */
if( !ctx.localStorage ) { ctx.localStorage = new Base() }
/* istanbul ignore next */
if( !ctx.setTimeout ) { ctx.setTimeout = ( cb, t, ...args ) => cb( args ) }

export class ClientStorage extends Base {
    /**
     * @readonly
     * @type {LocalStorageType}
     */
    #localStorage;
    /**
     * @param {LocalStorageType<P>} [localStorageImplementation]
     * @template [P={}]
     */
    constructor( localStorageImplementation = ctx.localStorage ) {
        super();
        this.#localStorage = localStorageImplementation;
    }
    get localStorage() { return this.#localStorage }
    /** @type {Base["getItem"]} */
    getItem( key ) {
        let val = jsCookie.get( key );
        if( typeof val !== 'undefined' ) {
            ctx.setTimeout( () => this.#localStorage.setItem( key, val ), 0 );
            return val;
        }
        val = this.#localStorage.getItem( key );
        /* istanbul ignore next */
        if( typeof val === 'undefined' ) { return };
        ctx.setTimeout( () => jsCookie.set( key, val ), 0 );
        return val;
    }
    /** @type {Base["removeItem"]} */
    removeItem( key ) {
        jsCookie.remove( key, { path: '/' } );
        this.#localStorage.removeItem( key );
    }
    /** @type {Base["setItem"]} */
    setItem( key, value ) {
        const val = `${ value }`;
        jsCookie.set( key, val, { path: '/' } );
        this.#localStorage.setItem( key, val );
    }
};

/** @type {Id} */
const instanceId = { value: undefined };

/** @type {StorageRef<ClientStorage>} */
export const storage = new StorageRef( instanceId );

/** @type {XMLHttpRequest["send"]} */ let sendXhr;

/**
 * Discards current storage singleton instance. To get 
 * a new one, simply call getStorage(...) afterwards.
 */
export const discardStorage = () => {
    storage.reset( instanceId );
    if( !sendXhr ) { return }
    ctx.XMLHttpRequest.prototype.send = sendXhr;
    sendXhr = undefined;
}

/**
 * **Singleton**
 * 
 * @param {LocalStorageType<P>} [localStorageImplementation]
 * @returns {StorageRef<ClientStorage>}
 * @template [P={}]
 */
export const getStorage = localStorageImplementation => {
    if( typeof storage.current !== 'undefined' ) { return storage }
    storage.set( new ClientStorage( localStorageImplementation ), instanceId );
    const localStorage = storage.current.localStorage;
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

/** @param {()=>void} onResponse */
function startServerWatch( onResponse ) /* istanbul ignore next */ { 
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
        /* istanbul ignore next */
        this.addEventListener( 'readystatechange', orderServerSync );
        /* istanbul ignore next */
        sendXhr.apply( this, args );
    };
}

/** @typedef {import("..").Id} Id */
/**
 * @typedef {import("..").LocalStorageType<P>} LocalStorageType
 * @template [P={}]
 */