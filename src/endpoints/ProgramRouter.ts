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
import {SessionValidator} from "../session/SessionValidator";
import {StandardType} from "typit";
import {Session} from "../session/Session";
import {Business} from "../objects/Business";
import {Product} from "../objects/Product";
import {ECSQLCondition, ECSQLFilter, ECSQLFilterGroup, ECSQLOperator, ECSQLQuery} from "@elijahjcobb/nosql";
import {Program, ProgramProps} from "../objects/Program";
import {ECArray} from "@elijahjcobb/collections";

export class ProgramRouter extends ECSRouter {

	public async handleCreateProgram(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const productId: string = req.get("productId");
		const price: number = req.get("price");
		const allowance: number = req.get("allowance");
		const business: Business = await session.getBusiness();
		const product: Product = await ECSQLQuery.getObjectWithId(Product, productId);

		const program: Program = new Program();
		program.props.productId = product.id;
		program.props.businessId = business.id;
		program.props.price = price;
		program.props.closed = false;
		program.props.allowance = allowance;
		await program.create();

		return new ECSResponse(program.getJSON());

	}

	public async handleGetSingular(req: ECSRequest): Promise<ECSResponse> {

		const programId: string = req.getParameters().get("id") as string;
		const program: Program = await ECSQLQuery.getObjectWithId(Program, programId);


		return new ECSResponse(program.getJSON());

	}

	public async handleGetAllForBusiness(req: ECSRequest): Promise<ECSResponse> {

		const closed: boolean = req.getEndpoint().indexOf("closed") !== -1;

		const businessId: string = req.getParameters().get("id") as string;
		const business: Business = await ECSQLQuery.getObjectWithId(Business, businessId);
		const query: ECSQLQuery<Program, ProgramProps> = new ECSQLQuery(
			Program,
			new ECSQLFilterGroup(
				ECSQLCondition.And,
				new ECSQLFilter("businessId", ECSQLOperator.Equal, business.id as string),
				new ECSQLFilter("closed", ECSQLOperator.Equal, closed),
			)
		);

		const programs: ECArray<Program> = await query.getAllObjects();

		return new ECSResponse(programs.map((program: Program) => {

			return program.getJSON();

		}).toNativeArray());

	}

	public async handleGetAllForProduct(req: ECSRequest): Promise<ECSResponse> {

		const productId: string = req.getParameters().get("id") as string;
		const product: Product = await ECSQLQuery.getObjectWithId(Product, productId);
		const programs: ECArray<Program> = await product.getAllPrograms();

		return new ECSResponse(programs.map((program: Program) => {

			return program.getJSON();

		}).toNativeArray());

	}

	public async handleUpdatePrice(req: ECSRequest): Promise<ECSResponse> {

		const oldProgramId: string = req.getParameters().get("id") as string;
		const oldProgram: Program = await ECSQLQuery.getObjectWithId(Program, oldProgramId);

		const price: number = req.get("value");
		if (price <= 0) {
			throw ECSError
				.init()
				.code(400)
				.show()
				.msg("You cannot have a price that is less than or equal to 0.");
		}

		if (await oldProgram.hasSubscribers()) {

			let newProgram: Program = oldProgram.newProgramWithChangedPrice(price);
			await newProgram.create();

			oldProgram.props.successorId = newProgram.id;
			await oldProgram.updateProps("successorId");

			return new ECSResponse({
				old: oldProgram.getJSON(),
				new: newProgram.getJSON()
			});

		} else {

			oldProgram.props.price = price;

			await oldProgram.updateProps("price");

			return new ECSResponse(oldProgram.getJSON());

		}

	}

	public async handleUpdateAllowance(req: ECSRequest): Promise<ECSResponse> {

		const oldProgramId: string = req.getParameters().get("id") as string;
		const oldProgram: Program = await ECSQLQuery.getObjectWithId(Program, oldProgramId);

		const allowance: number = req.get("value");

		if (allowance <= 0) {
			throw ECSError
				.init()
				.code(400)
				.show()
				.msg("You cannot have a allowance that is less than or equal to 0.");
		}

		if (await oldProgram.hasSubscribers()) {

			let newProgram: Program = oldProgram.newProgramWithChangedAllowance(allowance);
			await newProgram.create();

			oldProgram.props.successorId = newProgram.id;
			await oldProgram.updateProps("successorId");

			return new ECSResponse({
				old: oldProgram.getJSON(),
				new: newProgram.getJSON()
			});

		} else {

			oldProgram.props.price = allowance;

			await oldProgram.updateProps("allowance");

			return new ECSResponse(oldProgram.getJSON());

		}


	}

	public async handleDelete(req: ECSRequest): Promise<ECSResponse> {

		const id: string = req.getParameters().get("id") as string;
		const program: Program = await ECSQLQuery.getObjectWithId(Program, id);

		program.props.closed = true;
		await program.updateProps("closed");

		return new ECSResponse(program.getJSON());

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/",
			this.handleCreateProgram,
			new ECSValidator(
				new ECSTypeValidator({
					productId: StandardType.STRING,
					price: StandardType.NUMBER,
					allowance: StandardType.NUMBER
				}),
				SessionValidator.init().business()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/business/:id/closed",
			this.handleGetAllForBusiness
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/business/:id",
			this.handleGetAllForBusiness
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/product/:id",
			this.handleGetAllForProduct
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/:id",
			this.handleGetSingular
		));

		this.add(new ECSRoute(
			ECSRequestType.DELETE,
			"/:id",
			this.handleDelete,
			new ECSValidator(
				undefined,
				SessionValidator.init().business()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/:id/price",
			this.handleUpdatePrice,
			new ECSValidator(
				new ECSTypeValidator({
					value: StandardType.NUMBER
				}),
				SessionValidator.init().business()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.PUT,
			"/:id/allowance",
			this.handleUpdateAllowance,
			new ECSValidator(
				new ECSTypeValidator({
					value: StandardType.NUMBER
				}),
				SessionValidator.init().business()
			)
		));

		return this.createRouter();

	}

}