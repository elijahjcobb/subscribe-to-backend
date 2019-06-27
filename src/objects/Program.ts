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
import { Subscription, SubscriptionProps } from "./Subscription";

export interface ProgramProps {
	businessId: string;
	productId: string;
	price: number;
	allowance: number;
	successorId: string;
	closed: boolean;
}

export class Program extends ECSQLObject<ProgramProps> {

	public constructor() {

		super("program", {
			businessId: "string",
			productId: "string",
			price: "number",
			allowance: "number",
			successorId: "number",
			closed: "boolean"
		});

	}


	public getDeadDate(): number {

		const now: number = Date.now();
		const timeToAdd: number = 1000 * 60 * 60 * 24 * 7 * 4;

		return now + timeToAdd;

	}

	public newProgramWithChangedPrice(price: number): Program {

		let newProgram: Program = new Program();

		newProgram.props.businessId = this.props.businessId;
		newProgram.props.productId = this.props.productId;
		newProgram.props.allowance = this.props.allowance;
		newProgram.props.successorId = this.props.successorId;
		newProgram.props.price = price;

		return newProgram;

	}

	public newProgramWithChangedAllowance(allowance: number): Program {

		let newProgram: Program = new Program();

		newProgram.props.businessId = this.props.businessId;
		newProgram.props.productId = this.props.productId;
		newProgram.props.successorId = this.props.successorId;
		newProgram.props.price = this.props.price;
		newProgram.props.allowance = allowance;

		return newProgram;

	}

	public async countSubscribers(): Promise<number> {

		if (this.id === undefined) return 0;

		const query: ECSQLQuery<Subscription, SubscriptionProps> = new ECSQLQuery(
			Subscription,
			new ECSQLFilter("programId", ECSQLOperator.Equal, this.id)
		);

		return await query.count();

	}

	public async hasSubscribers(): Promise<boolean> {

		return (await this.countSubscribers()) > 0;

	}

}