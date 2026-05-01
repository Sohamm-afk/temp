# ============================================
# Ride Sharing Matcher - Flask Backend
# Demonstrates: Graph, Dijkstra, Greedy Matching
# ============================================

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# -----------------------------------------
# GRAPH STRUCTURE (Adjacency List)
# -----------------------------------------
# Each key is a location (node).
# Each value is a dictionary of neighbors and edge weights.
# Example: 'A' connects to 'B' with distance 5.
#
#   A --5-- B --3-- D
#   |       |       |
#   10      2       7
#   |       |       |
#   C --4-- E --6-- F
#
graph = {
    'A': {'B': 5, 'C': 10},
    'B': {'A': 5, 'D': 3, 'E': 2},
    'C': {'A': 10, 'E': 4},
    'D': {'B': 3, 'F': 7},
    'E': {'B': 2, 'C': 4, 'F': 6},
    'F': {'D': 7, 'E': 6}
}

# -----------------------------------------
# RIDERS LIST
# -----------------------------------------
# Each rider is stored as a dictionary with:
#   - name: rider's name
#   - start: starting location (a node in the graph)
#   - end: destination location (a node in the graph)
riders = []


# -----------------------------------------
# DIJKSTRA'S ALGORITHM (from scratch)
# -----------------------------------------
# Finds the shortest distance from 'start' to all other nodes.
# Uses simple loops instead of a priority queue / heap.
#
# Steps:
#   1. Set distance to start = 0, all others = infinity
#   2. Track which nodes are visited
#   3. Repeat:
#      a. Pick the unvisited node with smallest distance
#      b. Mark it as visited
#      c. Update distances to its neighbors
#   4. Return distance to 'end'
def dijkstra(graph, start, end):
    # Step 1: Initialize distances
    # All nodes start with infinite distance except the source
    distances = {}
    for node in graph:
        distances[node] = float('inf')
    distances[start] = 0

    # Track visited nodes
    visited = []

    # Step 2: Process all nodes
    for _ in range(len(graph)):
        # Step 3a: Find the unvisited node with the smallest distance
        current = None
        current_dist = float('inf')
        for node in graph:
            if node not in visited and distances[node] < current_dist:
                current = node
                current_dist = distances[node]

        # If no reachable unvisited node remains, stop
        if current is None:
            break

        # Step 3b: Mark current node as visited
        visited.append(current)

        # Step 3c: Update distances to neighbors
        for neighbor in graph[current]:
            new_dist = distances[current] + graph[current][neighbor]
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist

    # Step 4: Return the shortest distance to the end node
    return distances[end]


# -----------------------------------------
# GREEDY MATCHING LOGIC
# -----------------------------------------
# Compare riders pairwise.
# Match two riders if they share the same start OR the same end.
# Once a rider is matched, they cannot be matched again.
#
# Steps:
#   1. Create an empty list for matches
#   2. Track which riders are already used
#   3. For each pair (i, j) where i < j:
#      a. Skip if either rider is already used
#      b. Check if start or end locations match
#      c. If match found, record it and mark both as used
#   4. Return all matches
def match_riders(riders, graph):
    matches = []       # Store matched pairs
    used = []          # Indices of riders already matched

    # Compare every pair of riders
    for i in range(len(riders)):
        for j in range(i + 1, len(riders)):
            # Skip riders that are already matched
            if i in used or j in used:
                continue

            rider_a = riders[i]
            rider_b = riders[j]

            # Check if they share the same start or same end
            same_start = rider_a['start'] == rider_b['start']
            same_end = rider_a['end'] == rider_b['end']

            if same_start or same_end:
                # Compute shortest path distance for each rider
                dist_a = dijkstra(graph, rider_a['start'], rider_a['end'])
                dist_b = dijkstra(graph, rider_b['start'], rider_b['end'])

                # Build the match result string
                reason = "same start" if same_start else "same end"
                match_info = (
                    f"{rider_a['name']} ({rider_a['start']}->{rider_a['end']}, "
                    f"dist={dist_a}) <-> "
                    f"{rider_b['name']} ({rider_b['start']}->{rider_b['end']}, "
                    f"dist={dist_b}) "
                    f"[Reason: {reason}]"
                )
                matches.append(match_info)

                # Mark both riders as used
                used.append(i)
                used.append(j)

    return matches


# -----------------------------------------
# FLASK ROUTES
# -----------------------------------------

# Route: Home page
@app.route('/')
def index():
    return render_template('index.html')


# Route: Add a new rider (POST)
@app.route('/add', methods=['POST'])
def add_rider():
    data = request.get_json()

    name = data.get('name', '').strip()
    start = data.get('start', '').strip().upper()
    end = data.get('end', '').strip().upper()

    # Validate inputs
    if not name or not start or not end:
        return jsonify({'error': 'All fields are required'}), 400

    if start not in graph or end not in graph:
        return jsonify({'error': 'Invalid location. Use A, B, C, D, E, or F'}), 400

    if start == end:
        return jsonify({'error': 'Start and end must be different'}), 400

    # Add rider to the list
    rider = {'name': name, 'start': start, 'end': end}
    riders.append(rider)

    return jsonify({'message': f'Rider {name} added', 'riders': riders})


# Route: Match riders (GET)
@app.route('/match', methods=['GET'])
def match():
    if len(riders) < 2:
        return jsonify({
            'riders': riders,
            'matches': ['Need at least 2 riders to match']
        })

    matches = match_riders(riders, graph)

    if not matches:
        matches = ['No matching riders found (no shared start or end)']

    return jsonify({
        'riders': riders,
        'matches': matches
    })


# -----------------------------------------
# RUN THE APP
# -----------------------------------------
if __name__ == '__main__':
    app.run(debug=True)
