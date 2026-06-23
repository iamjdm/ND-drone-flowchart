/* global cytoscape, dagre, cytoscapeDagre, LZString */

cytoscape.use(cytoscapeDagre);

// ---------- Constants ----------
const GRID_SIZE = 20;
const MAX_HISTORY = 50;

// ---------- GSN node definitions ----------
const GSN_TYPES = {
	"gsn-goal":         { shape: "rectangle",     bg: "#1b3353", border: "#4a90d9", borderStyle: "solid" },
	"gsn-strategy":     { shape: "barrel",         bg: "#1e3520", border: "#4caf50", borderStyle: "solid" },
	"gsn-solution":     { shape: "ellipse",        bg: "#3a1f1f", border: "#ef5350", borderStyle: "solid" },
	"gsn-context":      { shape: "round-rectangle",bg: "#2a1f3a", border: "#ab47bc", borderStyle: "solid" },
	"gsn-assumption":   { shape: "ellipse",        bg: "#1f2a3a", border: "#7e8aa6", borderStyle: "dashed" },
	"gsn-justification":{ shape: "ellipse",        bg: "#1f2a3a", border: "#aab4c8", borderStyle: "dotted" },
};

// Auto-numbering for GSN nodes (G1, S1, Sn1, C1, A1, J1)
const GSN_PREFIX = {
	"gsn-goal": "G", "gsn-strategy": "S", "gsn-solution": "Sn",
	"gsn-context": "C", "gsn-assumption": "A", "gsn-justification": "J",
};
const gsnCounters = { "gsn-goal":0,"gsn-strategy":0,"gsn-solution":0,"gsn-context":0,"gsn-assumption":0,"gsn-justification":0 };

// ---------- ERD node definitions ----------
const ERD_TYPES = {
	"erd-entity":       { shape: "rectangle", bg: "#1e2838", border: "#4a90d9" },
	"erd-relationship": { shape: "diamond",   bg: "#2d1f0f", border: "#ff9800" },
	"erd-attribute":    { shape: "ellipse",   bg: "#1a2a1a", border: "#4caf50" },
};

// Auto-numbering for ERD nodes (E1, R1, A1)
const ERD_PREFIX = { "erd-entity": "E", "erd-relationship": "R", "erd-attribute": "Attr" };
const erdCounters = { "erd-entity":0, "erd-relationship":0, "erd-attribute":0 };

// Returns next label for typed nodes ("G1", "E2", etc.)
function nextLabel(type) {
	if (GSN_PREFIX[type] !== undefined) return GSN_PREFIX[type] + ++gsnCounters[type];
	if (ERD_PREFIX[type] !== undefined) return ERD_PREFIX[type] + ++erdCounters[type];
	return "Node";
}

// Scan existing nodes to sync counters after import / load
function syncCounters() {
	cy.nodes().forEach((node) => {
		const type = node.data("nodeType");
		if (!type) return;
		if (GSN_PREFIX[type]) {
			const id = node.data("gsnId") || "";
			const prefix = GSN_PREFIX[type];
			if (id.startsWith(prefix)) {
				const n = parseInt(id.slice(prefix.length), 10);
				if (!isNaN(n)) gsnCounters[type] = Math.max(gsnCounters[type], n);
			}
		}
		if (ERD_PREFIX[type]) {
			const label = node.data("entityName") || node.data("label") || "";
			const prefix = ERD_PREFIX[type];
			if (label.startsWith(prefix)) {
				const n = parseInt(label.slice(prefix.length), 10);
				if (!isNaN(n)) erdCounters[type] = Math.max(erdCounters[type], n);
			}
		}
	});
}

// ---------- GSN label builder ----------
function buildGSNLabel(node) {
	const id    = node.data("gsnId")    || "";
	const claim = (node.data("gsnClaim") || "").trim();
	const base  = claim ? `${id}\n${"─".repeat(16)}\n${claim}` : id;
	return node.data("undeveloped") ? `${base}\n⬦` : base;
}

// ---------- ERD label builder ----------
function buildERDLabel(node) {
	const name   = node.data("entityName") || "Entity";
	const fields = node.data("fields") || [];
	if (!fields.length) return name;
	const rows = fields.map((f) => `${f.pk ? "PK  " : "      "}${f.name} : ${f.type}`);
	return [name, "─".repeat(22), ...rows].join("\n");
}

