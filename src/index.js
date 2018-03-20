import React from "react";
import ReactDOM from "react-dom";
import registerServiceWorker from "./registerServiceWorker";
import store from "./redux/store/store.js";
import { Provider } from "react-redux";
import Router from "./routes.js";
import "./styles/style.scss";

const App = () => (
	<Provider store={store}>
		<Router />
	</Provider>
);


ReactDOM.render(<App />, document.getElementById("root"));
registerServiceWorker();
