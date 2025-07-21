import { BaseStorage, Id } from '../..';

export class StorageRef<S extends BaseStorage = BaseStorage> {
    private _current : S;
    private _instanceId : Id;
    static genInstanceId () : string { return Math.random().toString().slice( -16 ) }
    constructor( instanceId : Id ) {
        const instanceIdKeys = Object.keys( instanceId );
        if( !instanceIdKeys.length ) { instanceId.value = undefined }
        if( instanceIdKeys.length > 1 || !( 'value' in instanceId ) ) {
            throw new TypeError( 'Invalid instanceId parameter: expects an object with a lone `value` property of the type `string`.' );
        }
        this._instanceId = instanceId;
        this._instanceId.value = `~${ StorageRef.genInstanceId() }`;
    }
    get current () { return this._current }
    reset( currentInstanceId : Id ) {
        if( this._instanceId.value[ 0 ] === '~' || currentInstanceId !== this._instanceId ) { return }
        this._current = undefined;
        this._instanceId.value = `~${ this._instanceId.value }`;
    }
    set( instance : S, currentInstanceId : Id ) {
        if( !instance ) { return this.reset( currentInstanceId ) }
        /* istanbul ignore next */
        if( this._instanceId.value[ 0 ] !== '~' || this._instanceId !== currentInstanceId ) { return }
        this._current = instance;
        this._instanceId.value = StorageRef.genInstanceId();
    }
}
