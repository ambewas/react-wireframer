import React, { Component } from "react";
import PropTypes from 'prop-types';

import Row from "./components/row";
import Button from "./components/button";
import ClassComponent from "./components/class";

import createLayouter from "../lib/components/layouter";
import "./style.css";

const Layouter = createLayouter(PropTypes);

class Main extends Component { // eslint-disable-line
	render() {
		return (
			<Layouter components={{ Button, Row, ClassComponent }}/>
		);
	}
}

export default Main;
