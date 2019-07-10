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

import { ECCipher } from "@elijahjcobb/encryption";
import { ECSError } from "@elijahjcobb/server";

export class Encryption {

	private static cipher: ECCipher | undefined;

	public static encrypt(data: Buffer): Buffer {

		if (this.cipher === undefined) throw ECSError.init().msg("Tried to encrypt without first calling init.");

		try {
			return this.cipher.encrypt(data);
		} catch (e) {
			console.log(e);
			throw e;
		}

	}

	public static decrypt(data: Buffer): Buffer {

		if (this.cipher === undefined) throw ECSError.init().msg("Tried to encrypt without first calling init.");
		return this.cipher.decrypt(data);

	}

	public static init(password: Buffer): void {

		console.log("Encryption init with password: ", password.toString("utf8"));
		this.cipher = new ECCipher(password);

	}

}