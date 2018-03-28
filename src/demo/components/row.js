import React from "react";
import PropTypes from "prop-types";

const Row = ({ children = "row", className }) => (
	<div className={className} style={{ padding: 30, background: "#ffefef" }}>
		{children}
	</div>
);

Row.propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
};

export default Row;
