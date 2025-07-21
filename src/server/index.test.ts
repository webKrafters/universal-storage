import { DEL_MARKER } from '../constants';

import { ParsedCookies, RawCookies, Request } from '..';

import { ServerStorage, discardStorage, getStorage, storage } from '.';

import { StorageRef } from '../helper/ref';

describe( 'Universal Storage: Server', () => {
    test( 'Instance is empty on start', () => {
        expect( storage.current ).toBeUndefined();
    } );
    describe( 'Singleton nature', () => {
        let instance : StorageRef<ServerStorage>;
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
            const VALUE = '22';
            const requestStub : Request<ParsedCookies> = {
                getHeader(){ return '' },
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
            const requestStub : Request<RawCookies> = {
                getHeader(){ return '' },
                cookies: `test0=val0;${ KEY }=${ VALUE };test2=val2`
            };
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
        test( 'no request object is fine too', () => {
            expect( new ServerStorage().getItem( 'TEST KEY' ) ).toBeNull();
        } );
    } );
    describe( `removeItem(...)`, () => {
        let key, response, value;
        beforeAll(() => {
            key = 'TEST_KEY_COOKIE54';
            value = 'VALUE122';
            response = { setHeader: jest.fn() };
            ( new ServerStorage() ).removeItem( key, value, response );
        } );
        test( 'sets response headers twice', () => expect( response.setHeader ).toHaveBeenCalledTimes( 2 ) );
        test( 'first set-cookie issues a command on the client to remove item from storage', () => {
            expect( response.setHeader.mock.calls[ 0 ] ).toEqual([ 'Set-Cookie', `${ key }=${ value }; max-age=0` ]);
        } );
        test( 'second set-cookie issues a command on the client to remove item from local storage', () => {
            expect( response.setHeader.mock.calls[ 1 ] ).toEqual([ 'Set-Cookie', `${ DEL_MARKER }${ key }=1` ]);
        } );
        test( 'no response object is fine too', () => {
            expect(() => { new ServerStorage().removeItem( 'TEST KEY', 'ANYTHING' ) }).not.toThrow( ReferenceError );
        } );
    } );
    describe( 'setItem(...)', () => {
        let key, response, value;
        beforeAll(() => {
            key = 'TEST_KEY_COOKIE5';
            value = 'VALUE512';
            response = { setHeader: jest.fn() };
            ( new ServerStorage() ).setItem( key, value, response );
        } );
        test( 'sets response headers twice', () => expect( response.setHeader ).toHaveBeenCalledTimes( 2 ) );
        test( 'first set-cookie issues a command on the client to place an item into storage', () => {
            expect( response.setHeader.mock.calls[ 0 ] ).toEqual([ 'Set-Cookie', `${ key }=${ value }` ]);
        } );
        test( 'second set-cookie issues a command on the client to discard any local storage removals pending for this key', () => {
            expect( response.setHeader.mock.calls[ 1 ] ).toEqual([ 'Set-Cookie', `${ DEL_MARKER }${ key }=1; max-age=0` ]);
        } );
        test( 'no response object is fine too', () => {
            expect(() => { new ServerStorage().setItem( 'TEST KEY', 'ANYTHING' ) }).not.toThrow( ReferenceError );
        } );
    } );
} );
