


var dataset = [];


// window.onload is called when DOM is ready -- we can only manipulate it once
// it's ready, so any d3 dom functions must go in here.
window.onload = function () {

  // Look at parallelising window.onload and csv load, i.e. ready() is called
  // when both are done
  d3.csv("gifts_clean.csv", function(d) {
    return {
       rec: d["Receiver"],
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

//Width and height
var w = 1100;
var h = 400;
var pad = 0;


// called when
function ready() {

// Define domain -> range scales that map data values to visual
  var scaley = d3.scaleLinear()
                      .domain([
                        0, d3.max(dataset, function(d) {
                          return d.value;
                        })
                       ])
                      .range([pad, h - pad]);

  // Append svg element to #main div
  var svg = d3.select("#main").append("svg")
      .attr("height", h)
      .attr("width", w);

  var bars = svg.selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", function(d, i) {
          return i * (w / dataset.length + pad);
      })
      .attr("y", function(d) {
          return h - scaley(d.value);
      })
      .attr("width", function(d) {
          return w / dataset.length;
      })
      .attr("height", function(d) {
          return scaley(d.value);
      });

  console.log(bars)
}
