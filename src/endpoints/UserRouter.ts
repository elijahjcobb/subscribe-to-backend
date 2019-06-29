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
import {User, UserGender} from "../objects/User";
import {Session} from "../session/Session";
import {SessionValidator} from "../session/SessionValidator";
import {BusinessOwner} from "../objects/BusinessOwner";
import {Business} from "../objects/Business";
import {ECSQLQuery} from "@elijahjcobb/nosql";
import { TOTP} from "../session/TOTP";
import { ECCipher } from "@elijahjcobb/encryption";

export class UserRouter extends ECSRouter {

	public async handleGetSelf(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();

		return new ECSResponse(user.getJSON());

	}

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

			const business: Business | undefined = await ECSQLQuery.getObjectWithId(Business, businessId, true);

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

		if (user.usesTOTP()) {

			let key: string;

			try {

				const id: string = user.id as string;
				const idData: Buffer = Buffer.from(id, "utf8");
				const passwordData: Buffer = Buffer.from(password, "utf8");
				const encryptedId: Buffer = new ECCipher(passwordData).encrypt(idData);
				key = encryptedId.toString("hex");

			} catch (e) {

				throw ECSError.init();

			}

			return new ECSResponse({ key });

		} else {

			const session: Session = await user.getNewSession();

			return new ECSResponse({
				sessionId: session.id
			});

		}

	}

	public async handleSignInTOTP(req: ECSRequest): Promise<ECSResponse> {

		const key: string = req.get("key");
		const code: string = req.get("code");
		const password: string = req.get("password");

		let id: string;

		try {

			const passwordData: Buffer = Buffer.from(password, "utf8");
			const keyData: Buffer = Buffer.from(key, "hex");
			const idData: Buffer = new ECCipher(passwordData).decrypt(keyData);
			id = idData.toString("utf8");

		} catch (e) {

			throw ECSError.init().msg("Invalid password or key.").code(401).show();

		}

		const user: User = await ECSQLQuery.getObjectWithId(User, id);

		if (!user.usesTOTP()) {
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
				.msg("Incorrect code, try again.")
				.show();
		}

		const session: Session = await user.getNewSession();

		return new ECSResponse({ sessionId: session.id });

	}

	public async handleUpdate(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const user: User = await session.getUser();
		const endpoint: string = req.getEndpoint().replace("/me/", "");

		if (endpoint === "name") {

			user.props.firstName = req.get("firstName");
			user.props.lastName = req.get("lastName");

		} else if (endpoint === "gender") {

			const gender: UserGender = req.get("gender");
			if (gender < UserGender.Male || gender > UserGender.Other) {
				throw ECSError
					.init()
					.code(401)
					.msg("The value for gender is not valid.")
					.show();
			}

			user.props.gender = gender;

		} else if (endpoint === "birthday") {

			const month: number = req.get("month");
			const day: number = req.get("day");
			const year: number = req.get("year");
			const date: Date = new Date(month + "/" + day + "/" + year);

			if (Number.isNaN(date.getMonth())) {
				throw ECSError
					.init()
					.code(401)
					.msg("The date provided is not a real date.")
					.show();
			}

			const monthProvided: number = date.getMonth() + 1;
			const monthString: string = (monthProvided < 10) ? ("0" + monthProvided) : ("" + monthProvided);
			const dayProvided: number = date.getDate();
			const dayString: string = (dayProvided < 10) ? ("0" + dayProvided) : ("" + dayProvided);

			user.props.birthday = monthString + "" + dayString + "" + date.getFullYear();

		} else if (endpoint === "email") {

			throw ECSError.init().code(501).show();

		} else if (endpoint === "phone") {

			throw ECSError.init().code(501).show();

		} else if (endpoint === "password") {

			throw ECSError.init().code(501).show();

		}

		await user.update();

		return new ECSResponse(user.getJSON());

	}

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

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/me/name",
			this.handleUpdate,
			new ECSValidator(
				new ECSTypeValidator({
					firstName: StandardType.STRING,
					lastName: StandardType.STRING
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/me/gender",
			this.handleUpdate,
			new ECSValidator(
				new ECSTypeValidator({
					gender: StandardType.NUMBER
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/me/birthday",
			this.handleUpdate,
			new ECSValidator(
				new ECSTypeValidator({
					month: StandardType.NUMBER,
					day: StandardType.NUMBER,
					year: StandardType.NUMBER,
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/me/email",
			this.handleUpdate,
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
			ECSRequestType.PUT,
			"/me/phone",
			this.handleUpdate,
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
			ECSRequestType.PUT,
			"/me/password",
			this.handleUpdate,
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
			"/me/totp",
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
			"/me/totp/finalize",
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

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/me",
			this.handleGetSelf,
			new ECSValidator(
				undefined,
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/me/session",
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
			"/me/session/business",
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
			ECSRequestType.POST,
			"/sign-up",
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
			"/sign-in",
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
			"/sign-in/totp",
			this.handleSignInTOTP,
			new ECSValidator(
				new ECSTypeValidator({
					password: StandardType.STRING,
					code: StandardType.STRING,
					key: StandardType.STRING
				})
			)
		));

		return this.createRouter();

	}

}