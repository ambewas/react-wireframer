import React, { Component } from "react";

import Row from "./components/row";
import Button from "./components/button";
import ClassComponent from "./components/class";

import Layouter from "../lib/components/layouter";
import "./style.css";

class Main extends Component { // eslint-disable-line
	render() {
		return (
			<Layouter components={{ Button, Row, ClassComponent }}/>
		);
	}
}

export default Main;
