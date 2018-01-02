(function (exports) {
  'use strict';

  var myWorker = new Worker(config.web_worker_path);
  myWorker.onmessage = workerMessage;

  var selectedMatchData;

  exports.loadBooks = loadBooks;
  exports.parseMetaDataFile = parseMetaDataFile;
  exports.parseSrtFile = parseSrtFile;

  function loadBooks(_selectedMatchData) {
    selectedMatchData = _selectedMatchData;

    config.bookSequence.forEach(function (bookName) {
      d3.select('#' + bookName + 'Loader').style('display', null);
      var contentNodeD3 = d3.select('#' + bookName + 'Content')
      contentNodeD3.style('display', 'none');
      contentNodeD3.html(null);
      d3.select(bookName + 'RawContent').text(null);
    });

    var workerConfig = utils.pick([
      'page_chunk_count', 'forward_chunk_count', 'backward_chunk_count',
      'page_string_format', 'book_content_url', 'bookSequence'
    ], {}, config)
    var workerData = utils.pick([
      'book1_id', 'book1_chunk', 'book2_id', 'book2_chunk'
    ], {}, _selectedMatchData);
    myWorker.postMessage(['load_book', workerData, workerConfig]);
  }
  function workerMessage(e) {
    var taskName = e.data[0];
    if (taskName === 'load_book') {
      var status = e.data[1];
      var textObj = e.data[2];
      var bookName = e.data[3];
      var selectedChunkId = selectedMatchData[bookName + '_chunk'];

      for (var chunkId in textObj) {
        var textToAppend = textObj[chunkId];
        textToAppend = parseBookIntoHtml(textToAppend);
        var contentNodeD3 = d3.select('#' + bookName + 'Content');

        var paraLabel = contentNodeD3
          .append('div')
          .attr('class', 'label-chunk')
          .html('ms' + chunkId);

        var currentPara = contentNodeD3
          .append('div')
          .html(textToAppend);
        contentNodeD3.style('display', null);


        if (Number(chunkId) === selectedChunkId) {
          paraLabel.attr('class', 'selected-para-label')
          currentPara.attr('class', 'selection-chunk');
          selectPara(bookName, currentPara, textToAppend, paraLabel);

          var rawContent = '<div class="booktitle">' + bookName
            + ' (ms' + selectedMatchData[bookName + '_chunk'] + ')</div>'
            + selectedMatchData[bookName + '_raw_content'];
          d3.select('#' + bookName + 'RawContent').html(rawContent);
        }
      }

      if (status === 'complete') {
        d3.select('#' + bookName + 'Loader').style('display', 'none');
      }
    }
  }
  function parseBookIntoHtml(text) {
    text = marked(text);
    return text;
  }
  function selectPara(bookName, currentPara, content, paraLabel) {
    var itemText = selectedMatchData[bookName + '_content'];
    content = content.replace(itemText, '<selection>$&</selection>');
    currentPara.html(parseBookIntoHtml(content));

    setTimeout(function () {
      paraLabel.node().scrollIntoView();
      setTimeout(function () {
        var contentNodeD3 = d3.select('#' + bookName + 'Content');
        var selectionNodeD3 = contentNodeD3.select('selection');
        if (!selectionNodeD3.node()) {
          return;
        }

        var scrollTop = selectionNodeD3.property('offsetTop') - contentNodeD3.property('offsetTop');
        contentNodeD3.property('scrollTop', scrollTop);
        utils.selectText(selectionNodeD3.node());
      }, 0);
    }, 0);
  }

  function parseMetaDataFile(fileStr, bookUris) {
    var booksToFind = 2;
    var bookIdHash = {};
    config.bookSequence.forEach(function (bookName) {
      bookIdHash[bookUris[bookName]] = true;
    });

    fileStr.split('\n').some(function (row) {
      if (row) {
        row = row.split('\t');
        var bookId = config.get_meta_data_book_id(row);
        if (bookIdHash[bookId]) {
          bookIdHash[bookId] = config.map_meta_data(row);
          booksToFind--;
        }
      }
      return booksToFind <= 0;
    });

    return config.bookSequence.map(function (bookName) {
      return bookIdHash[bookUris[bookName]];
    });
  }

  function parseSrtFile(fileStr) {
    var data = [];
    fileStr.split('\n').forEach(function (row) {
      if (row) {
        row = row.split('\t');
        data.push(config.map_srt_data(row));
      }
    });
    return data;
  }


})(window.dataLoader = {});