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

import { ECSQLFilter, ECSQLObject, ECSQLOperator, ECSQLQuery } from "@elijahjcobb/nosql";
import { User } from "../objects/User";
import { Admin, AdminProps } from "./Admin";
import { Business } from "../objects/Business";

export interface SessionProps {
	userId: string;
	businessId: string;
	dead: boolean;
}

export class Session extends ECSQLObject<SessionProps> {

	public constructor() {

		super("session", {
			userId: "string",
			businessId: "string",
			dead: "boolean"
		});

	}

	public async getUser(): Promise<User> {

		if (this.props.userId === undefined) throw Error("Attempted to fetch user for session when session does not have userId.");
		return await ECSQLQuery.getObjectWithId(User, this.props.userId);

	}

	public async getBusiness(): Promise<Business> {

		if (this.props.businessId === undefined) throw Error("Attempted to fetch business for session when session does not have businessId.");
		return await ECSQLQuery.getObjectWithId(Business, this.props.businessId);

	}

	public async isAdmin(): Promise<boolean> {

		if (!this.props.userId) return false;

		let admin: Admin | undefined = await ECSQLQuery.getObjectWithId(Admin, this.props.userId, true);

		return admin !== undefined;

	}

}