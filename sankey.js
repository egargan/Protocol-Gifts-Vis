
// This version of D3's Sankey function creates a vertically-oriented
// diagram, adapted for this visualisation.

// Much of this code is left uncommented due to the majority of it not
// being mine (egargan) -- but any additions or modifications have been commented
// accordingly.

// Original code found at https://github.com/benlogan1981/VerticalSankey

d3.sankey = function() {

  var sankey = {},
      size = [1, 1],
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };


  // Custom scale factor for top-most 'source' bar
  var sourcebarsf = 0.6;

  // Padding between source (top) nodes only
  var sourcePad = 10;

  // Simple getter for above variable
  sankey.sourcepad = function() {
      return sourcePad;
  }


  sankey.layout = function(iterations) {

    computeNodeLinks();
    computeNodeValues();

    computeNodeDepths();
    computeNodeBreadths(iterations);

    computeLinkDepths();
    return sankey;

  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };



  sankey.link = function() {

    var curvature = .5;

    function link(d) {

      // .sy/.ty should be  .sy/.ty!
      // This code still uses much of the same code os the original D3
      // sankey lib, hence y's meaning x's, etc.

      // d.sy/ty = offset within node
      var x0 = d.source.x + d.sy,            // chord begin X
          x1 = d.target.x + d.ty,            // chord end X
          y0 = d.source.y + nodeWidth,       // chord begin Y
          y1 = d.target.y,                   // chord end Y
          yi = d3.interpolateNumber(y0, y1),
          y2 = yi(curvature),                // bezier control point (right side)
          y3 = yi(1 - curvature);            // bezier control point (left side)

      // Here we return an SVG description for the shape of the current chord,
      // formed using two bezier curves (where before chords were assumed
      // to be constant width, and drawn as lines)

      return   "M" + x0 + "," + y0  // Left bezier start coords, from source node (top)
             + "C" + x0 + "," + y2  // Control point (right of chord)
             + " " + x1 + "," + y3  // Control point (left of chord)
             + " " + x1 + "," + y1  // End coords

             + "H" + (x1 + d.dy)    // Move right by bottom width of chord

             // Here we 'chain' bezier definitions, meaning we only have to define
             // more control points and SVG assumes we're referring to a new bezier

             // Right-side bezier, drawn from bottom (target) to top (source)
             // i.e. so invert control point ordering

             + "C" + (x1 + d.dy) + "," + y3 // Control point (left
             + " " + (x0 + d.dy * sourcebarsf) + "," + y2 // Control point (right)
             + " " + (x0 + d.dy * sourcebarsf) + "," + y0 // End coords

             + "Z" // Terminate shape definition
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
    });
  }

  // take a grouping of the nodes - the vertical columns
  // there shouldnt be 8 - there will be more, the total number of 1st level sources
  // then iterate over them and give them an incrementing x
  // because the data structure is ALL nodes, just flattened, don't just apply at the top level
  // then everything should have an X
  // THEN, for the Y
  // do the same thing, this time on the grouping of 8! i.e. 8 different Y values, not loads of different ones!
  function computeNodeBreadths(iterations) {

      var nodesByBreadth = d3.nest()
      .key(function(d) { return d.y ; })
      .sortKeys(d3.ascending)
      .entries(nodes)
      .map(function(d) { return d.values; }); // values! we are using the values also as a way to seperate nodes (not just stroke width)?

      // this bit is actually the node sizes (widths)
      // var ky = (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value)
      // this should be only source nodes surely (level 1)
      var ky = (size[0] - (nodesByBreadth[0].length - 1) * nodePadding) / d3.sum(nodesByBreadth[0], value);

      // Give each node its width
      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {

          node.x = i

          // Assuming 'node' object contains 'type', use to apply conditional
          // scaling to the top 'source' bar
          if (node.type == "source") {
              node.dy = node.value * ky * sourcebarsf;
          } else {
              node.dy = node.value * ky;
          }

        });
      });

      // Give each link item its chord width
      links.forEach(function(link) {
        link.dy = link.value * ky;
      });

      resolveCollisions();

      for (var alpha = 1; iterations > 0; --iterations) {
        relaxLeftToRight(alpha);
        resolveCollisions();

        relaxRightToLeft(alpha *= .99);
        resolveCollisions();
      }

      // Counter variables, used to be able to split 'node'
      // into source and target nodes (they're both in a single collection!)
      var numSourceNodes = 0;
      var numTargetNodes = 0;

      nodes.forEach(function(node) {
          if (node.type == "source") {
              numSourceNodes++;
          } else if (node.type == "target") {
              numTargetNodes++;
          }
      })

      // Apply custom transformations to nodes coordinates --
      // Above code iteratively repositions the code to 'organise' the sankey
      // this loop simply scales and re-translates the results of this process
      // to achieve custom positioning, e.g. central recipient bar
      nodes.forEach(function(node, i) {

          if (node.type == "source") {

              // Reposition each node according to padding and scale factor
              // Referencing width defined in script.js ... disgraceful
              node.x -= (ovw * ((sourcebarsf * sourcebarsf) / 2)
                      - (i - numTargetNodes) * sourcePad)
                      + sourcePad * (numSourceNodes - 1);
          }
      })


      function relaxLeftToRight(alpha) {

          nodesByBreadth.forEach(function(nodes, breadth) {
              nodes.forEach(function(node) {
                  if (node.targetLinks.length) {
                      var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
                      node.x += (y - center(node)) * alpha;
                  }
              });
          });

        function weightedSource(link) {
          return center(link.source) * link.value;
        }
      }

     function relaxRightToLeft(alpha) {

        nodesByBreadth.slice().reverse().forEach(function(nodes) {
          nodes.forEach(function(node) {
            if (node.sourceLinks.length) {
              var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
              node.x += ((y - center(node)) * alpha);
            }
          });
        });

        function weightedTarget(link) {
          return center(link.target) * link.value;
        }
      }

      function resolveCollisions() {

        nodesByBreadth.forEach(function(nodes) {
            var node,
            dy,
            x0 = 0,
            n = nodes.length,
            i;

            // Push any overlapping nodes right.
            nodes.sort(ascendingDepth);
            for (i = 0; i < n; ++i) {
                node = nodes[i];
                dy = x0 - node.x;
                if (dy > 0) node.x += dy;
                x0 = node.x + node.dy + nodePadding;
            }

            // If the rightmost node goes outside the bounds, push it left.
            dy = x0 - nodePadding - size[0]; // was size[1]
            if (dy > 0) {
                x0 = node.x -= dy;

                // Push any overlapping nodes left.
                for (i = n - 2; i >= 0; --i) {
                    node = nodes[i];
                    dy = node.x + node.dy + nodePadding - x0; // was y0
                    if (dy > 0) {
                      node.x -= dy;
                    }
                    x0 = node.x;
                }
            }
        });
      }

      function ascendingDepth(a, b) {
          return a.y - b.y; // flows go up
      }
  }

  // this moves all end points (sinks!) to the most extreme bottom
  function moveSinksDown(y) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.y = y - 1;
      }
    });
  }

  // shift their locations out to occupy the screen
  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.y *= kx;
    });
  }

  function computeNodeDepths() {

        var remainingNodes = nodes,
        nextNodes,
        y = 0;

        while (remainingNodes.length) {
          nextNodes = [];
          remainingNodes.forEach(function(node) {
            node.y = y;
            //node.dx = nodeWidth;
            node.sourceLinks.forEach(function(link) {
              if (nextNodes.indexOf(link.target) < 0) {
                nextNodes.push(link.target);
              }
            });
          });
          remainingNodes = nextNodes;
          ++y;
        }

        // move end points to the very bottom
        moveSinksDown(y);

        scaleNodeBreadths((size[1] - nodeWidth) / (y - 1));
    }

  // .ty is the offset in terms of node position of the link (target)
  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function(node) {

      var sy = 0, ty = 0;

      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += (link.dy * sourcebarsf); // Apply custom scaling!
      });

      node.targetLinks.forEach(function(link) {
        // this is simply saying, for each target, keep adding the width of the link
        link.ty = ty;
        ty += (link.dy);
        //ty -= link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      //return a.source.y - b.source.y;
        return a.source.x - b.source.x;
    }

    function ascendingTargetDepth(a, b) {
      //return a.target.y - b.target.y;
        return a.target.x - b.target.x;
    }
  }

  function center(node) {
      return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};
