(function (){
  'use strict';

  // book1: Top Bar Chart (x0)
  // book2: Bottom Bar Chart (x1)
  // connections: connect top bars with bottom bars
  // y-axis: 0 to 100 for book1 and book2
  // x-axis: decided by maxValues function which returns {book1, book2, peek}
  // vertical layout :: 60 + 60

  var url = {
    book1: 'https://raw.githubusercontent.com/OpenArabic/0300AH/master/data/0255Jahiz/0255Jahiz.Hayawan/0255Jahiz.Hayawan.Shamela0023775-ara1.inProgress',
    book2: 'https://raw.githubusercontent.com/OpenArabic/0500AH/master/data/0429AbuMansurThacalibi/0429AbuMansurThacalibi.ThimarQulub/0429AbuMansurThacalibi.ThimarQulub.Shamela0006896-ara1.completed'
  };
  var texts = {
    book1: null,
    book2: null
  };
  var book1Selector, book2Selector;

  marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
  });

  var margin = {
        top: 40,
        right: 20,
        bottom: 20,
        left: 60
      },
      padding = {
        top: 40,
        right: 0,
        bottom: 40,
        left: 60
      },
      barMaxHeight = 150;
  var max, width, height,
      outerWidth, outerHeight = 530, innerWidth, innerHeight;

  var selectedLine = null;
  var connColor = '#FFCC66', connHColor = '#ff9600',
      hoverStrokeWidth = 3, barWidth = 0.5;

  var chartData = null, refLinesData = null, hoverLines = [{}, {}];
  var chartBox, svgD3, drawingG, marksG, clipRect, x0ScaleNode, x1ScaleNode;
  var book1Bars, connections, book2Bars, brushG;

  var xScale, xScaleIdentity, x0Axis, x1Axis;
  var y0Scale, y0Axis, y1Scale, y1Axis;
  var brushHandle = d3.brushX().on("end", brushEnded);

  var xIdentityDomain, currentXDomain, animating = false,
      duration1 = 700, duration2 = 400;

  var toolTipDiv, layoutPadding = 48, sidePanelHeight = 400, isPanelOpened;


  d3.tsv("data-live.txt", mapData, function(error, data) {
    chartData = data;
    console.log(data[3]);
    window.a = data[3];
    drawChart();
    updateChart();
  });

  createChart();
  setLayout();
  eventBindings();

  function eventBindings() {
    d3.select('#closeBtn').on('click', closePanel);
    window.onresize = onResize;

    d3.select( '#book1Loader' ).style("display", null);
    d3.text(url.book1, function(error, text) {
      d3.select( '#book1Loader' ).style("display", "none");
      if (error) throw error;

      text = filterNoise(text);
      texts.book1 = text;
      text = parse(text);
      setTimeout(function() {
        d3.select( '#book1Content' )
            .html( text )
            .style( "display", null );
        book1Selector && setTimeout(book1Selector, 0);
      }, 0);
    });

    d3.select( '#book2Loader' ).style("display", null);
    d3.text(url.book2, function(error, text) {
      d3.select( '#book2Loader').style("display", "none");
      if (error) throw error;
      //var text = localStorage.getItem("test");

      text = filterNoise(text);
      texts.book2 = text;
      text = parse(text);
      setTimeout(function() {
        d3.select( '#book2Content' )
            .html( text )
            .style( "display", null );
        book2Selector && setTimeout(book2Selector, 0);
      }, 0);
    });
    /*$.ajax({
     url: url.book1,
     success: function (mdText) {
     d3.select('#book1Content').text(mdText);
     }
     });
     $.ajax({
     url: url.book2,
     success: function (mdText) {
     d3.select('#book2Content').text(mdText);
     }
     });*/
  }
  function filterNoise(text){
    text = text.slice(0, 5000);
    text = text.replace(/\n~~/g, " ");
    window.text = text;
    return text;
  }
  function parse(text){
    text = marked(text);
    return text;
  }
  function setPanelContent(d1){
    var t = "وبناء هذا الكتاب على ذكر أشياء مضافة ومنسوبة إلى أشياء مختلفة يتمثل";
    if(d3.select( '#book2Loader' ).style("display") === "none"){
      selectPara(d3.select( '#book2Content' ), t, texts.book2);
    } else{
      book2Selector = selectPara.bind(null, d3.select( '#book2Content' ), t, texts.book2);
    }
  }
  function selectPara(contentNodeD3, text, content){
    content = content.replace(text, '<selection>$&</selection>');
    contentNodeD3.html( parse(content) );
    setTimeout(function(){
      var selectionNodeD3 = contentNodeD3.select('selection');
      var scrollTop = selectionNodeD3.property("offsetTop") - contentNodeD3.property("offsetTop");
      contentNodeD3.property("scrollTop", scrollTop);
      selectText(selectionNodeD3.node());
    }, 0);
  }

  function onResize() {
    setLayout();
    drawChart();
    updateChart(duration2);
  }

  function createChart(){
    toolTipDiv  = d3.select("body").append("div").attr("class", "tooltip").style("display", "none").style("opacity", 0.9);

    chartBox    = document.getElementById('chartBox');
    svgD3       = d3.select(chartBox).append("svg").attr("class", "chartGroup");
    brushG      = svgD3.append("g").attr("class", "brush");
    drawingG    = svgD3.append("g").attr("class", "drawing").attr("clip-path", "url('#clipDrawing')");
    marksG      = svgD3.append("g").attr("class", "markings");

    book1Bars   = drawingG.append("g").attr("id", "firstchart");
    connections = drawingG.append("g").attr("class", "connections");
    book2Bars   = drawingG.append("g").attr("id", "secondchart");

    xScale      = d3.scaleLinear();
    xScaleIdentity = d3.scaleLinear();
    y0Scale     = d3.scaleLinear().domain([0, 100]).range([barMaxHeight, 0]);
    y1Scale     = d3.scaleLinear().domain([0, 100]).range([0, barMaxHeight]);
    y0Axis      = d3.axisLeft(y0Scale).ticks(5);
    y1Axis      = d3.axisLeft(y1Scale).ticks(5);

    // - Book1 xAxis Scale::
    x0ScaleNode = marksG.append("g")
        .attr("class", "x0 axis")
        .attr("transform", "translate(0," + barMaxHeight + ")");

    // - Book2 xAxis Scale::
    x1ScaleNode = marksG.append("g")
        .attr("class", "x1 axis")
        .attr("transform", "translate(0," + barMaxHeight*2 + ")");

    // - Book1 yAxis Scale::
    marksG.append("g")
        .attr("class", "y0 axis")
        .call(y0Axis);

    // - Book2 xAxis Scale::
    marksG.append("g")
        .attr("class", "y1 axis")
        .call(y1Axis)
        .attr("transform", "translate(0," + barMaxHeight*2 + ")");

    // - Clip Path (Masking) ::
    clipRect = svgD3.append("defs").append("clipPath")
        .attr("id", "clipDrawing")
        .append("rect");

  }

  function setLayout(){
    //outerWidth = isPanelOpened ? (window.innerWidth - layoutPadding - sidePanelWidth) : chartBox.offsetWidth;
    outerWidth = chartBox.offsetWidth;
    innerWidth = outerWidth - margin.left - margin.right;
    innerHeight = outerHeight - margin.top - margin.bottom;
    width = innerWidth - padding.left - padding.right;
    height = innerHeight-20;

    svgD3.attr("width", outerWidth)
        .attr("height", outerHeight);

    drawingG.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    brushG.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    marksG.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    book2Bars.attr("transform", "translate(0,300)");

    clipRect.attr("width", width)
        .attr("height", height);

    // --- Set Scales on Basis of the chartData ::
    max = maxValues();
    xIdentityDomain = [0, max.peek];
    currentXDomain || (currentXDomain = xIdentityDomain);
    xScale.domain(currentXDomain).range([1, width-1]);
    xScaleIdentity.domain(xIdentityDomain).range([1, width-1]);
    x0Axis = d3.axisBottom(xScale);
    x1Axis = d3.axisTop(xScale).tickValues([1, max.book2]);
    brushHandle.extent([[0, 0], [width, height]]);
    refLinesData = [
      {x: 1,         y: 0,              yScale: y0Scale},
      {x: max.book1, y: 0,              yScale: y0Scale},
      {x: 1,         y: barMaxHeight*2, yScale: y1Scale},
      {x: max.book2, y: barMaxHeight*2, yScale: y1Scale}
    ];
    hoverLines = [
      {x: 150,  y: 0,               yScale:y0Scale, visible: false},
      {x: 150,  y: barMaxHeight*2,  yScale:y0Scale, visible: false}
    ];
  }
  function drawChart() {

    // - Hover Lines ::
    drawingG.selectAll(".dotted-bar-lines")
        .data(hoverLines)
        .enter().insert("line", ":first-child")
        .attr("clip-path", "url('#clipDrawing')")
        .attr("class", "dotted-bar-lines")
        .attr("opacity", 0);

    // --- Draw Book1 Bar Chart [START] :::
    var book1BarNodes = book1Bars.selectAll(".bar")
        .data(chartData);

    book1BarNodes.enter().append("line")
        .attr("class", "bar")
        .attr("stroke-width", barWidth);

    book1BarNodes.exit().remove();
    // --- Draw Book1 Bar Chart [END] :::

    // --- Draw Connections Curves [START] :::
    var connectionNodes = connections.selectAll("path")
        .data(chartData);

    connectionNodes.enter().append("path")
        .attr("class", "connection")
        .attr("stroke", connColor);

    connectionNodes.exit().remove();
    // --- Draw Connections Curves [END] :::

    // --- Draw Book2 Bar Chart [START] :::
    var book2BarNodes = book2Bars.selectAll(".bar")
        .data(chartData);

    book2BarNodes.enter().append("line")
        .attr("class", "bar")
        .attr("stroke-width", barWidth);

    book2BarNodes.exit().remove();
    // --- Draw Book2 Bar Chart [END] :::

    // - Append Brush
    brushG.call(brushHandle)
        .select('.overlay')
        .on("dblclick", restoreCanvas);

    // - Max Marking ::
    marksG.selectAll(".max-reference-lines")
        .data(refLinesData)
        .enter().append("line")
        .attr("clip-path", "url('#clipDrawing')")
        .attr("class", "max-reference-lines");
  }
  function updateChart(duration){
    var t = svgD3.transition().duration(duration || 0);

    animating = true;
    t.on('end', function(){
      animating = false;
    });

    // - render Bars of Book1 and Book2 ::
    book1Bars.selectAll(".bar")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .on("click", selectLineOnClicked)
        .transition(t)
        .attr("x1", function (d) {  return xScale(d.book1_page);  })
        .attr("x2", function (d) {  return xScale(d.book1_page);  })
        .attr("y1", function (d) {  return y0Scale(d.book1_y1);   })
        .attr("y2", function (d) {  return y0Scale(d.book1_y2);   });

    // - render Connection Curves ::
    connections.selectAll("path")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .on("click", selectLineOnClicked)
        .transition(t)
        .attr("d", function (d) {
          return "M " + xScale(d.book1_page) + " 150 C " + xScale(d.book1_page) + " 250," + xScale(d.book2_page) + " 220 , " + xScale(d.book2_page) + " " + 300;
        });

    // - render Bars of Book2 ::
    book2Bars.selectAll(".bar")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .on("click", selectLineOnClicked)
        .transition(t)
        .attr("x1", function (d) {  return xScale(d.book2_page);  })
        .attr("x2", function (d) {  return xScale(d.book2_page);  })
        .attr("y1", function (d) {  return y1Scale(d.book2_y1);   })
        .attr("y2", function (d) {  return y1Scale(d.book2_y2);   });

    // - render X Axis of Book1 ::
    x0Axis.tickValues(selectedLine ? [1, selectedLine.book1_page, max.book1] : [1, max.book1] );
    x0ScaleNode.transition(t).call(x0Axis)
        .selectAll("text")
        .attr("x", 10)
        .attr("y", -5)
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // - render X Axis of Book2 ::
    x1Axis.tickValues(selectedLine ? [1, selectedLine.book2_page, max.book2] : [1, max.book2] );
    x1ScaleNode.transition(t).call(x1Axis)
        .selectAll("text")
        .attr("x", -10)
        .attr("y", 2)
        .attr("transform", "rotate(90)")
        .style("text-anchor", "end");

    // - render Reference Lines Min and Max ::
    marksG.selectAll(".max-reference-lines").transition(t)
        .attr("x1", function (d) {  return xScale(d.x);       })
        .attr("x2", function (d) {  return xScale(d.x);       })
        .attr("y1", function (d) {  return d.yScale(0)+d.y;   })
        .attr("y2", function (d) {  return d.yScale(100)+d.y; });

    return t;
  }

  function brushEnded() {
    if (!d3.event.sourceEvent) return; // Only transition after input.
    var sel = d3.event.selection;
    if (!sel) {
      selectedLine && closePanel();
      return;
    }

    currentXDomain = sel.map(function (d) {
      return Math.round(xScale.invert(d));
    });
    xScale.domain(currentXDomain);
    zoom();
  }
  function restoreCanvas(){
    if(animating) return;

    if(selectedLine) {
      selectedLine = null;
      makeLinesVisible();
    }
    currentXDomain = xIdentityDomain;
    xScale.domain(currentXDomain);
    setTimeout(zoom, 0);
  }
  function zoom() {
    brushG.call(brushHandle.move, null);
    updateChart(duration1);
  }
  function focusOnLine(d1){
    var a = d1.book1_page;
    var b = d1.book2_page;
    var min = Math.min(a, b)-xScaleIdentity.invert(5);
    var max = Math.max(a, b)+xScaleIdentity.invert(5);

    currentXDomain = [min, max];
    xScale.domain(currentXDomain);
    zoom();
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
  function showToolTip(d1){
    var html = 'Book1: #'+d1.book1_page +' ('+d1.book1_y1+'-'+d1.book1_y2+')<br/>'
        +'Book2: #'+d1.book2_page+''+' ('+d1.book2_y1+'-'+d1.book2_y2+')';

    toolTipDiv
        .style("display", null);

    toolTipDiv.html(html)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
  }
  function hideToolTip(){
    toolTipDiv
        .style("display", "none");
  }
  function mouseOver(d1){
    filterSelected(d1, getConnections())
        .attr("stroke", connHColor)
        .attr("stroke-width", hoverStrokeWidth)
        .attr("opacity", null);

    filterSelected(d1, getBars())
        .attr("stroke-width", hoverStrokeWidth)
        .attr("opacity", null);

    // - render Dotted Bars for book1 and book2 on hover/click ::
    hoverLines[0].x = d1.book1_page;
    hoverLines[1].x = d1.book2_page;
    drawingG.selectAll(".dotted-bar-lines")
        .attr("x1", function (d) {  return xScale(d.x);       })
        .attr("x2", function (d) {  return xScale(d.x);       })
        .attr("y1", function (d) {  return d.yScale(0)+d.y;   })
        .attr("y2", function (d) {  return d.yScale(100)+d.y; })
        .attr("opacity", null);
    showToolTip(d1);
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

    drawingG.selectAll(".dotted-bar-lines")
        .attr("opacity", 0);

    hideToolTip();

    function opacityOnMouseOut(d){
      return d.hidden ? 0.1 : null
    }
  }
  function selectLineOnClicked(d1){
    if(d1===selectedLine) return;
    openPanel();
    setPanelContent(d1);

    selectedLine && clearSelectedLine();
    selectedLine = d1;

    getConnections()
        .each(function hideOthers(d){
          d.hidden = d!==d1;
        })
        .filter(filterHidden)
        .attr("opacity", 0.1);

    getBars()
        .filter(filterHidden)
        .attr("opacity", 0.1);

    drawingG.selectAll(".dotted-bar-lines")
        .attr("opacity", 0);

    hideToolTip();
    setTimeout(focusOnLine, 0, d1);

    function filterHidden(d){
      return d.hidden;
    }
  }
  function clearSelectedLine(){
    var d2 = selectedLine;
    selectedLine = null;
    d2.hidden = true;
    mouseOut(d2);
  }
  function makeLinesVisible(){
    getConnections()
        .each(function hideOthers(d){
          delete d.hidden;
        })
        .attr("stroke", connColor)
        .attr("stroke-width", null)
        .attr("opacity", null);

    getBars()
        .attr("stroke-width", barWidth)
        .attr("opacity", null);

    drawingG.selectAll(".dotted-bar-lines")
        .attr("opacity", 0);

    hideToolTip();
  }


  //star panel
  function openPanel() {
    if(animating)   return;

    isPanelOpened = true;
    setLayout();
    drawChart();
    d3.select("#mySidenav").style("display", null);
    setTimeout(function(){
      d3.select('#mySidenav').style("opacity", null);
    }, duration1);
  }

  function closePanel() {
    if(animating)   return;

    isPanelOpened = false;
    restoreCanvas();
    setLayout();
    drawChart();
    setTimeout(function(){
      d3.select('#mySidenav').style("opacity", 0);
    }, 500);
  }

  function selectText(textNode){
    var range;
    if (document.body.createTextRange) { // ms
      range = document.body.createTextRange();
      range.moveToElementText( textNode );
      range.select();
    } else if (window.getSelection) {
      var selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents( textNode );
      selection.removeAllRanges();
      selection.addRange( range );
    }
  }


  //end panel

  function mapData(d) {
    // d.column16 = +d.column16;

    return {
      book1_page  : +d.column9,
      book2_page  : +d.column10,
      book1_y1    : +d.column11,
      book1_y2    : +d.column12,
      book2_y1    : +d.column13,
      book2_y2    : +d.column14,
      book1_content: d.column15,
      book2_content: d.column16
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