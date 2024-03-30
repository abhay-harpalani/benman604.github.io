let city = "New York City"; // Change city name as desired
let bbox = []; // Bounding box coordinates
let streets = []; // Array to hold street segment data
let streetColor = [255, 0, 0]; // Color of street lines
let osmBaseUrl = "https://nominatim.openstreetmap.org/search.php?q=";
let osmFormat = "&format=json";
let pixelToMileRatio = 0.01; // Each pixel represents 0.01 miles

function setup() {
  createCanvas(800, 600); // Adjust canvas size as desired
  getBoundingBox(city); // Fetch bounding box for specified city
}

function draw() {
  background(220);
  
  // Display streets
  stroke(streetColor);
  for (let street of streets) {
    line(street[0][0], street[0][1], street[1][0], street[1][1]);
  }
}

async function getBoundingBox(cityName) {
  // Fetching bounding box coordinates for the city
  let url = `${osmBaseUrl}${cityName}${osmFormat}`;
  console.log("Requesting bounding box:", url);
  let response = await fetch(url);
  let data = await response.json();
  console.log("Bounding box data:", data);
  let citybbox = [
    parseFloat(data[0].boundingbox[0]), // min lat
    parseFloat(data[0].boundingbox[2]), // min lon
    parseFloat(data[0].boundingbox[1]),  // max lat
    parseFloat(data[0].boundingbox[3]) // max lon
  ];
  
  // Calculate the width and height of the bounding box based on pixel to mile ratio and canvas aspect ratio
  let canvasAspectRatio = width / height;
  let bboxWidth = Math.sqrt((pixelToMileRatio * canvasAspectRatio) * (pixelToMileRatio * canvasAspectRatio));
  let bboxHeight = bboxWidth / canvasAspectRatio;
  
  // Calculate random coordinates for the bounding box within the citybbox
  let randomLat = random(citybbox[0], citybbox[2] - bboxHeight)
  let randomLon = random(citybbox[1], citybbox[3] - bboxWidth)
  
  // Set the bbox coordinates based on the random coordinates and the calculated width and height
  bbox = [
    randomLat,
    randomLon,
    randomLat + bboxWidth,
    randomLon + bboxHeight
  ];
  
  getStreetData();
}

async function getStreetData() {
  // Fetching street data within the bounding box
  let url = `https://overpass-api.de/api/interpreter?data=[out:json];way(${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]})[highway];out;`;
  console.log("Requesting street data:", url);
  let response = await fetch(url);
  let data = await response.json();
  console.log("Street data:", data);
  
  // Convert OSM way data to street segments
  for (let way of data.elements) {
    if (way.type == "way") {
      let street = [];
      for (let node of way.nodes) {
        let x = map(node.lon, bbox[1], bbox[3], 0, width);
        let y = map(node.lat, bbox[0], bbox[2], height, 0);
        street.push([x, y]);
      }
      streets.push(street);
    }
  }
  console.log("Streets:", streets);
}