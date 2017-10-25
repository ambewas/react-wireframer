import { createStore, applyMiddleware, compose } from "redux";
import { createLogger } from "redux-logger";

import thunk from "redux-thunk";
import reducers from "../reducers";

const loggerMiddleware = createLogger({
	level: "info",
	collapsed: true,
});

// setup redux devtools chrome extension connection
// https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd/related
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
	reducers,
	composeEnhancers(
		applyMiddleware(thunk),
		applyMiddleware(loggerMiddleware),
	)
);

export default store;
