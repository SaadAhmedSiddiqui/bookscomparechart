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
      },
      barMaxHeight = 150;
  var max, width, height,
      outerWidth, outerHeight = 570, innerWidth, innerHeight;

  var selectedLine = null;
  var connColor = '#FFCC66', connHColor = '#ff9600',
      hoverStrokeWidth = 3, barWidth = 0.5;

  var chartData = null;
  var chartBox, svgD3, drawingG, marksG, clipRect, x0ScaleNode, x1ScaleNode;
  var book1Bars, connections, book2Bars, brushG;

  var xScale, x0Axis, x1Axis;
  var y0Scale, y0Axis, y1Scale, y1Axis;
  var brushHandle = d3.brushX().on("end", brushEnded);

  var xIdentityDomain, currentXDomain, idleTimeout, idleDelay = 350, duration1 = 750, duration2 = 500;

  createChart();
  eventBindings();
  setLayout();

  d3.tsv("data-ss.txt", mapData, function(error, data) {
    chartData = data;
    drawChart();
    updateChart();
  });

  function eventBindings(){
    d3.select('#resetBtn').on('click', restoreCanvas);
    window.onresize = onResize;
  }
  function onResize() {
    setLayout();
    drawChart();
    xScale.domain(currentXDomain);
    updateChart(duration2);
  }

  function createChart(){
    chartBox    = document.getElementById('chartBox');
    svgD3       = d3.select(chartBox).append("svg").attr("class", "chartGroup");
    brushG      = svgD3.append("g").attr("class", "brush");
    drawingG    = svgD3.append("g").attr("class", "drawing").attr("clip-path","url('#clipDrawing')");
    marksG      = svgD3.append("g").attr("class", "markings");

    book1Bars   = drawingG.append("g").attr("id", "firstchart");
    connections = drawingG.append("g").attr("class", "connections");
    book2Bars   = drawingG.append("g").attr("id", "secondchart");

    xScale      = d3.scaleLinear();
    y0Scale     = d3.scaleLinear().domain([0, 100]).range([barMaxHeight, 0]);
    y1Scale     = d3.scaleLinear().domain([0, 100]).range([0, barMaxHeight]);
    y0Axis      = d3.axisLeft(y0Scale).ticks(5);
    y1Axis      = d3.axisLeft(y1Scale).ticks(5);

    // - Book1 xAxis Scale::
    x0ScaleNode = marksG.append("g")
        .attr("class", "x0 axis")
        .attr("transform", "translate("+margin.left+"," + (margin.top+barMaxHeight) + ")");

    // - Book2 xAxis Scale::
    x1ScaleNode = marksG.append("g")
        .attr("class", "x1 axis")
        .attr("transform", "translate("+margin.left+"," + (margin.top+barMaxHeight*2) + ")");

    // - Book1 yAxis Scale::
    marksG.append("g")
        .attr("class", "y0 axis")
        .call(y0Axis)
        .attr("transform", "translate("+margin.left+"," + margin.top + ")");

    // - Book2 xAxis Scale::
    marksG.append("g")
        .attr("class", "y1 axis")
        .call(y1Axis)
        .attr("transform", "translate("+margin.left+"," + (margin.top+barMaxHeight*2) + ")");

    // - Clip Path (Masking) ::
    clipRect = svgD3.append("defs").append("clipPath")
        .attr("id", "clipDrawing")
        .append("rect");
  }
  function setLayout(){
    outerWidth = chartBox.offsetWidth;
    innerWidth = outerWidth - margin.left - margin.right;
    innerHeight = outerHeight - margin.top - margin.bottom;
    width = innerWidth - padding.left - padding.right;
    height = innerHeight-40;

    svgD3.attr("width", outerWidth)
        .attr("height", outerHeight);

    drawingG.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    brushG.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    book2Bars.attr("transform", "translate(0,300)");

    clipRect.attr("width", width)
        .attr("height", height);
  }
  function drawChart() {

    // --- Set Scales on Basis of the chartData ::
    max = maxValues();
    xIdentityDomain = [0, max.peek];
    xScale.domain(xIdentityDomain).range([0, width]);
    x0Axis = d3.axisBottom(xScale).tickValues([1, max.book1]);
    x1Axis = d3.axisTop(xScale).tickValues([1, max.book2]);
    brushHandle.extent([[0, 0], [width, height]]);

    // --- Draw Book1 Bar Chart [START] :::
    var book1BarNodes = book1Bars.selectAll(".bar")
        .data(chartData);

    book1BarNodes.enter().append("line")
        .attr("class", "bar")
        .attr("stroke-width", barWidth)
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut);

    book1BarNodes.exit().remove();
    // --- Draw Book1 Bar Chart [END] :::

    // --- Draw Connections Curves [START] :::
    var connectionNodes = connections.selectAll("path")
        .data(chartData);

    connectionNodes.enter().append("path")
        .attr("class", "connection")
        .attr("stroke", connColor)
        .on("click", selectLineOnClicked)
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut);

    connectionNodes.exit().remove();
    // --- Draw Connections Curves [END] :::

    // --- Draw Book2 Bar Chart [START] :::
    var book2BarNodes = book2Bars.selectAll(".bar")
        .data(chartData);

    book2BarNodes.enter().append("line")
        .attr("class", "bar")
        .attr("stroke-width", barWidth)
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut);

    book2BarNodes.exit().remove();
    // --- Draw Book2 Bar Chart [END] :::

    brushG.call(brushHandle)
        .select('.overlay')
        .on("dblclick", restoreCanvas);

  }
  function updateChart(duration){
    var t = svgD3.transition().duration(duration || 0);

    book1Bars.selectAll(".bar")
        .transition(t)
        .attr("x1", function (d) {
          return xScale(d.book1_page);
        })
        .attr("x2", function (d) {
          return xScale(d.book1_page);
        })
        .attr("y1", function (d) {
          return y0Scale(d.book1_y1);
        })
        .attr("y2", function (d) {
          return y0Scale(d.book1_y2);
        });

    connections.selectAll("path")
        .transition(t)
        .attr("d", function (d) {
          return "M " + xScale(d.book1_page) + " 150 C " + xScale(d.book1_page) + " 250," + xScale(d.book2_page) + " 220 , " + xScale(d.book2_page) + " " + 300;
        });

    book2Bars.selectAll(".bar")
        .transition(t)
        .attr("x1", function (d) {
          return xScale(d.book2_page);
        })
        .attr("x2", function (d) {
          return xScale(d.book2_page);
        })
        .attr("y1", function (d) {
          return y1Scale(d.book2_y1);
        })
        .attr("y2", function (d) {
          return y1Scale(d.book2_y2)
        });

    // - render X Axis of Book1 ::
    x0ScaleNode.transition(t).call(x0Axis)
        .selectAll("text")
        .attr("x", 10)
        .attr("y", -5)
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // - render X Axis of Book2 ::
    x1ScaleNode.transition(t).call(x1Axis)
        .selectAll("text")
        .attr("x", -10)
        .attr("y", 2)
        .attr("transform", "rotate(90)")
        .style("text-anchor", "end");

  }

  function brushEnded() {
    console.log('test2');
    if (!d3.event.sourceEvent) return; // Only transition after input.
    var sel = d3.event.selection;
    if (!sel) {
      selectedLine && deSelectLine();
      return;
    }

    currentXDomain =sel.map(function (d) {
      return Math.round(xScale.invert(d));
    });
    xScale.domain(currentXDomain);
    brushG.call(brushHandle.move, null);
    zoom();
  }
  function idled() {
    idleTimeout = null;
  }
  function restoreCanvas(){
    if (idleTimeout) {
      return;
    }
    idleTimeout = setTimeout(idled, idleDelay);
    xScale.domain(xIdentityDomain);
    zoom();
    selectedLine && deSelectLine();
  }
  function zoom() {
    updateChart(duration1);
  }

  function getConnections(){
    return connections.selectAll("path");
  }
  function getBars(){
    return drawingG.selectAll("#firstchart .bar, #secondchart .bar");
  }
  function filterSelected(d1, nodesD3){
    return nodesD3
        .filter(function(d){
          return d===d1;
        });
  }
  function mouseOver(d1){
    filterSelected(d1, getConnections())
        .attr("stroke", connHColor)
        .attr("stroke-width", hoverStrokeWidth)
        .attr("opacity", null);

    filterSelected(d1, getBars())
        .attr("stroke-width", hoverStrokeWidth)
        .attr("opacity", null);
  }
  function mouseOut(d1){
    if(selectedLine === d1) return;

    filterSelected(d1, getConnections()).transition()
        .attr("stroke", connColor)
        .attr("stroke-width", null)
        .attr("opacity", opacityOnMouseOut);

    filterSelected(d1, getBars()).transition()
        .attr("stroke-width", barWidth)
        .attr("opacity", opacityOnMouseOut);

    function opacityOnMouseOut(d){
      return d.hidden ? 0 : null
    }
  }
  function selectLineOnClicked(d1){
    if(d1===selectedLine) return;
    
    selectedLine && clearSelectedLine();
    selectedLine = d1;

    getConnections()
        .each(function hideOthers(d){
          d.hidden = d!==d1;
        })
        .filter(filterHidden)
        .attr("opacity", 0);

    getBars()
        .filter(filterHidden)
        .attr("opacity", 0);

    function filterHidden(d){
        return d.hidden;
    }
  }
  function deSelectLine(){
    clearSelectedLine();
    makeOtherLinesVisible();
  }
  function clearSelectedLine(){
    var d2 = selectedLine;
    selectedLine = null;
    d2.hidden = true;
    mouseOut(d2);
  }
  function makeOtherLinesVisible(){
    getConnections()
        .each(function hideOthers(d){
          delete d.hidden;
        })
        .attr("opacity", null);

    getBars()
        .attr("opacity", null);
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