let pq = new PriorityQueue();
let distTo = new Map();

document.getElementById('mastar').addEventListener('click', () => {
    path = [];
    pq = new PriorityQueue();
    distTo.clear();
    visited.clear();
    prepareForSearch();

    if (startSelection.nodeId == null || endSelection.nodeId == null) return;
    astar(startSelection.nodeId, endSelection.nodeId);
});

async function astar(start, end) {
    let tick = 0;
    distTo.set(start, {dist: 0, prev: null});
    pq.push({key: start, value: distTo.get(start)});

    while (!pq.isEmpty()) {
        let current = pq.shift().key;

        if (tick % waitOneMsEvery === 0) {
            await new Promise(resolve => setTimeout(resolve, 0.5));
        }
        tick++;

        if (tick > 100) waitOneMsEvery = 100;
        if (tick > 500) waitOneMsEvery = 500;
        if (tick % 1000 === 0) waitOneMsEvery = tick;

        if (current === end) {
            let trace = distTo.get(current);
            while (trace.prev) {
                path.push(trace.prev);
                trace = distTo.get(trace.prev);
            }
            path.reverse();
            path.push(end);
            console.log("Path found: ", path);
            found = true;
            return;
        }

        let neighbors = roadMap.get(current);
        for (let neighbor of neighbors) {
            let cloc = nodesMap.get(current);
            let nloc = nodesMap.get(neighbor);
            let endloc = nodesMap.get(end);

            let distFromStart = distTo.get(current).dist + dist(cloc.x, cloc.y, nloc.x, nloc.y);
            let distToEnd = dist(nloc.x, nloc.y, endloc.x, endloc.y);
            let score = distFromStart + distToEnd;
            if (!distTo.has(neighbor) || score < distTo.get(neighbor).score) {
                distTo.set(neighbor, {dist: distFromStart, score: score, prev: current});
                pq.push({key: neighbor, value: distTo.get(neighbor)});

                mapPathOverlay.line(cloc.x, cloc.y, nloc.x, nloc.y);
            }
        }
    }

    if (!found) {
        console.log("No path found");
    }
}