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
	ECSRequest,
	ECSRequestType,
	ECSResponse,
	ECSRoute,
	ECSRouter,
	ECSTypeValidator,
	ECSValidator
} from "@elijahjcobb/server";
import * as Express from "express";
import { StandardType, ObjectType } from "typit";
import { User } from "../objects/User";
import { Session } from "../objects/Session";

export class UserRouter extends ECSRouter {

	public async handleGetSelf(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();

		return new ECSResponse({
			user: user.getJSON(),
			session: session.getJSON()
		});

	}


	public async handleSignUp(req: ECSRequest): Promise<ECSResponse> {

		const email: string = req.get("email");
		const password: string = req.get("password");

		const user: User = await User.signUp(email, password);
		const session: Session = await user.getNewSession();

		return new ECSResponse({
			sessionId: session.id
		});

	}

	public async handleSignIn(req: ECSRequest): Promise<ECSResponse> {

		const email: string = req.get("email");
		const password: string = req.get("password");

		const user: User = await User.signIn(email, password);
		const session: Session = await user.getNewSession();

		return new ECSResponse({
			sessionId: session.id
		});

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(ECSRequestType.GET, "/", this.handleGetSelf));

		this.add(((): ECSRoute => {

			let validator: ECSValidator = new ECSValidator();

			validator.typeValidator = new ECSTypeValidator(new ObjectType({
				email: StandardType.STRING,
				password: StandardType.STRING
			}));

			return new ECSRoute(ECSRequestType.POST, "/sign-up", this.handleSignUp, validator);

		})());

		this.add(((): ECSRoute => {

			let validator: ECSValidator = new ECSValidator();

			validator.typeValidator = new ECSTypeValidator(new ObjectType({
				email: StandardType.STRING,
				password: StandardType.STRING
			}));

			return new ECSRoute(ECSRequestType.POST, "/sign-in", this.handleSignIn, validator);

		})());

		return this.createRouter();

	}

}