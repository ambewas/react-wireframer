/**
 * philosophy
 * ----------
 *
 * the configurable HOC is minimalistic: it exposes the configurable props of your components into
 * a user friendly interface where everyone (designers included) are able to edit the look and feel
 * of your component library.
 *
 * To keep this project frictionless, only string/number props are exposed for now. Technically it
 * should be possible to do the same for functions, objects and arrays. Development of this is
 * on the roadmap, but we want to keep this first version as minimal as possible.
 *
 * Because the HOC works recursively, it even allows the user to create small pieces of a user interface,
 * by exposing the children prop, which can be completed with any of your library's components.
 *
 * Technically, this makes it possible to create an entire wireframing application with only using
 * "configurabled" components. The JSX that one should use for that piece of UI, can then be printed
 * out right from the interface, ready to be dropped in any piece of the application you're developing.
 *
 * The project assumes that you have "zero-configuration rendereable components". The most practical
 * way of achieving this, is by having default props for all of your components (which, as a library
 * developer, you should do as a best practice anyway).
 *
 * i.e. a developer should only have to enter <MyComponent/> in their application, and nothing should
 * crash. A default should always render.
 *
 */



/**
 *
 * todo
 *
 * - HOW THE HELL DO WE START WRITING TESTS FOR THIS?! -- we really should, as it's going to be open sourced...
 *
 * - decouple the configurable component from the nesting system. Still make it possible to nest via children, but a drag/drop system would be better
 *   in fact, drag & drop would automatically fill out the children prop for that particular component.
 *
 * - hide other prop switchers.. in fact, make a decent UI for this entire thing.
 *
 * - add different input types for different prop types
 *
 * - add config object that contains the different prop options. Ideally, we should read this off the proptypes.. but that's not possible for now.
 *   so for example, if it's a oneOf propType -> render a dropdown menu with the choices.
 *
 * - propTypesToObject is unfeasible. It's not possible to get the possible prop types for, e.g., oneOf -- as those just return functions. Impossible to call an evaluation
 *   of proptypes at runtime yourself -- ESPECIALLY since these are not present in a react production bundle. So technically, we CANNOT even rely on propTypes to get the different
 * 	 keys of possible props, unless these are never stripped. This shouldn't be used in a production env anyway, so yeah... guess that might be OK.
 *
 * - another possibility is to use react doc-gen to generate an array of props and prop types from our component folder. This makes the entire project a bit more difficult to
 *   setup, though, as a user. Ideally, you should still JUST have to import this component from NPM & use it in your own projects.
 *
 *   So... why not allow a config object to be passed through and decouple the entire thing. The config input would then be the output of react-docgen &
 *   we can have guides to show people how to generate their component config themselves, without having to add everything in themselves.
 *
 *   Alternatively, we could force people to add another static to their components, that include our own implementation of propTypes, which we can then use
 *   to generate the props. However, this is already a bit much to ask I think. Better would be to just generate the possible props from react-docgen.
 *
 *   OOOOOOOOOOORRRrrr... allow the browser to simply show the proptype warning & possibly extract the text from there...??
 * 		-- tried it, it's impossible.
 *
 * 	 temporary solution -> watch for object & function prop types & don't show these as being configurable.
 *
 * - prettify the UI
 *
 * - possibly split setting 'children' and setting a text node
 */

import React, { Component } from "react";
import uuid from "uuid/v1";
import PropTypes from "prop-types";
import {
	lensPath,
	lensProp,
	view,
	set,
	append,
	flatten,
	reject,
	compose,
} from "ramda";

import {
	safeClick,
	lensById,
	DummyComponent,
	removeFromState,
	addToState,
	updateState,
	getCleanProps,
	printJSX,
} from "./helpers";

import propTypesToObject from "./propTypesToObject";

