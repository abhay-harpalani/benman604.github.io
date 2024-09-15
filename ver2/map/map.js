const overpassAPI = "https://overpass-api.de/api/interpreter?data=" 
const reverseGeocodeAPI = "https://nominatim.openstreetmap.org/reverse"
const ipGeoAPI = "http://ip-api.com/json"
const zipCodeAPI = "http://api.geonames.org/postalCodeLookupJSON?username=benny12&country=US&postalcode="

let startSelection = {state: "Select", nodeId: null};
let endSelection = {state: "Select", nodeId: null};
let path = []; // list of node IDs
let roadMap = new Map(); // adjacency list of node IDs

let highwaysData;
let geoData;
let nodesMap = new Map(); // maps node IDs to lat lon x y
let windowWidthMiles = 30;
let minLat, maxLat, minLon, maxLon;
let mapGraphics;
let mapPathOverlay;

function miToDegLat(mi) {
  return mi / 69.172;
}

function miToDegLon(mi, lat) {
  return mi / (69.172 * Math.cos(radians(lat)));
}

function xyToLatLon(x, y) {
  let lat = map(y, 0, height, maxLat, minLat);
  let lon = map(x, 0, width, minLon, maxLon);
  return {lat, lon};
}

function latLonToXY(lat, lon) {
  let x = map(lon, minLon, maxLon, 0, width);
  let y = map(lat, maxLat, minLat, 0, height);
  return {x, y};
}

async function fetchCurrentGeo() {
  let response = await fetch(ipGeoAPI);
  let data = await response.json();
  console.log("Fetched IP geolocation:", data);
  return data.lat + "," + data.lon;
}

async function fetchGeoFromZip(zip) {
  let response = await fetch(zipCodeAPI + zip);
  let data = await response.json();
  console.log("Fetched zip code geolocation:", data);
  if (!data.postalcodes || data.postalcodes.length === 0) {
    screenLoadingState("Invalid zip code");
    return;
  }
  return data.postalcodes[0].lat + "," + data.postalcodes[0].lng;
}

async function fetchGeoData(coord) {
  mapGraphics.clear();
  screenLoadingState("Loading...");
  setButtonsEnabled(false);

  let w = windowWidthMiles; // viewport width in miles
  let h = windowHeight * windowWidthMiles / windowWidth; 

  let centerLat = parseFloat(coord.split(",")[0]);
  let centerLon = parseFloat(coord.split(",")[1]);

  // bbox coordinates
  minLat = centerLat - miToDegLat(h) / 2;
  maxLat = centerLat + miToDegLat(h) / 2;
  minLon = centerLon - miToDegLon(w, centerLat) / 2;
  maxLon = centerLon + miToDegLon(w, centerLat) / 2;

  console.log(minLat, maxLat, minLon, maxLon);

  // overpass ql query
  let query = `[out:json];
    (
      way["highway"~"primary|secondary|trunk|motorway"](bbox:${minLat},${minLon},${maxLat},${maxLon});
      node(w);
    );
    out body;`;

  // HTTP request to overpass API
  try {
    let response = await fetch(overpassAPI + encodeURIComponent(query));
    let data = await response.json();
    console.log("Fetched geo data:", data);
    highwaysData = data;
    for (let node of highwaysData.elements) {
      if (node.type === "node") {
        nodesMap.set(node.id, {
          lat: node.lat,
          lon: node.lon,
          x: map(node.lon, minLon, maxLon, 0, width),
          y: map(node.lat, maxLat, minLat, 0, height)
        });
      }
    }
    drawHighways();
  } catch(error) {
    console.error("Failed to fetch geo data:", error);
    screenLoadingState("Failed to fetch data");
  }
}

async function fetchReverseGeocode(lat, lon) {
  try {
    let response = await fetch(reverseGeocodeAPI + `?lat=${lat}&lon=${lon}&format=json`);
    let data = await response.json();
    return data;
  } catch(error) {
    console.error("Failed to fetch reverse geocode:", error);
    return;
  }
}

function screenLoadingState(message) {
  mapGraphics.background(backgroundColor.r, backgroundColor.g, backgroundColor.b);
  mapGraphics.stroke(outlineColor);
  mapGraphics.fill(outlineColor);
  mapGraphics.strokeWeight(1);
  mapGraphics.textSize(16);
  mapGraphics.text((message) ? message : "Loading...", width/2, height/2); 
}

async function setup() {
  document.getElementById('buttons-map').style.display = 'block';
  document.getElementById('buttons-maze').style.display = 'none';

  let canvas = createCanvas(windowWidth, windowHeight);
	canvas.parent('sketch');

  mapGraphics = createGraphics(width, height);
  mapPathOverlay = createGraphics(width, height);
  screenLoadingState();

  // let coord = await fetchCurrentGeo();
  let coord = "37.7749,-122.4194"; // San Francisco
  await fetchGeoData(coord);
  drawHighways();
}

// let drewHighways = false;
function draw() {
  // if (highwaysData && !drewHighways) {
  //   drawHighways();
  //   drewHighways = true;
  // }
  background(backgroundColor.r, backgroundColor.g, backgroundColor.b);
  if (mapGraphics)  image(mapGraphics, 0, 0);
  if (mapPathOverlay) image(mapPathOverlay, 0, 0);
  noStroke();
  fill(highlightColor.r, highlightColor.g, highlightColor.b);

  if (startSelection.state == "Selected") {
    let node = nodesMap.get(startSelection.nodeId); 
    ellipse(node.x, node.y, 20, 20);
  }
  if (endSelection.state == "Selected") {
    let node = nodesMap.get(endSelection.nodeId);
    triangle(node.x, node.y - 10, node.x - 10, node.y + 10, node.x + 10, node.y + 10);
    // triangle(endSelection.x, endSelection.y - 10, endSelection.x - 10, endSelection.y + 10, endSelection.x + 10, endSelection.y + 10);
  }

  if (path.length > 0) {
    stroke(highlightColor.r, highlightColor.g, highlightColor.b);
    strokeWeight(5);
    noFill();
    beginShape();
    for (let nodeId of path) {
      let node = nodesMap.get(nodeId);
      vertex(node.x, node.y);
    }
    endShape();
  }
}
  
