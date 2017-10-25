import React from "react";
import PropTypes from "prop-types";

const Row = ({ children }) => (
	<div style={{ padding: 30, background: "#ffefef" }}>
		{children}myrow
	</div>
);

Row.propTypes = {
	children: PropTypes.node,
};

export default Row;