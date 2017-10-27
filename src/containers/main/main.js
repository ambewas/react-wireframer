import React, { Component } from "react";

import Row from "../../components/row";
import Button from "../../components/button";
import configurated from "../../helpers/configurated";
const CButton = configurated(Button);

import { compose, lensIndex, lensProp } from "ramda";

class Main extends Component {
	state = {  }
	render() {
		return (
			<Row>
				<CButton parentLens={compose(lensIndex(0), lensProp("children"))}/>
			</Row>
		);
	}
}

export default Main;