function drawHighways() {
  roadMap = new Map();
  mapGraphics.clear();
  backtrace.clear();
  mapGraphics.stroke(outlineColor);
  mapGraphics.strokeWeight(2);
  mapGraphics.noFill();

  for (let way of highwaysData.elements) {
    if (way.type === "way" && way.nodes.length > 1) {
      mapGraphics.beginShape();
      // for (let nodeId of way.nodes) {
      //   let node = nodesMap[nodeId];
      //   if (node) {
      //     let x = map(node.lon, minLon, maxLon, 0, width);
      //     let y = map(node.lat, maxLat, minLat, 0, height);
      //     mapGraphics.vertex(x, y);
      //   }
      // }

      for (let i=0; i<way.nodes.length-1; i++) {
        let nodeId = way.nodes[i];
        let nextNodeId = way.nodes[i+1];

        let node = nodesMap.get(nodeId);
        if (node) {
          // let x = map(node.lon, minLon, maxLon, 0, width);
          // let y = map(node.lat, maxLat, minLat, 0, height);
          mapGraphics.vertex(node.x, node.y);
        }

        if (!roadMap.get(nodeId)) roadMap.set(nodeId, []);
        roadMap.get(nodeId).push(nextNodeId)
        if (!roadMap.get(nextNodeId)) roadMap.set(nextNodeId, []);
        roadMap.get(nextNodeId).push(nodeId)
      }

      let lastNode = way.nodes[way.nodes.length - 1];
      mapGraphics.vertex(nodesMap.get(lastNode).x, nodesMap.get(lastNode).y);
      mapGraphics.endShape();
    }
  }

  setButtonsEnabled(true);
}

async function mousePressed() {
  if (!highwaysData) return;
  if (!(startSelection.state === "Selecting" || endSelection.state === "Selecting")) return;

  let coord = xyToLatLon(mouseX, mouseY);
  let data = await fetchReverseGeocode(coord.lat, coord.lon);
  let nearestNode = findNearestNode(coord.lat, coord.lon);
  console.log(coord.lat + "," + coord.lon);
  console.log(nodesMap.get(nearestNode));

  let name;
  if (data && data.address) {
    let houseNumber = data.address.house_number;
    if (houseNumber) houseNumber = houseNumber.split(";")[0];
    if (data.name) name = data.name;
    else if (data.address.road) name = ((houseNumber) ? houseNumber : "") + " " + data.address.road;
    else if (data.address.city) name = data.address.city;
    else if (data.address.state) name = data.address.state;
    else if (data.address.country) name = data.address.country;
    else name = "Unknown";
  }

  let coordInXY = latLonToXY(data.lat, data.lon);

  if (startSelection.state === "Selecting") {
    // startSelection.x = coordInXY.x;
    // startSelection.y = coordInXY.y;
    startSelection.nodeId = nearestNode;
    startSelection.state = "Selected";
    selStartBtn.innerText = name;
  } else if (endSelection.state === "Selecting") {
    // endSelection.x = coordInXY.x;
    // endSelection.y = coordInXY.y;
    endSelection.nodeId = nearestNode;
    endSelection.state = "Selected";
    selEndBtn.innerText = name;
  }
}

document.getElementById('go-zip').addEventListener('click', async () => {
  screenLoadingState();
  startSelection.state = "Select";
  endSelection.state = "Select";
  selStartBtn.innerText = "Select start";
  selEndBtn.innerText = "Select end";

  let zip = document.getElementById('zip').value;
  let coord = await fetchGeoFromZip(zip);
  if (coord) {
    await fetchGeoData(coord);
    draw();
  }
});

function findNearestNode(lat, lon) {
  let nearestNode = null;
  let nearestDistance = Infinity;

  for (let [nodeId, node] of nodesMap) {
    // let node = nodesMap[nodeId];
    let distance = dist(lat, lon, node.lat, node.lon);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestNode = nodeId;
    }
  }

  return nearestNode;
}

const selStartBtn = document.getElementById('sel-start');
const selEndBtn = document.getElementById('sel-end');

selStartBtn.addEventListener('click', () => {
  startSelection.state = "Selecting";
  selStartBtn.innerText = "Selecting start";
});

selEndBtn.addEventListener('click', () => {
  endSelection.state = "Selecting";
  selEndBtn.innerText = "Selecting end";
});

function onUpdateColorTheme() {
  drawHighways();
  // noStroke();
  // fill(highlightColor.r, highlightColor.g, highlightColor.b);
  // if (startSelection.state === "Selected")
  //   ellipse(startSelection.x, startSelection.y, 20, 20);
  // if (endSelection.state === "Selected")
  //   triangle(endSelection.x, endSelection.y - 10, endSelection.x - 10, endSelection.y + 10, endSelection.x + 10, endSelection.y + 10);
}

function setButtonsEnabled(val) {
	document.getElementById('mastar').disabled = !val
	document.getElementById('mbfs').disabled = !val
}