let highwaysData;
let nodesMap = {};
const coord = "37.8067898,-122.4112719"
let minLat, maxLat, minLon, maxLon;

function miToDegLat(mi) {
  return mi / 69.172;
}

function miToDegLon(mi, lat) {
  return mi / (69.172 * Math.cos(radians(lat)));
}

function preload() {
  // Coordinates and dimensions of the bounding box
  let w = 2;
  let h = windowHeight * 2 / windowWidth;

  let centerLat = parseFloat(coord.split(",")[0]);
  let centerLon = parseFloat(coord.split(",")[1]);

  // Calculate bounding box coordinates
  minLat = centerLat - miToDegLat(h) / 2;
  maxLat = centerLat + miToDegLat(h) / 2;
  minLon = centerLon - miToDegLon(w, centerLat) / 2;
  maxLon = centerLon + miToDegLon(w, centerLat) / 2;

  console.log(minLat, maxLat, minLon, maxLon);

  // Construct Overpass QL query
  let query = `[out:json];
    (
      way["highway"](bbox:${minLat},${minLon},${maxLat},${maxLon});
      node(w);
    );
    out body;`;

  // Send HTTP request to Overpass API
  loadJSON("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query), processData);
}

function processData(data) {
  highwaysData = data;
  // Build nodes map for faster lookup
  for (let node of highwaysData.elements) {
    if (node.type === "node") {
      nodesMap[node.id] = node;
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(backgroundColor.r, backgroundColor.g, backgroundColor.b);
  if (highwaysData) {
    drawHighways();
  }
}

function drawHighways() {
  for (let way of highwaysData.elements) {
    if (way.type === "way" && way.nodes.length > 1) {
      stroke(outlineColor);
      strokeWeight(2);
      noFill();
      beginShape();
      for (let nodeId of way.nodes) {
        let node = nodesMap[nodeId];
        if (node) {
          let x = map(node.lon, minLon, maxLon, 0, width);
          let y = map(node.lat, maxLat, minLat, 0, height);
          vertex(x, y);
        }
      }
      endShape();
    }
  }
}
