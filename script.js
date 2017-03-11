(function (){
  'use strict';

  // book1: Top Bar Chart (x0)
  // book2: Bottom Bar Chart (x1)
  // connections: connect top bars with bottom bars
  // y-axis: 0 to 100 for book1 and book2
  // x-axis: decided by maxValues function which returns {book1, book2, peek}
  // vertical layout :: 60 + 60

  var books = {
    book1: {
      nodeId  : '#book1Content',
      url     : 'https://raw.githubusercontent.com/OpenArabic/0300AH/master/data/0255Jahiz/0255Jahiz.Hayawan/0255Jahiz.Hayawan.Shamela0023775-ara1.inProgress',
      text    : null,
      loading : false,
      selector: null
    },
    book2: {
      nodeId  : '#book2Content',
      url     :'https://raw.githubusercontent.com/OpenArabic/0500AH/master/data/0429AbuMansurThacalibi/0429AbuMansurThacalibi.ThimarQulub/0429AbuMansurThacalibi.ThimarQulub.Shamela0006896-ara1.completed',
      text    : null,
      loading : false,
      selector: null
    }
  };
  var isPanelOpened;
  var duration1 = 700, duration2 = 400;

  var graph = graphHelper;
  graph.openPanel   = openPanel;
  graph.closePanel  = closePanel;

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

  // use mapDataWithIndex function when there is no header
  d3.tsv("data-live.txt", mapData, function (error, data) {
    //window.itemText = data[3];
    if(!data){
      throw new Error('Data is undefined');
    }
    graph.initData(data);
    graph.drawChart();
    graph.updateChart();
  });

  graph.createChart();
  graph.setLayout();
  eventBindings();

  function eventBindings() {
    d3.select('#closeBtn').on('click', closePanel);
    window.onresize = onResize;

    loadBook("book1");
    setTimeout(loadBook, 200, "book2");
  }
  function onResize() {
    graph.setLayout();
    graph.drawChart();
    graph.updateChart(duration2);
  }
  function loadBook(bookName){
    var context = books[bookName];

    context.loading = true;
    d3.select("#"+bookName+"Loader").style("display", null);
    d3.text(context.url, function(error, text) {
      if (error) throw error;
      context.loading = false;

      text = filterBookNoise(text);
      context.text = text;//.slice(35000,40000);
      text = parseBookIntoHtml(text);
      setTimeout(function () {
        var contentNodeD3 = d3.select(context.nodeId).style("display", null);
        d3.select("#"+bookName+"Loader").style("display", "none");
        context.selector ? context.selector() : contentNodeD3.html(text);
      }, 0);
    });
  }

  function deNormalizeItemText(text){
    text = text.replace(/-+/g, "");           // removes dashes
    text = text.replace(/ +/g, " ").trim();   // remove possible double spaces
    // -------------------------------------

    var alifs     = '[إأٱآا]';
    var alifRepl  = '[إأٱآا]';
    // -------------------------------------
    var alifMaqsura     = '[يى]';
    var alifMaqsuraRepl = '[يى]';
    // -------------------------------------
    var taMarbutas      = 'ة';
    var taMarbutasRepl  = '[هة]';
    // -------------------------------------
    var hamzas      = '[ؤئء]';
    //var hamzasRepl  = '[ؤئءوي]';
    var hamzasRepl  = '[يى]?[ؤئءوي]';
    // -------------------------------------

    // Applying deNormalization ::
    text = text.replace(new RegExp(alifs, 'g'), alifRepl);
    text = text.replace(new RegExp(alifMaqsura, 'g'), alifMaqsuraRepl);
    text = text.replace(new RegExp(taMarbutas, 'g'), taMarbutasRepl);
    text = text.replace(new RegExp(hamzas, 'g'), hamzasRepl);
    // -------------------------------------

    //text = text.replace(/ /g, "[\\s\\w\\#\\n\\@\\$\\|\\(\\)-]+");
    //text = text.replace(/ /g, "((\\W+(\\d+)?)?(Page\\w+)?)+");       // new from max
    text = text.replace(/ /g, "(\\W+(\\d+)?)?(note\\w+|Page\\w+)?");  // old from max
    // -------------------------------------

    return new RegExp(text);
  }

  function filterBookNoise(text){
    text = text.replace(/\n~~/g, " ");
    text = text.replace(/  +/g, " ");
    text = text.replace(/### \|+/g, function(match){
      return "#"+match.slice(4).replace(/\|/g, "#");
    });
    return text;
  }
  function parseBookIntoHtml(text){
    text = marked(text);
    return text;
  }
  function setPanelContent(bookName, d1){
    var context = books[bookName];
    d3.select(bookName+'RawContent').text(null);
    if(context.loading){
      context.selector = selectPara.bind(null, bookName, d1);
    } else{
      selectPara(bookName, d1);
    }
  }
  function selectPara(bookName, itemData){
    var context = books[bookName];
    var itemText = itemData[bookName+"_content"];
    var contentNodeD3 = d3.select(context.nodeId);
    var content = context.text;
    content = content.replace(itemText, '<selection>$&</selection>');
    contentNodeD3.html( parseBookIntoHtml(content) );

    setTimeout(function(){
      var selectionNodeD3 = contentNodeD3.select('selection');
      var rawContent = bookName+" :</br></br>"+itemData[bookName+"_raw_content"];
      d3.select('#'+bookName+'RawContent').html(rawContent);
      if(!selectionNodeD3.node()) {
        return;
      }

      var scrollTop = selectionNodeD3.property("offsetTop") - contentNodeD3.property("offsetTop");
      contentNodeD3.property("scrollTop", scrollTop);
      selectText(selectionNodeD3.node());
    }, 0);
  }

  // --- Panel Events [START] :::
  function openPanel(itemData) {
    if(graph.animating)   return;

    isPanelOpened = true;
    d3.select("#mySidenav").style("display", null);
    d3.select("#bottomPanelRaw").style("display", null);
    setTimeout(function(){
      d3.select('#mySidenav').style("opacity", null);
    }, duration1);

    setTimeout(function(){
      setPanelContent("book1", itemData);
    }, 0);
    setTimeout(function(){
      setPanelContent("book2", itemData);
    }, 0);
  }
  function closePanel() {
    if(graph.animating)   return;

    isPanelOpened = false;
    graph.restoreCanvas();
    graph.setLayout();
    graph.drawChart();
    setTimeout(function(){
      d3.select("#bottomPanelRaw").style("display", "none");
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
  // --- Panel Events [END] :::

  // --- Data Mapping [START] :::
  function mapData(d) {

    return {
      book1_page  : +d.column9,
      book2_page  : +d.column10,
      book1_y1    : +d.column11,
      book1_y2    : +d.column12,
      book2_y1    : +d.column13,
      book2_y2    : +d.column14,
      book1_content: deNormalizeItemText(d.column15),
      book2_content: deNormalizeItemText(d.column16),
      book1_raw_content: d.column15,
      book2_raw_content: d.column16
    };
  }
  function mapDataWithIndex(d) {

    return {
      book1_page  : +d[0],
      book2_page  : +d[1],
      book1_y1    : +d[2],
      book1_y2    : +d[3],
      book2_y1    : +d[4],
      book2_y2    : +d[5],
      book1_content: deNormalizeItemText(d[6]),
      book2_content: deNormalizeItemText(d[7]),
      book1_raw_content: d[6],
      book2_raw_content: d[7]
    };
  }
  // --- Data Mapping [END] :::

})();