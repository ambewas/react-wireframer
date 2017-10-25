import React, { Component } from "react";
import { lensPath, lensProp, set, append } from "ramda";

const configurable = config => WrappedComponent => {
	return class ConfigurableComponent extends Component {
		state = {
			child: "aa",
			props: {},
			listedProp: undefined,
		}

		componentDidMount() {
			this.setState({ // eslint-disable-line
				props: this.getWrappedComponentProps(),
			});
		}

		getWrappedComponentProps = () => {
			if (WrappedComponent && WrappedComponent.propTypes) {
				const keys = Object.keys(WrappedComponent.propTypes);

				return keys.reduce((acc, key) => {
					return {
						...acc,
						[key]: undefined,
					};
				}, {});
			}
		}

		setPropState = (prop, value) => {
			const propLens = lensProp(prop);

			const NewComponent = prop === "children" ? configurable(config)(value) : undefined;

			console.log("this.state.props.children", this.state.props.children);
			const newChildren = append(NewComponent, [this.state.props.children]);

			console.log("newChildren", newChildren);
			const componentTree = (
				<div>
					{
						newChildren.filter(c => c).map((Child, i) => {
							if (typeof Child === "object") {
								return Child;
							}
							return <Child key={i} />; // eslint-disable-line
						})
					}
				</div>
			);

			const theValue = NewComponent ? componentTree : value;

			console.log("theValue", theValue);
			this.setState({
				props: set(propLens, theValue, this.state.props),
			});
		}

		showPropList = (prop) => {
			this.setState({
				listedProp: prop,
			});
		}

		renderPropList = () => {
			const { components } = config;
			const { listedProp, textInput } = this.state;
			const keys = Object.keys(components);

			const componentList = keys.map(key => {
				return (
					<div key={key} style={{ padding: 30, border: "4px solid grey" }}>
						<div
							onClick={(e) => {
								e.stopPropagation();
								this.setPropState(listedProp, components[key]);
							}}
						>{key}
						</div>
					</div>
				);
			});

			return (
				<div >
					{listedProp === "children" ? componentList : (
						<div style={{ padding: 30, border: "4px solid grey" }}>
							<span style={{ paddingRight: 12 }}>enter value for {listedProp}:</span>
							<input
								onClick={e => e.stopPropagation()}
								type="text" onChange={(e) => {
									e.stopPropagation();
									e.preventDefault();
									this.setState({ textInput: e.target.value });
								}} value={textInput}
							/>
							<span
								onClick={(e) => {
									e.stopPropagation();
									this.setPropState(listedProp, textInput);
								}}
							>SET
							</span>
						</div>
					)}
				</div>
			);
		}

		renderPropSwitcher = () => {
			const { listedProp, props } = this.state;

			if (props) {
				const keys = Object.keys(props);

				const propList = keys.map(prop => {
					return (
						<div
							key={prop} onClick={(e) => {
								e.stopPropagation();
								this.showPropList(prop);
							}}
						>{prop}
						</div>);
				});

				return (
					<div style={{ position: "absolute", right: -60, top: 0, transform: "translateX(100%)" }}>
						{propList}
						{listedProp && this.renderPropList()}
					</div>
				);
			}
		}

		render() {
			console.log("this.state", this.state);
			return (
				<div
					style={{ position: "relative" }} onClick={(e) => {
						e.stopPropagation();
						this.setState({ propSwitcher: !this.state.propSwitcher });
					}}
				>
					<WrappedComponent {...this.state.props}>
						<div style={{ position: "relative" }}>{this.state.propSwitcher && this.renderPropSwitcher()}</div>
						{this.state.props.children}
					</WrappedComponent>
				</div>
			);
		}
	};
};

export default configurable;
