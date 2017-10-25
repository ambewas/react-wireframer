import React from "react";
import PropTypes from "prop-types";

const Button = ({ children, color = "blue", background = "pink", borderColor = "white" }) => (
	<div style={{ padding: "10px 30px", background: background, width: 100, color: color, border: `3px solid ${borderColor}` }}>
		{children}mybutton
	</div>
);

Button.propTypes = {
	children: PropTypes.node,
	color: PropTypes.string,
	background: PropTypes.string,
	borderColor: PropTypes.string,
};

export default Button;
