(function (){
  'use strict';

  // book1: Top Bar Chart (x0)
  // book2: Bottom Bar Chart (x1)
  // connections: connect top bars with bottom bars
  // y-axis: 0 to 100 for book1 and book2
  // x-axis: decided by maxValues function which returns {book1, book2, peek}
  // vertical layout :: 60 + 60

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
  var max, width,
      outerWidth, outerHeight = 570, innerWidth, innerHeight;

  var chartData = null;
  var chartBox, svgD3, chartGroup, x0ScaleNode, x1ScaleNode;
  var book1Bars, connections, book2Bars, brushG;

  var xScale, x0Axis, x1Axis;
  var y0Scale, y0Axis, y1Scale, y1Axis;
  var brushHandle = d3.brushX();

  var xIdentityDomain, idleTimeout, idleDelay = 350, duration1 = 750, duration2 = 500, duration3 = 250;

  createChart();
  eventBindings();
  setLayout();

  d3.tsv("data-ss.txt", mapData, function(error, data) {
    chartData = data;
    drawChart();
    updateChart(duration3);
  });

  function eventBindings(){
    brushHandle.on("end", brushEnded);
    window.onresize = onResize;
  }
  function onResize() {
    setLayout();
    drawChart();
    updateChart(duration2);
  }

  function createChart(){
    chartBox    = document.getElementById('chartBox');
    svgD3       = d3.select(chartBox).append("svg").attr("class", "chartGroup");
    chartGroup  = svgD3.append("g");

    book1Bars   = chartGroup.append("g").attr("id", "firstchart");
    connections = chartGroup.append("g").attr("class", "connections");
    book2Bars   = chartGroup.append("g").attr("id", "secondchart");
    brushG      = chartGroup.append("g").attr("class", "brush");

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

    svgD3.attr("width", outerWidth)
        .attr("height", outerHeight);

    book1Bars.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    connections.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    book2Bars.attr("transform", "translate(" + margin.left + "," + (margin.top+300) + ")");
    brushG.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }
  function drawChart() {

    // --- Set Scales on Basis of the chartData ::
    max = maxValues();
    xIdentityDomain = [0, max.peek];
    xScale.domain(xIdentityDomain).range([0, width]);
    x0Axis = d3.axisBottom(xScale).tickValues([1, max.book1]);
    x1Axis = d3.axisBottom(xScale).tickValues([1, max.book2]);
    brushHandle.extent([[0, 0], [width, innerHeight-40]]);

    // --- Draw Book1 Bar Chart [START] :::
    var book1BarNodes = book1Bars.selectAll(".bar")
        .data(chartData);

    book1BarNodes.enter().append("rect")
        .attr("class", "bar")
        .attr("width", 0.5);

    // - render X Axis of Book1 ::
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
        .style("fill", "none")
        .on("click", function (d, i) {
          console.log(d);
        });

    connectionNodes.exit();
    // --- Draw Connections Curves [END] :::

    // --- Draw Book2 Bar Chart [START] :::
    var book2BarNodes = book2Bars.selectAll(".bar")
        .data(chartData);

    book2BarNodes.enter().append("rect")
        .attr("class", "bar")
        .attr("width", 0.5);

    book2BarNodes.exit().remove();

    // - render X Axis of Book2 ::
    x1ScaleNode.call(x1Axis)
        .selectAll("text")
        .attr("y", 0)
        .attr("dy", ".30em")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "start");

    // --- Draw Book2 Bar Chart [END] :::

    brushG.call(brushHandle);

  }
  function updateChart(duration){
    var t = svgD3.transition().duration(duration || 0);

    book1Bars.selectAll(".bar")
        .transition(t)
        .attr("x", function (d) {
          return xScale(d.book1_page);
        })
        .attr("y", function (d) {
          return y0Scale(d.book1_y2);
        })
        .attr("height", function (d) {
          return y0Scale(d.book1_y1) - y0Scale(d.book1_y2);
        });

    connections.selectAll("path")
        .transition(t)
        .attr("d", function (d) {
          return "M " + xScale(d.book1_page) + " 150 C " + xScale(d.book1_page) + " 250," + xScale(d.book2_page) + " 220 , " + xScale(d.book2_page) + " " + 300;
        });

    book2Bars.selectAll(".bar")
        .transition(t)
        .attr("x", function (d) {
          return xScale(d.book2_page);
        })
        .attr("y", function (d) {
          return y1Scale(d.book2_y1);
        })
        .attr("height", function (d) {
          return y1Scale(d.book2_y2) - y1Scale(d.book2_y1);
        });

  }

  function brushEnded() {
    if (!d3.event.sourceEvent) return; // Only transition after input.
    var sel = d3.event.selection;

    if (!sel) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      xScale.domain(xIdentityDomain);
    } else {
      xScale.domain(sel.map(function(d){
        return Math.round(xScale.invert(d));
      }));
      brushG.call(brushHandle.move, null);
    }
    zoom();
  }
  function idled() {
    idleTimeout = null;
  }
  function zoom() {
    var t = svgD3.transition().duration(duration1);
    x0ScaleNode.transition(t).call(x0Axis);
    x1ScaleNode.transition(t).call(x0Axis);
    updateChart(duration1);
  }

  function mapData(d) {
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
  function maxValues(){
    return {
      book1: 4020,
      book2: 1172,
      peek: 4020
    };
  }

})();