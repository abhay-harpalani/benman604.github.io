const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
let currSketch = 0;

let addScript = (info) => { 
    return new Promise(function(resolve, reject) { 
        let gfgData = document.createElement('script'); 
        gfgData.src = info; 
        gfgData.async = false; 
        gfgData.onload = () => { 
            resolve(info); 
        }; 
        gfgData.onerror = () => { 
            reject(info); 
        }; 
        document.body.appendChild(gfgData); 
    }); 
};


let common = ["theme.js", "priority_queue.js"]
let sketches = {
    "map": {
        scripts: ["map/map.js", "map/bfs_map.js", "map/astar_map.js"],
        buttons: ".buttons-map",
        displayname: "Map",
        source: "https://github.com/benman604/benman604.github.io/tree/v2/map"
    },
    "maze": {
        scripts: ["maze/cell.js", "maze/maze.js", "maze/astar_maze.js", "maze/bfs_maze.js", "maze/dfs_maze.js"],
        buttons: ".buttons-maze",
        displayname: "Maze",
        source: "https://github.com/benman604/benman604.github.io/tree/v2/maze"
    },
    "polar": {
        scripts: ["polar/polar.js"],
        buttons: ".buttons-polar",
        displayname: "Polar",
        source: "https://github.com/benman604/benman604.github.io/tree/v2/polar"
    }
}

let scripts = [];
const params = new URLSearchParams(window.location.search);
if(params.has("sketch") && sketches[params.get("sketch")] !== undefined) {
    currSketch = params.get("sketch");
    scripts = sketches[params.get("sketch")].scripts
} else {
    currSketch = "map"
    scripts = sketches[currSketch].scripts
}

document.querySelectorAll(sketches[currSketch].buttons).forEach(element => {
  element.style.display = 'block';
});

for (const [key, value] of Object.entries(sketches)) {
    if (key !== currSketch) {
        document.querySelectorAll(value.buttons).forEach(element => {
            element.style.display = 'none';
        });
    }
}

document.getElementById('sketchName').innerText = sketches[currSketch].displayname;
document.getElementById('sourceLink').href = sketches[currSketch].source;

let promiseData = []; 
[...common, ...scripts].forEach(function(info) { 
    promiseData.push(addScript(info)); 
});

console.log(promiseData)
Promise.all(promiseData).then(function() { 
    console.log('required scripts loaded successfully');
}).catch(function(gfgData) {
    console.log(gfgData + ' failed to load');
}); 

let skeys = Object.keys(sketches);
let curri = skeys.indexOf(currSketch);
prevBtn.onclick = () => {
    curri = (curri + 1) % skeys.length;
    window.location.href = `?sketch=${skeys[curri]}`;
}

nextBtn.onclick = () => {
    curri = (curri + 1) % skeys.length;
    window.location.href = `?sketch=${skeys[curri]}`;
}