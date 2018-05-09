

// JS Object array of data from gifts CSV.
var dataset = [];

// Selection of colours that the country nodes choose from
var colours = ["#FFC312", "#F79F1F", "#EE5A24", "#EA2027", "#C4E538", "#A3CB38",
               "#009432", "#006266","#FDA7DF", "#D980FA", "#9980FA", "#5758BB",
               "#ED4C67", "#B53471", "#833471", "#6F1E51"]

// Hard coded colour values -- horribly inextensible but it will have to do :/
var blues = {"PresidentBarackObama": "#1E3888",
             "FirstFamilyObamas" : "#00A6FB",
             "FirstLadyLauraBush" : "#016FB9",
             "FirstLadyMichelleObama" : "#0098CD",
             "miscWHStaff" : "#5DA9E9",
             "PresidentGeorgeBush" : "#1D3461"}


// Default dimensions for overview SVG
var ovw = 700;
var ovh = 400;

// Default dimensions for zoom SVG
var zw = 700;
var zh = 400;

// Above widths overwritten in window.onload() below,


// overviewContainer element to contain vis
var overviewContainer, zoomContainer;

// window.onload is called when DOM is ready -- we can only manipulate it once
// it's ready, so any d3 dom functions must go in here.
window.onload = function () {

  // Get main's computed width
  ovw = zw =  d3.select("#main").node().getBoundingClientRect().width;

  // Append overviewContainer element to #main div
  overviewContainer = d3.select("#main").append("svg")
      .attr("z-index", "1")
      .attr("position", "absolute")
      .attr("top", 0)
      .attr("left", 0)
      .attr("height", ovh)
      .attr("width", ovw)
      .attr("id", "overview")

  zoomContainer = d3.select("#main").append("svg")
      .attr("z-index", "-1")
      .attr("position", "absolute")
      .attr("top", 0)
      .attr("left", 0)
      .attr("height", zh)
      .attr("width", zw)
      .attr("id", "zoom")


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

/*  Will only be called when dom is ready, i.e. after window.onload() */
function ready() {

  countReceivers();
  setupOverview(overviewContainer);

}

// Wipes any previous 'zoomed' country, and displays the given country's gifts
// data in the separate 'zoom' svg.
function zoomCountry(country) {

  zoomContainer
     .transition()
     .duration(100)
     .style("opacity", 0)

     .on("end", function(d) {

         zoomContainer.selectAll("*").remove();
         setupZoom(country);
         zoomContainer.style("opacity", 1)

     })

}



// A map of all of the dataset's receivers, and the amount of gifts they received
var recvGiftCount = d3.map();

// A 'map of maps', where each outer map entry represents a single country,
// which holds its own map of the receivers it gave gifts to, and how many
var countryRecvCounts = d3.map();

function countReceivers() {

  // Iterate over dataset and count gifts
  for (let c of dataset) {
    recvGiftCount.set(c.recvmin, (recvGiftCount.get(c.recvmin) || 0) + 1)
  }

  // For any receiver with less than n gifts, add them to a 'misc' category
  // -- there are a good few unique receivers, partly due to the dataset
  // having loads of typos! Will hopefully clean before deadline.
  recvGiftCount.set("miscWHStaff", 0);

  recvGiftCount.each(function(d, k) { // 'd' is map value, 'k' is map key

     // threshold minimum gift count so receiver nodes aren't too small
     if (d < 100) {

       // Add any misc. receivers' counts to the total misc count,
       // and remove from map.
       recvGiftCount.set("miscWHStaff", recvGiftCount.get("miscWHStaff") + d);
       recvGiftCount.remove(k);
     }
  })

  // For each country, a count the gifts sent to each recipient is stored (a map of maps)
  for (let c of dataset) {

    // If country is not present in outer map, then create a new one.
    if (!countryRecvCounts.has(c.countrymin)) {
      countryRecvCounts.set(c.countrymin, d3.map());
    }

    // Each country owns an inner map of Receiver -> gift count.
    // Increment this country's count for the receiver value in 'c'.
    // If receiver considered 'misc' (above), then increment the value with key "misc"
    countryRecvCounts.get(c.countrymin).set((recvGiftCount.has(c.recvmin) ? c.recvmin : "miscWHStaff"),
          (countryRecvCounts.get(c.countrymin).get(c.recvmin) || 0) + 1);
  }

}















//
