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
		const arrayOrValue = valueType === "array" && inputValue != null ? inputValue.split(",") : inputValue; // eslint-disable-line eqeqeq

		updatePropInHierarchy(inputPath, hierarchyPath, arrayOrValue);
	}

	handleSelectInput = (e, inputPath) => {
		e.stopPropagation();

		const { updatePropInHierarchy, hierarchyPath } = this.props;
		const value = e.target.value;

		updatePropInHierarchy(inputPath, hierarchyPath, value);
	}

	getValueForInputPath = inputPath => {
		const { propInputs } = this.state;
		const { hierarchyPath, hierarchy } = this.props;

		const theComponent = getById(hierarchyPath, hierarchy);
		const theComponentProps = theComponent && theComponent.props;
		const inputPathArray = inputPath.split(".");

		const localValue = view(lensPath(inputPathArray), propInputs);
		const inputValue = localValue == null ? view(lensPath(inputPathArray.slice(1)), theComponentProps) : localValue; // eslint-disable-line

		return inputValue;
	}

	renderSelectBox = (propTypeDefinition, inputPath) => {
		const selectValue = this.getValueForInputPath(inputPath);

		const options = propTypeDefinition.expectedValues;
		const optionsArray = options.map(option => <option key={option} value={option}>{option}</option>);

		return (
			<select name={inputPath} value={selectValue || "default"} onChange={(e) => this.handleSelectInput(e, inputPath)}>
				<option value="default" disabled hidden>select</option>
				{optionsArray}
			</select>
		);
	}

	renderInputBox = (inputPath, inputType, valueType) => {
		const inputValue = this.getValueForInputPath(inputPath);

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
					<div key={keyPath} className="__prop-switcher-input-wrapper">
						<div>{shapeKey}</div>
						<div className="__prop-switcher-shape-style">{this.renderShape(shape[shapeKey].shapeTypes, keyPath)}</div>
					</div>
				);
			}

			return <div key={shapeKey} className="__prop-switcher-input-wrapper">{shapeKey}{this.getInputType(shape[shapeKey], keyPath)}</div>;
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
			return this.getInputType(propTypeDefinition.expectedType, propTypePath);
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
			const className = propTypeDefinitions[propTypeKey].type === "shape" ? "__prop-switcher-shape-style" : undefined;

			return (
				<div key={propTypeKey} className="__prop-switcher-input-wrapper">
					{propTypeKey}
					<div className={className}>{this.getInputType(propTypeDefinitions[propTypeKey], `${hierarchyPath}.${propTypeKey}`)}</div>
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
					className="__prop-switcher"
				>
					<div
						className="__prop-switcher-close-button"
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