// ---------- Cytoscape styles ----------
function buildStyles() {
	const s = [
		{
			selector: "node",
			style: {
				shape: "round-rectangle",
				"background-color": "#2c3654",
				"border-color": "#4e5d87",
				"border-width": 2,
				"border-style": "solid",
				label: "data(label)",
				"text-wrap": "wrap",
				"text-max-width": 150,
				color: "#e6e8ee",
				"font-size": 13,
				"text-valign": "center",
				"text-halign": "center",
				"height": "label",
				padding: "14px",
			},
		},
		{ selector: "node[shape]",   style: { shape: "data(shape)" } },
		{ selector: "node.edge-source", style: { "border-color": "#6ea8fe", "border-width": 4 } },
		{ selector: "node:selected",    style: { "border-color": "#6ea8fe", "border-width": 3 } },
		{
			selector: "edge",
			style: {
				"curve-style": "bezier",
				"line-color": "#7e8aa6",
				"line-style": "solid",
				width: 2,
				"target-arrow-shape": "triangle",
				"target-arrow-color": "#7e8aa6",
				label: "data(label)",
				"text-wrap": "wrap",
				"text-max-width": 160,
				"font-size": 11,
				color: "#cfd5e6",
				"text-background-color": "#0f1115",
				"text-background-opacity": 0.75,
				"text-background-padding": "3px",
				"text-background-shape": "roundrectangle",
			},
		},
		{ selector: "edge[lineStyle]",  style: { "line-style": "data(lineStyle)" } },
		{ selector: "edge[arrowShape]", style: { "target-arrow-shape": "data(arrowShape)" } },
		{ selector: "edge[lineColor]",  style: { "line-color": "data(lineColor)", "target-arrow-color": "data(lineColor)" } },
		{ selector: "edge[curveStyle]", style: { "curve-style": "data(curveStyle)" } },
		{ selector: "edge:selected",    style: { "line-color": "#6ea8fe", "target-arrow-color": "#6ea8fe" } },
	];

	// GSN type styles
	for (const [type, def] of Object.entries(GSN_TYPES)) {
		s.push({
			selector: `node[nodeType='${type}']`,
			style: { shape: def.shape, "background-color": def.bg, "border-color": def.border, "border-width": 2, "border-style": def.borderStyle },
		});
	}

	// GSN goal: wider text for claim content
	s.push({ selector: "node[nodeType='gsn-goal']", style: { "text-max-width": 200, "font-size": 12 } });

	// GSN undeveloped goal: dashed amber border
	s.push({
		selector: "node[nodeType='gsn-goal'][?undeveloped]",
		style: { "border-style": "dashed", "border-color": "#ffb300", "border-width": 3 },
	});
	// Restore selection ring on top of undeveloped amber border
	s.push({
		selector: "node[nodeType='gsn-goal'][?undeveloped]:selected",
		style: { "border-color": "#6ea8fe", "border-width": 3 },
	});

	// ERD type styles
	s.push({ selector: "node[nodeType='erd-entity']",       style: { shape: "rectangle", "background-color": "#1e2838", "border-color": "#4a90d9", "border-width": 2, "text-valign": "top", "text-margin-y": 8 } });
	s.push({ selector: "node[nodeType='erd-relationship']", style: { shape: "diamond",   "background-color": "#2d1f0f", "border-color": "#ff9800", "border-width": 2 } });
	s.push({ selector: "node[nodeType='erd-attribute']",    style: { shape: "ellipse",   "background-color": "#1a2a1a", "border-color": "#4caf50", "border-width": 2 } });

	// User-set color overrides type defaults (must be last)
	s.push({ selector: "node[bgColor]", style: { "background-color": "data(bgColor)" } });

	return s;
}

// ---------- Cytoscape instance ----------
const cy = cytoscape({ container: document.getElementById("cy"), style: buildStyles(), layout: { name: "grid" } });

// ---------- DOM helpers ----------
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

// ---------- Mode ----------
let currentMode = "flowchart";

function setMode(mode, skipConfirm = false) {
	if (mode === currentMode) return;
	if (!skipConfirm && cy.elements().length > 0) {
		if (!confirm(`Switch to ${mode.toUpperCase()} mode? The canvas will be cleared.`)) return;
	}
	currentMode = mode;
	cy.elements().remove();
	hist.reset();
	updateModeUI();
	hist.save();
}

