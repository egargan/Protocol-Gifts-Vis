

// Populates a given SVG element with the 'zoom' state visualisation
// for the given country, showing a timeline of that country's gifts
// and their value
function setupZoom(country) {

  if (country == null) return;

   var svg = d3.select("svg#zoom")

   const width = +svg.attr("width"),
         height = +svg.attr("height");

   // X-ward padding for timeline
   const sidepad = 0.1 * width;
   const bottompad = 0.05 * height

   const barwidth = 5;

   // Height allowed for 'value' bar chart
   const valueBarHeight = 0.8 * height;

   // Object array of country's individual gift data
   var countryGifts = []

   // Temp vars
   let i = 0, date;

   // Iterate over dataset and collect subset whose country = given country
   for (let c of dataset) {

     if (c.countrymin == country) {

         date = c.date.split("-");
         countryGifts.push({  year:    +date[0],
                              month:   +date[1],
                              day:     +date[2],
                              value:   +c.value,
                              recv:    c.recvmin,
                              from:    c.frommin,
                              desc:    c.gift,
                              // 'Pretty print' versions
                              recvpp:  c.recv,
                              frompp:  c.from,
                            });
      }
   }

   // Apply 'misc' receiver filtering to this subset
   countryGifts.forEach(function(d) {
      if (!countryRecvCounts.get(country).has(d.recv)) {
         d.recv = "miscWHStaff";
      }
   })


   // Get max date
   var maxdate = countryGifts.filter(d => d.year == d3.max(countryGifts, date =>  date.year))
   maxdate = maxdate.filter(d => d.month == d3.max(maxdate, date =>  date.month))
   maxdate = maxdate.filter(d => d.day == d3.max(maxdate, date =>  date.day))[0]

   // And min date, for timeline scale
   var mindate = countryGifts.filter(d => d.year == d3.min(countryGifts, date => date.year))
   mindate = mindate.filter(d => d.month == d3.min(mindate, date =>  date.month))
   mindate = mindate.filter(d => d.day == d3.min(mindate, date =>  date.day))[0]


   var timescale = d3.scaleTime()
        .domain([new Date(mindate.year, mindate.month, mindate.day),
                 new Date(maxdate.year, maxdate.month, maxdate.day)])
        .range([sidepad, width - sidepad]);

   var valuescale = d3.scaleLinear()
        .domain([0,
                 d3.max(countryGifts, function(d) { return d.value; })])
        .range([height - valueBarHeight, height - bottompad])


   // Define axes
   var timeaxis = d3.axisTop(timescale);
   var valuesaxis = d3.axisRight(valuescale);


   // Create timeline element group
   var timelineg = svg.append("g").attr("class", "timeline")

   // Draw the 'receiver' bars -- the bars north of the timeline whose
   // colour represents the Recipient (was supposed to link to pictures)
   // of them like in the main Sankey but couldn't crack it :/
   timelineg.append("g").attr("class", "recvbars")
        .selectAll("rect")
        .data(countryGifts)
        .enter()
        .append("rect")
        .attr("width", barwidth)
        .attr("height", height - valueBarHeight)
        .attr("x", function(d) {
            return timescale(new Date(d.year, d.month, d.day))
        })
        .style("fill", function(d) {
            return blues[d.recv];
        })

    // Draw bars extending downwards encoding gift value
    timelineg.append("g").attr("class", "valuebars")
         .selectAll("rect")
         .data(countryGifts)
         .enter()
         .append("rect")
         .attr("width", barwidth)
         .attr("height", function(d) {
             return valuescale(d.value);
         })
         .attr("x", function(d) {
             return timescale(new Date(d.year, d.month, d.day))
         })
         .attr("y", height - valueBarHeight)
         .style("fill", function(d) {
             return "red"
         })
         .append("title")
              .text(function(d) {
                   return "Date: " + d.year + "/" + d.month + "/" + d.day + "\n"
                        + "Value: $" + d.value + "\n"
                        + "To: " +    d.recv + "\n"
                        + "From: " +  d.frompp + "\n"
                        + "Description: " + d.desc })

     // Draw date axis
     timelineg.append("g")
        .attr("transform", "translate(0," + (height - valueBarHeight) + ")")
        .call(timeaxis);

     // Draw value axis label
     timelineg.append("text")
          .attr("text-anchor", "end")
          .attr("x", width)
          .attr("y", (height - valueBarHeight * 1.05))
          .style("font-family","sans-serif")
          .style("font-size", "0.9em")
          .text("Value (USD)");

      // Draw value axis down right hand side
      timelineg.append("g")
          .attr("transform", "translate(" + (width - sidepad * 0.75) + ", 0)")
          .call(valuesaxis);


}
