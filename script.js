(function (){
  'use strict';

  // book1: Top Bar Chart (x0)
  // book2: Bottom Bar Chart (x1)
  // connections: connect top bars with bottom bars
  // y-axis: 0 to 100 for book1 and book2
  // x-axis: decided by maxValues function which returns {book1, book2, peek}

  var margin = {
        top: 60,
        right: 20,
        bottom: 20,
        left: 60
      },
      padding = {
        top: 60,
        right: 0,
        bottom: 60,
        left: 60
      };
  var max, width, height,
      outerWidth, outerHeight, innerWidth, innerHeight;

  var chartData = null;
  var chartBox, svgD3, chartGroup, x0ScaleNode, x1ScaleNode;
  var book1Bars, connections, book2Bars;
  var brush = d3.brushX().on("end", brushended),
      idleTimeout,
      idleDelay = 350;

  var xScale, x0Axis, x1Axis;
  var y0Scale, y0Axis, y1Scale, y1Axis;

  /* var k = height / width,
   x3 = [-4.5, 4.5],
   y3 = [-4.5 * k, 4.5 * k];*/

  createChart();
  eventBindings();
  setLayout();

  d3.tsv("data-ss.txt", mapData, function(error, data) {
    chartData = data;
    drawChart();
  });

  function eventBindings(){
    d3.select("button").on("click", resetted);
    window.onresize = onResize;
  }
  function onResize() {
    setLayout();
    drawChart();
  }
  function resetted() {
    chartGroup.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
  }

  function createChart(){
    chartBox    = document.getElementById('chartBox');
    svgD3       = d3.select(chartBox).append("svg").attr("class", "chartGroup");
    chartGroup  = svgD3.append("g");

    book1Bars   = chartGroup.append("g").attr("id", "firstchart");
    connections = chartGroup.append("g").attr("class", "connections");
    book2Bars   = chartGroup.append("g").attr("id", "secondchart");
    chartGroup.append("g").attr("class", "brush").call(brush);

    outerHeight = 600;

    xScale  = d3.scaleLinear();
    y0Scale = d3.scaleLinear().domain([0, 100]).range([150, 0]);
    y1Scale = d3.scaleLinear().domain([0, 100]).range([0, 150]);
    y0Axis  = d3.axisLeft(y0Scale).ticks(5);
    y1Axis  = d3.axisLeft(y1Scale).ticks(5);


    // - Book1 xAxis Scale::
    x0ScaleNode = book1Bars.append("g")
        .attr("class", "x0 axis")
        .attr("transform", "translate(0," + 150 + ")");

    // - Book2 xAxis Scale::
    x1ScaleNode = book2Bars.append("g")
        .attr("class", "x1 axis")
        .attr("transform", "translate(0," + 0 + ")");

    // - Book1 yAxis Scale::
    book1Bars.append("g")
        .attr("class", "y0 axis")
        .call(y0Axis)
        .selectAll("text")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 2)
        .attr("dy", ".31em")
        .style("text-anchor", "end")
        .text("Column9");

    // - Book2 xAxis Scale::
    book2Bars.append("g")
        .attr("class", "y1 axis")
        .call(y1Axis)
        .selectAll("text")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 2)
        .attr("dy", ".31em")
        .style("text-anchor", "end")
        .text("Column10");
  }
  function setLayout(){
    outerWidth = chartBox.offsetWidth;
    innerWidth = outerWidth - margin.left - margin.right;
    innerHeight = outerHeight - margin.top - margin.bottom;
    width = innerWidth - padding.left - padding.right;
    height = innerHeight - padding.top - padding.bottom;

    svgD3.attr("width", outerWidth)
        .attr("height", outerHeight);

    book1Bars.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    connections.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    book2Bars.attr("transform", "translate(" + margin.left + "," + (margin.top+300) + ")");
  }
  function drawChart(){

    // --- Set Scales on Basis of the chartData ::
    max = maxValues();
    xScale.domain([0, max.peek]).range([0, width]);
    x0Axis = d3.axisBottom(xScale).tickValues([1, max.book1]);
    x1Axis = d3.axisBottom(xScale).tickValues([1, max.book2]);

    // --- Draw Book1 Bar Chart [START] :::
    var book1BarNodes = book1Bars.selectAll(".bar")
        .data(chartData);

    book1BarNodes.enter().append("rect")
        .attr("class", "bar")
        .attr("width", 0.5);

    book1BarNodes = book1Bars.selectAll(".bar");
    book1BarNodes
        .attr("x", function(d) {
          return xScale(d.book1_page);
        })
        .attr("y", function(d) {
          return y0Scale(d.book1_y2);
        })
        .attr("height", function(d) {
          return y0Scale(d.book1_y1) - y0Scale(d.book1_y2);
        });

    x0ScaleNode.call(x0Axis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 15)
        .attr("dy", ".10em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");
    // --- Draw Book1 Bar Chart [END] :::

    // --- Draw Connections Curves [START] :::
    var connectionNodes = connections.selectAll("path")
        .data(chartData);

    connectionNodes.enter().append("path")
        .style("stroke", "#FFCC66")
        .attr("class", "connection")
        .style("fill", "none");

    connectionNodes = connections.selectAll("path");
    connectionNodes.on("click", function(d, i) {
          console.log(d);
        })
        .attr("d", function(d) {
          return "M " + xScale(d.book1_page) + " 150 C " + xScale(d.book1_page) + " 250," + xScale(d.book2_page) + " 220 , " + xScale(d.book2_page) + " " + 300;
        });

    // --- Draw Connections Curves [END] :::

    // --- Draw Book1 Bar Chart [START] :::
    var book2BarNodes = book2Bars.selectAll(".bar")
        .data(chartData);

    book2BarNodes.enter().append("rect")
        .attr("class", "bar")
        .attr("width", 0.5);

    book2BarNodes = book2Bars.selectAll(".bar");
    book2BarNodes.attr("x", function(d) {
          return xScale(d.book2_page);
        })
        .attr("y", function(d) {
          return y1Scale(d.book2_y1);
        })
        .attr("height", function(d) {
          return y1Scale(d.book2_y2) - y1Scale(d.book2_y1);
        });

    x1ScaleNode.call(x1Axis)
        .selectAll("text")
        .attr("y", 0)
        .attr("dy", ".30em")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "start");

    // --- Draw Book1 Bar Chart [END] :::
  }