function updateModeUI() {
	document.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === currentMode));
	["optFlowchart","optERD","optGSN"].forEach(hide);
	({ flowchart:"optFlowchart", erd:"optERD", gsn:"optGSN" })[currentMode] && show(({ flowchart:"optFlowchart", erd:"optERD", gsn:"optGSN" })[currentMode]);
	$("footerMode").textContent = { flowchart:"Flowchart Mode", erd:"ERD Mode", gsn:"GSN / Safety Case Mode" }[currentMode];
	updateInspector();
}

document.querySelectorAll(".mode-btn").forEach((b) => { b.onclick = () => setMode(b.dataset.mode); });

// ---------- History ----------
const hist = {
	stack: [], idx: -1,
	reset() { this.stack = []; this.idx = -1; syncUndoButtons(); },
	save() {
		this.stack = this.stack.slice(0, this.idx + 1);
		this.stack.push(JSON.stringify(cy.json().elements));
		if (this.stack.length > MAX_HISTORY) this.stack.shift();
		this.idx = this.stack.length - 1;
		syncUndoButtons();
		autosave();
	},
	undo() { if (this.idx > 0) { this.idx--; this._apply(); } },
	redo() { if (this.idx < this.stack.length - 1) { this.idx++; this._apply(); } },
	_apply() { cy.elements().remove(); cy.add(JSON.parse(this.stack[this.idx])); syncUndoButtons(); updateInspector(); scheduleSnapshot(200); },
};

function syncUndoButtons() {
	$("btnUndo").disabled = hist.idx <= 0;
	$("btnRedo").disabled = hist.idx >= hist.stack.length - 1;
}

$("btnUndo").onclick = () => hist.undo();
$("btnRedo").onclick = () => hist.redo();

// ---------- Keyboard shortcuts ----------
document.addEventListener("keydown", (e) => {
	const tag = document.activeElement.tagName;
	const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

	if (e.key === "Escape") {
		document.body.classList.remove("presenting");
		exitEdgeMode();
		return;
	}
	if (isInput) return;
	if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); hist.undo(); }
	else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); hist.redo(); }
	else if (e.key === "Delete") { cy.$(":selected").remove(); hist.save(); }
});

// ---------- Snap-to-grid ----------
let snapEnabled = false;

$("btnGrid").onclick = () => {
	snapEnabled = !snapEnabled;
	$("btnGrid").classList.toggle("active", snapEnabled);
	document.getElementById("cy").classList.toggle("snap-grid", snapEnabled);
	refreshGridBg();
	drawMinimap();
};

function refreshGridBg() {
	const el = document.getElementById("cy");
	if (!snapEnabled) { el.style.backgroundImage = ""; return; }
	const pan = cy.pan(), zoom = cy.zoom(), size = GRID_SIZE * zoom;
	el.style.backgroundImage = "linear-gradient(to right,#1a1e2a 1px,transparent 1px),linear-gradient(to bottom,#1a1e2a 1px,transparent 1px)";
	el.style.backgroundSize  = `${size}px ${size}px`;
	el.style.backgroundPosition = `${pan.x % size}px ${pan.y % size}px`;
}

cy.on("pan zoom", refreshGridBg);
cy.on("dragfree", "node", (e) => {
	if (!snapEnabled) return;
	const pos = e.target.position();
	e.target.position({ x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE, y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE });
	hist.save();
});

// ---------- Viewport center ----------
function viewportCenter() {
	const pan = cy.pan(), zoom = cy.zoom();
	return { x: (cy.width() / 2 - pan.x) / zoom, y: (cy.height() / 2 - pan.y) / zoom };
}

// ---------- Add nodes ----------

// Generic flowchart node
$("btnAddNode").onclick = () => {
	cy.add({ group:"nodes", data:{ id:"n"+Math.random().toString(36).slice(2,7), label:"New Node", shape:$("shapeSelect").value }, position:viewportCenter() });
	hist.save();
};

