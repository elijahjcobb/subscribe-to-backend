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
import { SessionValidator } from "../../session/SessionValidator";
import { OptionalType, StandardType } from "typit";
import { Session } from "../../session/Session";
import { BusinessOwner } from "../../objects/BusinessOwner";
import { Business, BusinessProps } from "../../objects/Business";
import {ECMQuery} from "@elijahjcobb/maria";
import { ECArray } from "@elijahjcobb/collections";
import { ECGBox, ECGDistance, ECGDistanceUnit, ECGPoint } from "@elijahjcobb/geo";
import {BusinessRouterMe} from "./me/BusinessRouterMe";
import {ECSQLCMD, ECSQLCMDQuery} from "@elijahjcobb/sql-cmd";

type BusinessNear = BusinessProps & { distance: { readable: string, value: number }};

export class BusinessRouter extends ECSRouter {

	public async handleCreate(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const businessName: string = req.get("name");
		const lat: number | undefined = req.get("lat");
		const lng: number | undefined = req.get("lng");

		const business: Business = new Business();
		business.props.name = businessName;
		if (lat !== undefined) business.props.lat = lat;
		if (lng !== undefined) business.props.lng = lng;
		await business.create();

		const businessOwner: BusinessOwner = new BusinessOwner();
		businessOwner.props.businessId = business.id;
		businessOwner.props.userId = session.props.userId;
		await businessOwner.create();

		session.props.businessId = business.id;
		await session.update();

		return new ECSResponse(business.getJSON());

	}

	public async handleGetMe(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const business: Business = await session.getBusiness();

		return new ECSResponse(business.getJSON());

	}

	public async handleGet(req: ECSRequest): Promise<ECSResponse> {

		const id: string = req.getParameters().get("id") as string;
		const business: Business | undefined = await ECMQuery.getObjectWithId(Business, id, true);

		if (!business) {
			throw ECSError
				.init()
				.code(404)
				.msg(`A business with id '${id}' does not exist.`)
				.show();
		}

		return new ECSResponse(business.getJSON());

	}

	public async handleGetAll(req: ECSRequest): Promise<ECSResponse> {

		const query: ECMQuery<Business, BusinessProps> = new ECMQuery(Business, ECSQLCMD.select());
		const businesses: ECArray<Business> = await query.getAllObjects();
		const formattedBusinesses: ECArray<object> = businesses.map((business: Business) => { return business.getJSON(); });

		return new ECSResponse(formattedBusinesses.toNativeArray());

	}

	public async handleGetNear(req: ECSRequest): Promise<ECSResponse> {

		const lat: number = req.get("lat");
		const lng: number = req.get("lng");
		const radius: number = req.get("radius") || 5;
		const point: ECGPoint = new ECGPoint(lat, lng);
		const box: ECGBox = point.findBoxWithRadius(new ECGDistance(radius, ECGDistanceUnit.Miles));

		const query: ECMQuery<Business, BusinessProps> = new ECMQuery(Business, ECSQLCMD
			.select()
			.whereThese(
				ECSQLCMDQuery
					.and()
					.where("lat", "<=", box.topLeft.lat)
					.where("lat", ">=", box.bottomLeft.lat)
					.where("lng", ">=", box.topLeft.lat)
					.where("lng", "<=", box.topRight.lat)
			)
			.limit(40)
		);

		const businesses: ECArray<Business> = await query.getAllObjects();
		const formattedBusinesses: ECArray<object> = businesses.map((business: Business) => {

			let obj: BusinessNear = business.getJSON() as BusinessNear;

			if (business.props.lat !== undefined && business.props.lng !== undefined) {

				const distAway: ECGDistance = point.distanceToPoint(new ECGPoint(business.props.lat, business.props.lng));

				obj.distance = {
					value: distAway.toMiles().distance,
					readable: distAway.smartConvert().toString()
				};

			}

			return obj;

		});

		let sorted: BusinessNear[] = formattedBusinesses.toNativeArray() as BusinessNear[];

		sorted.sort((a: BusinessNear, b: BusinessNear): number => {

			return a.distance.value - b.distance.value;

		});

		return new ECSResponse(sorted);

	}

	public getRouter(): Express.Router {

		this.use("/me", new BusinessRouterMe());

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/",
			this.handleCreate,
			new ECSValidator(
				new ECSTypeValidator({
					name: StandardType.STRING,
					lat: new OptionalType(StandardType.NUMBER),
					lng: new OptionalType(StandardType.NUMBER)
				}),
				SessionValidator
					.init()
					.user()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/all",
			this.handleGetAll,
			new ECSValidator(
				undefined,
				SessionValidator
					.init()
					.admin()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/near",
			this.handleGetNear,
			new ECSValidator(
				new ECSTypeValidator({
					lat: StandardType.NUMBER,
					lng: StandardType.NUMBER,
					radius: new OptionalType(StandardType.NUMBER)
				})
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/:id",
			this.handleGet
		));

		return this.createRouter();

	}

}