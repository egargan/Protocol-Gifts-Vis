

/* JS Object array of data from gifts CSV. */
var dataset = [];


// window.onload is called when DOM is ready -- we can only manipulate it once
// it's ready, so any d3 dom functions must go in here.
window.onload = function () {

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
       country: d["country"]
    };
  }).then(function(data) {
    dataset = data;
    ready();
  });

}

// Default width, will be computed in ready()
var w = 700;
var h = 400;
var pad = 1;

/** Height of the horizontal country gift count bar. */
var countryBarHeight = 40;
var recvBarHeight = 25;

// Chart scales
var scaleCountryCount, scaleRecvCount;

var visSvg;

/** Width of visualisation SVG. */
var visW;


/*  Will only be called when dom is ready, i.e. after window.onload() */
function ready() {

  // Get main's computed width
  visW = d3.select("#main").node().getBoundingClientRect().width;

  // Append svg element to #main div
  visSvg = d3.select("#main").append("svg")
      .attr("height", h)
      .attr("width", visW)
      .attr("id", "vis")

  drawCountriesBar();

  drawRecvBar();
}

/** Creates SVGs for horiztonal stacked bar chart visualising the number of
gifts per country. */
function drawCountriesBar() {

  countCountries();

  scaleCountryCount = d3.scaleLinear()
                      .domain([0, (d3.sum(countryCount.values()) + ((countryCount.size()-1) * pad))])
                      .range([0, visW]);

  // Running total of x positions
  let tot = 0;
  let temp = 0;

  var cbars = visSvg.append("g")
        .attr("id", "groupCountryBars")
        .selectAll("rect")
        .data(countryCount.entries())
        .enter()
        .append("rect")
        .attr("class", "countryBars")
        .attr("x", function(d) {
           temp = tot;
           tot += scaleCountryCount(d.value + pad);
           return temp;
        })
        .attr("y", h - countryBarHeight)
        .attr("width", function(d) {
            return scaleCountryCount(d.value);
        })
        .attr("height", countryBarHeight);

}

function drawRecvBar() {

   countReceivers();

   // Define receiver count mappings to be half that of svg width
   scaleRecvCount = d3.scaleLinear()
                    .domain([0, (d3.sum(recvCount.values()) + ((recvCount.size()-1) * pad))])
                    .range([0, visW / 2]);

   // Running total of x positions
   let tot = 0;
   let temp = 0;

   var rbars = visSvg.append("g")
          .attr("id", "groupRecvBars");

   rbars.selectAll("rect")
          .data(recvCount.entries())
          .enter()
          .append("rect")
          .attr("class", "recvBars")
          .attr("x", function(d) {
             temp = tot;
             tot += scaleRecvCount(d.value + pad);
             return temp;
          })
          .attr("y", 40)
          .attr("width", function(d) {
              return scaleRecvCount(d.value);
          })
          .attr("height", recvBarHeight);

   // TODO: could probably calculate this before bars being generated, then apply offset to x
   rbars.attr("transform", "translate(" + ((tot - pad) / 2) + ", 0)");


}


var countryCount = d3.map();
var recvCount = d3.map();

var smap = d3.map();

/** Populates map with the number of per-country gifts. */
function countCountries() {

  for (let c of dataset) {
    countryCount.set(c.country, (countryCount.get(c.country) || 0) + 1)
  }

}


function countReceivers() {

  for (let c of dataset) {
    recvCount.set(c.recv, (recvCount.get(c.recv) || 0) + 1)
  }

  // For any receiver with less than n gifts, add them to a 'misc' category
  // -- there are a good few unique receivers, partly due to the dataset
  // having fucking loads of typos. Will hopefully clean before deadline.
  recvCount.set("misc", 0);

  recvCount.each(function(d, k) { // 'd' is map value, 'k' is map key
     if (d < 10) {
       recvCount.set("misc", recvCount.get("misc") + d);
       recvCount.remove(k);
     }
  })

  // For each country, a count the gifts sent to each recipient is stored (a map of maps)
  for (let c of dataset) {

    // If country is not present in outer map, then create a new one.
    if (!smap.has(c.country)) {
      smap.set(c.country, d3.map());
    }

    // smap.set(c.country, (smap.get(c.country) || d3.map()));

    // Each country owns an inner map of Receiver -> gift count.
    // Increment this country's count for the receiver value in 'c'.
    // If receiver considered 'misc' (above), then increment the value with key "misc"
    smap.get(c.country).set((recvCount.has(c.recv) ? c.recv : "misc"),
          (smap.get(c.country).get(c.recv) || 0) + 1);
  }

}












//
