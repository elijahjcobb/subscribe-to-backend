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

import { ECMObject } from "@elijahjcobb/maria";
import { ECHash } from "@elijahjcobb/encryption";
import * as FS from "fs";

export abstract class Files {

	public static readonly rootDirectory: string = "/home/elijahcobb/Documents/subscribeto-storage";

	public static getFileId(object: ECMObject<any>): string {

		const idPreHash: string = object.table + object.id;
		const idPreHashData: Buffer = Buffer.from(idPreHash, "hex");
		const idHashedData: Buffer = ECHash.hash(idPreHashData);
		return idHashedData.toString("hex");

	}

	public static getFilePathForId(id: string): string {

		return this.rootDirectory + "/" + id;

	}

	public static getFilePathForObject(object: ECMObject<any>): string {

		return this.getFilePathForId(this.getFileId(object));

	}

	public static saveFile(object: ECMObject<any>, data: Buffer): string {

		const newId: string = this.getFileId(object);
		const filePath: string = this.getFilePathForId(newId);
		FS.writeFileSync(filePath, data);

		return newId;

	}

	public static doesFileExistForId(id: string): boolean {

		const filePath: string = this.getFilePathForId(id);
		return FS.existsSync(filePath);

	}

	public static doesFileExistForObject(object: ECMObject<any>): boolean {

		const filePath: string = this.getFilePathForObject(object);
		return FS.existsSync(filePath);

	}

	public static getFileForObject(object: ECMObject<any>): Buffer | undefined {

		if (!this.doesFileExistForObject(object)) return;
		return FS.readFileSync(this.getFilePathForObject(object));

	}


	public static getFileForId(id: string): Buffer | undefined {

		if (!this.doesFileExistForId(id)) return;
		return FS.readFileSync(this.getFilePathForId(id));

	}


	public static getUrl(object: ECMObject<any>): string | undefined {

		if (this.doesFileExistForObject(object)) return;

		const id: string = this.getFileId(object);
		return "/files/" + id;

	}

}