const configurable = config => WrappedComponent => {
	return class ConfigurableComponent extends Component {
		state = {
			props: {},
			listedProp: undefined,
			textInput: "",
		}

		static defaultProps = {
			id: 1,
			lens: lensById(1),
			removeChild: () => console.error("cannot delete root component"), // eslint-disable-line no-console
		}

		static propTypes = {
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			lens: PropTypes.func,
			removeChild: PropTypes.func,
		}

		componentDidMount() {
			/**
			 * we take the props of the wrapped component and copy them to the state.
			 * from here we can start to do prop manipulation & pass the modified prop state
			 * to the next recursively rendered Configurable component
			 */
			this.setState({ // eslint-disable-line react/no-did-mount-set-state
				props: { children: this.props.children, ...this.getWrappedComponentProps() },
			});
		}

		getWrappedComponentProps = () => {
			if (WrappedComponent.propTypes) {
				const propTypesObject = propTypesToObject({
					propTypes: WrappedComponent.propTypes,
				});

				const keys = Object.keys(WrappedComponent.propTypes);
				const CDummy = configurable(config)(DummyComponent);

				const props =  keys.reduce((acc, key) => {
					// strip all props that are NOT a string or a node. We ignore other props for now.
					const keyToAdd = propTypesObject[key].type === "string" || propTypesObject[key].type === "node" ? { [key]: undefined } : undefined;

					return {
						...acc,
						...keyToAdd,
						children: <CDummy removeChild={this.removeChild} id={0}>{"placeholder"}</CDummy>, // not logging this one to state, because is only dummy to be removed.
					};
				}, {});

				return props;
			}
		}

		removeChild = (id) => {
			const byPropId = (component) => view(lensPath(["props", "id"]), component) === id;
			const propLens = lensProp("children");

			// find the child in componentState and remove it there as well.
			const { lens } = this.props;

			removeFromState(lens, id);

			// component update for representation in the DOM.
			const newChildren = reject(byPropId, this.state.props.children);

			if (Array.isArray(this.state.props.children)) {
				this.setState({
					props: set(propLens, newChildren, this.state.props),
				});
			} else {
				this.setState({
					props: set(propLens, "", this.state.props),
				});
			}
		}

		setPropState = (prop, value) => {
			// TODO -> should we split this up in setting prop values vs children...?
			const propLens = lensProp(prop);
			const { lens } = this.props;

			const NewComponent = prop === "children" && typeof value === "function" ? configurable(config)(value) : undefined;

			const newChildren = compose(
				flatten,
				append(NewComponent)
			)([this.state.props.children]);

			const cleanedProps = getCleanProps(this.state.props);

			const componentTree = newChildren.filter(c => c).map(Child => {
				if (typeof Child === "object" || typeof Child === "string") {
					return Child;
				}

				const uniqueID = uuid();
				const childrenLens = compose(lens, lensProp("children"));
				const deeperLens = compose(childrenLens, lensById(uniqueID));

				// add this specific child to componentState
				addToState(uniqueID, value, childrenLens, cleanedProps);

				return <Child key={uniqueID} removeChild={this.removeChild} id={uniqueID} lens={deeperLens} />;
			});

			// dom state update
			const propValue = NewComponent ? componentTree : value;
			const newProps = set(propLens, propValue, this.state.props);

			this.setState({
				props: newProps,
			}, () => {
				// update component props in componentState
				const newCleanedProps = getCleanProps(this.state.props);

				updateState(this.props.id, lens, newCleanedProps);
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
				const DisplayComponent = components[key];

				return (
					<div
						key={key}
						style={{ padding: 30, border: "4px solid grey" }}
						onClick={safeClick(() => this.setPropState(listedProp, components[key]))}
					>
						<DisplayComponent>{key}</DisplayComponent>
					</div>
				);
			});

			return (
				<div>
					<div>
						<input
							onClick={e => e.stopPropagation()}
							type="text"
							onChange={safeClick((e) => this.setState({ textInput: e.target.value }))}
							value={textInput}
						/>
						<span
							onClick={safeClick(() => this.setPropState(listedProp, textInput))}
						>
							{"SET"}
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
							onClick={safeClick(() => this.showPropList(prop))}
						>
							{prop}
							{listedProp && listedProp === prop && this.renderPropList()}
						</div>
					);
				});
				const buttonStyle = { marginTop: 50, border: "1px solid red", padding: 20 };

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
							boxShadow: "0px 6px 14px black",
						}}
					>
						{propList}
						<div
							style={buttonStyle}
							onClick={safeClick(() => this.props.removeChild(this.props.id))}
						>
							{"delete this component"}
						</div>
						<div
							style={buttonStyle}
							onClick={safeClick(() => printJSX())}
						>
							{"print JSX"}
						</div>
					</div>
				);
			}
		}


		render() {
			const { children, ...restProps } = this.state.props;

			return (
				<div
					style={{ position: "relative", borderLeft: this.state.propSwitcher && "4px solid orange" }}
					onClick={safeClick(() => this.setState({ propSwitcher: !this.state.propSwitcher }))}
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