// ERD typed nodes
document.querySelectorAll("[data-erd-add]").forEach((btn) => {
	btn.onclick = () => {
		const type = btn.dataset.erdAdd;
		const id   = "n" + Math.random().toString(36).slice(2, 7);
		const label = nextLabel(type);
		const data  = { id, nodeType: type, label };
		if (type === "erd-entity") { data.fields = []; data.entityName = label; }
		cy.add({ group:"nodes", data, position:viewportCenter() });
		hist.save();
	};
});

// GSN typed nodes — auto-ID (G1, S1, Sn1...) + empty claim
document.querySelectorAll("[data-gsn-add]").forEach((btn) => {
	btn.onclick = () => {
		const type  = btn.dataset.gsnAdd;
		const id    = "n" + Math.random().toString(36).slice(2, 7);
		const gsnId = nextLabel(type);
		cy.add({
			group: "nodes",
			data: { id, nodeType: type, gsnId, gsnClaim: "", label: gsnId },
			position: viewportCenter(),
			style: { width: 200 },
		});
		hist.save();
	};
});

// ---------- Edge creation ----------
let edgeMode = false, edgeSource = null;

function enterEdgeMode() { edgeMode = true; edgeSource = null; $("btnAddEdge").classList.add("active"); document.getElementById("cy").style.cursor = "crosshair"; }
function exitEdgeMode() {
	edgeMode = false;
	if (edgeSource) { edgeSource.removeClass("edge-source"); edgeSource = null; }
	$("btnAddEdge").classList.remove("active");
	document.getElementById("cy").style.cursor = "";
}

$("btnAddEdge").onclick = () => edgeMode ? exitEdgeMode() : enterEdgeMode();

cy.on("tap", "node", (e) => {
	if (!edgeMode) return;
	const node = e.target;
	if (!edgeSource) { edgeSource = node; node.addClass("edge-source"); }
	else if (edgeSource.id() !== node.id()) {
		cy.add({ group:"edges", data:{ id:"e"+Math.random().toString(36).slice(2,7), source:edgeSource.id(), target:node.id(), label:"" } });
		exitEdgeMode();
		hist.save();
	}
});

$("btnDelete").onclick = () => { cy.$(":selected").remove(); hist.save(); };
$("btnLayout").onclick = () => { cy.layout({ name:"dagre", padding:20 }).run(); hist.save(); };
$("textWidth").oninput  = () => { cy.style().selector("node").style("text-max-width", parseInt($("textWidth").value,10)||180).update(); };

// ---------- Inspector ----------
let labelDebounce;

function updateInspector() {
	const sel = cy.$(":selected");
	["inspEmpty","inspLabel","inspGSNLabel","inspNode","inspGSN","inspEdge","inspERD","inspMulti","cardinalityRow"].forEach(hide);

	if (sel.length === 0) { show("inspEmpty"); return; }
	if (sel.length > 1)  { show("inspMulti"); $("multiInfo").textContent = `${sel.length} elements selected`; return; }

	const ele      = sel[0];
	const nodeType = ele.isNode() ? ele.data("nodeType") : null;
	const isGSN    = nodeType && nodeType.startsWith("gsn-");
	const isERD    = nodeType && nodeType.startsWith("erd-");

	if (ele.isNode()) {
		// Label area
		if (isGSN) {
			show("inspGSNLabel");
			$("gsnIdInput").value    = ele.data("gsnId")    || "";
			$("gsnClaimInput").value = ele.data("gsnClaim") || "";
			if (nodeType === "gsn-goal") { show("inspGSN"); $("chkUndeveloped").checked = !!ele.data("undeveloped"); }
		} else {
			show("inspLabel");
			$("labelInput").value = nodeType === "erd-entity" ? (ele.data("entityName") || "") : (ele.data("label") || "");
		}

		show("inspNode");

		// Color — show type default or user override
		const typeBg = (isGSN && GSN_TYPES[nodeType]?.bg) || (isERD && ERD_TYPES[nodeType]?.bg) || "#2c3654";
		$("nodeColor").value = ensureHex(ele.data("bgColor") || typeBg);

		// Shape row only for generic flowchart nodes
		if (isGSN || isERD) { hide("shapeRow"); }
		else { show("shapeRow"); $("inspShape").value = ele.data("shape") || "round-rectangle"; }

		$("nodeWidth").value = parseInt(ele.style("width"), 10) || 160;

		if (nodeType === "erd-entity") { show("inspERD"); renderERDFields(ele); }
	} else {
		// Edge
		show("inspLabel");
		$("labelInput").value    = ele.data("label") || "";
		show("inspEdge");
		$("edgeRoute").value     = ele.data("curveStyle") || "bezier";
		$("edgeStyle").value     = ele.data("lineStyle")  || "solid";
		$("edgeArrow").value     = ele.data("arrowShape") || "triangle";
		$("edgeColor").value     = ensureHex(ele.data("lineColor") || "#7e8aa6");
		if (currentMode === "erd") { show("cardinalityRow"); $("edgeCardinality").value = ele.data("cardinality") || ""; }
	}
}

