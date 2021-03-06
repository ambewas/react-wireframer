import React from "react";
import PropTypes from "prop-types";

const Button = ({ className, aantal, labels = {}, children = "button", borderColor = "white", getBackground, light = false, myShape = { background: "orange" } }) => (
	<div className={className} style={{ padding: "10px 30px", background: myShape.background, width: 200, color: light ? "green" : "blue", border: `3px solid ${borderColor}` }}>
		{children}
		{aantal}
		{labels && labels.items && labels.items.map(label => <span key={label}>{label.title}</span>)}
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
	className: PropTypes.string,
	light: PropTypes.bool,
	labels: PropTypes.shape({
		items: PropTypes.arrayOf(PropTypes.shape({
			title: PropTypes.number,
		})),
	}),
	getBackground: PropTypes.func,
	aantal: PropTypes.oneOfType([ // eslint-disable-line
		PropTypes.number,
		PropTypes.string,
	]),
	myShape: PropTypes.shape({ // eslint-disable-line
		background: PropTypes.oneOfType([
			PropTypes.oneOf(["red", "green", "orange"]),
			PropTypes.string,
		]),
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
