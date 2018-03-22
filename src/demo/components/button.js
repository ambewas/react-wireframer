import React from "react";
import PropTypes from "prop-types";

const Button = ({ children = "button", background = "pink", borderColor = "white", getBackground, light = false }) => (
	<div style={{ padding: "10px 30px", background: background, width: 200, color: light ? "green" : "blue", border: `3px solid ${borderColor}` }}>
		{children}
		{getBackground && getBackground()}
	</div>
);

const myHoc = (WrappedComponent) => {
	return class ButtonEnhancer extends React.Component { // eslint-disable-line
		// pass on proptypes for compatibility with configurable.
		// static propTypes = WrappedComponent.propTypes;
		render() {
			const extraProps = {
				language: "get it from somewhere",
			};

			return <WrappedComponent {...extraProps} {...this.props} />;
		}
	};
};

Button.propTypes = {
	children: PropTypes.node,
	background: PropTypes.oneOf(["red", "green"]),
	light: PropTypes.bool,
	getBackground: PropTypes.func,
	borderColor: PropTypes.string,
	myShape: PropTypes.shape({ // eslint-disable-line
		foo: PropTypes.string,
		bar: PropTypes.bool,
		baz: PropTypes.oneOf(["shoe", "store"]),
		boe: PropTypes.shape({
			lala: PropTypes.number,
		}),
	}),
};

export default myHoc(Button);
