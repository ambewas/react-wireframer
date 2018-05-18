import {
	omit,
	set,
	lensPath,
	map,
	evolve,
	ifElse,
	propEq,
	append,
	reject,
	identity,
	split,
	compose,
	lensProp,
	insert,
} from "ramda";

import uuid from "uuid/v1";

export const safeClick = fn => e => {
	e.preventDefault();
	e.stopPropagation();

	return fn && fn(e);
};

// clean some props
export const getCleanProps = (props) => omit(["connectDropTarget", "ctx", "hierarchyPath", "isOverCurrent", "componentType", "connectDragSource", "isDragging"], props);

const recursiveUpdateById = (id, updateFn, objs) => map(
	evolve({ props: { children: xs => Array.isArray(xs) ? recursiveUpdateById(id, updateFn, xs) : xs } }),
	map(
		ifElse(
			propEq("id", id),
			updateFn,
			identity
		),
		objs
	)
);

const setNewId = (newId) => {
	return compose(
		set(lensProp("id"), newId),
		set(lensPath(["props", "hierarchyPath"]), newId),
	);
};

// note -> we cannot curry the setNewId function, because uuid() is then only executed once,
// which results in only one UUID per sibling.
export const refreshAllIds = (objs) => {
	return map(
		evolve({ props: { children: xs => Array.isArray(xs) ? refreshAllIds(xs) : xs } }),
		map((x) => setNewId(uuid())(x), objs)
	);
};

export const updateById = (id, prop, value, objs) => {
	const propPath = split(".")(prop);

	propPath.shift();

	return recursiveUpdateById(id, set(lensPath(["props", ...propPath]), value), objs);
};

export const addById = (id, value, objs, index) => (
	recursiveUpdateById(id, evolve(
		{
			props: {
				children: xs => Array.isArray(xs) ? insert(index, value, xs) : [value],
			},
		}
	), objs)
);

export const removeById = (id, objs) => map(
	evolve({ props: { children: xs => Array.isArray(xs) ? removeById(id, xs) : xs } }),
	reject(propEq("id", id), objs)
);

export const getById = (id, data) => {
	const iter = (a) => {
		if (a.id === id) {
			result = a;

			return true;
		}

		return Array.isArray(a.props.children) && a.props.children.some(iter);
	};

	let result;
	data.some(iter);

	return result;
};

export const getPropTypeShape = (shape) => {
	const shapeKeys = Object.keys(shape);

	const definition = shapeKeys.reduce((acc, curr) => {
		return {
			...acc,
			[curr]: shape[curr].shapeTypes ? getPropTypeShape(shape[curr].shapeTypes) : undefined,
		};
	}, {});

	return definition;
};

export const getChildren = (n, skipMe) => {
	const r = [];

	for (; n; n = n.nextSibling) {
		if (n.nodeType === 1 && n !== skipMe) {
			r.push(n);
		}
	}

	return r;
};

// https://stackoverflow.com/questions/4378784/how-to-find-all-siblings-of-currently-selected-object
export const getSiblings = (n) => {
	return getChildren(n.parentNode.firstChild, n);
};


export function getNextSiblings(elem, filter) {
	const sibs = [];
	while (elem = elem.nextSibling) { // eslint-disable-line
		if (elem.nodeType === 3) {
			continue;
		} // text node
		if (!filter || filter(elem)) {
			sibs.push(elem);
		}
	}

	return sibs;
}

export function getPreviousSiblings(elem, filter) {
	const sibs = [];
	while (elem = elem.previousSibling) { // eslint-disable-line
		if (elem.nodeType === 3) {
			continue;
		} // text node
		if (!filter || filter(elem)) {
			sibs.push(elem);
		}
	}

	return sibs;
}

export function divFilter(elem) {
	switch (elem.nodeName.toUpperCase()) {
		case "DIV":
			return true;
		default:
			return false;
	}
}
