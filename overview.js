
var sankeygifts;

function setupOverview() {

  var svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  var formatNumber = d3.format(",.0f"),
      format = function(d) { return formatNumber(d) + " TWh"; },
      color = d3.scaleOrdinal(d3.schemeCategory10);

  var sankey = d3.sankey()
        .nodeWidth(25) // was 15
        .nodePadding(0) // was 10
        .size([width, height]);

  // Create new SVG groups for links (chords),
  var link = svg.append("g")
      .attr("class", "links")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.2)
      .selectAll("path");

  // and nodes (bars)
  var node = svg.append("g")
      .attr("class", "nodes")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g");

  let nodes = [];
  let links = [];

  smap.keys().forEach(function(d, i) {
    nodes.push({ "name" : d });
  })

  const rlen = smap.size();

  recvCount.keys().forEach(function(d, i) { // TODO use other source of recv names
    nodes.push({ "name" : d });
  })

  let i = 0

  // TODO optimize! this can't be the best way of doing this
  smap.entries().forEach(function(c) {
      c.value.entries().forEach(function(r) {
          links.push({  "source" : smap.keys().indexOf(c.key),
                        "target" : rlen + recvCount.keys().indexOf(r.key),
                        "value"  : r.value});
      })
  });

  sankeygifts = {nodes, links}

  var path = sankey.link();

  // d3.json("energy.json").then(function(energy) {

      sankey
          .nodes(sankeygifts.nodes)
          .links(sankeygifts.links)
          .layout(16); // what is this?

      var link = svg.append("g").selectAll(".link")
          .data(sankeygifts.links)
          .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          .style("stroke-width", function(d) { return Math.max(1, d.dy); })
          .style("stroke", function(d) { return d.source.color = color(d.source.name.replace(/ .*/, "")); })
          .sort(function(a, b) { return b.dy - a.dy; });

      link.append("title")
          .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });
          // title is an SVG standard way of providing tooltips, up to the browser how to render this, so changing the style is tricky

      var node = svg.append("g").selectAll(".node")
          .data(sankeygifts.nodes)
          .enter()
          .append("g")
          .attr("class", "node")
          .attr("transform", function(d) {
              return "translate(" + d.x + "," + d.y + ")";
          })

      node.append("rect")
          .attr("height", sankey.nodeWidth())
          .attr("width", function(d) { return d.dy; })
          .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
          //.style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
        .append("title")
          .text(function(d) { return d.name + "\n" + format(d.value); });

    // Commented out block for use with d3's official sankey library
    // The above code creates a vertical sankey diagram, by use of 'vsankey.js'
    // Uncomment within 'd3.json(...' + use official d3 sankey for regular sankey chart

    // Keeping this here for now just in case!

    // sankey(energy);
    //
    // link = link
    //   .data(energy.links)
    //   .enter().append("path")
    //     .attr("d", d3.sankeyLinkHorizontal())
    //     .attr("stroke-width", function(d) { return Math.max(1, d.width); });
    //
    // link.append("title")
    //     .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });
    //
    // node = node
    //   .data(energy.nodes)
    //   .enter().append("g");
    //
    // node.append("rect")
    //     .attr("x", function(d) { return d.x0; })
    //     .attr("y", function(d) { return d.y0; })
    //     .attr("height", function(d) { return d.y1 - d.y0; })
    //     .attr("width", function(d) { return d.x1 - d.x0; })
    //     .attr("fill", function(d) { return color(d.name.replace(/ .*/, "")); })
    //     .attr("stroke", "#000");
    //
    // node.append("text")
    //     .attr("x", function(d) { return d.x0 - 6; })
    //     .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
    //     .attr("dy", "0.35em")
    //     .attr("text-anchor", "end")
    //     .text(function(d) { return d.name; })
    //   .filter(function(d) { return d.x0 < width / 2; })
    //     .attr("x", function(d) { return d.x1 + 6; })
    //     .attr("text-anchor", "start");
    //
    // node.append("title")
    //     .text(function(d) { return d.name + "\n" + format(d.value); });


 });

}
