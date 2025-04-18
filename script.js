let cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
        { 
            selector: 'node', 
            style: { 
                'background-color': '#9b87f5', 
                'label': 'data(id)', 
                'color': '#fff', 
                'text-valign': 'center', 
                'text-halign': 'center',
                'font-weight': 'bold'
            } 
        },
        { 
            selector: 'edge', 
            style: { 
                'width': 3, 
                'line-color': '#6E59A5', 
                'target-arrow-color': '#6E59A5', 
                'target-arrow-shape': 'triangle', 
                'curve-style': 'bezier', 
                'label': 'data(weight)', 
                'font-size': '12px', 
                'text-margin-y': -10,
                'color': '#fff'
            } 
        },
        { 
            selector: '.highlighted', 
            style: { 
                'line-color': '#ea384c', 
                'target-arrow-color': '#ea384c' 
            } 
        },
        { 
            selector: '.path', 
            style: { 
                'line-color': '#57d500', 
                'target-arrow-color': '#57d500', 
                'width': 5 
            } 
        }
    ],
    elements: [],
    layout: { name: 'grid', rows: 1 }
});

let nodeCount = 0;
let edges = [];
let distances = {};
let parents = {};
let currentStep = 0;
let totalSteps = [];

function addEdge(fromVal, toVal, weightVal) {
    const from = fromVal !== undefined ? fromVal : parseInt(document.getElementById('from').value);
    const to = toVal !== undefined ? toVal : parseInt(document.getElementById('to').value);
    const weight = weightVal !== undefined ? weightVal : parseInt(document.getElementById('weight').value);

    if (!cy.getElementById(String(from)).length) {
        cy.add({ group: 'nodes', data: { id: String(from) } });
        nodeCount++;
    }
    if (!cy.getElementById(String(to)).length) {
        cy.add({ group: 'nodes', data: { id: String(to) } });
        nodeCount++;
    }

    const id = `${from}-${to}`;
    if (!cy.getElementById(id).length) {
        cy.add({ group: 'edges', data: { id, source: String(from), target: String(to), weight } });
        edges.push({ from, to, weight });
    }

    cy.layout({ name: 'cose' }).run();
}

function runBellmanFord() {
    const source = parseInt(document.getElementById('source').value);
    const nodes = cy.nodes().map(n => parseInt(n.id()));

    distances = {};
    parents = {};
    totalSteps = [];

    nodes.forEach(n => distances[n] = Infinity);
    distances[source] = 0;

    for (let i = 0; i < nodes.length - 1; i++) {
        for (let { from, to, weight } of edges) {
            if (distances[from] + weight < distances[to]) {
                totalSteps.push({ from, to, weight, updated: true, newDist: distances[from] + weight });
                distances[to] = distances[from] + weight;
                parents[to] = from;
            } else {
                totalSteps.push({ from, to, weight, updated: false });
            }
        }
    }

    for (let { from, to, weight } of edges) {
        if (distances[from] + weight < distances[to]) {
            alert("Graph contains a negative weight cycle!");
            return;
        }
    }

    currentStep = 0;

    let result = `Shortest distances from node ${source}:\n`;
    Object.keys(distances).forEach(k => {
        result += `${k}: ${distances[k] === Infinity ? '∞' : distances[k]}\n`;
    });

    alert(result);
}

function nextStep() {
    cy.edges().removeClass('highlighted');
    if (currentStep >= totalSteps.length) {
        showPaths();
        return;
    }

    const step = totalSteps[currentStep];
    const id = `${step.from}-${step.to}`;
    const edge = cy.getElementById(id);
    edge.addClass('highlighted');
    if (step.updated) {
        edge.data('weight', step.newDist);
    }
    currentStep++;
}

function showPaths() {
    const source = parseInt(document.getElementById('source').value);
    for (let node of cy.nodes()) {
        let current = parseInt(node.id());
        while (parents[current] !== undefined) {
            const id = `${parents[current]}-${current}`;
            const edge = cy.getElementById(id);
            edge.addClass('path');
            current = parents[current];
        }
    }
}

function resetGraph() {
    cy.elements().remove();
    edges = [];
    distances = {};
    parents = {};
    currentStep = 0;
    totalSteps = [];
    nodeCount = 0;
}

function loadExample() {
    const selected = document.getElementById('exampleSelect').value;
    if (selected === 'example1') {
        resetGraph();
        const sampleEdges = [
            [0, 1, 6], [0, 2, 7], [1, 2, 8], [1, 3, 5], [1, 4, -4],
            [2, 3, -3], [2, 4, 9], [3, 1, -2], [4, 3, 7], [4, 0, 2]
        ];
        sampleEdges.forEach(e => addEdge(...e));
        document.getElementById('source').value = 0;
    }
}
