import { BaseStorage as Base } from '.';

describe( 'Base storage is just a cross-env placeholder',  () => {
	let storage : Base;
	afterEach(() => { storage = null as unknown as Base })
	beforeEach(() => { storage = new Base() })
	test( '"getItem" method always returns null', () => { 
		storage.setItem( 'somekey', 22 );
		expect( storage.getItem( 'someKey' ) ).toBeNull();
	 } );
} );
