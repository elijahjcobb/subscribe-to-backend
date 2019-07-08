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
import { StandardType} from "typit";
import {User} from "../../../../objects/User";
import {Session} from "../../../../session/Session";
import {TFAToken} from "../../../../session/TFA";


export class UserRouterAuthSignUp extends ECSRouter {


	public async handleSignUp(req: ECSRequest): Promise<ECSResponse> {

		const email: string = req.get("email");
		const password: string = req.get("password");

		const token: TFAToken = await User.getSignUpToken(email, password);

		return new ECSResponse({
			token: token.encrypt(),
			type: "sign-up"
		});

	}

	public async handleSignUpFinalize(req: ECSRequest): Promise<ECSResponse> {

		const token: string = req.get("token");
		const code: string = req.get("code");

		const user: User = await User.finalizeSignUp(token, code);
		const session: Session = await user.getNewSession();

		return new ECSResponse({
			token: session.id,
			type: "session"
		});

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/",
			this.handleSignUp,
			new ECSValidator(
				new ECSTypeValidator({
					email: StandardType.STRING,
					password: StandardType.STRING
				})
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/finalize",
			this.handleSignUpFinalize,
			new ECSValidator(
				new ECSTypeValidator({
					token: StandardType.STRING,
					code: StandardType.STRING
				})
			)
		));


		return this.createRouter();

	}

}