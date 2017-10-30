import React, { Component } from "react";

import Row from "../../components/row";
import configurated from "../../helpers/configurated";
const CRow = configurated(Row);

class Main extends Component { // eslint-disable-line
	render() {
		return (
			<CRow>
				{"lets do this"}
			</CRow>
		);
	}
}

export default Main;
