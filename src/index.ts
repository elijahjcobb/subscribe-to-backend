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

import { ECSQLDatabase, ECSQLQuery } from "@elijahjcobb/nosql";
import { ECSRequest, ECSServer } from "@elijahjcobb/server";
import { UserRouter } from "./endpoints/UserRouter";
import { Session } from "./objects/Session";

ECSQLDatabase.init({
	database: "subscribeto",
	verbose: true
});

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

server.startHTTP(3000);