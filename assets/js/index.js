var bounds = new L.LatLngBounds(new L.LatLng(15, -178), new L.LatLng(75, -65));

var map = L.map("map", {
  center: bounds.getCenter(),
  maxBounds: bounds,
  maxBoundsViscosity: 1,
  zoom: 5,
  minZoom: 4,
}).setView([37.0902, -95.7129], 5);

// var latlngs = L.rectangle(bounds).getLatLngs();
// L.polyline(latlngs[0].concat(latlngs[0][0])).addTo(map);
// L.polyline(latlngs[0].concat(latlngs[0][0])).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

console.log(states);

var us_states = L.geoJSON(states, {
  attribution: "US Census Bureau",
  style: stateStyle,
  onEachFeature: onEachState,
}).addTo(map);

function stateStyle(feature) {
  return {
    fillColor: "blue",
    fillOpacity: 0.3,
    weight: 2,
    opacity: 1,
    color: "black",
  };
}

function onEachState(feature, layer) {
  layer.on({
    mouseover: highlightLayer,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });

  console.log(layer.options);
}

function highlightLayer(e) {
  var layer = e.target;

  if (!layer.options.clicked) {
    layer.setStyle({
      weight: 5,
      color: "black",
      fillOpacity: 0.5,
    });
  }
}

function resetHighlight(e) {
  if (!e.target.options.clicked) {
    us_states.resetStyle(e.target);
  }
}

function zoomToFeature(e) {
  for (layerNum of Object.keys(us_states._layers)) {
    if (us_states._layers[layerNum].options.clicked) {
      us_states._layers[layerNum].options.clicked = false;
      us_states.resetStyle(us_states._layers[layerNum]);
    }
  }
  map.fitBounds(e.target.getBounds());
  e.target.options.clicked = true;

  e.target.setStyle({
    fillOpacity: 0.7,
    color: "black",
    weight: 5,
  });

  var layer = e.target;
  var state = layer.feature.properties.NAME;

  if (stationLayer != undefined) {
    map.removeLayer(stationLayer);
  }

  stationLayer = L.layerGroup.stationsLayer({
    state: state,
  });

  stationLayer.addTo(map);
}

console.log(us_states);

var stationLayer = L.layerGroup.stationsLayer({
  state: "Tennessee",
});

stationLayer.addTo(map);
