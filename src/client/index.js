import {
    BOUNDARY_MARKER,
    DEL_MARKER
} from '../constants';

import { Base } from '../base';

import { StorageRef } from '../helper/ref';

const jsCookie = require( 'js-cookie' );

export const {
    ClientStorage,
    discardStorage,
    getStorage,
    storage
} = ( ctx => {
   
    /* istanbul ignore next */
    if( !ctx.localStorage ) { ctx.localStorage = new Base() }
    /* istanbul ignore next */
    if( !ctx.setTimeout ) { ctx.setTimeout = ( cb, t, ...args ) => cb( args ) }
    
    class ClientStorage extends Base {
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
            val = this.#localStorage?.getItem( key );
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
    const storage = new StorageRef( instanceId );

    /** @type {XMLHttpRequest["send"]} */ let sendXhr;

    /**
     * Discards current storage singleton instance. To get 
     * a new one, simply call getStorage(...) afterwards.
     */
    const discardStorage = () => {
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
    const getStorage = localStorageImplementation => {
        if( typeof storage.current !== 'undefined' ) { return storage }
        storage.set( new ClientStorage( localStorageImplementation ), instanceId );
        const localStorage = storage.current.localStorage;
        const delKeysId = DEL_MARKER.slice( 0, -1 );
        const synchronizeWithServer = () => {
            let delKeys = jsCookie.get( delKeysId );
            if( typeof delKeys === 'undefined' ) { return }
            for( const k of delKeys.split( BOUNDARY_MARKER ) ) {
                localStorage.removeItem( k );
            }
            jsCookie.remove( delKeysId );
        };
        startServerWatch( synchronizeWithServer );
        synchronizeWithServer();
        return storage;
    }

    /** @param {()=>void} onResponse */
    function startServerWatch( onResponse ) /* istanbul ignore next */ { 
        if( typeof ctx.XMLHttpRequest === 'undefined' ) { return }
        sendXhr = ctx.XMLHttpRequest.prototype.send;
        function runServerSync() {
            /* istanbul ignore next */
            this.readyState !== ctx.XMLHttpRequest.DONE && onResponse();
        }
         ctx.XMLHttpRequest.prototype.send = function( ...args ) {
            /* istanbul ignore next */
            this.onreadystatechange = runServerSync;
            /* istanbul ignore next */
            sendXhr.apply( this, args );
        };
    }

    return { ClientStorage, discardStorage, getStorage, storage };

} )(
    /* istanbul ignore next */
    typeof window !== 'undefined' ? window :
    /* istanbul ignore next */
    typeof self !== 'undefined' ? self :
    /* istanbul ignore next */
    typeof global !== 'undefined' ? global :
    {}
);

/** @typedef {import("..").Id} Id */
/**
 * @typedef {import("..").LocalStorageType<P>} LocalStorageType
 * @template [P={}]
 */