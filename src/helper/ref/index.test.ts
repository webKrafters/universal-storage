import { StorageRef } from '.';

describe( 'The Storage Reference Object', () => {
    test( 'requires an instance id parameter', () => {
        // @ts-ignore
        expect(() => { new StorageRef() }).toThrow()
    } );
    test( 'requires an instance id of an object with only the `value` property', () => {
        // @ts-ignore
        expect(() => { new StorageRef({ a: '1', b: '1', value: '1' }) }).toThrow()
        expect(() => { new StorageRef({ value: '1' }) }).not.toThrow();
        expect(() => {
            class InstanceId {
                private _value;
                get value() { return this._value }
                set value( v ) { this._value = v }
            }
            new StorageRef( new InstanceId() );
        }).not.toThrow();
    } );
    test( 'allows an empty instance id of an object', () => {
        // @ts-ignore
        // expect(() => { new StorageRef({}) }).not.toThrow();
        // @ts-ignore
        // expect(() => { new StorageRef([]) }).not.toThrow();
        expect(() => {
            class InstanceId {}
            // @ts-ignore
            new StorageRef( new InstanceId() );
        }).not.toThrow();
    } );
    test( 'initializes instanceId on instantiation', () => {
        const instanceId = { value: undefined as unknown as string };
        new StorageRef( instanceId );
        expect( instanceId.value ).not.toBeUndefined();
    } );
    test( 'will attempt to reset if incoming value is nil', () => {
        const reset = StorageRef.prototype.reset;
        StorageRef.prototype.reset = jest.fn();
        // @ts-ignore
        new StorageRef({ value: '33' }).set( null, { value : '3343' } );
        expect( StorageRef.prototype.reset ).toHaveBeenCalledTimes( 1 );
        StorageRef.prototype.reset = reset;
    } );
} );
