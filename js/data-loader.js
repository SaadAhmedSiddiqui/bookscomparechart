(function (exports) {
  'use strict';

  var workerConfig = utils.pick([
    'page_chunk_count', 'forward_chunk_count', 'backward_chunk_count',
    'page_string_format', 'book_content_url', 'bookSequence'
  ], {}, config);
  var myWorker = new Worker(config.web_worker_path.load_chunks);
  myWorker.onmessage = workerMessage;

  var selectedMatchData, loadedChunkRange = {};
  var completedDataCount = 0;

  exports.loadBackwardContent = loadBackwardContent;
  exports.loadForwardContent = loadForwardContent;
  exports.loadBooks = loadBooks;

  function pickWorkerData() {
    return utils.pick([
      'book1_id', 'book1_chunk', 'book2_id', 'book2_chunk'
    ], {}, selectedMatchData);
  }
  function loadBackwardContent(bookName) {
    var workerArgs = {
      bookName: bookName,
      start_chunk: loadedChunkRange[bookName][0] - config.load_more_count,
      end_chunk: loadedChunkRange[bookName][0] - 1,
    };

    var workerData = pickWorkerData();
    myWorker.postMessage(['load_backward_book', workerData, workerConfig, workerArgs]);
  }
  function loadForwardContent(bookName) {
    var workerArgs = {
      bookName: bookName,
      start_chunk: loadedChunkRange[bookName][1] + 1,
      end_chunk: loadedChunkRange[bookName][1] + config.load_more_count,
    };

    var workerData = pickWorkerData();
    myWorker.postMessage(['load_forward_book', workerData, workerConfig, workerArgs]);
  }

  function loadBooks(_selectedMatchData) {
    completedDataCount = 0;
    selectedMatchData = _selectedMatchData;

    config.bookSequence.forEach(function (bookName) {
      d3.select('#' + bookName + 'Loader').style('display', null);
      d3.select('#' + bookName + 'Content').style('display', 'none');
      d3.selectAll('.' + bookName + '.loader-btn').style('display', 'none');
      d3.select('#' + bookName + 'Content').html(null);
      d3.select('#' + bookName + 'RawContent').text(null);
    });

    var workerData = pickWorkerData();
    myWorker.postMessage(['load_new_book', workerData, workerConfig]);
  }
  function workerMessage(e) {
    var taskName = e.data[0];
    var status = e.data[1];
    var textObj = e.data[2];
    var bookName = e.data[3];
    var selectedChunkId = selectedMatchData[bookName + '_chunk'];
    var contentNodeD3 = d3.select('#' + bookName + 'Content');
    var prependReferenceD3;

    if (taskName === 'load_new_book') {
      loadedChunkRange[bookName] = e.data[4];
    }
    else if (taskName === 'load_backward_book') {
      loadedChunkRange[bookName][0] = e.data[4][0];
      prependReferenceD3 = contentNodeD3.select('div')
        .attr('class', 'prepend-reference');
    }
    else if (taskName === 'load_forward_book') {
      loadedChunkRange[bookName][1] = e.data[4][1];
    }

    d3.select('#' + bookName + 'Content').style('display', null);

    for (var chunkId in textObj) {
      var chunkText = textObj[chunkId];
      chunkText = parseBookIntoHtml(chunkText);

      var paraLabel;
      var currentPara;
      if (prependReferenceD3) {
        paraLabel = contentNodeD3.insert('div', 'div.prepend-reference');
        currentPara = contentNodeD3.insert('div', 'div.prepend-reference');
      } else {
        paraLabel = contentNodeD3.append('div');
        currentPara = contentNodeD3.append('div');
      }

      paraLabel.attr('class', 'label-chunk')
        .html('ms' + chunkId);
      currentPara.html(chunkText);;

      chunkId = Number(chunkId);
      if (chunkId === selectedChunkId) {
        selectPara(bookName, currentPara, chunkText, paraLabel);
      }
    }
    if (prependReferenceD3) {
      prependReferenceD3.attr('class', null);
    }

    if (status === 'complete') {
      d3.select('#' + bookName + 'Loader').style('display', 'none');
      d3.selectAll('.' + bookName + '.loader-btn').style('display', null);

      if (++completedDataCount >= 2) {
        markDashes();
      }
    }

  }
  function parseBookIntoHtml(text) {
    text = marked(text);
    return text;
  }
  function selectPara(bookName, currentPara, content, paraLabel) {
    var itemText = selectedMatchData[bookName + '_content'];

    paraLabel.attr('class', 'selected-para-label')
    currentPara.attr('class', 'selection-chunk');

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
  function markDashes() {
    console.log(selectedMatchData);
    var rawContent = '<div class="booktitle">book1 (ms' + selectedMatchData['book1_chunk'] + ')</div>'
      + processColoring(selectedMatchData['book1_raw_content'], selectedMatchData['book2_raw_content'], 'difference-deletion')
      + '<br/><br/>'
      + selectedMatchData['book1_raw_content'];
    d3.select('#book1RawContent').html(rawContent);

    var rawContent = '<div class="booktitle">book2 (ms' + selectedMatchData['book2_chunk'] + ')</div>'
      + processColoring(selectedMatchData['book2_raw_content'], selectedMatchData['book1_raw_content'], 'difference-addition')
      + '<br/><br/>'
      + selectedMatchData['book2_raw_content'];
    d3.select('#book2RawContent').html(rawContent);
  }
  function processColoring(text1, text2, colorClass) {
    var output = '';
    for (var globalIndex = 0; globalIndex < text1.length && globalIndex < text2.length; globalIndex++) {
      if (text1[globalIndex] === text2[globalIndex]) {
        text1Append(globalIndex);

      } else if (compareOmission(globalIndex)) {
        globalIndex = traverseExtension(globalIndex, 'difference-deletion', compareOmission, text1Append);

      } else if (compareInsertion(globalIndex)) {
        globalIndex = traverseExtension(globalIndex, 'difference-addition', compareInsertion, text1Append);

      } else if (compareDifference(globalIndex)) {
        globalIndex = traverseExtension(globalIndex, colorClass, compareDifference, text1Append);
      }
      /* if T1[x] == "-":
        OMISSIONS += 1
      if T2[x] == "-":
        INSERTION += 1
      if T1[x] != "-" and T2[x] != "-":
      if T1[x] != T2[x]:
        DIFF += 1 */
    }
    return output;
    function compareOmission(j) {
      return text1[j] === '-';
    }
    function compareInsertion(j) {
      return text2[j] === '-';
    }
    function compareDifference(j) {
      return text1[j] !== '-' && text2[j] !== '-' && text1[j] !== text1[j];
    }
    function text1Append(j) {
      output += text1[j];
    }
    function text2Append(j) {
      output += text1[j];
    }
    function traverseExtension(index, markerClass, compareFn, appendFn) {
      output += '<span class="' + markerClass + '">';
      appendFn(index++);
      while (index < text1.length && compareFn(index)) {
        appendFn(index++);
      };
      output += '</span>';
      return --index;
    }
  }


})(window.dataLoader = {});