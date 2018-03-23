import React from "react";
import PropTypes from "prop-types";

const Button = ({ children = "button", borderColor = "white", getBackground, light = false, myShape = { background: "orange" } }) => (
	<div style={{ padding: "10px 30px", background: myShape.background, width: 200, color: light ? "green" : "blue", border: `3px solid ${borderColor}` }}>
		{children}
		{getBackground && getBackground()}
	</div>
);

const myHoc = (WrappedComponent) => {
	return class ButtonEnhancer extends React.Component { // eslint-disable-line
		// pass on proptypes for compatibility with configurable.
		static propTypes = WrappedComponent.propTypes;
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
	light: PropTypes.bool,
	getBackground: PropTypes.func,
	whuu: PropTypes.oneOfType([ // eslint-disable-line
		PropTypes.number,
		PropTypes.string,
	]),
	myShape: PropTypes.shape({ // eslint-disable-line
		background: PropTypes.oneOf(["red", "green", "orange"]),
		foo: PropTypes.string,
		bar: PropTypes.bool,
		baz: PropTypes.oneOf(["shoe", "store"]),
		boe: PropTypes.shape({
			lala: PropTypes.number,
			foela: PropTypes.shape({
				tralal: PropTypes.number,
			}),
		}),
	}),
	borderColor: PropTypes.string,
};

export default myHoc(Button);
