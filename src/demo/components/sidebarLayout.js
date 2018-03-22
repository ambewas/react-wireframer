import React from "react";

const SidebarLayout = ({ left, right }) => (
	<div style={{ display: "flex" }}>
		<div style={{ border: "2px solid blue" }}>{left}</div>
		<div style={{ border: "2px solid green" }}>{right}</div>
	</div>
);

export default SidebarLayout;
