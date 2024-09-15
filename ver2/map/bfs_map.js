let bfsqueue = []

document.getElementById('mbfs').addEventListener('click', () => {
    path = [];
    bfsqueue = [];
    visited.clear();
    backtrace.clear();
    found = false;
    waitOneMsEvery = _waitOneMsEvery

    mapPathOverlay.clear();
    mapPathOverlay.stroke(255, 50, 50);
    mapPathOverlay.strokeWeight(2);
    mapPathOverlay.noFill();

    if (startSelection.nodeId == null || endSelection.nodeId == null) return;
    bfs(startSelection.nodeId, endSelection.nodeId);
});

async function bfs(start, end) {
    let tick = 0;
    bfsqueue.push(start);
    while (bfsqueue.length > 0) {
        let current = bfsqueue.shift();

        if (tick % waitOneMsEvery === 0) {
            await new Promise(resolve => setTimeout(resolve, 0.01));
        }
        tick++;

        if (tick > 100) waitOneMsEvery = 100;
        if (tick > 500) waitOneMsEvery = 500;
        if (tick % 1000 === 0) waitOneMsEvery = tick * 3;

        if (current === end) {
            found = true;
            let trace = backtrace.get(current);
            while (trace) {
                path.push(trace);
                trace = backtrace.get(trace);
            }
            path.reverse();
            path.push(end);
            console.log("Path found: ", path);
            return;
        }

        visited.add(current);
        let cloc = nodesMap.get(current);

        for (let neighbor of roadMap.get(current)) {
            if (!visited.has(neighbor)) {
                bfsqueue.push(neighbor);
                backtrace.set(neighbor, current);
                
                let nloc = nodesMap.get(neighbor);
                mapPathOverlay.line(cloc.x, cloc.y, nloc.x, nloc.y);
            }
        }
    }

    if (!found) {
        console.log("No path found");
    }
}