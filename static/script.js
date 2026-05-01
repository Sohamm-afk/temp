// ============================================
// Ride Sharing Matcher - Frontend Logic (Netlify Fix)
// All logic moved to JS for serverless deployment
// ============================================

// -----------------------------------------
// DATA STORAGE
// -----------------------------------------
var riders = [];

// -----------------------------------------
// GRAPH STRUCTURE (Adjacency List)
// -----------------------------------------
const graph = {
    'A': {'B': 5, 'C': 10},
    'B': {'A': 5, 'D': 3, 'E': 2},
    'C': {'A': 10, 'E': 4},
    'D': {'B': 3, 'F': 7},
    'E': {'B': 2, 'C': 4, 'F': 6},
    'F': {'D': 7, 'E': 6}
};

// -----------------------------------------
// DIJKSTRA'S ALGORITHM
// -----------------------------------------
function dijkstra(start, end) {
    let distances = {};
    let visited = new Set();
    let nodes = Object.keys(graph);

    for (let node of nodes) {
        distances[node] = Infinity;
    }
    distances[start] = 0;

    for (let i = 0; i < nodes.length; i++) {
        let current = null;
        let minDistance = Infinity;

        for (let node of nodes) {
            if (!visited.has(node) && distances[node] < minDistance) {
                current = node;
                minDistance = distances[node];
            }
        }

        if (current === null) break;
        visited.add(current);

        for (let neighbor in graph[current]) {
            let alt = distances[current] + graph[current][neighbor];
            if (alt < distances[neighbor]) {
                distances[neighbor] = alt;
            }
        }
    }
    return distances[end];
}

// -----------------------------------------
// UI UTILITIES
// -----------------------------------------
function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast'; }, 2500);
}

function updateCount() {
    var el = document.getElementById('rider-count-num');
    el.textContent = riders.length;
    el.style.transform = 'scale(1.4)';
    setTimeout(() => {
        el.style.transition = '0.3s ease';
        el.style.transform = 'scale(1)';
    }, 150);
}

function flashOutput() {
    var output = document.getElementById('output');
    output.classList.add('highlight');
    setTimeout(() => { output.classList.remove('highlight'); }, 800);
}

function typewrite(element, text, speed) {
    element.textContent = '';
    var i = 0;
    function step() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(step, speed);
        }
    }
    step();
}

// -----------------------------------------
// CORE FUNCTIONS
// -----------------------------------------

function addRider() {
    var name = document.getElementById('rider-name').value.trim();
    var start = document.getElementById('start-loc').value;
    var end = document.getElementById('end-loc').value;

    if (!name) {
        showToast('Please enter a rider name.', 'error');
        return;
    }
    if (start === end) {
        showToast('Start and end must be different.', 'error');
        return;
    }

    // Store rider locally
    riders.push({ name: name, start: start, end: end });

    // Update Output
    var output = 'Riders Added:\n';
    output += '─────────────\n';
    riders.forEach((r, idx) => {
        output += `  ${idx + 1}.  ${r.name}  (${r.start} → ${r.end})\n`;
    });

    typewrite(document.getElementById('output'), output, 8);
    flashOutput();
    updateCount();
    showToast('✓ ' + name + ' added successfully', 'success');
    
    document.getElementById('rider-name').value = '';
    document.getElementById('rider-name').focus();
}

function matchRiders() {
    if (riders.length < 2) {
        showToast('Need at least 2 riders to match', 'info');
        return;
    }

    var btn = document.getElementById('btn-match');
    btn.classList.add('pulse');
    setTimeout(() => { btn.classList.remove('pulse'); }, 600);

    let matches = [];
    let used = new Set();

    for (let i = 0; i < riders.length; i++) {
        for (let j = i + 1; j < riders.length; j++) {
            if (used.has(i) || used.has(j)) continue;

            let rA = riders[i];
            let rB = riders[j];

            let sameStart = rA.start === rB.start;
            let sameEnd = rA.end === rB.end;

            if (sameStart || sameEnd) {
                let distA = dijkstra(rA.start, rA.end);
                let distB = dijkstra(rB.start, rB.end);
                let reason = sameStart ? "same start" : "same end";

                matches.push(`${rA.name} (${rA.start}→${rA.end}, dist=${distA}) <-> ${rB.name} (${rB.start}→${rB.end}, dist=${distB}) [Reason: ${reason}]`);
                used.add(i);
                used.add(j);
            }
        }
    }

    var output = 'All Riders:\n';
    output += '───────────\n';
    riders.forEach((r, idx) => {
        output += `  ${idx + 1}.  ${r.name}  (${r.start} → ${r.end})\n`;
    });

    output += '\nMatches (Greedy):\n';
    output += '─────────────────\n';
    if (matches.length === 0) {
        output += '  No matching riders found.';
    } else {
        matches.forEach(m => {
            output += '  ● ' + m + '\n';
        });
    }

    typewrite(document.getElementById('output'), output, 6);
    flashOutput();
    showToast('⚡ Matching complete', 'info');
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('rider-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addRider();
    });
});
