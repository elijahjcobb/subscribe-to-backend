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

import {ECMObject, ECMQuery} from "@elijahjcobb/maria";
import { ECArray } from "@elijahjcobb/collections";
import { Product, ProductProps } from "./Product";
import { ECSError } from "@elijahjcobb/server";
import { Program, ProgramProps } from "./Program";
import {ECSQLCMD, ECSQLCMDQuery} from "@elijahjcobb/sql-cmd";

export interface BusinessProps {
	name: string;
	lat: number;
	lng: number;
}

export class Business extends ECMObject<BusinessProps> {

	public constructor() {

		super("business", {
			name: "string",
			lat: "number",
			lng: "number"
		});

	}

	public async getAllProducts(): Promise<ECArray<Product>> {

		if (this.id === undefined) {
			throw ECSError
				.init()
				.msg("You cannot get products for a business that hasn't been created.");
		}

		const query: ECMQuery<Product, ProductProps> = new ECMQuery(
			Product,
			ECSQLCMD.select().where("businessId", "=", this.id)
		);

		return await query.getAllObjects();

	}

	public async getAllPrograms(): Promise<ECArray<Program>> {

		if (this.id === undefined) {
			throw ECSError
				.init()
				.msg("You cannot get programs for a business that hasn't been created.");
		}

		const query: ECMQuery<Program, ProgramProps> = new ECMQuery(
			Program,
			ECSQLCMD.select().where("businessId", "=", this.id)
		);

		return await query.getAllObjects();

	}

	public async getPrograms(closed: boolean = false): Promise<ECArray<Program>> {

		if (this.id === undefined) {
			throw ECSError
				.init()
				.msg("You cannot get programs for a business that hasn't been created.");
		}

		const query: ECMQuery<Program, ProgramProps> = new ECMQuery(
			Program,
			ECSQLCMD
				.select()
				.whereThese(
					ECSQLCMDQuery
						.and()
						.where("businessId", "=", this.id)
						.where("closed", "=", closed)
				)
		);

		return await query.getAllObjects();

	}

}