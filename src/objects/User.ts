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

import {ECSQLFilter, ECSQLObject, ECSQLOperator, ECSQLQuery} from "@elijahjcobb/nosql";
import {ECDate} from "@elijahjcobb/prototypes";
import {ECErrorOriginType, ECErrorStack, ECErrorType} from "@elijahjcobb/error";

export enum UserGender {
	Male,
	Female,
	Other
}

export interface UserProps {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	gender: UserGender;
	birthday: string;
	salt: Buffer;
	pepper: Buffer;
}

export class User extends ECSQLObject<UserProps> {

	public birthday: ECDate = new ECDate();

	public constructor() {

		super("user", {
			firstName: "string",
			lastName: "string",
			email: "string",
			phone: "string",
			gender: "number",
			birthday: "string",
			salt: "buffer",
			pepper: "buffer"
		});

	}

	public static async doesUserExistForEmail(email: string): Promise<boolean> {

		const query: ECSQLQuery<User, UserProps> = new ECSQLQuery(User, new ECSQLFilter(
			"email",
			ECSQLOperator.Equal,
			email
		));

		return query.exists();

	}

	public static async signUp(email: string, password: string): Promise<User> {

	}
}