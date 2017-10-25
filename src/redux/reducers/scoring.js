import { actionTypes } from "../actions/index.js";
import R from "ramda";
import lensify from "lensify";


const initialState = {
	playerMoves: 0,
	totalScore: 100,
	deeper: {
		deepProp: 0,
		array: ["hm", "haha"],
	},
};

const stateL = lensify(initialState);

const scoring = (state = initialState, action) => {
	switch (action.type) {
		case actionTypes.UPDATE_PLAYER_MOVES:
			return R.over(stateL.playerMoves, R.add(action.moves), state);
		case actionTypes.UPDATE_TOTAL_SCORE:
			return R.over(stateL.totalScore, R.add(action.points), state);
		default:
			return state;
	}
};

export default scoring;
