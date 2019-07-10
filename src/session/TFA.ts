/**
 *
 * Elijah Cobb
 * elijah@elijahcobb.com
 * https://elijahcobb.com
 *
 *
 * Copyright 2019 Elijah Cobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import { ECGenerator } from "@elijahjcobb/encryption";
import {ECSError} from "@elijahjcobb/server";
import {Encryption} from "./Encryption";

export type TFATokenObject = { data: string; code: string; };

export class TFAToken {

	public code: string;
	public data: string;

	public constructor(data: string) {

		this.data = data;
		this.code = ECGenerator.randomCode();

	}

	public encrypt(): string {

		const tokenObject: TFATokenObject = {
			code: this.code,
			data: this.data
		};

		console.log(`Simulated TFA SMS Message: '${this.code}' for user with id '${this.data}'.`);

		let encrypted: string;

		try {

			const tokenString: string = JSON.stringify(tokenObject);
			const tokenData: Buffer = Buffer.from(tokenString, "utf8");
			const encryptedTokenData: Buffer = Encryption.encrypt(tokenData);
			encrypted = encryptedTokenData.toString("hex");

		} catch (e) {

			console.log(e);
			throw ECSError.init().msg("Failed to encrypt TFAToken.");

		}

		return encrypted;

	}

	public isCodeValid(code: string): boolean {

		return this.code !== undefined && this.code === code;

	}

	public static decrypt(token: string): TFAToken {

		try {

			const encryptedTokenData: Buffer = Buffer.from(token, "hex");
			const decryptedTokenData: Buffer = Encryption.decrypt(encryptedTokenData);
			const tokenString: string = decryptedTokenData.toString("utf8");
			const tokenObject: TFATokenObject = JSON.parse(tokenString) as TFATokenObject;

			let newToken: TFAToken = new TFAToken(tokenObject.data);
			newToken.code = tokenObject.code;

			return newToken;

		} catch (e) {

			throw ECSError.init().msg("Failed to decrypt TFAToken.");

		}

	}

	public static isCodeValid(code: string, token: string): boolean {

		const tokenObject: TFAToken = TFAToken.decrypt(token);

		return tokenObject.isCodeValid(code);

	}

}

export abstract class TFA {



}