# NASA Drone Safety Flowchart System

An interactive GUI flowchart editor developed for visualizing drone safety protocols in NASA-funded research at Notre Dame University.

## Overview

This tool enables researchers to create, edit, and visualize complex flowcharts for drone safety analysis. It was specifically designed to map safety arguments and test coverage for kill-switch functionality in autonomous drone systems.

## Features

- **Interactive Node Editing**: Add, delete, and customize nodes with multiple shapes (rectangles, circles, diamonds, hexagons)
- **Auto-Layout**: Automatic hierarchical graph layout using Dagre algorithm
- **Text Wrapping**: Smart word wrapping for long labels with adjustable width
- **Import/Export**: Save and load flowcharts in JSON format
- **Real-time Editing**: Inspector panel for modifying node properties on the fly
- **Sample Data**: Pre-loaded example showing a safety argument structure

## Technologies Used

- **Cytoscape.js** - Graph visualization and manipulation
- **Dagre** - Directed graph layout algorithm
- **Vanilla JavaScript** - Core application logic
- **CSS3** - Modern, dark-themed UI

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/iamjdm/nasa-drone-flowchart.git
cd nasa-drone-flowchart
```

2. Open `index.html` in your browser, or serve with a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

3. Navigate to `http://localhost:8000`

## Usage

### Creating Nodes

1. Select a shape from the dropdown menu
2. Click **+ Node** to add a new node to the canvas
3. Click and drag nodes to reposition them

### Editing Nodes

1. Click on a node to select it
2. Use the Inspector panel on the left to:
   - Edit the label text
   - Adjust width and height
   - Change the shape
3. Click **Apply Changes** to save

### Creating Edges

1. Click **+ Edge** button
2. Click on the source node
3. Click on the target node

### Auto-Layout

Click **↯ Auto-Layout** to automatically arrange nodes in a hierarchical layout

### Import/Export

- **Export**: Click **⬇ Export JSON** to download your flowchart
- **Import**: Click **⬆ Import JSON** and select a previously saved file
- **Sample**: Click **Load Sample** to see an example safety argument flowchart

## Project Context

This tool was developed as part of NASA-funded drone research at the University of Notre Dame, focusing on safety verification for autonomous systems. The flowchart visualizations help researchers map:

- Safety goals (G nodes)
- Strategies for achieving goals (S nodes)
- Solutions and test coverage (O nodes)
- Relationships between safety arguments

## File Structure

```
├── index.html          # Main HTML structure
├── styles.css          # UI styling
├── app.js             # Core application logic
├── sample.json        # Example flowchart data
└── README.md          # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Developed for NASA-funded research at the University of Notre Dame
- Built with Cytoscape.js and Dagre layout engine
- Special thanks to Professor Aslam Shahid, Division of Science, Math and Technology at Governors State University, and the drone club at Governor State University.
- Special thanks to Dr. Jane Cleland-Huang, Chair of Notre Dame's Department of Computer Science and Engineering, and the drone research team.

## Contact

For questions or collaboration opportunities, feel free to reach out via mimnaughjonathan@gmail.com.
