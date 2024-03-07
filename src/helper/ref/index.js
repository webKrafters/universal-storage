/** @template {Base} [S=Base] */
export class StorageRef {
    /** @param {Id} instanceId */
    constructor( instanceId ) {
        const instanceIdKeys = Object.keys( instanceId );
        if( !instanceIdKeys.length ) { instanceId.value = undefined }
        if( instanceIdKeys.length > 1 || !( 'value' in instanceId ) ) {
            throw new TypeError( 'Invalid instanceId parameter: expects an object with a lone `value` property of the type `string`.' );
        }
        this.#instanceId = instanceId;
        this.#instanceId.value = `~${ StorageRef.#genInstanceId() }`;
    }
    get current () { return this.#current }
    /**
     * @package
     * @param {Id} currentInstanceId
     */
    reset( currentInstanceId ) {
        if( this.#instanceId.value[ 0 ] === '~' || currentInstanceId !== this.#instanceId ) { return }
        this.#current = undefined;
        this.#instanceId.value = `~${ this.#instanceId.value }`;
    }
    /**
     * @package
     * @param {S} instance
     * @param {Id} currentInstanceId
     */
    set( instance, currentInstanceId ) {
        if( !instance ) { return this.reset( currentInstanceId ) }
        /* istanbul ignore next */
        if( this.#instanceId.value[ 0 ] !== '~' || this.#instanceId !== currentInstanceId ) { return }
        this.#current = instance;
        this.#instanceId.value = StorageRef.#genInstanceId();
    }
    /**
     * @readonly
     * @type {S}
     */
    #current;
    /**
     * @private
     * @type {Id}
     */
    #instanceId;
    static #genInstanceId () { return Math.random().toString().slice( -16 ) }
}

/** @typedef {import("../..").BaseStorage} Base */
/** @typedef {import("../..").Id} Id */