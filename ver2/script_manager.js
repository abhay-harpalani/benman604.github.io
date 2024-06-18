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


let common = ["theme.js"]
let sketches = {
    "map": ["map/map.js"],
    "maze": ["maze/cell.js", "maze/maze.js", "priority_queue.js", "maze/astar_maze.js", "maze/bfs_maze.js", "maze/dfs_maze.js"]
}

let scripts = [];
const params = new URLSearchParams(window.location.search);
if(params.has("sketch")) {
    currSketch = Object.keys(sketches).indexOf(params.get("sketch"));
    scripts = sketches[params.get("sketch")]
} else {
    scripts = sketches[Object.keys(sketches)[0]]
}


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

prevBtn.onclick = () => {
    currSketch = (currSketch - 1 + Object.keys(sketches).length) % Object.keys(sketches).length;
    window.location.href = `?sketch=${Object.keys(sketches)[currSketch]}`;
}

nextBtn.onclick = () => {
    currSketch = (currSketch + 1) % Object.keys(sketches).length;
    window.location.href = `?sketch=${Object.keys(sketches)[currSketch]}`;
}