cy.on("select unselect", updateInspector);

// Live: generic label
$("labelInput").oninput = () => {
	const sel = cy.$(":selected");
	if (sel.length !== 1) return;
	const ele = sel[0], val = $("labelInput").value;
	if (ele.isNode() && ele.data("nodeType") === "erd-entity") {
		ele.data("entityName", val);
		ele.data("label", buildERDLabel(ele));
	} else {
		ele.data("label", val);
	}
	clearTimeout(labelDebounce);
	labelDebounce = setTimeout(() => hist.save(), 500);
};

// Live: GSN node ID
$("gsnIdInput").oninput = () => {
	const sel = cy.$(":selected").filter("node");
	if (!sel.length) return;
	sel[0].data("gsnId", $("gsnIdInput").value);
	sel[0].data("label", buildGSNLabel(sel[0]));
	clearTimeout(labelDebounce);
	labelDebounce = setTimeout(() => hist.save(), 500);
};

// Live: GSN claim
$("gsnClaimInput").oninput = () => {
	const sel = cy.$(":selected").filter("node");
	if (!sel.length) return;
	sel[0].data("gsnClaim", $("gsnClaimInput").value);
	sel[0].data("label", buildGSNLabel(sel[0]));
	clearTimeout(labelDebounce);
	labelDebounce = setTimeout(() => hist.save(), 500);
};

// Undeveloped toggle
$("chkUndeveloped").onchange = () => {
	const sel = cy.$(":selected").filter("node");
	if (!sel.length) return;
	const node = sel[0];
	node.data("undeveloped", $("chkUndeveloped").checked);
	node.data("label", buildGSNLabel(node));
	hist.save();
};

// Live: node color
$("nodeColor").oninput = () => {
	const sel = cy.$(":selected").filter("node");
	if (sel.length !== 1) return;
	sel.data("bgColor", $("nodeColor").value);
	hist.save();
};

// Live: node shape
$("inspShape").onchange = () => {
	const sel = cy.$(":selected").filter("node");
	if (sel.length !== 1) return;
	sel.data("shape", $("inspShape").value);
	hist.save();
};

// Live: node size
$("nodeWidth").oninput  = () => {
	const n = cy.$(":selected").filter("node");
	if (n.length !== 1) return;
	const w = parseInt($("nodeWidth").value) || 160;
	n.style("width", w);
	n.style("text-max-width", w - 28);
};
$("nodeWidth").onchange = () => hist.save();

// Live: edge controls
$("edgeRoute").onchange = () => {
	const sel = cy.$(":selected").filter("edge");
	if (!sel.length) return;
	sel.data("curveStyle", $("edgeRoute").value);
	hist.save();
};
$("edgeStyle").onchange = () => {
	const sel = cy.$(":selected").filter("edge");
	if (!sel.length) return;
	sel.data("lineStyle", $("edgeStyle").value);
	hist.save();
};
$("edgeArrow").onchange = () => {
	const sel = cy.$(":selected").filter("edge");
	if (!sel.length) return;
	sel.data("arrowShape", $("edgeArrow").value);
	hist.save();
};
$("edgeColor").oninput = () => {
	const sel = cy.$(":selected").filter("edge");
	if (!sel.length) return;
	sel.data("lineColor", $("edgeColor").value);
	hist.save();
};
$("edgeCardinality").onchange = () => {
	const sel = cy.$(":selected").filter("edge");
	if (!sel.length) return;
	const val = $("edgeCardinality").value;
	sel[0].data("cardinality", val);
	sel[0].data("label", val);
	$("labelInput").value = val;
	hist.save();
};

// Bulk color
$("btnApplyMulti").onclick = () => { cy.$(":selected").filter("node").data("bgColor", $("multiColor").value); hist.save(); };

