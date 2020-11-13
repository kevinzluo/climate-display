L.LayerGroup.StationsLayer = L.LayerGroup.extend({
  options: {
    minZoom: 10,
  },

  initialize: function (options) {
    options = options || {};
    L.Util.setOptions(this, options);
    this._layers = {};
  },

  onAdd: function (map) {
    map.on("moveend", this.requestRegionData, this);
    this._map = map;
    this.requestRegionData();
  },

  onRemove: function (map) {
    map.off("moveend", this.requestRegionData, this);
    this.clearLayers();
    this._layers = {};
  },

  requestRegionData: function () {
    var self = this;

    (function () {
      var zoom = self._map.getZoom();
      var northeast = self._map.getBounds().getNorthEast();
      var southwest = self._map.getBounds().getSouthWest();
      var $ = window.jQuery;

      if (self._map.getZoom() >= 8) {
        var requestEndpoint = `https://www.ncei.noaa.gov/access/services/search/v1/data?dataset=global-summary-of-the-year&startDate=1900-01-01T00:00:00&endDate=2020-12-31T23:59:59&dataTypes=TAVG,DT00,DX90,PRCP&bbox=${northeast.lat},${southwest.lng},${southwest.lat},${northeast.lng}`;
        $.getJSON(requestEndpoint, function (stateData) {
          self.parseData(stateData);
        });
      }

      // var requestEndpoint = `https://www.ncei.noaa.gov/access/services/data/v1?dataset=global-summary-of-the-year&dataType=SNOW,PRCP,TAVG&stations=${station_string}&startDate=1900-01-01&endDate=2020-12-31&includeAttributes=true&includeStationName=true&format=json`;
      console.log(requestEndpoint);
    })();

    this.clearOutsideBounds();
  },

  addMarker: function (obj) {
    var self = this;
    var marker = L.marker(station_coords_dict[this.options.state][obj.key]);
    var key = obj.key;

    marker.bindPopup(function () {
      var stationURL = `https://www.ncei.noaa.gov/access/services/data/v1?dataset=global-summary-of-the-year&dataType=PRCP,TAVG,DT00,DX90&stations=${obj.key}&startDate=1900-01-01&endDate=2020-12-31&includeAttributes=false&includeStationName=true&format=json`;
      var el = document.createElement("div");
      el.classList.add("marker");
      el.id = obj.key;

      console.log(el);

      $.getJSON(stationURL, function (stationData) {
        console.log(stationData);
        var content = document.createElement("div");
        var s = "";
        s += `<b>Name: </b> ${stationData[0]["NAME"]}<br>`;
        s += `ID: ${obj.key}<br>`;
        s += `Recorded Period: ${stationData[0]["DATE"]} -- ${
          stationData[stationData.length - 1]["DATE"]
        }<br>`;
        s += `Number of Measurements: ${stationData.length}<br>`;
        s += `Coverage: ${
          Math.round(
            (1000 * stationData.length) /
              (parseInt(stationData[stationData.length - 1]["DATE"]) -
                parseInt(stationData[0]["DATE"]) +
                1)
          ) / 10
        }%<br>`;

        var oldAvg = 0,
          newAvg = 0;

        var minSample = Math.min(10, stationData.length);

        var threshold = 10;
        var i = 0,
          j = 0;
        while (i < threshold && j < stationData.length) {
          if (stationData[j]["TAVG"] != undefined) {
            oldAvg += parseFloat(stationData[j]["TAVG"]);
            i++;
            console.log("Old Avg += " + parseFloat(stationData[j]["TAVG"]));
          }
          j++;
        }

        oldAvg /= i;

        i = 0;
        j = 0;

        while (i < threshold && j < stationData.length) {
          if (stationData[stationData.length - 1 - j]["TAVG"] != undefined) {
            newAvg += parseFloat(
              stationData[stationData.length - 1 - j]["TAVG"]
            );
            console.log(
              "New Avg += " +
                parseFloat(stationData[stationData.length - 1 - j]["TAVG"])
            );
            i++;
          }
          j++;
        }

        newAvg /= i;

        oldAvg = Math.round(oldAvg * 10) / 10;
        newAvg = Math.round(newAvg * 10) / 10;

        s += `Average of Oldest 10 Temperatures: ${oldAvg}<br>`;
        s += `Average of Newest 10 Temperatures: ${newAvg}`;

        content.innerHTML = s;
        el.appendChild(content);
      });
      return el;
    });

    if (!this._layers[key]) {
      this._layers[key] = marker;
      this.addLayer(marker);
    }
  },

  parseData: function (data) {
    console.log(data);
    console.log(data.stations.buckets);
    for (obj of data.stations.buckets) {
      if (obj.key in station_coords_dict[this.options.state]) {
        this.addMarker(obj);
      }
    }
  },

  clearOutsideBounds: function () {
    console.log("clearing");
    var bounds = this._map.getBounds();
    var latLng;
    var key;

    for (key in this._layers) {
      if (this._layers.hasOwnProperty(key)) {
        latLng = this._layers[key].getLatLng();

        if (!bounds.contains(latLng)) {
          this.removeLayer(this._layers[key]);
          delete this._layers[key];
        }
      }
    }
  },
});

L.layerGroup.stationsLayer = function (options) {
  return new L.LayerGroup.StationsLayer(options);
};
