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
import {StandardType} from "typit";
import {User} from "../../objects/User";
import {Session} from "../../session/Session";
import {SessionValidator} from "../../session/SessionValidator";
import {TOTP} from "../../session/TOTP";
import {TFAToken} from "../../session/TFA";

export class UserRouterSecurityTFA extends ECSRouter {

	public async handleToggleTOTP(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		let user: User = await session.getUser();
		const enable: boolean = req.get("enable");
		const password: string = req.get("password");

		if (!user.passwordIsCorrect(password)) {
			throw ECSError
				.init()
				.msg("Incorrect password.")
				.code(401)
				.show();
		}

		user.props.tfaTOTPEnabled = false;

		if (enable) user.props.tfaTOTPSecret = TOTP.generateSecret();
		else user.props.tfaTOTPSecret = undefined;

		await user.update();

		return new ECSResponse({
			secret: user.props.tfaTOTPSecret
		});

	}

	public async finalizeTOTPOn(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		let user: User = await session.getUser();

		if (user.props.tfaTOTPSecret === undefined) {
			throw ECSError
				.init()
				.msg("You must call /user/me/totp first.")
				.code(400)
				.show();
		}

		const realCode: string = user.getTOTPCode();
		const providedCode: string = req.get("code");

		if (realCode !== providedCode) {
			throw ECSError
				.init()
				.msg("The code you provided is invalid. Please try again.")
				.code(400)
				.show();
		}

		user.props.tfaTOTPEnabled = true;
		await user.updateProps("tfaTOTPEnabled");

		return new ECSResponse({});

	}

	public async handleToggleSMSTFA(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const enable: boolean = req.get("enable");
		const password: string = req.get("password");

		if (!user.passwordIsCorrect(password)) {
			throw ECSError
				.init()
				.code(401)
				.msg("Incorrect password.")
				.show();
		}

		if (enable) {

			//TODO Put user's real phone number in.

			return new ECSResponse({
				token: new TFAToken(user.id as string).encrypt(),
				phone: "1234567890"
			});

		} else {

			user.props.tfaSMSEnabled = false;
			await user.updateProps("tfaSMSEnabled");
			return new ECSResponse({});

		}

	}

	public async handleFinalizeSMSTFA(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const code: string = req.get("code");
		const encryptedToken: string = req.get("token");
		const isValid: boolean = TFAToken.isCodeValid(code, encryptedToken);

		if (!isValid) {
			throw ECSError
				.init()
				.code(401)
				.msg("The code provided was incorrect.");
		}

		user.props.tfaSMSEnabled = true;
		await user.updateProps("tfaSMSEnabled");

		return new ECSResponse({});

	}

	public getRouter(): Express.Router {


		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/sms",
			this.handleToggleSMSTFA,
			new ECSValidator(
				new ECSTypeValidator({
					enable: StandardType.BOOLEAN,
					password: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/sms/finalize",
			this.handleFinalizeSMSTFA,
			new ECSValidator(
				new ECSTypeValidator({
					code: StandardType.STRING,
					token: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/totp",
			this.handleToggleTOTP,
			new ECSValidator(
				new ECSTypeValidator({
					enable: StandardType.BOOLEAN,
					password: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/totp/finalize",
			this.finalizeTOTPOn,
			new ECSValidator(
				new ECSTypeValidator({
					code: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		return this.createRouter();

	}

}