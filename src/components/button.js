import React from "react";
import PropTypes from "prop-types";

const Button = ({ children, color = "blue", background = "pink", borderColor = "white", getBackground }) => (
	<div style={{ padding: "10px 30px", background: background, width: 100, color: color, border: `3px solid ${borderColor}` }}>
		{children}
		{getBackground && getBackground()}
	</div>
);

Button.propTypes = {
	children: PropTypes.node,
	color: PropTypes.string,
	background: PropTypes.string,
	getBackground: PropTypes.func,
	borderColor: PropTypes.string,
};

export default Button;
