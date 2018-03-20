import React from "react";
import PropTypes from "prop-types";

const Row = ({ children = "row" }) => (
	<div style={{ padding: 30, background: "#ffefef" }}>
		{children}
	</div>
);

Row.propTypes = {
	children: PropTypes.node,
};

export default Row;
