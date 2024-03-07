import { StorageRef } from '.';
import { ClientStorage } from '../../client';

describe( 'The Storage Reference Object', () => {
    test( 'requires an instance id parameter', () => {
        expect(() => { new StorageRef() }).toThrow()
    } );
    test( 'requires an instance id of an object with only the `value` property', () => {
        expect(() => { new StorageRef({ a: '1', b: '1', value: '1' }) }).toThrow()
        expect(() => { new StorageRef({ value: '1' }) }).not.toThrow();
        expect(() => {
            class InstanceId {
                #value;
                get value() { return this.#value }
                set value( v ) { this.#value = v }
            }
            new StorageRef( new InstanceId() );
        }).not.toThrow();
    } );
    test( 'allows an empty instance id of an object', () => {
        expect(() => { new StorageRef({}) }).not.toThrow();
        expect(() => { new StorageRef([]) }).not.toThrow();
        expect(() => {
            class InstanceId {}
            new StorageRef( new InstanceId() );
        }).not.toThrow();
    } );
    test( 'initializes instanceId on instantiation', () => {
        const instanceId = { value: undefined };
        new StorageRef( instanceId );
        expect( instanceId.value ).not.toBeUndefined();
    } );
    test( 'will attempt to reset if incoming value is nil', () => {
        const reset = StorageRef.prototype.reset;
        StorageRef.prototype.reset = jest.fn();
        new StorageRef({}).set( null );
        expect( StorageRef.prototype.reset ).toHaveBeenCalledTimes( 1 );
        StorageRef.prototype.reset = reset;
    } );
} );