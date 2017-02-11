(function (){
  'use strict';

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
      outerWidth = 1200,
      outerHeight = 600,
      innerWidth = outerWidth - margin.left - margin.right,
      innerHeight = outerHeight - margin.top - margin.bottom,
      width = innerWidth - padding.left - padding.right,
      height = innerHeight - padding.top - padding.bottom;
var k = height / width,
    x3 = [-4.5, 4.5],
    y3 = [-4.5 * k, 4.5 * k]
    
// largest value between the two books (Max value).
//put condition to retunr the largest max value 
//which will be used as the max value for domain x axis

var maxBook1Value,maxBook2Value;
var maxBookValue = 4020;

var chartGroup = d3.select("#chartBox").append("svg")
  .attr("width", outerWidth)
  .attr("height", outerHeight)
  .attr("class", "chartGroup")
 // .call(zoom)
  .append("g")

var firstChart = chartGroup.append("g");
firstChart.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .attr("id", "firstchart")

var connections = d3.select("#firstchart").append("g")
  .attr("class", "connections");

margin.top += 300;

var secondChart = chartGroup.append("g");
secondChart.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .attr("id", "secondchart");

//var x0 = d3.scaleBand().range([0, width]).padding(0.0);
//var x1 = d3.scaleBand().range([0, width]).padding(0.0);

var y0 = d3.scaleLinear().range([150, 0]);
var y0Axis = d3.axisLeft(y0).ticks(5);
var y1 = d3.scaleLinear().range([0, 150]);
var y1Axis = d3.axisLeft(y1).ticks(5);
var   x0Axis, x1Axis;


  var brush = d3.brushX().on("end", brushended),
    idleTimeout,
    idleDelay = 350;

d3.tsv("data-ss.txt", type, function(error, data) {


//var brush = d3.brushX()
  //  .extent([
    //  [0, 0],
      //[width - 20, outerHeight]
    //])
  //  .on("start brush end", brushmoved);
    
  

  //minimum/maximum values for column9 used for ticks
  var max = d3.max(data, function(d) {
    return d.column9;
  });
  var min = d3.min(data, function(d) {
    return d.column9;
  });


 // x0 = d3.scaleLinear()
   // .domain([0, d3.max(data, function(d) {
     // return d.column9;
//    })])
  //  .range([0, width]);
    
      var x0 = d3.scaleLinear()
    .domain([0, maxBookValue])
    .range([0, width]);
    

  //minimum/maximum values for column10 used for ticks
  var min1 = d3.min(data, function(d) {
    return d.column10;
  });
  var max1 = d3.max(data, function(d) {
    return d.column10;
  });

//  x1 = d3.scaleLinear()
  //  .domain([0, d3.max(data, function(d) {
    //  return d.column10;
    //})])
    //.range([0, width]);
    
      var x1 = d3.scaleLinear()
    .domain([0, maxBookValue])
    .range([0, width]);

  y0.domain([d3.min(data, function(d) {
    return d.column11;
  }), d3.max(data, function(d) {
    return d.column12;
  })]);

  y1.domain([d3.min(data, function(d) {
    return d.column13;
  }), d3.max(data, function(d) {
    return d.column14;
  })]);

  firstChart.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) {
      return x0(d.column9);
    })
    .attr("width", 0.5)
    .attr("y", function(d) {
      return y0(d.column11), y0(d.column12);
    })
    .attr("height", function(d) {
      return y0(d.column11) - y0(d.column12);
    })

  x0Axis = d3.axisBottom(x0).tickValues([1, 4020]);



  //First Chart Starts
  firstChart.append("g")
    .attr("class", "x0 axis")
    .attr("transform", "translate(0," + 150 + ")")
    .call(x0Axis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 15)
    .attr("dy", ".10em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

  firstChart.append("g")
    .attr("class", "y0 axis")
    .call(y0Axis)
    .selectAll("text")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 2)
    .attr("dy", ".31em")
    .style("text-anchor", "end")
    .text("Column9");

  ////////First Chart Ends//////

  //////Second Chart Start///////
  secondChart.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) {
      return x1(d.column10);
    })
    .attr("width", 0.5)
    .attr("y", function(d) {
      return y1(d.column14), y1(d.column13);
    })
    .attr("height", function(d) {
      return y1(d.column14) - y1(d.column13);
    })

  x1Axis = d3.axisBottom(x1).tickValues([1, 1172]);


  secondChart.append("g")
    .attr("class", "x1 axis")
    .attr("transform", "translate(0," + 0 + ")")
    .call(x1Axis)
    .selectAll("text")
    .attr("y", 0)
    .attr("dy", ".30em")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "start");

  secondChart.append("g")
    .attr("class", "y1 axis")
    .call(y1Axis)
    .selectAll("text")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 2)
    .attr("dy", ".31em")
    .style("text-anchor", "end")
    .text("Column10");

  ////////Second Chart Ends//////

  var connection = chartGroup.append("g");
  connections.selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .style("stroke", "#FFCC66")
    .attr("class", "connection")
    .style("fill", "none")


  .on("click", function(d, i) {
      alert(d.column9 + "- " + d.column10);
      console.log(d);
    })
    .attr("d", function(d) {
      return "M " + x0(d.column9) + " 150 C " + x0(d.column9) + " 250," + x1(d.column10) + " 220 , " + x1(d.column10) + " " + 300;
    });

  chartGroup.append("g")
    .attr("class", "brush")
    .call(brush);

  d3.select("button")
    .on("click", resetted);
    


});

//function brushmoved() {

  //var s = d3.event.selection;

  // console.log(s[0] && s[1]);
//}


function type(d) {
  d.column9 = +d.column9;
  d.column10 = +d.column10;
  d.column11 = +d.column11;
  d.column12 = +d.column12;
  d.column13 = +d.column13;
  d.column14 = +d.column14;

  //d.column15 = +d.column15;
  // d.column16 = +d.column16;
  return d;
}

function zoomed() {
  chartGroup.attr("transform", d3.event.transform);
}



function resetted() {
  chartGroup.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity);
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
    x0.domain(x3);
    y0.domain(y3);
   // x1.domain(x3);
    //y1.domain(y3);
  } else {
    x0.domain([s[1][1], s[1][0]].map(x0.invert, x1));
    y0.domain([s[1][1], s[0][1]].map(y0.invert, y1));
    // x1.domain([s[0][0], s[1][0]].map(x1.invert, x1));
    //y1.domain([s[1][1], s[0][1]].map(y1.invert, y1));
    chartGroup.select(".brush").call(brush.move, null);
  }
  zoom();
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

})();