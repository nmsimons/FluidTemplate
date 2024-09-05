/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TreeViewConfiguration, SchemaFactory } from "fluid-framework";

// Schema is defined using a factory object that generates classes for objects as well
// as list and map nodes.

// Include a UUID to guarantee that this schema will be uniquely identifiable.
// As this schema uses a recursive type, the beta SchemaFactoryRecursive is used instead of just SchemaFactory.
const sf = new SchemaFactory("fc1db2e8-0a00-11ee-be56-0242ac120002");

// Define the schema for the note object.
// Helper functions for working with the data contained in this object
// are included in this class definition as methods.
export class Thing extends sf.object(
	"Note",
	// Fields for Notes which SharedTree will store and synchronize across clients.
	// These fields are exposed as members of instances of the Note class.
	{
		/**
		 * Id to make building the React app simpler.
		 */
		id: sf.identifier,
		text: sf.string,
		array: sf.array(sf.number),
	},
) {}

// Schema for a thing.
export class Items extends sf.array("Items", [() => Thing]) {
	public readonly addThing = () => {
		// create an array with a million random numbers
		const randomArray = Array.from({ length: 1000000 }, () =>
			Math.floor(Math.random() * 1000000),
		);

		// create a string with the numbers in randomArray
		const randomString = randomArray.join("");

		const thing = new Thing({
			text: randomString,
			array: randomArray,
		});

		// Insert the note into the SharedTree.
		this.insertAtEnd(thing);
	};
}

// Export the tree config appropriate for this schema.
// This is passed into the SharedTree when it is initialized.
export const appTreeConfiguration = new TreeViewConfiguration(
	// Schema for the root
	{ schema: Items },
);
