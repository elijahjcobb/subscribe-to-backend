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

import {ECMFilteredJSON, ECMObject, ECMQuery} from "@elijahjcobb/maria";
import {ECErrorOriginType, ECErrorStack, ECErrorType} from "@elijahjcobb/error";
import {ECGenerator, ECHash} from "@elijahjcobb/encryption";
import {Session, SessionProps} from "../session/Session";
import {TOTP} from "../session/TOTP";
import {TFAToken} from "../session/TFA";
import {ECSError} from "@elijahjcobb/server";
import {ECSQLCMD, ECSQLCMDQuery} from "@elijahjcobb/sql-cmd";

export enum UserGender {
	Male,
	Female,
	Other
}

export interface TestUser {
	firstName: string;
}

type SignUpToken = {
	email: string;
	salt: string;
	pepper: string;
};

export interface UserProps extends TestUser {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	gender: UserGender;
	birthday: string;
	salt: Buffer;
	pepper: Buffer;
	tfaTOTPSecret: string;
	tfaTOTPEnabled: boolean;
	tfaSMSEnabled: boolean;
}

export class User extends ECMObject<UserProps> {

	public constructor() {

		super("user", {
			firstName: "string",
			lastName: "string",
			email: "string",
			phone: "string",
			gender: "number",
			birthday: "string",
			salt: "buffer",
			pepper: "buffer",
			tfaTOTPEnabled: "boolean",
			tfaTOTPSecret: "string",
			tfaSMSEnabled: "boolean"
		});

	}

	public getJSON(): object {

		let obj: ECMFilteredJSON<UserProps> = this.getFilteredJSON(
			"id",
			"email",
			"firstName",
			"lastName",
			"phone",
			"gender",
			"birthday",
			"updatedAt",
			"createdAt"
		);

		if (this.props.birthday) {

			// @ts-ignore
			obj.birthday = {
				month: parseInt(this.props.birthday.substr(0, 2)),
				day: parseInt(this.props.birthday.substr(2, 2)),
				year: parseInt(this.props.birthday.substr(4, 4))
			};

		}

		return obj;

	}

	public async getNewSession(): Promise<Session> {

		if (!this.id) throw Error("You cannot make a session for a user that has not been created.");

		let session: Session = new Session();
		session.props.userId = this.id;
		await session.create();

		return session;

	}

	public usesTFASMS(): boolean {

		return this.props.tfaSMSEnabled !== undefined && this.props.tfaSMSEnabled;

	}

	public usesTFATOTP(): boolean {

		return this.props.tfaTOTPEnabled !== undefined && this.props.tfaTOTPEnabled;

	}

	public getTOTPCode(): string {

		return TOTP.generateCode(this.props.tfaTOTPSecret as string);

	}

	public passwordIsCorrect(password: string): boolean {

		if (this.props.salt === undefined || this.props.pepper === undefined) return false;
		return this.props.pepper.equals(User.createPepper(this.props.salt, password));

	}

	public async signOutOfAllSessions(): Promise<void> {

		if (this.id === undefined) {
			throw ECSError.init().msg("Tried to sign out of all sessions for a user who hasn't been created.");
		}

		const query: ECMQuery<Session, SessionProps> = new ECMQuery(Session,
			ECSQLCMD
				.select()
				.whereThese(
					ECSQLCMDQuery
						.and()
						.where("userId", "=", this.id)
						.where("dead", "=", true)
				)
		);

		await (await query.getAllObjects()).forEachSync(async (session: Session): Promise<void> => {

			session.props.dead = true;
			await session.updateProps("dead");

		});

	}

	public static createPepper(salt: Buffer, password: string): Buffer {

		let pepper: Buffer = Buffer.from(password, "utf8");
		for (let i: number = 0; i < 1000; i++) pepper = ECHash.hash(Buffer.concat([pepper, salt]));

		return pepper;

	}

	public static async doesUserExistForEmail(email: string): Promise<boolean> {

		const query: ECMQuery<User, UserProps> = new ECMQuery(User,
			ECSQLCMD
				.count()
				.where("email", "=", email)
		);

		return await query.count() > 0;

	}

	public static async getSignUpToken(email: string, password: string): Promise<TFAToken> {

		if (await this.doesUserExistForEmail(email)) {
			throw ECErrorStack.newWithMessageAndType(
				ECErrorOriginType.User,
				ECErrorType.ValueAlreadyExists,
				new Error("A user already exits with this email address."));
		}

		const salt: Buffer = ECGenerator.randomBytes(32);

		let tokenPayload: SignUpToken = {
			email,
			salt: salt.toString("base64"),
			pepper: User.createPepper(salt, password).toString("base64")
		};

		console.log("1");

		let tokenPayloadData: Buffer = Buffer.from(JSON.stringify(tokenPayload), "utf8");
		let tokenPayloadString: string = tokenPayloadData.toString("base64");

		console.log("2");

		return new TFAToken(tokenPayloadString);

	}

	public static async finalizeSignUp(token: string, code: string): Promise<User> {

		const decryptedToken: TFAToken = TFAToken.decrypt(token);

		if (code !== decryptedToken.code) {
			throw ECSError
				.init()
				.code(401)
				.msg("Incorrect code.")
				.show();
		}

		const tokenPayloadString: string = decryptedToken.data;
		const tokenPayloadData: Buffer = Buffer.from(tokenPayloadString, "base64");
		const tokenPayloadObject: SignUpToken = JSON.parse(tokenPayloadData.toString("utf8"));

		const email: string = tokenPayloadObject.email;
		const pepper: Buffer = Buffer.from(tokenPayloadObject.pepper, "base64");
		const salt: Buffer = Buffer.from(tokenPayloadObject.salt, "base64");

		let user: User = new User();
		user.props.salt = salt;
		user.props.pepper = pepper;
		user.props.email = email;
		await user.create();

		return user;
	}

	public static async signIn(email: string, password: string): Promise<User> {

		if (!await this.doesUserExistForEmail(email)) {
			throw ECErrorStack.newWithMessageAndType(
				ECErrorOriginType.User,
				ECErrorType.UsernameIncorrect,
				new Error("A user does not exist for this email address."));
		}

		let query: ECMQuery<User, UserProps> = new ECMQuery(User,
			ECSQLCMD
				.select()
				.where("email", "=", email)
		);

		let user: User = await query.getFirstObject();

		const pepperProvided: Buffer = this.createPepper(user.props.salt as Buffer, password);
		if (!(user.props.pepper as Buffer).equals(pepperProvided)) {

			throw ECErrorStack.newWithMessageAndType(
				ECErrorOriginType.User,
				ECErrorType.PasswordIncorrect,
				new Error("Password is incorrect for user."));

		}

		return user;

	}
}