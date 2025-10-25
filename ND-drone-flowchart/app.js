/* global cytoscape, dagre */

// Initialize Cytoscape with Dagre layout extension
cytoscape.use(cytoscapeDagre);

// Create the main graph instance
const cy = cytoscape({
	container: document.getElementById("cy"),
	style: [
		// Node styling
		{
			selector: "node",
			style: {
				shape: "round-rectangle",
				"background-color": "#2c3654",
				"border-color": "#4e5d87",
				"border-width": 2,
				label: "data(label)",
				"text-wrap": "wrap",
				"text-max-width": 180,
				color: "#e6e8ee",
				"font-size": 14,
				"text-valign": "center",
				"text-halign": "center",
				padding: "10px",
			},
		},
		// Allow nodes to override shape via data attribute
		{ selector: "node[shape]", style: { shape: "data(shape)" } },
		// Edge styling with arrows
		{
			selector: "edge",
			style: {
				"curve-style": "bezier",
				"line-color": "#7e8aa6",
				width: 2,
				"target-arrow-shape": "triangle",
				"target-arrow-color": "#7e8aa6",
				label: "data(label)",
				"text-wrap": "wrap",
				"text-max-width": 160,
				"font-size": 12,
				color: "#cfd5e6",
			},
		},
	],
	layout: { name: "grid" },
});

// Helper function for cleaner DOM queries
const $ = (id) => document.getElementById(id);

// Add a new node with random ID
$("btnAddNode").onclick = () => {
	const id = "n" + Math.random().toString(36).slice(2, 7);
	cy.add({
		group: "nodes",
		data: { id, label: "New node", shape: $("shapeSelect").value },
		position: { x: 100, y: 100 },
	});
};

// Delete selected elements (nodes or edges)
$("btnDelete").onclick = () => cy.$(":selected").remove();

// Apply automatic hierarchical layout using Dagre
$("btnLayout").onclick = () => cy.layout({ name: "dagre", padding: 20 }).run();

// Apply changes from inspector to selected element
$("btnApply").onclick = () => {
	const sel = cy.$(":selected");
	if (sel.length) {
		const ele = sel[0];
		ele.data("label", $("labelInput").value);
		// Only nodes can have shape and size changes
		if (ele.isNode()) {
			ele.data("shape", $("shapeSelect").value);
			ele.style({
				width: $("nodeWidth").value,
				height: $("nodeHeight").value,
			});
		}
	}
};

// Adjust text wrapping width for all nodes dynamically
$("textWidth").oninput = () => {
	const max = parseInt($("textWidth").value, 10) || 180;
	cy.style().selector("node").style("text-max-width", max).update();
};

// Export current flowchart as JSON file
$("btnExport").onclick = () => {
	const json = cy.json().elements;
	const blob = new Blob([JSON.stringify(json, null, 2)], {
		type: "application/json",
	});
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "flowchart.json";
	a.click();
};

// Import flowchart from JSON file
$("importFile").onchange = async (e) => {
	const file = e.target.files[0];
	if (!file) return;
	const text = await file.text();
	cy.elements().remove();
	cy.add(JSON.parse(text));
	cy.fit();
};

// Load sample flowchart demonstrating safety argument structure
$("btnLoadSample").onclick = async () => {
	const res = await fetch("./sample.json");
	const els = await res.json();
	cy.elements().remove();
	cy.add(els);
	cy.layout({ name: "dagre" }).run();
};
