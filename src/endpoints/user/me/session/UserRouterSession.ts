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
import {OptionalType, StandardType} from "typit";
import {User} from "../../../../objects/User";
import {Session} from "../../../../session/Session";
import {SessionValidator} from "../../../../session/SessionValidator";
import {BusinessOwner} from "../../../../objects/BusinessOwner";
import {Business} from "../../../../objects/Business";
import {ECMQuery} from "@elijahjcobb/maria";


export class UserRouterSession extends ECSRouter {

	public async handleGetSelfSession(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();

		return new ECSResponse(session.getJSON());

	}

	public async handleSetSelfSessionBusiness(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const businessId: string | undefined  = req.get("id");

		if (businessId === undefined) {

			session.props.businessId = undefined;
			await session.update();

		} else {

			const business: Business | undefined = await ECMQuery.getObjectWithId(Business, businessId, true);

			if (business === undefined) throw ECSError.init().msg("The business you are referencing does not exist.").code(404).show();
			if (session.props.userId === undefined) throw ECSError.init().msg("Your session does not have a userId.").show().code(400);

			if (await BusinessOwner.isUserIdOwnerOfBusinessId(session.props.userId, businessId)) {

				session.props.businessId = businessId;
				await session.update();

			} else {

				throw ECSError.init().msg(`You are not an owner of ${business.props.name}.`).code(401).show();

			}

		}

		return new ECSResponse(session.getJSON());

	}

	public async handleSignOut(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();

		session.props.dead = true;
		await session.updateProps("dead");

		return new ECSResponse(session.getJSON());

	}

	public async handleSignOutAll(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();

		await user.signOutOfAllSessions();

		return new ECSResponse(session.getJSON());

	}

	public getRouter(): Express.Router {


		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/",
			this.handleGetSelfSession,
			new ECSValidator(
				undefined,
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/business",
			this.handleSetSelfSessionBusiness,
			new ECSValidator(
				new ECSTypeValidator({
					id: new OptionalType(StandardType.STRING)
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.DELETE,
			"/sign-out",
			this.handleSignOut,
			new ECSValidator(
				undefined,
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.DELETE,
			"/sign-out/all",
			this.handleSignOutAll,
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