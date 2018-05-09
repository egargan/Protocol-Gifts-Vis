
// Creates the main 'overview' state Sankey diagram, and populates
// the given SVG element with this visualisation.
function setupOverview(_svg) {

  var svg = _svg;

  var width = +svg.attr("width"),
      height = +svg.attr("height");

  // Create scheme for tooltip text
  var formatNumber = d3.format(",.0f"),
      format = function(d) { return formatNumber(d) + " Gifts"; },
      color = d3.scaleOrdinal(d3.schemeCategory10);

  // Construct sankey object
  var sankey = d3.sankey()
        .nodeWidth(25)
        .nodePadding(0)    // Disregard -- custom padding to top nodes is applied within
        .size([width, height * 0.7]);

  // SVG element group containing all of the elements comprising the diagram
  var sankg = svg.append("g").attr("class", "sankg")

  let nodes = [];
  let links = [];

  countryRecvCounts.keys().forEach(function(d, i) {
    nodes.push({ "name" : d,
                 "type" : "target" });
  })

  const rlen = countryRecvCounts.size();

  recvGiftCount.keys().forEach(function(d, i) { // TODO use other source of recv names
    nodes.push({ "name" : d,
                 "type" : "source"  });
  })

  // TODO optimize! this can't be the best way of doing this
  countryRecvCounts.entries().forEach(function(c) {
      c.value.entries().forEach(function(r) {
          links.push({  "target" : countryRecvCounts.keys().indexOf(c.key),
                        "source" : rlen + recvGiftCount.keys().indexOf(r.key),
                        "value"  : r.value});
      })
  });


  // Create reference to the path data sankey will generate
  var path = sankey.link();

  // Give sankey link and node data.
  // 'layout(x)' is number of iterations to let sankey perform its iterative
  // repositioning of node elements -- more iterations == 'better' arrangement
  // of nodes and links
  sankey.nodes(nodes).links(links).layout(32);


  // Dimensions of receiver portrait elements, defined in terms of total vis height
  const portraitSize = height * 0.14;
  const portraitPad = portraitSize * 0.2;
  const totPortraitOffset = portraitSize + portraitPad * 2

  // Ratio of border width to total size
  const portraitBorderWidth = 3;

  // Create new SVG group for 'node' elements
  var node = sankg.append("g")
      .attr("id", "nodeg")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", function(d) { return "node " + d.name + " "  + d.type; })
      .attr("transform", function(d) { return "translate(" + d.x + "," + (d.y + totPortraitOffset) + ")"; })
      .attr("cursor", function(d) { if (d.type == "target") return "pointer"})
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)

      .on("click", function(d) { // On click event -- request country to be zoomed

           if (d.type == "target") { // i.e. if country node
               zoomCountry(d.name);
           }
      });

  // Draw source and target nodes
  node.append("rect")
      .attr("height", sankey.nodeWidth())
      .attr("width", function(d) { return d.dy; })
      .style("fill", function(d, i) { return d.color = colours[i % colours.length]; })

  // Give nodes on-hover tooltips, provided by SVG's 'title' entities
  node.append("title")
          .text(function(d) { return d.name + "\n" + format(d.value); })

  // Get collection of only the top, 'source' node elements
  // 'source' because flow is technically starting at the receiver nodes,
  // sankey.js doesn't allow for upward-directed flow!
  sourcenodes = node.filter(function(d) { return d.type == "source"; })

  // Recolour source nodes using different pallette
  sourcenodes
    .style("fill", function(d, i) { return d.color = blues[d.name]; })
    .selectAll("rect").style("fill", function(d) { return d.color })

  // Create clipping masks for recipient images
  sourcenodes
      .append("clipPath")
      .attr("id", function(d) { return d.name;})
      .append("circle")
      .attr("r", portraitSize / 2 - portraitBorderWidth)
      .attr("cx", function(d) { return d.dy * 0.5; })
      .attr("cy", (-portraitSize * 0.5) - portraitPad)

  // Create border circles, slightly larger than image clipping mask
  sourcenodes
      .append("circle")
      .attr("class", "portrait")
      .attr("r", portraitSize / 2)
      .attr("cx", function(d) { return d.dy * 0.5; })
      .attr("cy", (-portraitSize * 0.5) - portraitPad)

   // Get images and apply clipping masks to them
   sourcenodes
      .append("svg:image")
      .attr("width", portraitSize - portraitBorderWidth)
      .attr("height", portraitSize - portraitBorderWidth)
      .attr('x', function(d) { return (d.dy - portraitSize + portraitBorderWidth) * 0.5;})
      .attr('y', -portraitSize - portraitPad + portraitBorderWidth * 0.5)
      .attr("clip-path",  function(d) { return "url(#" + d.name + ")" })
      .attr("xlink:href", function(d) { return "images/" + d.name + ".jpg"})
      .style("border", function(d) { return "10px solid" + d.color; })

      .append("title")
           .text(function(d) { return d.name + "\n" + format(d.value); })

  // Create new group for 'links', i.e. Sankey chords
  var link = sankg.append("g")
      .attr("id", "linkg")

  // Use links data returned from sankey call to draw paths
  link.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("class", function(d) { return "link " + d.source.name + " " + d.target.name })
      .attr("transform", "translate(0," + totPortraitOffset + ")")
      .attr("d", path)
      .style("fill", function(d, i) { return d.source.color })
      .style("fill-rule", "nonzero")
      .sort(function(a, b) { return b.dy - a.dy; })
      .on("mouseover", linkMouseOver)
      .on("mouseout", linkMouseOut)

  .append("title")
      .text(function(d) { return d.target.name + " → " + d.source.name + "\n" + format(d.value); });



    // --- Event handler methods --- //

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

}
