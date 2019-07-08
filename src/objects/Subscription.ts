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

import {ECMObject, ECMQuery} from "@elijahjcobb/maria";
import {ECArray} from "@elijahjcobb/collections";
import {ECSQLCMD} from "@elijahjcobb/sql-cmd";

export interface SubscriptionProps {
	userId: string;
	businessId: string;
	programId: string;
	autoRenew: boolean;
}

export class Subscription extends ECMObject<SubscriptionProps> {

	public constructor() {

		super("subscription", {
			userId: "string",
			businessId: "string",
			programId: "string",
			autoRenew: "boolean"
		});

	}

	public static getAllForUser(userId: string): Promise<ECArray<Subscription>> {

		let query: ECMQuery<Subscription, SubscriptionProps> = new ECMQuery(Subscription, ECSQLCMD
			.select()
			.where("userId", "=", userId)
		);

		return query.getAllObjects();

	}

	public static getAllForBusiness(businessId: string): Promise<ECArray<Subscription>> {

		let query: ECMQuery<Subscription, SubscriptionProps> = new ECMQuery(Subscription, ECSQLCMD
			.select()
			.where("businessId", "=", businessId)
		);

		return query.getAllObjects();

	}

	public static getAllForProgram(programId: string): Promise<ECArray<Subscription>> {

		let query: ECMQuery<Subscription, SubscriptionProps> = new ECMQuery(Subscription, ECSQLCMD
			.select()
			.where("programId", "=", programId)
		);

		return query.getAllObjects();

	}

	public static getAllForProduct(productId: string): Promise<ECArray<Subscription>> {

		let query: ECMQuery<Subscription, SubscriptionProps> = new ECMQuery(Subscription, ECSQLCMD
			.select()
			.whereKeyIsValueOfQuery("id", "program", "productId", productId)
		);

		return query.getAllObjects();

	}

}