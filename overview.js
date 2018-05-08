
var sankeygifts;

function setupOverview() {

  var svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  var formatNumber = d3.format(",.0f"),
      format = function(d) { return formatNumber(d) + " Gifts"; },
      color = d3.scaleOrdinal(d3.schemeCategory10);

  var sankey = d3.sankey()
        .nodeWidth(25) // was 15
        .nodePadding(0) // was 10
        .size([width, height]);

  // and nodes (bars)
  var node = svg.append("g")
      .attr("class", "nodes")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g");

  let nodes = [];
  let links = [];

  smap.keys().forEach(function(d, i) {
    nodes.push({ "name" : d,
                 "type" : "target" });
  })

  const rlen = smap.size();

  recvCount.keys().forEach(function(d, i) { // TODO use other source of recv names
    nodes.push({ "name" : d,
                 "type" : "source"  });
  })

  let i = 0

  // TODO optimize! this can't be the best way of doing this
  smap.entries().forEach(function(c) {
      c.value.entries().forEach(function(r) {
          links.push({  "target" : smap.keys().indexOf(c.key),
                        "source" : rlen + recvCount.keys().indexOf(r.key),
                        "value"  : r.value});
      })
  });

  sankeygifts = {nodes, links}

  var path = sankey.link();

  sankey
      .nodes(sankeygifts.nodes)
      .links(sankeygifts.links)
      .layout(4); // number of 'relax' iterations

  var node = svg.append("g")
      .attr("id", "nodeg")
      .selectAll(".node")
      .data(sankeygifts.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("class", function(d) {
        return "node " + d.name;
      })
      .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
      })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)

  node.append("rect")
      .attr("height", sankey.nodeWidth())
      .attr("width", function(d) { return d.dy; })
      .style("fill", function(d, i) { return d.color = colours[i % colours.length]; })
    .append("title")
      .text(function(d) { return d.name + "\n" + format(d.value); });

  var link = svg.append("g")
      .attr("id", "linkg")
      .selectAll(".link")
      .data(sankeygifts.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("class", function(d) {
         return "link " + d.source.name + " " + d.target.name
      })
      .attr("d", path)
      .style("fill", function(d, i) { return d.target.color })
      .style("fill-rule", "nonzero")
      .sort(function(a, b) { return b.dy - a.dy; })
      .on("mouseover", linkMouseOver)
      .on("mouseout", linkMouseOut)

  link.append("title")
      .text(function(d) { return d.target.name + " → " + d.source.name + "\n" + format(d.value); });
      // title is an SVG standard way of providing tooltips, up to the browser how to render this, so changing the style is tricky




}


function nodeMouseOver(d) {

  var link = svg.selectAll("#linkg path:not(." + d.name + ")")

  link.style("fill-opacity", 0.05);

}

function nodeMouseOut(d) {

  var link = svg.selectAll(".link:not(." + d.name + ")")
  link.style("fill-opacity", 1);

}

// holds timeout object used to reduce the 'flickering'
// between mouseover events
var timeout;

function linkMouseOver(d) {

  // clear any pending timeout if new event received, so the links are not reset
  window.clearTimeout(timeout)

  var link = svg.selectAll("#linkg path")

  // reduce opacity of every element but that being hovered over
  link.style("fill-opacity", function(dd) {
      return d == dd ? "1" : "0.05"
  })

}


function linkMouseOut(d, i) {

  window.clearTimeout(timeout)
  timeout = window.setTimeout(function() {

    var link = svg.selectAll("#linkg path")


    link.style("fill-opacity", function(d) {
      return "1"
    })

  }, 300);

}
