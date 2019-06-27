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
	ECSError,
	ECSRequest,
	ECSRequestType,
	ECSResponse,
	ECSRoute,
	ECSRouter,
	ECSTypeValidator,
	ECSValidator
} from "@elijahjcobb/server";
import * as Express from "express";
import { StandardType, OptionalType } from "typit";
import { SessionValidator } from "../session/SessionValidator";
import { Subscription } from "../objects/Subscription";
import { Session } from "../session/Session";
import { User } from "../objects/User";
import { Business } from "../objects/Business";
import { ECSQLQuery } from "@elijahjcobb/nosql";
import { Program } from "../objects/Program";

export class SubscriptionRouter extends ECSRouter {

	public async handleCreateSubscription(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const programId: string = req.get("programId");
		const autoRenew: boolean = req.get("autoRenew");
		const user: User = await session.getUser();
		const program: Program = await ECSQLQuery.getObjectWithId(Program, programId);
		const businessId: string = program.props.businessId as string;
		const business: Business = await ECSQLQuery.getObjectWithId(Business, businessId);

		const subscription: Subscription = new Subscription();
		subscription.props.businessId = business.id;
		subscription.props.userId = user.id;
		subscription.props.programId = program.id;
		subscription.props.autoRenew = autoRenew;
		await subscription.create();

		return new ECSResponse(subscription.getJSON());

	}

	public async handleUpdateAutoRenew(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const subscriptionId: string = req.getParameters().get("id") as string;
		const subscription: Subscription = await ECSQLQuery.getObjectWithId(Subscription, subscriptionId);

		if (subscription.props.userId !== user.id) {
			throw ECSError
				.init()
				.show()
				.code(401)
				.msg("You are not the user this subscription belongs to.");
		}

		subscription.props.autoRenew = req.get("autoRenew");
		await subscription.updateProps("autoRenew");

		return new ECSResponse(subscription.getJSON());

	}

	public async handleRenew(req: ECSRequest): Promise<ECSResponse> {

		return new ECSResponse({});

	}

	public getRouter(): Express.Router {

		this.routes.add(new ECSRoute(
			ECSRequestType.POST,
			"/",
			this.handleCreateSubscription,
			new ECSValidator(
				new ECSTypeValidator({
					programId: StandardType.STRING,
					autoRenew: StandardType.BOOLEAN
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.routes.add(new ECSRoute(
			ECSRequestType.PUT,
			"/:id/auto-renew",
			this.handleUpdateAutoRenew,
			new ECSValidator(
				new ECSTypeValidator({
					autoRenew: StandardType.BOOLEAN
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.routes.add(new ECSRoute(
			ECSRequestType.PUT,
			"/:id/renew",
			this.handleRenew,
			new ECSValidator(
				undefined,
				SessionValidator
					.init()
					.user()
			)
		));


		return this.createRouter();

	}

}