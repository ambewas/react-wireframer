import React, { Component } from "react";

import Row from "../../components/row";
import Button from "../../components/button";
import configurated from "../../helpers/configurated";
const CButton = configurated(Button);

class Main extends Component {
	state = {  }
	render() {
		return (
			<Row>
				<CButton />
			</Row>
		);
	}
}

export default Main;
