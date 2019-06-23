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

import {
	ECSQLCondition,
	ECSQLFilter,
	ECSQLFilterGroup,
	ECSQLObject,
	ECSQLOperator,
	ECSQLQuery
} from "@elijahjcobb/nosql";
import { ECArray } from "@elijahjcobb/collections";
import { Business, BusinessProps } from "./Business";

export interface BusinessOwnerProps {
	userId: string;
	businessId: string;
}

export class BusinessOwner extends ECSQLObject<BusinessOwnerProps> {

	public constructor() {

		super("businessOwner", {
			userId: "string",
			businessId: "string"
		});

	}

	public static async isUserIdOwnerOfBusinessId(userId: string, businessId: string): Promise<boolean> {

		const query: ECSQLQuery<BusinessOwner, BusinessOwnerProps> = new ECSQLQuery(BusinessOwner, new ECSQLFilterGroup(
			ECSQLCondition.And,
			new ECSQLFilter("userId", ECSQLOperator.Equal, userId),
			new ECSQLFilter("businessId", ECSQLOperator.Equal, businessId),
		));

		return await query.exists();

	}

	public static async getAllBusinessIdsForUserId(userId: string): Promise<ECArray<string>> {

		const query: ECSQLQuery<BusinessOwner, BusinessOwnerProps> = new ECSQLQuery(BusinessOwner, new ECSQLFilter("userId", ECSQLOperator.Equal, userId));
		const links: ECArray<BusinessOwner> = await query.getAllObjects();

		return links.map((link: BusinessOwner) => { return link.props.businessId as string; });

	}

	public static async getAllBusinessesForUserId(userId: string): Promise<ECArray<Business>> {

		const businessIds: ECArray<string> = await this.getAllBusinessIdsForUserId(userId);
		return await ECSQLQuery.getObjectsWithIds(Business, ...businessIds.toNativeArray());

	}

}