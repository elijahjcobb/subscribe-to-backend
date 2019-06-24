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

import { ECSError, ECSRequest, ECSRequestType, ECSResponse, ECSRoute, ECSRouter } from "@elijahjcobb/server";
import * as Express from "express";
import { Files } from "../files/Files";

export class FilesRouter extends ECSRouter {

	public async handleGetFile(req: ECSRequest): Promise<ECSResponse> {

		const id: string = req.getParameters().get("id") as string;
		const fileData: Buffer | undefined = Files.getFileForId(id) as Buffer;

		if (!fileData) {
			throw ECSError
				.init()
				.msg("The file you are trying to access does not exist.")
				.code(404)
				.show();
		}

		return new ECSResponse(fileData, { name: id });


	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.GET,
			":id",
			this.handleGetFile
		));

		return this.createRouter();

	}

}