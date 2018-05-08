

/* JS Object array of data from gifts CSV. */
var dataset = [];

var colours = ["#FFC312", "#F79F1F", "#EE5A24", "#EA2027", "#C4E538", "#A3CB38",
               "#009432", "#006266", "#12CBC4", "#1289A7", "#0652DD", "#1B1464",
               "#FDA7DF", "#D980FA", "#9980FA", "#5758BB", "#ED4C67", "#B53471",
               "#833471", "#6F1E51"]


// window.onload is called when DOM is ready -- we can only manipulate it once
// it's ready, so any d3 dom functions must go in here.
window.onload = function () {

  // Get main's computed width
  w = d3.select("#main").node().getBoundingClientRect().width;

  // Append svg element to #main div
  svg = d3.select("#main").append("svg")
      .attr("height", h)
      .attr("width", w)
      .attr("id", "vis")


  // Look at parallelising window.onload and csv load, i.e. ready() is called
  // when both are done
  d3.csv("gifts_clean.csv", function(d) {
    return {
       recv: d["Receiver"],
       from: d["From"],
       //just: d["Justification"],
       gift: d["Gift"],
       //disp: d["Disposition"],
       value: +d["Value_USD"],
       date: d["Date"],
       country: d["country"],

       // 'min' versions have special characters removed so can be
       // used as HTML classes

       countrymin: (d["country"].replace(/[^a-zA-Z]/g, "")),
       recvmin: (d["Receiver"].replace(/[^a-zA-Z]/g, "")),
       frommin: (d["From"].replace(/[^a-zA-Z]/g, ""))
    };
  }).then(function(data) {
    dataset = data;
    ready();
  });

}

// Default width, will be computed in ready()
var w = 700;
var h = 500;
var pad = 1;

/** Height of the horizontal country gift count bar. */
var countryBarHeight = 40;
var recvBarHeight = 25;

// Chart scales
var scaleCountryCount, scaleRecvCount;

var svg;

/** Width of visualisation SVG. */
var visW;


/*  Will only be called when dom is ready, i.e. after window.onload() */
function ready() {

  countReceivers();
  setupOverview();

  // drawCountriesBar();
  // drawRecvBar();
}


var countryCount = d3.map();
var recvCount = d3.map();

var smap = d3.map();

/** Populates map with the number of per-country gifts. */
function countCountries() {

  for (let c of dataset) {
    countryCount.set(c.countrymin, (countryCount.get(c.countrymin) || 0) + 1)
  }

}


function countReceivers() {

  for (let c of dataset) {
    recvCount.set(c.recvmin, (recvCount.get(c.recvmin) || 0) + 1)
  }

  // For any receiver with less than n gifts, add them to a 'misc' category
  // -- there are a good few unique receivers, partly due to the dataset
  // having fucking loads of typos. Will hopefully clean before deadline.
  recvCount.set("misc", 0);

  recvCount.each(function(d, k) { // 'd' is map value, 'k' is map key
     if (d < 20) {
       recvCount.set("misc", recvCount.get("misc") + d);
       recvCount.remove(k);
     }
  })

  // For each country, a count the gifts sent to each recipient is stored (a map of maps)
  for (let c of dataset) {

    // If country is not present in outer map, then create a new one.
    if (!smap.has(c.countrymin)) {
      smap.set(c.countrymin, d3.map());
    }

    // smap.set(c.country, (smap.get(c.country) || d3.map()));

    // Each country owns an inner map of Receiver -> gift count.
    // Increment this country's count for the receiver value in 'c'.
    // If receiver considered 'misc' (above), then increment the value with key "misc"
    smap.get(c.countrymin).set((recvCount.has(c.recvmin) ? c.recvmin : "misc"),
          (smap.get(c.countrymin).get(c.recvmin) || 0) + 1);
  }

}















//
