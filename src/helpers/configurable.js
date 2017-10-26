import React, { Component } from "react";
import { lensProp, set, append, flatten, remove } from "ramda";

const configurable = config => WrappedComponent => {
	return class ConfigurableComponent extends Component {
		state = {
			child: "aa",
			props: {},
			listedProp: undefined,
		}

		componentDidMount() {
			this.setState({ // eslint-disable-line
				props: { ...this.getWrappedComponentProps(), ...this.props },
			});
		}

		getWrappedComponentProps = () => {
			// TODO -> should be possible to add some prop values before rendering the component.
			// because yeah well.. we don't really have a way of accessing the default props of the component, now do we...?
			if (WrappedComponent.propTypes) {
				const keys = Object.keys(WrappedComponent.propTypes);

				return keys.reduce((acc, key) => {
					return {
						...acc,
						[key]: undefined,
						children: "hello",
					};
				}, {});
			}
		}

		removeChild = (id) => {
			console.log("id", id);
			console.log("this.state.props.children", this.state.props.children);
			const newChildren = remove(id, 1, this.state.props.children);
			const propLens = lensProp("children");

			this.setState({
				props: set(propLens, newChildren, this.state.props),
			});
		}

		setPropState = (prop, value) => {
			const propLens = lensProp(prop);
			const NewComponent = prop === "children" && typeof value === "function" ? configurable(config)(value) : undefined;
			const newChildren = flatten(append(NewComponent, [this.state.props.children]));

			const componentTree = flatten(newChildren.filter(c => c).map((Child, i) => {
				if (typeof Child === "object" || typeof Child === "string") {
					return Child;
				}
				return <Child key={i} removeChild={this.removeChild} orderID={i}/>; // eslint-disable-line
			}));

			const propValue = NewComponent ? componentTree : value;

			this.setState({
				props: set(propLens, propValue, this.state.props),
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
					<div
						key={key}
						style={{ padding: 30, border: "4px solid grey" }}
						onClick={(e) => {
							e.stopPropagation();
							this.setPropState(listedProp, components[key]);
						}}
					>
						{key}
					</div>
				);
			});

			return (
				<div>
					<div>
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
						>{"SET"}
						</span>
						{listedProp === "children" && componentList}
					</div>
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
							className="fc-flex-container"
							key={prop}
							onClick={(e) => {
								e.stopPropagation();
								this.showPropList(prop);
							}}
						>
							{prop}
							{listedProp && listedProp === prop && this.renderPropList()}
						</div>);
				});

				return (
					<div
						style={{ position: "fixed",
							zIndex: 99999999,
							textAlign: "left",
							padding: "10px 30px",
							backgroundColor: "white",
							right: 0,
							top: 0,
							width: 500,
							height: "100vh",
							color: "black",
							overflow: "scroll",
						}}
					>
						<div
							onClick={(e) => {
								e.stopPropagation();
							this.props.removeChild(this.props.orderID); // eslint-disable-line
							}}
						>{"delete"}
						</div>
						{propList}
					</div>
				);
			}
		}

		render() {
			const { children, ...restProps } = this.state.props;

			return (
				<div
					style={{ position: "relative", borderLeft: this.state.propSwitcher && "4px solid orange" }} onClick={(e) => {
						e.stopPropagation();
						this.setState({ propSwitcher: !this.state.propSwitcher });
					}}
					ref={c => this.componentRef = c} // eslint-disable-line
				>
					<div style={{ position: "relative" }}>{this.state.propSwitcher && this.renderPropSwitcher()}</div>
					<WrappedComponent {...restProps}>
						{children}
					</WrappedComponent>
				</div>
			);
		}
	};
};

export default configurable;
