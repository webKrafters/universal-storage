import type { Cookies, Request, Response } from '..';

export class BaseStorage {
	getItem<CDATA extends Cookies>(
		key : string,
		req? : Request<CDATA>
	) : string { return null }
	removeItem(
		key : string,
		value? : unknown,
		response? : Response
	) : void {}
	setItem(
		key : string,
		value : unknown,
		response? : Response
	) : void {}
}
