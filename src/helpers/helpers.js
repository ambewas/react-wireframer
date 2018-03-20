import R, {
	omit,
	set,
	lensPath,
	map,
	evolve,
	ifElse,
	propEq,
	append,
} from "ramda";
// import generateJSX from "./generateJSX";

export const safeClick = fn => e => {
	e.preventDefault();
	e.stopPropagation();
	return fn && fn(e);
};

// clean some props
export const getCleanProps = (props) => omit(["connectDropTarget", "ctx", "hierarchyPath", "isOverCurrent"], props);

const recursiveUpdateById = (id, value, updateFn, objs) => map(
	evolve({ props: { children: xs => Array.isArray(xs) ? recursiveUpdateById(id, value, updateFn, xs) : xs } }),
	map(
		ifElse(
			propEq("id", id),
			updateFn,
			R.identity
		),
		objs
	)
);

export const updateById = (id, prop, value, objs) => (
	recursiveUpdateById(id, value, set(lensPath(["props", prop]), value), objs)
);

export const addById = (id, value, objs) => (
	recursiveUpdateById(id, value, evolve(
		{
			props: {
				children: xs => Array.isArray(xs) ? append(value, xs) : [value],
			},
		}
	), objs)
);

export const removeById = (id, objs) => R.map(
	R.evolve({ props: { children: xs => Array.isArray(xs) ? removeById(id, xs) : xs } }),
	R.reject(R.propEq("id", id), objs)
);

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