//function brushmoved() {

  //var s = d3.event.selection;

  // console.log(s[0] && s[1]);
//}


  function mapData(d) {
    d.column9 = +d.column9;
    d.column10 = +d.column10;
    d.column11 = +d.column11;
    d.column12 = +d.column12;
    d.column13 = +d.column13;
    d.column14 = +d.column14;

    //d.column15 = +d.column15;
    // d.column16 = +d.column16;

    return {
      book1_page  : +d.column9,
      book2_page  : +d.column10,
      book1_y1    : +d.column11,
      book1_y2    : +d.column12,
      book2_y1    : +d.column13,
      book2_y2    : +d.column14
    };
  }

  function zoomed() {
    chartGroup.attr("transform", d3.event.transform);
  }




  function dragged(d) {
    var x = d3.event.x;
    var y = d3.event.y;
    d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
  }


  function brushended() {
    var s = d3.event.selection;
    if (!s) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      xScale.domain(x3);
      y0Scale.domain(y3);
      // x1.domain(x3);
      //y1.domain(y3);
    } else {
      xScale.domain([s[1][1], s[1][0]].map(xScale.invert, xScale));
      y0Scale.domain([s[1][1], s[0][1]].map(y0Scale.invert, y1Scale));
      // x1.domain([s[0][0], s[1][0]].map(x1.invert, x1));
      //y1.domain([s[1][1], s[0][1]].map(y1.invert, y1));
      chartGroup.select(".brush").call(brush.move, null);
    }
    //zoom();
  }

  function idled() {
    idleTimeout = null;
  }

  function zoom() {
    var t = chartGroup.transition().duration(750);
    chartGroup.select(".x0").transition(t).call(x0Axis);
    chartGroup.select(".y0").transition(t).call(y0Axis);
    //chartGroup.select(".x1").transition(t).call(x1Axis);
    //chartGroup.select(".y1").transition(t).call(y1Axis);
    //chartGroup.selectAll("rect").transition(t)
    //  .attr("x", function(d) { return x0(d[0]); })
    //.attr("y", function(d) { return y1(d[1]); });

  }

  function maxValues(){
    return {
      book1: 4020,
      book2: 1172,
      peek: 4020
    };
  }

})();