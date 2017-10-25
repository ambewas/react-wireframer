import React from "react";

import {
	BrowserRouter as Router,
	Route,
	Redirect,
} from "react-router-dom";


// DocumentHead is a wrapper around Helmet. See documentHead.js for more documentation around its use.
import DocumentHead from "./documentHead.js";

const Routes = () => ( // eslint-disable-line
	<Router>
		<div className="App">
			<DocumentHead />
		</div>
	</Router>
);

export default Routes;
