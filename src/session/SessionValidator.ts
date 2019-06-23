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

import { ECSAuthValidator, ECSAuthValidatorHandler, ECSRequest, ECSResponse } from "@elijahjcobb/server";
import { ECArrayList } from "@elijahjcobb/collections";
import { Session } from "./Session";

export enum SessionLevel { user, business, admin }

export class SessionValidator implements ECSAuthValidator {

	private levels: ECArrayList<SessionLevel> = new ECArrayList<SessionLevel>();

	private addLevel(level: SessionLevel): SessionValidator {

		this.levels.add(level);
		return this;

	}

	private responseForUnauthorized(): ECSResponse {

		return new ECSResponse({ error: `You are not authorized to make this request.` }, { status: 401 });

	}

	public user(): SessionValidator { return this.addLevel(SessionLevel.user); }
	public business(): SessionValidator { return this.addLevel(SessionLevel.business); }
	public admin(): SessionValidator { return this.addLevel(SessionLevel.admin); }

	public async verifyRequest(request: ECSRequest): Promise<ECSResponse | undefined> {

		if (this.levels.size() === 0) return;

		const session: Session = await request.getSession();
		if (!session) return this.responseForUnauthorized();

		if (this.levels.contains(SessionLevel.user) && !session.props.userId) return this.responseForUnauthorized();
		if (this.levels.contains(SessionLevel.business) && !session.props.businessId) return this.responseForUnauthorized();
		if (this.levels.contains(SessionLevel.admin) && !(await session.isAdmin())) return this.responseForUnauthorized();

		return;

	}

	public static init(): SessionValidator { return new SessionValidator(); }

}