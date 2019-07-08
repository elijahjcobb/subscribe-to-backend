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
import { SessionValidator } from "../../../session/SessionValidator";
import { StandardType } from "typit";
import { Session } from "../../../session/Session";
import { Business } from "../../../objects/Business";

export class BusinessRouterMe extends ECSRouter {

	public async handleGetMe(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const business: Business = await session.getBusiness();

		return new ECSResponse(business.getJSON());

	}

	public async handleUpdate(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const business: Business = await session.getBusiness();

		if (req.getEndpoint().indexOf("name") === -1) {

			business.props.name = req.get("name");
			await business.updateProps("name");

		} else {

			business.props.lat = req.get("lat");
			business.props.lng = req.get("lng");
			await business.updateProps("lat", "lng");

		}

		return new ECSResponse(business.getJSON());

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/",
			this.handleGetMe,
			new ECSValidator(
				undefined,
				SessionValidator
					.init()
					.business()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/name",
			this.handleUpdate,
			new ECSValidator(
				new ECSTypeValidator({
					name: StandardType.STRING
				}),
				SessionValidator
					.init()
					.business()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/location",
			this.handleUpdate,
			new ECSValidator(
				new ECSTypeValidator({
					lat: StandardType.NUMBER,
					lng: StandardType.NUMBER
				}),
				SessionValidator
					.init()
					.business()
			)
		));

		return this.createRouter();

	}

}