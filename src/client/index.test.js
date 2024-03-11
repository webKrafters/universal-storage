import { DEL_MARKER } from '../constants';

import { ClientStorage, discardStorage, getStorage, storage } from '.';

const jsCookie = require( 'js-cookie' );

jest.mock( 'js-cookie' );
jest.useFakeTimers();
jest.spyOn( global, 'setTimeout' );

describe( 'Universal Storage: Client', () => {
    test( 'Instance is empty on start', () => {
        expect( storage.current ).toBeUndefined();
    } );
    describe( 'Singleton nature', () => {
        let instance;
        beforeEach(() => { instance = getStorage() });
        afterEach( discardStorage );
        describe( 'getStorage(...)', () => {
            test( 'sets the instance', () => {
                expect( instance.current ).toBe( storage.current );
                expect( instance.current ).toBeInstanceOf( ClientStorage )
            } );
            test( 'once set remains unchanged at subsequent attempts', () => {
                const instance2 = getStorage();
                expect( instance2.current ).toBe( instance.current );
                expect( instance2.current ).toBe( storage.current );
            } );
            describe( 'browser-server synchronization', () => {
                let testRunner;
                beforeAll(() => {
                    testRunner = storageKeys => {
                        discardStorage();
                        jsCookie.get.mockReset();
                        jsCookie.remove.mockClear();
                        const DELETE_PENDING_KEYS = storageKeys.map( k => `${ DEL_MARKER }${ k }` );
                        jsCookie.get.mockReturnValue({
                            aKey: 'some key shorter than del marker: coverage test',
                            myFunnyLongerKey: 'some key longer def longer than del marker: coverage test',
                            [ DELETE_PENDING_KEYS[ 0 ] ]: 1,
                            [ 't'.repeat( DEL_MARKER.length ) ]: 'some key equal in length to the del marker: coverage test',
                            [ DELETE_PENDING_KEYS[ 1 ] ]: 1
                        });
                        const localStorage = { removeItem: jest.fn() };
                        getStorage( localStorage );
                        expect( localStorage.removeItem ).toHaveBeenCalledTimes( storageKeys.length );
                        expect( localStorage.removeItem.mock.calls[ 0 ] ).toEqual([ storageKeys[ 0 ] ]);
                        expect( localStorage.removeItem.mock.calls[ 1 ] ).toEqual([ storageKeys[ 1 ] ]);
                        expect( jsCookie.get ).toHaveBeenCalledTimes( 1 );
                        expect( jsCookie.remove ).toHaveBeenCalledTimes( 2 );
                        expect( jsCookie.remove.mock.calls[ 0 ] ).toEqual([
                            DELETE_PENDING_KEYS[ 0 ], expect.objectContaining({ path: '/' })
                        ]);
                        expect( jsCookie.remove.mock.calls[ 1 ] ).toEqual([
                            DELETE_PENDING_KEYS[ 1 ], expect.objectContaining({ path: '/' })
                        ]);
                    };
                });
                test(
                    'removes from the storage all entries identified for deletion by the server',
                    () => testRunner([ 'KEY1', 'KEY2'] )
                );
                test(
                    'observes the server new list of removables after each server trip',
                    () => testRunner([ 'KEYI', 'KEYII' ])
                );
            });
        } );
        test( 'uses discardStorage(...) to unset current instance', () => {
            discardStorage();
            expect( storage.current ).toBeUndefined();
            expect( instance.current ).toBeUndefined();
        } );
    } );
    describe( `getItem(...)`, () => {
        test( 'backs up items from cookie into the localstorage', () => {
            jsCookie.get.mockReturnValue( 'TEST_VALUE_COOKIE' );
            const localStorage = { setItem: jest.fn() }
            const storage = new ClientStorage( localStorage );
            storage.getItem( 'TEST_KEY' );
            jest.runAllTimers();
            expect( localStorage.setItem ).toHaveBeenCalledTimes( 1 );
            expect( localStorage.setItem ).toHaveBeenCalledWith( 'TEST_KEY', 'TEST_VALUE_COOKIE' );
            jsCookie.get.mockReset();
        } );
        test( 'updates items in cookie when recovered from the localstorage backup', () => {
            const localStorage = { getItem: jest.fn(() => 'TEST_VALUE_LS' ) }
            const storage = new ClientStorage( localStorage );
            storage.getItem( 'TEST_KEY2' );
            jest.runAllTimers();
            expect( localStorage.getItem ).toHaveBeenCalledTimes( 1 );
            expect( localStorage.getItem ).toHaveBeenCalledWith( 'TEST_KEY2' );
            expect( jsCookie.set ).toHaveBeenCalledTimes( 1 );
            expect( jsCookie.set ).toHaveBeenCalledWith( 'TEST_KEY2', 'TEST_VALUE_LS' );
            jsCookie.set.mockClear();
        } );
    } );
    describe( `removeItem(...)`, () => {
        test( 'removes an item from storage', () => {
            jsCookie.remove.mockClear();
            const localStorage = { removeItem: jest.fn() }
            const storage = new ClientStorage( localStorage );
            storage.removeItem( 'TEST_KEY3' );
            expect( localStorage.removeItem ).toHaveBeenCalledTimes( 1 );
            expect( localStorage.removeItem ).toHaveBeenCalledWith( 'TEST_KEY3' );
            expect( jsCookie.remove ).toHaveBeenCalledTimes( 1 );
            expect( jsCookie.remove ).toHaveBeenCalledWith(
                'TEST_KEY3', expect.objectContaining({ path: '/' })
            );
        } );
    } );
    describe( 'setItem(...)', () => {
        test( 'sets an item into storage', () => {
            const localStorage = { setItem: jest.fn() }
            const storage = new ClientStorage( localStorage );
            storage.setItem( 'TEST_KEY4', 'TEST VALUE 4' );
            expect( jsCookie.set ).toHaveBeenCalledWith(
                'TEST_KEY4', 'TEST VALUE 4', expect.objectContaining({ path: '/' })
            );
            expect( localStorage.setItem ).toHaveBeenCalledWith( 'TEST_KEY4', 'TEST VALUE 4' );
            jsCookie.set.mockClear();
        } );
        test( 'converts value to string type', () => {
            const localStorage = { setItem: jest.fn() }
            const storage = new ClientStorage( localStorage );
            storage.setItem( 'TEST_KEY5', 5 );
            expect( jsCookie.set ).toHaveBeenCalledWith(
                'TEST_KEY5', '5', expect.objectContaining({ path: '/' })
            );
            expect( localStorage.setItem ).toHaveBeenCalledWith( 'TEST_KEY5', '5' );
            jsCookie.set.mockClear();
        } );
    } );
} );