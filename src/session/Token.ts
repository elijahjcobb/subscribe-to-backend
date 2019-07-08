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

import { Encryption } from "./Encryption";
import {ECSError} from "@elijahjcobb/server";

export class Token {

	public static encrypt<T extends object>(payload: T): string {

		try {

			const payloadString: string = JSON.stringify(payload);
			const data: Buffer = Buffer.from(payloadString, "utf8");
			const encryptedData: Buffer = Encryption.encrypt(data);

			return encryptedData.toString("base64");

		} catch (e) {

			throw ECSError.init().msg("Failed to encrypt payload for token.");

		}

	}

	public static decrypt<T extends object>(token: string): T {

		try {

			const data: Buffer = Buffer.from(token, "base64");
			const decryptedData: Buffer = Encryption.decrypt(data);
			const payloadString: string = decryptedData.toString("utf8");

			return JSON.parse(payloadString);

		} catch (e) {

			throw ECSError.init().msg("Failed to decrypt token for payload.");

		}

	}

}