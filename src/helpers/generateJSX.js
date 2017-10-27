

const getElementString = (element, children) => `<${element}>${children.join("")}</${element}>`;

const generateJSX = (json) => {
	console.log("json", json);
	return json.map((jsonElement) => {
		console.log("jsonElement", jsonElement);
		const element = jsonElement.type;

		const elementString = getElementString(element, generateJSX(jsonElement.children));

		return elementString;
	});
};

export default generateJSX;
