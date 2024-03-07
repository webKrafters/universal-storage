import { BOUNDARY_MARKER, DEL_MARKER } from '../constants';

import { ServerStorage, discardStorage, getStorage, storage } from '.';

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
                expect( instance.current ).toBeInstanceOf( ServerStorage )
            } );
            test( 'once set remains unchanged at subsequent attempts', () => {
                const instance2 = getStorage();
                expect( instance2.current ).toBe( instance.current );
                expect( instance2.current ).toBe( storage.current );
            } );
        } );
        test( 'uses discardStorage(...) to unset current instance', () => {
            discardStorage();
            expect( storage.current ).toBeUndefined();
            expect( instance.current ).toBeUndefined();
        } );
    } );
    describe( `getItem(...)`, () => {
        test( 'gets items from request object holding already parsed cookies', () => {
            const KEY = 'TEST_KEY_COOKIE0';
            const VALUE = 22;
            const requestStub = {
                cookies: {
                    test0: 'val0',
                    test2: 'val2',
                    [ KEY ]: VALUE
                }
            };
            expect( new ServerStorage().getItem( KEY, requestStub ) ).toBe( VALUE );
        } );
        test( 'gets items from request object holding raw cookies', () => {
            const KEY = 'TEST_KEY_COOKIE1';
            const VALUE = 55;
            const requestStub = { cookies: `test0=val0;${ KEY }=${ VALUE };test2=val2` };
            expect( new ServerStorage().getItem( KEY, requestStub ) ).toBe( `${ VALUE }` );
        } );
        test( 'searches for the cookie header when no cookies found in request object', () => {
            const KEY = 'TEST_KEY_COOKIE2';
            const VALUE = 31;
            const requestStub = { getHeader: jest.fn().mockReturnValue( `test0=val0;${ KEY }=${ VALUE };test2=val2` ) };
            expect( new ServerStorage().getItem( KEY, requestStub ) ).toBe( `${ VALUE }` );
            expect( requestStub.getHeader ).toHaveBeenCalledTimes( 1 );
            expect( requestStub.getHeader ).toHaveBeenCalledWith( 'Cookie' );
        } );
    } );
    describe( `removeItem(...)`, () => {
        let response, key, value;
        beforeAll(() => {
            key = 'TEST_KEY_COOKIE3';
            response = {
                getHeader: jest.fn(),
                setHeader: jest.fn()
            };
            value = 'VAL122';
            new ServerStorage().removeItem( key, value, response );
        });
        test( 'sets cookie response header twice', () => {
            expect( response.setHeader ).toHaveBeenCalledTimes( 2 );
        } );
        test( 'sets cookie response header for removal', () => {
            const setHeaderCall0 = response.setHeader.mock.calls[ 0 ];
            expect( setHeaderCall0[ 0 ] ).toStrictEqual( 'Set-Cookie' );
            expect( setHeaderCall0[ 1 ] ).toStrictEqual( `${ key }=${ value }; max-age=0` )
        } );
        test( 'sets cookie response header with deleted localstorage entry keys for client synchronization', () => {
            const setHeaderCall1 = response.setHeader.mock.calls[ 1 ];
            expect( setHeaderCall1[ 0 ] ).toStrictEqual( 'Set-Cookie' );
            expect( setHeaderCall1[ 1 ] ).toStrictEqual( `${ DEL_MARKER }${ key }` )
        } );
        test( 'coverage test: for localstorage delete-ready entry keys accrual', () => {
            const currentAccruals = `2056${ BOUNDARY_MARKER }PROCLAIMED`
            const key = 'TEST_KEY_COOKIE4';
            const response = {
                getHeader: jest.fn().mockReturnValueOnce([
                    'wat=do we need',
                    'test30=just',
                    `${ DEL_MARKER }${ currentAccruals }`,
                    'test100=one hundred'
                ]),
                setHeader: jest.fn()
            };
            const value = 'VAL502';
            new ServerStorage().removeItem( key, value, response );
            // called twice: to remove cookie entry and to record the removed entry key
            expect( response.setHeader ).toHaveBeenCalledTimes( 2 );
            expect( response.setHeader.mock.calls[ 0 ] ).toEqual([
                'Set-Cookie', `${ key }=${ value }; max-age=0`
            ]);
            expect( response.setHeader.mock.calls[ 1 ] ).toEqual([
                'Set-Cookie', `${ DEL_MARKER }${ currentAccruals }${ BOUNDARY_MARKER }${ key }`
            ]);
        } );
        test( 'coverage test: for localstorage delete-ready entry keys accrual re-attempt disallowment', () => {
            const currentAccruals = `NOT${ BOUNDARY_MARKER }TODAY${ BOUNDARY_MARKER }PROCLAIMED`
            const key = 'TODAY'; // note: this key already appears in accruals.
            const response = {
                getHeader: jest.fn().mockReturnValueOnce([
                    'wat=do we need',
                    'test30=just',
                    `${ DEL_MARKER }${ currentAccruals }`,
                    'test100=one hundred'
                ]),
                setHeader: jest.fn()
            };
            const value = 'VAL87';
            new ServerStorage().removeItem( key, value, response );
            // while removed from cookies will not be re-entered in the accrual list.
            expect( response.setHeader ).toHaveBeenCalledTimes( 1 );
            expect( response.setHeader ).toHaveBeenCalledWith(
                'Set-Cookie', `${ key }=${ value }; max-age=0`
            );
        } );
    } );
    describe( 'setItem(...)', () => {
        test( 'sets an item into storage', () => {
            const key = 'TEST_KEY_COOKIE5';
            const value = 'VALUE512';
            const response = {
                getHeader: jest.fn(),
                setHeader: jest.fn()
            };
            ( new ServerStorage() ).setItem( key, value, response );
            expect( response.setHeader ).toHaveBeenCalledTimes( 1 );
            expect( response.setHeader ).toHaveBeenCalledWith( 'Set-Cookie', `${ key }=${ value }` );
        } );
        test( 'unregisters newly added key from remove-ready client localstorage keys', () => {
            const currentAccruals = `2056${ BOUNDARY_MARKER }PROCLAIMED`
            const key = 'PROCLAIMED';
            const value = 'VALUE512';
            const response = {
                getHeader: jest.fn().mockReturnValueOnce([
                    'wat=do we need',
                    'test30=just',
                    `${ DEL_MARKER }${ currentAccruals }`,
                    'test100=one hundred'
                ]),
                setHeader: jest.fn()
            };
            ( new ServerStorage() ).setItem( key, value, response );
            expect( response.setHeader ).toHaveBeenCalledTimes( 2 );
            const setHeaderCalls = response.setHeader.mock.calls;
            expect( setHeaderCalls[ 0 ] ).toEqual([ 'Set-Cookie', `${ key }=${ value }` ]);
            expect( setHeaderCalls[ 1 ] ).toEqual([ 'Set-Cookie', `${ DEL_MARKER }${ currentAccruals.split( BOUNDARY_MARKER )[ 0 ] }` ]);
        } );
        test( 'coverage test: discards the remove-ready client localstorage keys list when bearing lone matching key', () => {
            const key = '2056';
            const value = 'VALUE876';
            const response = {
                getHeader: jest.fn().mockReturnValueOnce([
                    'wat=do we need',
                    'test30=just',
                    `${ DEL_MARKER }${ key }`,
                    'test100=one hundred'
                ]),
                setHeader: jest.fn()
            };
            ( new ServerStorage() ).setItem( key, value, response );
            expect( response.setHeader ).toHaveBeenCalledTimes( 2 );
            const setHeaderCalls = response.setHeader.mock.calls;
            expect( setHeaderCalls[ 0 ] ).toEqual([ 'Set-Cookie', `${ key }=${ value }` ]);
            expect( setHeaderCalls[ 1 ] ).toEqual([ 'Set-Cookie', `${ DEL_MARKER }${ key }; max-age=0` ]);
        } );
        test( 'coverage test: leaves remove-ready client localstorage keys list untouched if no match found therein for entry key', () => {
            const currentAccruals = `2056${ BOUNDARY_MARKER }PROCLAIMED`
            const key = 'TEST_KEY_COOKIE6';
            const value = 'VALUE960';
            const response = {
                getHeader: jest.fn().mockReturnValueOnce([
                    'wat=do we need',
                    'test30=just',
                    `${ DEL_MARKER }${ currentAccruals }`,
                    'test100=one hundred'
                ]),
                setHeader: jest.fn()
            };
            ( new ServerStorage() ).setItem( key, value, response );
            // while set in to cookies will not attempt to remove from accrual list.
            expect( response.setHeader ).toHaveBeenCalledTimes( 1 );
            expect( response.setHeader ).toHaveBeenCalledWith( 'Set-Cookie', `${ key }=${ value }` );
        } );
    } );
} );