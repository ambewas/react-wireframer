// not really necessary here, and this saves some dependency injection
/* eslint-disable react/prop-types */

import React, { Component } from "react";
import { set, view, lensPath, omit, compose, propEq, keys, filter } from "ramda";
import { getById } from "../helpers/helpers";

class PropSwitcher extends Component {

	constructor(props) {
		super(props);
		// set initial values

		this.state = {
			propInputs: props.propInputs,
			typeSelectorValue: {},
		};
	}

	handlePropInput = (e, inputPath, inputType) => {
		const { updatePropInHierarchy, hierarchyPath } = this.props;

		this.isEnteringValue = true;
		// text-input values update. No need to propagate this in the hierarchy.
		const { propInputs } = this.state;

		const value = inputType === "checkbox" ? e.target.checked : e.target.value;
		const newState = set(lensPath(inputPath.split(".")), value, propInputs);

		this.setState({ propInputs: newState }, () => {
			if (inputType === "checkbox") {
				updatePropInHierarchy(inputPath, hierarchyPath, value);
			}
		});
	}

	handlePropInputBlur = (inputPath, inputValue, valueType) => {
		const { updatePropInHierarchy, hierarchyPath } = this.props;
		const arrayOrValue = valueType === "array" ? inputValue.split(",") : inputValue;

		updatePropInHierarchy(inputPath, hierarchyPath, arrayOrValue);
	}

	handleSelectInput = (e, inputPath) => {
		e.stopPropagation();

		const { updatePropInHierarchy, hierarchyPath } = this.props;
		const value = e.target.value;

		updatePropInHierarchy(inputPath, hierarchyPath, value);
	}

	renderSelectBox = (propTypeDefinition, inputPath) => {
		const { propInputs } = this.state;

		const selectValue = propInputs[inputPath];
		const options = propTypeDefinition.expectedValues;
		const optionsArray = options.map(option => <option key={option} value={option}>{option}</option>);

		return (
			<select name={inputPath} value={selectValue} onChange={(e) => this.handleSelectInput(e, inputPath)}>
				{optionsArray}
			</select>
		);
	}

	renderInputBox = (inputPath, inputType, valueType) => {
		const { propInputs } = this.state;
		const { hierarchyPath, hierarchy } = this.props;

		const theComponentProps = getById(hierarchyPath, hierarchy).props;

		const inputPathArray = inputPath.split(".");

		const inputValue =  view(lensPath(inputPathArray), propInputs) || view(lensPath(inputPathArray.slice(1)), theComponentProps);

		return (
			<div>
				<input
					onClick={e => e.stopPropagation()}
					type={inputType}
					onChange={e => this.handlePropInput(e, inputPath, inputType)}
					onBlur={() => this.handlePropInputBlur(inputPath, inputValue, valueType)}
					// check for null is to avoid going from an uncontrolled to a controlled input
					value={inputValue == null ? "" : inputValue} // eslint-disable-line
					checked={inputType === "checkbox" ? inputValue == null ? "" : inputValue : false} // eslint-disable-line
					name={inputPath}
				/>
			</div>
		);
	}

	renderShape = (shape, deeperKey) => {
		const shapeKeys = Object.keys(shape);

		// loop through the shape and print a select box for each one, with a little bit more marginLeft for every prop...
		const inputs = shapeKeys.map(shapeKey => {
			// build key path to support updates of deeper keys
			const keyPath = deeperKey ? `${deeperKey}.${shapeKey}` : shapeKey;

			if (shape[shapeKey].shapeTypes) {
				return (
					<div key={keyPath} style={{ display: "flex", paddingBottom: 12 }}>
						<div>{shapeKey}</div>
						<div style={{ marginLeft: 20, paddingLeft: 10, borderLeft: "2px solid blue" }}>{this.renderShape(shape[shapeKey].shapeTypes, keyPath)}</div>
					</div>
				);
			}

			return <div key={shapeKey} style={{ display: "flex", paddingBottom: 12  }}>{shapeKey}{this.getInputType(shape[shapeKey], keyPath)}</div>;
		});

		return inputs;
	}

	renderOneOfType = (expectedTypes, propTypePath) => {
		const { typeSelectorValue } = this.state;

		const options = expectedTypes.filter(o => o).map(option => (
			<option key={option.type} value={option.type}>{option.type}</option>
		));

		const selectedType = expectedTypes.find(item => item.type === typeSelectorValue[propTypePath]) || expectedTypes[0];

		return (
			<div>
				<select
					name={propTypePath}
					value={typeSelectorValue.value}
					onChange={(e) => this.setState({ typeSelectorValue: { [propTypePath]: e.target.value } })}
				>
					{options}
				</select>
				{this.getInputType(selectedType, propTypePath)}
			</div>
		);
	}

	getInputType = (propTypeDefinition, propTypePath) => {
		if (propTypeDefinition.type === "enum") {
			// TODO -- must also add value for initialising correctly.
			return this.renderSelectBox(propTypeDefinition, propTypePath);
		}

		if (propTypeDefinition.type === "shape") {
			return this.renderShape(propTypeDefinition.shapeTypes, propTypePath);
		}

		if (propTypeDefinition.type === "oneOfType") {
			return this.renderOneOfType(propTypeDefinition.expectedTypes, propTypePath);
		}

		if (propTypeDefinition.type === "number") {
			return this.renderInputBox(propTypePath, "number");
		}

		if (propTypeDefinition.type === "boolean") {
			return this.renderInputBox(propTypePath, "checkbox");
		}

		if (propTypeDefinition.type === "array") {
			return this.renderInputBox(propTypePath, "text", "array");
		}

		if (propTypeDefinition.type === "arrayOf") {
			console.log("propTypeDefinition", propTypeDefinition);
			return this.getInputType(propTypeDefinition.expectedType, propTypePath, "text");
		}

		return this.renderInputBox(propTypePath, "text");
	}

	renderPropList = () => {
		const { hierarchyPath, propTypeDefinitions } = this.props;

		const cleanedKeys = omit(
			compose(
				keys,
				filter(propEq("type", "function")),
			)(propTypeDefinitions),
			propTypeDefinitions,
		);

		return Object.keys(cleanedKeys).map(propTypeKey => {
			const style = propTypeDefinitions[propTypeKey].type === "shape" ? { marginLeft: 20, paddingLeft: 10, borderLeft: "2px solid blue" } : {};

			return (
				<div key={propTypeKey} style={{ display: "flex", paddingBottom: 12  }}>
					{propTypeKey}
					<div style={style}>{this.getInputType(propTypeDefinitions[propTypeKey], `${hierarchyPath}.${propTypeKey}`)}</div>
				</div>
			);
		});
	}

	render() {
		const { onCloseClick, hierarchyPath, propTypeDefinitions } = this.props;

		if (propTypeDefinitions && hierarchyPath) {
			const propList = this.renderPropList();

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
					<div
						style={{ position: "absolute", right: 0, top: 0, border: "1px solid red", padding: 12, margin: 20, cursor: "pointer" }}
						// close the panel
						onClick={onCloseClick}
					>
						X
					</div>
					active component hash: {hierarchyPath}
					{propList}
				</div>
			);
		}
	}
}

export default PropSwitcher;
