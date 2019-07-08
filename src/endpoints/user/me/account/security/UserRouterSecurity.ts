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
import { StandardType } from "typit";
import { User } from "../../../../../objects/User";
import { Session } from "../../../../../session/Session";
import { SessionValidator } from "../../../../../session/SessionValidator";
import { TFAToken } from "../../../../../session/TFA";
import { UserRouterSecurityTFA } from "./UserRouterSecurityTFA";

export class UserRouterSecurity extends ECSRouter {

	public async handleUpdatePassword(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const newPassword: string = req.get("new");
		const oldPassword: string = req.get("old");

		if (!user.passwordIsCorrect(oldPassword)) {
			throw ECSError
				.init()
				.code(401)
				.msg("Password incorrect.")
				.show();
		}

		user.props.pepper = User.createPepper(user.props.salt as Buffer, newPassword);
		await user.updateProps("pepper");

		return new ECSResponse(user.getJSON());

	}

	public async handleUpdateEmail(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const email: string = req.get("email");
		const password: string = req.get("password");

		if (!user.passwordIsCorrect(password)) {
			throw ECSError
				.init()
				.code(401)
				.msg("Password incorrect.")
				.show();
		}

		let token: TFAToken = new TFAToken(email);
		let tokenString: string = token.encrypt();

		console.log("FAKE SEND EMAIL:", email, token.code);

		return new ECSResponse({
			token: tokenString
		});


	}

	public async handleUpdateEmailFinalize(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const tokenString: string = req.get("token");
		const code: string = req.get("code");
		let token: TFAToken;

		try {
			token = TFAToken.decrypt(tokenString);
		} catch (e) {
			throw ECSError
				.init()
				.code(400)
				.msg("Invalid token.")
				.show();
		}

		if (code !== token.code) {
			throw ECSError
				.init()
				.code(401)
				.msg("Incorrect code.")
				.show();
		}

		user.props.email = token.data;
		await user.updateProps("email");

		return new ECSResponse(user.getJSON());

	}

	public async handleUpdatePhone(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const phone: string = req.get("phone");
		const password: string = req.get("password");

		if (!user.passwordIsCorrect(password)) {
			throw ECSError
				.init()
				.code(401)
				.msg("Password incorrect.")
				.show();
		}

		let token: TFAToken = new TFAToken(phone);
		let tokenString: string = token.encrypt();

		console.log("FAKE SEND PHONE:", phone, token.code);

		return new ECSResponse({
			token: tokenString
		});


	}

	public async handleUpdatePhoneFinalize(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const tokenString: string = req.get("token");
		const code: string = req.get("code");

		let token: TFAToken;

		try {
			token = TFAToken.decrypt(tokenString);
		} catch (e) {
			throw ECSError
				.init()
				.code(400)
				.msg("Invalid token.")
				.show();
		}

		if (code !== token.code) {
			throw ECSError
				.init()
				.code(401)
				.msg("Incorrect code.")
				.show();
		}

		user.props.phone = token.data;
		await user.updateProps("phone");

		return new ECSResponse(user.getJSON());

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/password",
			this.handleUpdatePassword,
			new ECSValidator(
				new ECSTypeValidator({
					old: StandardType.STRING,
					new: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/email",
			this.handleUpdateEmail,
			new ECSValidator(
				new ECSTypeValidator({
					email: StandardType.STRING,
					password: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/email/finalize",
			this.handleUpdateEmailFinalize,
			new ECSValidator(
				new ECSTypeValidator({
					token: StandardType.STRING,
					code: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));


		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/phone",
			this.handleUpdatePhone,
			new ECSValidator(
				new ECSTypeValidator({
					phone: StandardType.STRING,
					password: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/phone/finalize",
			this.handleUpdatePhoneFinalize,
			new ECSValidator(
				new ECSTypeValidator({
					token: StandardType.STRING,
					code: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.use("/tfa", new UserRouterSecurityTFA());

		return this.createRouter();

	}

}