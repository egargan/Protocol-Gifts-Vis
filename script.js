
/* ---- Sample D3 script, not related to project! ---- */

var dataset = []

for (var i = 0; i < 10; i++) {
   dataset.push([Math.random() * 200, Math.random() * 200]);
}

//Width and height
var w = 700;
var h = 400;
var pad = 40

d3.max(dataset, function(d) {    //Returns 480
    return d[0];  //References first value in each sub-array
});

var xscale = d3.scaleLinear()
                    .domain([
                      d3.min(dataset, function(d) {
                        return d[0];
                      }), d3.max(dataset, function(d) {
                        return d[0];
                      })
                     ])
                    .range([pad, w - pad])
                    .nice();

var yscale = d3.scaleLinear()
                    .domain([
                      d3.min(dataset, function(d) {
                        return d[1];
                      }), d3.max(dataset, function(d) {
                        return d[1];
                      })
                     ])
                    .range([h - pad, pad]);

  var rscale = d3.scaleLinear()
                       .domain([0, d3.max(dataset, function(d) { return d[1]; })])
                       .range([2, 10]);




// doc.onload is called when DOM is ready -- we can only manipulate it once
// it's ready, so any d3 dom functions must go in here.
window.onload = function () {


  var svg = d3.select("#main").append("svg")
      .attr("height", h)
      .attr("width", w);

  var points = svg.selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return xscale(d[0]);
    })
    .attr("cy", function(d) {
      return yscale(d[1]);
    })
    .attr("r", function(d) {
      return rscale(d[1]);
    })
    .attr("fill", "teal")

  svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function(d) {
      return Math.round(d[0]) + ", " + Math.round(d[1]);
    })
    .attr("x", function(d) {
      return xscale(d[0]);
    })
    .attr("y", function(d) {
      return yscale(d[1]);
    })
    .attr("font-size", 10)
    .attr("font-family", "sans-serif")



}
