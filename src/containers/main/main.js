import React, { Component } from "react";

import Row from "../../components/row";
import Button from "../../components/button";
import configurated from "../../helpers/configurated";
const CButton = configurated(Button);

import { compose, lensIndex, lensProp } from "ramda";

class Main extends Component {

	render() {
		return (
			<Row>
				<CButton getProps={this.getProps} />
			</Row>
		);
	}
}

export default Main;
