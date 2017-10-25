import React, { Component } from "react";
import { lensPath, lensProp, set } from "ramda";

const configurable = config => WrappedComponent => {
	return class ConfigurableComponent extends Component {
		state = {
			child: "aa",
			props: {},
			propList: false,
		}

		componentDidMount() {
			this.setState({ // eslint-disable-line
				props: this.getWrappedComponentProps(),
			});
		}

		getWrappedComponentProps = () => {
			console.log("WrappedComponent", WrappedComponent);
			if (WrappedComponent && WrappedComponent.propTypes) {
				const keys = Object.keys(WrappedComponent.propTypes);

				return keys.reduce((acc, key) => {
					return {
						...acc,
						[key]: "somethin",
					};
				}, {});
			}
		}

		setPropState = (prop, value) => {
			const propLens = lensProp(prop);
			const NewComponent = configurable(config)(value);

			this.setState({
				props: set(propLens, <NewComponent />, this.state.props),
			});

		}

		showPropList = (prop) => {
			this.setState({
				propList: prop,
			});
		}

		renderPropList = () => {
			const { components } = config;
			const keys = Object.keys(components);

			console.log("config", config);
			return keys.map(key => {
				return <div key={key} onClick={() => this.setPropState(this.state.propList, components[key])}>{key}</div>;
			});
		}

		renderPropSwitcher = () => {
			if (this.state.props) {
				const keys = Object.keys(this.state.props);

				return keys.map(prop => {
					return <div key={prop} onClick={() => this.showPropList(prop)}>{prop}</div>;
				});
			}
		}

		render() {
			this.getWrappedComponentProps();
			return (
				<div>
					{this.renderPropSwitcher()}
					{this.state.propList && this.renderPropList()}
					<WrappedComponent >{this.state.props.children}</WrappedComponent>
				</div>
			);
		}
	};
};

export default configurable;
