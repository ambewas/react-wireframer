import configurable from "./configurable";
import Button from "../components/button";
import Row from "../components/row";
import ClassComponent from "../components/class";

const config = {
	components: {
		Row,
		Button,
		ClassComponent,
	},
};

export default configurable(config);
