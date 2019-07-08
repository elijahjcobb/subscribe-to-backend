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

import {ECSRequest, ECSRequestType, ECSResponse, ECSRoute, ECSRouter, ECSValidator} from "@elijahjcobb/server";
import * as Express from "express";
import {SessionValidator} from "../../session/SessionValidator";
import {ECMQuery} from "@elijahjcobb/maria";
import {Session, SessionProps} from "../../session/Session";
import {ECArray, ECMap} from "@elijahjcobb/collections";
import {User} from "../../objects/User";
import {ECSQLCMD, ECSQLCMDQuery} from "@elijahjcobb/sql-cmd";

export class AdminRouter extends ECSRouter {

	private async handleGetAllForUser(req: ECSRequest): Promise<ECSResponse> {

		const userId: string = req.getParameters().get("id") as string;
		const query: ECMQuery<Session, SessionProps> = new ECMQuery(Session,
			ECSQLCMD
				.select()
				.whereThese(
					ECSQLCMDQuery
						.and()
						.where("userId", "=", userId)
						.where("dead", "=", false)
				)
		);

		const sessions: ECArray<Session> = await query.getAllObjects();
		const formattedSessions: ECArray<object> = sessions.map((session: Session): object => {

			return session.getJSON();

		});

		return new ECSResponse(formattedSessions.toNativeArray());

	}

	private async handleGetAllForBusiness(req: ECSRequest): Promise<ECSResponse> {

		const businessId: string = req.getParameters().get("id") as string;

		const query: ECMQuery<Session, SessionProps> = new ECMQuery(Session, ECSQLCMD
			.select()
			.whereThese(
				ECSQLCMDQuery.and()
					.where("businessId", "=", businessId)
					.where("dead", "=", false)
			)
		);

		const map: ECMap<string, object[] | undefined> = new ECMap<string, object[] | undefined>();
		(await query.getAllObjects()).forEach((session: Session) => {

			const userId: string = session.props.userId as string;
			let sessions: object[] | undefined = map.get(userId);
			if (sessions === undefined) sessions = [];
			sessions.push(session.getJSON());
			map.set(userId, sessions);

		});

		return new ECSResponse(map.toNativeObject());

	}

	private async handleCreateNewUserToken(req: ECSRequest): Promise<ECSResponse> {

		const user: User = await ECMQuery.getObjectWithId(User, req.getParameters().get("id") as string);

		const session: Session = new Session();
		session.props.userId = user.id;
		await session.create();

		return new ECSResponse({
			token: session.id,
			type: "session"
		});

	}

	private async handleCreateNewBusinessToken(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const userId: string = session.props.userId as string;
		const businessId: string = req.getParameters().get("id") as string;

		const newSession: Session = new Session();
		newSession.props.userId = userId;
		newSession.props.businessId = businessId;
		await newSession.create();

		return new ECSResponse({
			token: newSession.id,
			type: "session"
		});

	}

	private async handleDeleteSession(req: ECSRequest): Promise<ECSResponse> {

		const sessionId: string = req.getParameters().get("id") as string;
		const session: Session = await ECMQuery.getObjectWithId(Session, sessionId);

		session.props.dead = true;
		await session.updateProps("dead");

		return new ECSResponse({});

	}

	private async handleKillAllUser(req: ECSRequest): Promise<ECSResponse> {

		const userId: string = req.getParameters().get("id") as string;
		const user: User = await ECMQuery.getObjectWithId(User, userId);

		await user.signOutOfAllSessions();

		return new ECSResponse({});

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/user/:id",
			this.handleGetAllForUser,
			new ECSValidator(undefined, SessionValidator.init().admin())
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/business/:id",
			this.handleGetAllForBusiness,
			new ECSValidator(undefined, SessionValidator.init().admin())
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/user/:id",
			this.handleCreateNewUserToken,
			new ECSValidator(undefined, SessionValidator.init().admin())
		));

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/business/:id",
			this.handleCreateNewBusinessToken,
			new ECSValidator(undefined, SessionValidator.init().admin())
		));

		this.add(new ECSRoute(
			ECSRequestType.DELETE,
			"/session/:id",
			this.handleDeleteSession,
			new ECSValidator(undefined, SessionValidator.init().admin())
		));

		this.add(new ECSRoute(
			ECSRequestType.DELETE,
			"/user/:id",
			this.handleKillAllUser,
			new ECSValidator(undefined, SessionValidator.init().admin())
		));

		return this.createRouter();

	}

}