// ---------- ERD field editor ----------
function renderERDFields(node) {
	const fields    = node.data("fields") || [];
	const container = $("erdFields");
	container.innerHTML = "";
	fields.forEach((f, i) => {
		const row = document.createElement("div");
		row.className = "erd-field-row";
		const pk   = Object.assign(document.createElement("input"), { type:"checkbox", title:"PK", checked:f.pk });
		const name = Object.assign(document.createElement("input"), { type:"text", value:f.name, placeholder:"field" });
		const type = Object.assign(document.createElement("input"), { type:"text", value:f.type, placeholder:"type" });
		const del  = Object.assign(document.createElement("button"), { className:"f-del", textContent:"×" });
		pk.onchange   = () => patchField(node, i, { pk: pk.checked });
		name.oninput  = () => patchField(node, i, { name: name.value });
		type.oninput  = () => patchField(node, i, { type: type.value });
		del.onclick   = () => {
			const flds = [...(node.data("fields") || [])];
			flds.splice(i, 1);
			node.data("fields", flds);
			node.data("label", buildERDLabel(node));
			renderERDFields(node);
			hist.save();
		};
		row.append(pk, name, type, del);
		container.appendChild(row);
	});
}

function patchField(node, i, patch) {
	const flds = [...(node.data("fields") || [])];
	flds[i] = { ...flds[i], ...patch };
	node.data("fields", flds);
	node.data("label", buildERDLabel(node));
	clearTimeout(labelDebounce);
	labelDebounce = setTimeout(() => hist.save(), 500);
}

$("btnAddField").onclick = () => {
	const sel = cy.$(":selected").filter("node");
	if (!sel.length) return;
	const node = sel[0];
	const flds = [...(node.data("fields") || [])];
	flds.push({ name:"field", type:"varchar", pk:false });
	node.data("fields", flds);
	node.data("label", buildERDLabel(node));
	renderERDFields(node);
	hist.save();
};

// ---------- Export: JSON ----------
$("btnExportJSON").onclick = () => {
	const blob = new Blob([JSON.stringify({ mode:currentMode, elements:cy.json().elements }, null, 2)], { type:"application/json" });
	const url  = URL.createObjectURL(blob);
	const a    = Object.assign(document.createElement("a"), { href:url, download:"diagram.json" });
	a.click();
	URL.revokeObjectURL(url);
};

// Export: PNG (2× scale, dark background)
$("btnExportPNG").onclick = () => {
	const dataUrl = cy.png({ scale:2, bg:"#0f1115", full:true });
	const a = Object.assign(document.createElement("a"), { href:dataUrl, download:"diagram.png" });
	a.click();
};

// Export: SVG (via cytoscape-svg plugin, graceful fallback)
$("btnExportSVG").onclick = () => {
	try {
		const svgStr = cy.svg({ scale:1, bg:"#0f1115", full:true });
		const blob   = new Blob([svgStr], { type:"image/svg+xml" });
		const url    = URL.createObjectURL(blob);
		const a      = Object.assign(document.createElement("a"), { href:url, download:"diagram.svg" });
		a.click();
		URL.revokeObjectURL(url);
	} catch (e) {
		alert("SVG export unavailable — the cytoscape-svg plugin may not have loaded. Try PNG instead.");
		console.error("SVG export:", e);
	}
};

// ---------- Import ----------
$("importFile").onchange = async (e) => {
	const file = e.target.files[0];
	if (!file) return;
	try {
		const data = JSON.parse(await file.text());
		if (Array.isArray(data)) { cy.elements().remove(); cy.add(data); }
		else { if (data.mode && data.mode !== currentMode) setMode(data.mode, true); cy.elements().remove(); cy.add(data.elements); }
		cy.fit();
		syncCounters();
		hist.save();
		scheduleSnapshot(400);
	} catch (err) { alert("Import failed: " + err.message); }
	e.target.value = "";
};

// ---------- Shareable link ----------
$("btnShare").onclick = () => {
	const payload    = JSON.stringify({ mode:currentMode, elements:cy.json().elements });
	const compressed = LZString.compressToEncodedURIComponent(payload);
	const url        = `${location.origin}${location.pathname}#d=${compressed}`;
	navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!")).catch(() => prompt("Copy this link:", url));
};

