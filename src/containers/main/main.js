import React, { Component } from "react";

import Row from "../../components/row";
import Button from "../../components/button";

import Layouter from "../../helpers/layouter";
class Main extends Component { // eslint-disable-line
	render() {
		return (
			<Layouter components={{ Button, Row }}/>
		);
	}
}

export default Main;
