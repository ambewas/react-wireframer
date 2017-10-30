import React from "react";
import {
	propEq,
	omit,
	lensProp,
	view,
	set,
	append,
	reject,
	compose,
	findIndex,
	map,
	update,
} from "ramda";
import generateJSX from "./generateJSX";

let componentState = [{
	id: 1,
	type: "rootComponent",
	props: {
		background: "red",
		color: "white",
	},
	children: [],
}];

export const safeClick = fn => e => {
	e.preventDefault();
	e.stopPropagation();
	return fn && fn(e);
};

const lensMatching = pred => (toF => entities => {
	const index = findIndex(pred, entities);

	return map(entity => update(index, entity, entities), toF(entities[index]));
});

export const lensById = compose(lensMatching, propEq("id"));

export const DummyComponent = ({ children }) => <div>{children}</div>; // eslint-disable-line react/prop-types

export const setState = (newState) => componentState = newState;

export const removeFromState = (lens, id) => {
	const childrenLens = compose(lens, lensProp("children"));
	const byId = (component) => view(lensProp("id"), component) === id;

	const newArray = compose(
		reject(byId),
		view(childrenLens)
	)(componentState);

	const newState = set(childrenLens, newArray, componentState);

	// side effect. How shall we contain this...?
	setState(newState);
};

export const addToState = (uniqueID, value, lens, props) => {
	// dont need all the stateprops of this configurable component in the componentState, so lets cleanup a bit.
	const newComponent = {
		id: uniqueID,
		type: value.displayName || value.name,
		children: [],
		props: props,
	};
	const newArray = compose(append(newComponent), view(lens))(componentState);
	const newState = set(lens, newArray, componentState);

	// side effect. How shall we contain this...?
	setState(newState);
};

export const updateState = (id, lens, props) => {
	const propsLens = compose(lens, lensProp("props"));
	const newState = set(propsLens, props, componentState);

	setState(newState);
};

export const getCleanProps = (props) => omit(["children", "removeChild", "id", "lens"], props);

export const printJSX = () => {
	const string = generateJSX(componentState);

	console.log("componentState", string.join("")); // eslint-disable-line no-console
};