// Load shared diagram from URL hash
window.addEventListener("load", () => {
	const hash = location.hash;
	if (hash.startsWith("#d=")) {
		try {
			const data = JSON.parse(LZString.decompressFromEncodedURIComponent(hash.slice(3)));
			if (data.mode) setMode(data.mode, true);
			cy.elements().remove();
			cy.add(data.elements);
			cy.fit();
			syncCounters();
			hist.reset();
		} catch (err) { console.warn("Could not load shared diagram:", err); }
	} else {
		// Offer to restore autosaved session
		try {
			const saved = localStorage.getItem("nd-studio-autosave");
			if (saved) {
				const data = JSON.parse(saved);
				if (data.elements?.nodes?.length > 0 && confirm("Restore your last auto-saved session?")) {
					if (data.mode) setMode(data.mode, true);
					cy.elements().remove();
					cy.add(data.elements);
					cy.fit();
					syncCounters();
					hist.reset();
				}
			}
		} catch (err) { /* localStorage unavailable */ }
	}
	hist.save();
	scheduleSnapshot(500);
});

// ---------- Load sample ----------
$("btnLoadSample").onclick = async () => {
	if (cy.elements().length > 0 && !confirm("Load sample? This will clear the canvas.")) return;
	const raw = await (await fetch("./sample.json")).json();
	const data = Array.isArray(raw) ? { elements: raw } : raw;
	if (data.mode && data.mode !== currentMode) setMode(data.mode, true);
	cy.elements().remove();
	cy.add(data.elements);
	cy.layout({ name:"dagre", padding:30, rankDir:"TB" }).run();
	syncCounters();
	hist.save();
	scheduleSnapshot(400);
};

// ---------- Presentation mode ----------
$("btnPresent").onclick     = () => { document.body.classList.add("presenting");    cy.fit(); };
$("btnExitPresent").onclick = () => { document.body.classList.remove("presenting"); };

// ---------- Minimap ----------
const mmCanvas = document.getElementById("minimap");
const mmCtx    = mmCanvas.getContext("2d");
const MM_W = 180, MM_H = 115;
const MM_DPR = window.devicePixelRatio || 1;
mmCanvas.width        = MM_W * MM_DPR;
mmCanvas.height       = MM_H * MM_DPR;
mmCanvas.style.width  = MM_W + "px";
mmCanvas.style.height = MM_H + "px";
mmCtx.scale(MM_DPR, MM_DPR);

let _mmImg   = null;
let _mmBB    = null;
let _mmTimer;

// Compute the thumbnail's draw rect inside the canvas (aspect-ratio preserving)
function mmLayout() {
	if (!_mmBB) return null;
	const bbW = _mmBB.x2 - _mmBB.x1, bbH = _mmBB.y2 - _mmBB.y1;
	if (!bbW || !bbH) return null;
	const aspect = bbW / bbH;
	let drawW, drawH, ox, oy;
	if (aspect > MM_W / MM_H) {
		drawW = MM_W; drawH = MM_W / aspect; ox = 0; oy = (MM_H - drawH) / 2;
	} else {
		drawH = MM_H; drawW = MM_H * aspect; oy = 0; ox = (MM_W - drawW) / 2;
	}
	return { drawW, drawH, ox, oy, bbW, bbH };
}

// Rebuild the graph thumbnail — called after structural changes
function snapshotMinimap() {
	const eles = cy.elements();
	if (!eles.length) { _mmImg = null; _mmBB = null; drawMinimap(); return; }
	_mmBB = eles.boundingBox();
	const bbW = _mmBB.x2 - _mmBB.x1, bbH = _mmBB.y2 - _mmBB.y1;
	// Scale so the rendered image matches the minimap's physical pixel size — no upscaling, no blur
	const pxScale = Math.min((MM_W * MM_DPR) / bbW, (MM_H * MM_DPR) / bbH);
	const url = cy.png({ scale: Math.max(pxScale, 0.1), bg: "#0f1115", full: true });
	const img = new Image();
	img.onload = () => { _mmImg = img; drawMinimap(); };
	img.src = url;
}

