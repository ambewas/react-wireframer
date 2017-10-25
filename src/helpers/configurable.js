import React, { Component } from "react";
import { lensProp, set, append } from "ramda";

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

		setPropState = (prop, value) => {
			const propLens = lensProp(prop);
			const NewComponent = prop === "children" ? configurable(config)(value) : undefined;
			const newChildren = append(NewComponent, [this.state.props.children]);
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
					>{key}
					</div>
				);
			});

			return (
				<div >
					{listedProp === "children" ? componentList : (
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
							overflow: "scroll" }}
					>
						{propList}
					</div>
				);
			}
		}

		render() {
			return (
				<div
					style={{ display: "inline-block", position: "relative", borderLeft: this.state.propSwitcher && "4px solid orange" }} onClick={(e) => {
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
