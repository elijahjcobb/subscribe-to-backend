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
import {User, UserGender} from "../../objects/User";
import {Session} from "../../session/Session";
import {SessionValidator} from "../../session/SessionValidator";
import {UserRouterSecurity} from "./UserRouterSecurity";

export class UserRouterAccount extends ECSRouter {

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

		}

		await user.update();

		return new ECSResponse(user.getJSON());

	}

	public getRouter(): Express.Router {

		this.use("/security", new UserRouterSecurity());

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/name",
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
			"/gender",
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
			"/birthday",
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

		return this.createRouter();

	}

}