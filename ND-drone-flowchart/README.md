# ND Safety Case Studio

An interactive, browser-based safety case and diagram editor developed for NASA-funded research at the University of Notre Dame. Built to help researchers construct, visualize, and present formal safety arguments for autonomous drone systems using Goal Structuring Notation (GSN), Entity-Relationship Diagrams (ERD), and general flowcharts — all in one tool with no installation required.

## Overview

ND Safety Case Studio provides a structured environment for building safety cases following the GSN standard. Researchers can map safety goals, supporting strategies, solutions (test evidence), context, assumptions, and justifications as a connected argument graph. The tool also supports ERD diagramming for system modeling and a general-purpose flowchart mode for process visualization.

## Modes

### GSN / Safety Case
Formal Goal Structuring Notation for constructing safety arguments:
- **Goal (G)** — a safety claim to be argued
- **Strategy (S)** — the approach used to argue a goal
- **Solution (Sn)** — evidence (test logs, data) supporting a goal
- **Context (C)** — context information scoping a goal
- **Assumption (A)** — assumptions the argument depends on
- **Justification (J)** — rationale for a strategy

Each node type is auto-numbered (G1, G2, S1, Sn1...) with separate Node ID and Claim text fields rendered in formal `ID ─── Claim` format. Goals can be marked **undeveloped** (dashed amber border + ⬦ marker) to indicate unfinished argument branches.

### ERD
Entity-Relationship Diagramming for system data modeling:
- Entity nodes with a live field editor (field name, type, PK toggle)
- Relationship (diamond) and Attribute (ellipse) node types
- Edge cardinality labels (1:1, 1:N, N:1, M:N)

### Flowchart
General-purpose process flowcharts with selectable node shapes (round rectangle, rectangle, ellipse, diamond, hexagon).

## Features

- **Three diagram modes** — Flowchart, ERD, GSN/Safety Case; switching clears the canvas
- **Live inspector** — all node and edge properties update instantly with no Apply button
- **Undo / Redo** — 50-step history with Ctrl+Z / Ctrl+Y
- **Node customization** — color picker, shape selector, width control per node
- **Edge style controls** — curve style (bezier, straight, right-angle), line style (solid, dashed, dotted), arrow shape, and color per edge
- **Auto-layout** — hierarchical Dagre layout with one click
- **Snap-to-grid** — toggleable grid overlay with node snapping
- **Multi-select** — drag to select multiple nodes; bulk color apply
- **Minimap** — custom canvas minimap with HiDPI-sharp thumbnail, live viewport indicator rectangle, click-to-pan, and grid overlay when snap is active
- **Presentation mode** — hides all UI chrome for full-screen canvas; press Escape to exit
- **Shareable links** — full diagram compressed into a URL hash via lz-string; copy to clipboard with one click
- **Export PNG** — 2× scale high-resolution render with dark background
- **Export SVG** — vector export via cytoscape-svg
- **Export / Import JSON** — full diagram save and restore; backward compatible with legacy array format
- **Auto-save** — saves to localStorage on every change; offers to restore on next visit
- **Sample diagram** — pre-loaded GSN safety case for a drone kill-switch system

## Technologies

- **Cytoscape.js** — graph rendering and interaction
- **cytoscape-dagre** — hierarchical auto-layout
- **cytoscape-svg** — SVG export
- **lz-string** — URL compression for shareable links
- **Vanilla JS / CSS / HTML** — no build step, no framework, runs directly in the browser

## Getting Started

### Prerequisites

A modern web browser (Chrome, Firefox, Safari, Edge). No installation or build step required.

### Running Locally

1. Clone the repository:

```bash
git clone https://github.com/iamjdm/ND-drone-flowchart.git
cd ND-drone-flowchart/ND-drone-flowchart
```

2. Open `index.html` directly in your browser, or serve with a local server for full feature support:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

3. Navigate to `http://localhost:8000`

## Usage

### Modes
Select **Flowchart**, **ERD**, or **GSN** from the toolbar. Switching modes clears the canvas (you will be prompted to confirm).

### Adding Nodes
- **Flowchart**: Click **+ Node**; select shape from the Shape dropdown
- **ERD**: Click **+ Entity**, **+ Relationship**, or **+ Attribute**
- **GSN**: Click the node type button (Goal, Strategy, Solution, Context, Assumption, Justification); nodes are auto-numbered

### Editing Nodes
Click any node to select it. The Inspector panel updates immediately with that node's properties — label, color, width, shape (flowchart), Node ID + Claim (GSN), or field list (ERD entity). All edits are live with no save button.

### Creating Edges
1. Click **+ Edge** — the button turns blue and the cursor changes
2. Click the source node
3. Click the target node
4. Press **Escape** to cancel

### Navigating Large Diagrams
Use the minimap in the bottom-right corner — click anywhere on it to jump the viewport to that position.

### Sharing
Click **🔗 Share** to copy a compressed URL to your clipboard. Anyone with the link can open the exact same diagram.

### Exporting
- **JSON** — full diagram data for re-import
- **PNG** — high-resolution raster image
- **SVG** — scalable vector image

## File Structure

```
ND-drone-flowchart/
├── index.html      # Application structure and toolbar
├── app.js          # All application logic
├── styles.css      # Dark-theme UI styles
├── sample.json     # Example GSN kill-switch safety case diagram
└── README.md       # This file
```

## Project Context

This tool was developed during a NASA-funded summer research program at the University of Notre Dame. The research focuses on safety verification for autonomous drone systems, specifically mapping safety arguments for kill-switch functionality across multiple flight modes using the GSN standard.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Developed for NASA-funded research at the University of Notre Dame
- Special thanks to Professor Aslam Shahid, Division of Science, Math and Technology at Governors State University, and the drone club at Governors State University
- Special thanks to Dr. Jane Cleland-Huang, Chair of Notre Dame's Department of Computer Science and Engineering, and the drone research team

## Contact

For questions or collaboration opportunities: mimnaughjonathan@gmail.com
