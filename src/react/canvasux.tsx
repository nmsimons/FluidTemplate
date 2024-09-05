/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useEffect, useState } from "react";
import { Items, Thing } from "../schema/app_schema.js";
import { Session } from "../schema/session_schema.js";
import {
	ConnectionState,
	IFluidContainer,
	IMember,
	IServiceAudience,
	Tree,
	TreeView,
} from "fluid-framework";
import {
	Floater,
	NewButton,
	ButtonGroup,
	UndoButton,
	RedoButton,
	DeleteButton,
} from "./buttonux.js";
import { undoRedo } from "../utils/undo.js";

export function Canvas(props: {
	items: TreeView<typeof Items>;
	sessionTree: TreeView<typeof Session>;
	audience: IServiceAudience<IMember>;
	container: IFluidContainer;
	fluidMembers: string[];
	currentUser: string;
	undoRedo: undoRedo;
	setCurrentUser: (arg: string) => void;
	setConnectionState: (arg: string) => void;
	setSaved: (arg: boolean) => void;
	setFluidMembers: (arg: string[]) => void;
}): JSX.Element {
	const [invalidations, setInvalidations] = useState(0);

	// Register for tree deltas when the component mounts.
	// Any time the tree changes, the app will update
	// For more complex apps, this code can be included
	// on lower level components.
	useEffect(() => {
		const unsubscribe = Tree.on(props.items.root, "treeChanged", () => {
			setInvalidations(invalidations + Math.random());
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		const updateConnectionState = () => {
			if (props.container.connectionState === ConnectionState.Connected) {
				props.setConnectionState("connected");
			} else if (props.container.connectionState === ConnectionState.Disconnected) {
				props.setConnectionState("disconnected");
			} else if (props.container.connectionState === ConnectionState.EstablishingConnection) {
				props.setConnectionState("connecting");
			} else if (props.container.connectionState === ConnectionState.CatchingUp) {
				props.setConnectionState("catching up");
			}
		};
		updateConnectionState();
		props.setSaved(!props.container.isDirty);
		props.container.on("connected", updateConnectionState);
		props.container.on("disconnected", updateConnectionState);
		props.container.on("dirty", () => props.setSaved(false));
		props.container.on("saved", () => props.setSaved(true));
		props.container.on("disposed", updateConnectionState);
	}, []);

	const updateMembers = () => {
		if (props.audience.getMyself() == undefined) return;
		if (props.audience.getMyself()?.id == undefined) return;
		if (props.audience.getMembers() == undefined) return;
		if (props.container.connectionState !== ConnectionState.Connected) return;
		if (props.currentUser == "") {
			const user = props.audience.getMyself()?.id;
			if (typeof user === "string") {
				props.setCurrentUser(user);
			}
		}
		props.setFluidMembers(Array.from(props.audience.getMembers().keys()));
	};

	useEffect(() => {
		props.audience.on("membersChanged", updateMembers);
		return () => {
			props.audience.off("membersChanged", updateMembers);
		};
	}, []);

	return (
		<div className="relative flex grow-0 h-full w-full bg-transparent">
			<ItemsView
				items={props.items.root}
				clientId={props.currentUser}
				session={props.sessionTree.root}
				fluidMembers={props.fluidMembers}
				isRoot={true}
			/>
			<Floater>
				<ButtonGroup>
					<NewButton items={props.items.root} clientId={props.currentUser} />
				</ButtonGroup>
				<ButtonGroup>
					<DeleteButton
						delete={() => {
							props.items.root = [];
						}}
					/>
				</ButtonGroup>
				<ButtonGroup>
					<UndoButton undo={() => props.undoRedo.undo()} />
					<RedoButton redo={() => props.undoRedo.redo()} />
				</ButtonGroup>
			</Floater>
		</div>
	);
}

export function ItemsView(props: {
	items: Items;
	clientId: string;
	session: Session;
	fluidMembers: string[];
	isRoot: boolean;
}): JSX.Element {
	const things = [];
	for (const i of props.items) {
		things.push(<ThingView key={i.id} thing={i} />);
	}
	return (
		<div className="flex grow-0 flex-row h-full w-full flex-wrap gap-4 p-4 content-start overflow-y-scroll">
			{things}
			<div className="flex w-full h-24"></div>
		</div>
	);
}

export function ThingView(props: { thing: Thing }): JSX.Element {
	return (
		<div className="flex flex-col bg-transparent w-48 h-48 rounded-lg border-black border-4">
			<div className="flex flex-col bg-transparent p-2">
				<div className="flex flex-row bg-transparent">
					<div className="flex bg-transparent">{props.thing.text}</div>
				</div>
			</div>
		</div>
	);
}
