
function manhattanDistance(node1, node2) {
    return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y);
}

let pq = new PriorityQueue()
let distTo = new Map()

function astar(start) {
    distTo.set(start, {dist: 0, prev: null})
    pq.push({key: start, value: distTo.get(start)})
    nextAstar(start)
}

function nextAstar(current) {
    current.visited = true
    current.isCurrent = true

    if(current.i == last.i && current.j == last.j) {
        let trace = distTo.get(current)
        dfsstack.push(current)
        while(trace.prev) {
            dfsstack.push(trace.prev)
            trace = distTo.get(trace.prev)
        }
        setButtonsEnabled(true)
        return
    }

    let neighbors = current.whereCanGo()
    for (let neighbor of neighbors) {
        let distFromStart = distTo.get(current).dist + 1
        let distToEnd = manhattanDistance(neighbor, last) / boxSize
        let score = /* distFromStart + */ distToEnd
        if (!distTo.has(neighbor) || score < distTo.get(neighbor).score) {
            distTo.set(neighbor, {dist: distFromStart, score: score, prev: current})
            pq.push({key: neighbor, value: distTo.get(neighbor)})
        }
    }

    setTimeout(() => {
        current.isCurrent = false
        if (pq.isEmpty()) {
            setButtonsEnabled(true)
            return
        }
        return nextAstar(pq.shift().key)
    }, msBetweenSteps)
}

document.getElementById('astar').addEventListener('click', async () => {
    onMazeGenerated()
    pq = new PriorityQueue()
    distTo = new Map()
    setButtonsEnabled(false)
    let result = astar(grid[first.i][first.j])
    console.log(result + " dij")
})