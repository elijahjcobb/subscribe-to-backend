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

import { ECSQLDatabase, ECSQLQuery, ECSQLInitObject } from "@elijahjcobb/nosql";
import { ECSRequest, ECSServer } from "@elijahjcobb/server";
import { UserRouter } from "./endpoints/User/UserRouter";
import { Session } from "./session/Session";
import { BusinessRouter } from "./endpoints/Business/BusinessRouter";
import { ProductRouter } from "./endpoints/ProductRouter";
import { FilesRouter } from "./endpoints/FilesRouter";
import * as FileSystem from "fs";
import { ProgramRouter } from "./endpoints/ProgramRouter";
import { SubscriptionRouter } from "./endpoints/SubscriptionRouter";
import {TOTP} from "./session/TOTP";
import { Encryption } from "./session/Encryption";

let databaseConfig: ECSQLInitObject;
let port: number;

if (process.env.USER === "elijahcobb") {

	if (process.platform === "darwin") {

		console.log("Running local environment (Elijah's Laptop).");

		databaseConfig = {
			database: "subscribeto",
			password: "alpine",
			verbose: true
		};

		Encryption.init(FileSystem.readFileSync("/Users/elijahcobb/.s2.enc"));

		port = 3000;

	} else {

		console.log("Running local environment (Elijah's Desktop).");

		databaseConfig = {
			database: "subscribeto",
			password: "alpine",
			verbose: true
		};

		Encryption.init(FileSystem.readFileSync("/home/elijahcobb/.s2.enc"));

		port = 3000;

	}

} else {

	console.log("Running production environment.");

	databaseConfig = {
		database: "subscribeto",
		password: FileSystem.readFileSync("/root/databasepassword.txt").toString("utf8").replace("\n", ""),
		port: 3306,
		username: "root",
		verbose: true,
		insecureAuth: false
	};

	port = 80;

}

ECSQLDatabase.init(databaseConfig);

let server: ECSServer = new ECSServer();

server.setAuthorizationMiddleware(async(req: ECSRequest): Promise<ECSRequest> => {

	const authHeader: string | undefined = req.getHeader("Authorization");
	if (!authHeader) return req;

	const authSplit: string[] = authHeader.split(" ");
	const sessionId: string = authSplit[1];
	if (!sessionId) return req;

	const session: Session | undefined = await ECSQLQuery.getObjectWithId(Session, sessionId, true);
	if (!session) return req;

	req.setSession(session);
	return req;

});


server.use("/user", new UserRouter());
server.use("/business", new BusinessRouter());
server.use("/product", new ProductRouter());
server.use("/program", new ProgramRouter());
server.use("/subscription", new SubscriptionRouter());
server.use("/files", new FilesRouter());

server.startHTTP(port);