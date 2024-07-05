const overpassAPI = "https://overpass-api.de/api/interpreter?data=" 
const reverseGeocodeAPI = "https://nominatim.openstreetmap.org/reverse"
const ipGeoAPI = "http://ip-api.com/json"
const zipCodeAPI = "http://api.geonames.org/postalCodeLookupJSON?username=benny12&country=US&postalcode="

let startSelection = {state: "Select", x: 0, y: 0};
let endSelection = {state: "Select", x: 0, y: 0};

let highwaysData;
let geoData;
let nodesMap = {};
let windowWidthMiles = 2.5;
let minLat, maxLat, minLon, maxLon;

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
      way["highway"](bbox:${minLat},${minLon},${maxLat},${maxLon});
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
        nodesMap[node.id] = node;
      }
    }
    drewHighways = false;
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
  background(backgroundColor.r, backgroundColor.g, backgroundColor.b);
  stroke(outlineColor);
  fill(outlineColor);
  strokeWeight(1);
  textSize(16);
  text((message) ? message : "Loading...", width/2, height/2); 
}

async function setup() {
  document.getElementById('buttons-map').style.display = 'block';
  document.getElementById('buttons-maze').style.display = 'none';

  let canvas = createCanvas(windowWidth, windowHeight);
	canvas.parent('sketch');

  screenLoadingState();

  let coord = await fetchCurrentGeo();
  await fetchGeoData(coord);
}

let drewHighways = false;
function draw() {
  if (highwaysData && !drewHighways) {
    drawHighways();
    drewHighways = true;
  }
}
  
function drawHighways() {
  background(backgroundColor.r, backgroundColor.g, backgroundColor.b);

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

async function mousePressed() {
  if (!highwaysData) return;
  if (!(startSelection.state === "Selecting" || endSelection.state === "Selecting")) return;

  let coord = xyToLatLon(mouseX, mouseY);
  let data = await fetchReverseGeocode(coord.lat, coord.lon);
  console.log(coord.lat + "," + coord.lon);
  console.log(data);

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
    startSelection.x = coordInXY.x;
    startSelection.y = coordInXY.y;
    startSelection.state = "Selected";
    selStartBtn.innerText = name;
  } else if (endSelection.state === "Selecting") {
    endSelection.x = coordInXY.x;
    endSelection.y = coordInXY.y;
    endSelection.state = "Selected";
    selEndBtn.innerText = name;
  }

  drawHighways();
  noStroke();
  fill(highlightColor.r, highlightColor.g, highlightColor.b);
  if (startSelection.state === "Selected")
    ellipse(startSelection.x, startSelection.y, 20, 20);
  if (endSelection.state === "Selected")
    triangle(endSelection.x, endSelection.y - 10, endSelection.x - 10, endSelection.y + 10, endSelection.x + 10, endSelection.y + 10);
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
  noStroke();
  fill(highlightColor.r, highlightColor.g, highlightColor.b);
  if (startSelection.state === "Selected")
    ellipse(startSelection.x, startSelection.y, 20, 20);
  if (endSelection.state === "Selected")
    triangle(endSelection.x, endSelection.y - 10, endSelection.x - 10, endSelection.y + 10, endSelection.x + 10, endSelection.y + 10);
}