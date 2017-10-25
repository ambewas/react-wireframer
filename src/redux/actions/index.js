import { curry } from "ramda";

/**
|--------------------------------------------------
| action types
|--------------------------------------------------
*/

export const actionTypes = {
	ACTION_TYPE: "ACTION_TYPE",
};


/**
|--------------------------------------------------
| action creators
|--------------------------------------------------
*/

export const action = curry((type, key, data) => ({
	type,
	[key]: data,
}));

export const thunkAction = curry((type, key, data) => {
	return (dispatch) => {
		dispatch({
			type,
			[key]: data,
		});
	};
});

export const multiActionCreator = (...actions) => {
	return (dispatch) => {
		actions.forEach((a) => dispatch(a));
	};
};