// Draw thumbnail + live viewport rectangle — cheap, runs on every pan/zoom
function drawMinimap() {
	mmCtx.clearRect(0, 0, MM_W, MM_H);
	const L = mmLayout();
	if (!L || !_mmImg) return;
	const { drawW, drawH, ox, oy, bbW, bbH } = L;

	mmCtx.drawImage(_mmImg, ox, oy, drawW, drawH);

	// Grid overlay (only when snap-to-grid is active)
	if (snapEnabled) {
		const cellPx = GRID_SIZE / bbW * drawW;
		if (cellPx >= 2) {
			// First grid line >= bb.x1 / bb.y1 in graph coords, mapped to minimap pixels
			const firstGX = Math.ceil(_mmBB.x1 / GRID_SIZE) * GRID_SIZE;
			const firstGY = Math.ceil(_mmBB.y1 / GRID_SIZE) * GRID_SIZE;
			const startX  = ox + (firstGX - _mmBB.x1) / bbW * drawW;
			const startY  = oy + (firstGY - _mmBB.y1) / bbH * drawH;
			mmCtx.strokeStyle = "rgba(255, 255, 255, 0.09)";
			mmCtx.lineWidth   = 0.5;
			mmCtx.beginPath();
			for (let x = startX; x <= ox + drawW; x += cellPx) { mmCtx.moveTo(x, oy); mmCtx.lineTo(x, oy + drawH); }
			for (let y = startY; y <= oy + drawH; y += cellPx) { mmCtx.moveTo(ox, y); mmCtx.lineTo(ox + drawW, y); }
			mmCtx.stroke();
		}
	}

	// Viewport indicator
	const zoom = cy.zoom(), pan = cy.pan();
	const vpL = -pan.x / zoom,              vpT = -pan.y / zoom;
	const vpR = vpL + cy.width() / zoom,    vpB = vpT + cy.height() / zoom;

	const rx = ox + (vpL - _mmBB.x1) / bbW * drawW;
	const ry = oy + (vpT - _mmBB.y1) / bbH * drawH;
	const rw =      (vpR - vpL)       / bbW * drawW;
	const rh =      (vpB - vpT)       / bbH * drawH;

	mmCtx.fillStyle   = "rgba(110, 168, 254, 0.12)";
	mmCtx.strokeStyle = "rgba(110, 168, 254, 0.85)";
	mmCtx.lineWidth   = 1.5;
	mmCtx.fillRect(rx, ry, rw, rh);
	mmCtx.strokeRect(rx, ry, rw, rh);
}

function scheduleSnapshot(delay) {
	clearTimeout(_mmTimer);
	_mmTimer = setTimeout(snapshotMinimap, delay);
}

// Rebuild thumbnail when graph changes; redraw viewport rect live on pan/zoom
cy.on("add remove data position", () => scheduleSnapshot(400));
cy.on("pan zoom", drawMinimap);

// Click-to-pan: map minimap click back to graph coords and animate viewport
mmCanvas.addEventListener("click", (e) => {
	const L = mmLayout();
	if (!L) return;
	const { drawW, drawH, ox, oy, bbW, bbH } = L;
	const rect = mmCanvas.getBoundingClientRect();
	const gx = _mmBB.x1 + (e.clientX - rect.left  - ox) / drawW * bbW;
	const gy = _mmBB.y1 + (e.clientY - rect.top    - oy) / drawH * bbH;
	cy.animate({ pan: { x: cy.width() / 2 - gx * cy.zoom(), y: cy.height() / 2 - gy * cy.zoom() } }, { duration: 150 });
});

// ---------- Auto-save to localStorage ----------
function autosave() {
	try {
		localStorage.setItem("nd-studio-autosave", JSON.stringify({ mode:currentMode, elements:cy.json().elements }));
		const ind = $("saveIndicator");
		ind.textContent = "✓ Saved";
		ind.classList.add("visible");
		clearTimeout(ind._t);
		ind._t = setTimeout(() => ind.classList.remove("visible"), 2000);
	} catch (e) { /* storage full or unavailable */ }
}

// ---------- Utility ----------
function ensureHex(color) {
	if (!color || color === "none") return "#2c3654";
	if (color.startsWith("#")) return color;
	const m = color.match(/\d+/g);
	return m && m.length >= 3 ? "#" + m.slice(0,3).map((n)=>parseInt(n).toString(16).padStart(2,"0")).join("") : "#2c3654";
}

// ---------- Init ----------
updateModeUI();
hist.save();
