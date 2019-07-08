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
import {ECMQuery} from "@elijahjcobb/maria";
import {TFAToken} from "../../../../session/TFA";
import {Encryption} from "../../../../session/Encryption";

export class UserRouterAuthSignIn extends ECSRouter {

	public async handleSignIn(req: ECSRequest): Promise<ECSResponse> {

		const email: string = req.get("email");
		const password: string = req.get("password");

		const user: User = await User.signIn(email, password);

		if (user.usesTFATOTP()) {

			let key: string;

			try {

				const id: string = user.id as string;
				const idData: Buffer = Buffer.from(id, "utf8");
				const encryptedId: Buffer = Encryption.encrypt(idData);
				key = encryptedId.toString("hex");

			} catch (e) {

				throw ECSError.init();

			}

			return new ECSResponse({ token: key, type: "totp" });

		} else {

			if (user.usesTFASMS()) {

				//TODO Remember to send user's actual phone number once nexmo service is setup.

				return new ECSResponse({
					token: new TFAToken(user.id as string).encrypt(),
					type: "sms",
					phone: "1234567890"
				});

			} else {

				const session: Session = await user.getNewSession();

				return new ECSResponse({
					token: session.id,
					type: "session"
				});

			}

		}

	}

	public async handleSignInTOTP(req: ECSRequest): Promise<ECSResponse> {

		const token: string = req.get("token");
		const code: string = req.get("code");

		let id: string;

		try {

			const keyData: Buffer = Buffer.from(token, "hex");
			const idData: Buffer = Encryption.decrypt(keyData);
			id = idData.toString("utf8");

		} catch (e) {

			throw ECSError.init().msg("Could not decrypt shared password token.");

		}

		const user: User = await ECMQuery.getObjectWithId(User, id);

		if (!user.usesTFATOTP()) {
			throw ECSError
				.init()
				.msg("You do not have TOTP enabled.")
				.code(400)
				.show();
		}

		if (code !== user.getTOTPCode()) {
			throw ECSError
				.init()
				.code(401)
				.msg("Incorrect code.")
				.show();
		}

		const session: Session = await user.getNewSession();

		return new ECSResponse({ token: session.id, type: "session" });

	}

	public async handleSignInSMS(req: ECSRequest): Promise<ECSResponse> {

		const encryptedToken: string = req.get("token");
		const code: string = req.get("code");
		const token: TFAToken = TFAToken.decrypt(encryptedToken);

		if (!token.isCodeValid(code)) {
			throw ECSError
				.init()
				.msg("Incorrect code, try again.")
				.code(401)
				.show();
		}

		const user: User = await ECMQuery.getObjectWithId(User, token.data);
		const session: Session = await user.getNewSession();

		return new ECSResponse({ token: session.id, type: "session" });

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/",
			this.handleSignIn,
			new ECSValidator(
				new ECSTypeValidator({
					email: StandardType.STRING,
					password: StandardType.STRING
				})
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/totp",
			this.handleSignInTOTP,
			new ECSValidator(
				new ECSTypeValidator({
					code: StandardType.STRING,
					token: StandardType.STRING
				})
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/sms",
			this.handleSignInSMS,
			new ECSValidator(
				new ECSTypeValidator({
					code: StandardType.STRING,
					token: StandardType.STRING
				})
			)
		));
		return this.createRouter();

	}

}