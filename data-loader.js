(function (exports) {
  'use strict';
  var books = {
    book1: {
      nodeId: '#book1Content',
      text: null,
      loading: false,
      selector: null
    },
    book2: {
      nodeId: '#book2Content',
      text: null,
      loading: false,
      selector: null
    }
  };

  exports.books = books;
  exports.loadBook = loadBook;
  exports.parseMetaDataFile = parseMetaDataFile;
  exports.parseSrtFile = parseSrtFile;

  function loadBook(bookName) {
    var context = books[bookName];

    context.loading = true;
    d3.select('#' + bookName + 'Loader').style('display', null);
    d3.text(context.url, function (error, text) {
      if (error) throw error;
      context.loading = false;

      text = utils.filterBookNoise(text);
      context.text = text;//.slice(35000,40000);
      text = parseBookIntoHtml(text);
      setTimeout(function () {
        var contentNodeD3 = d3.select(context.nodeId).style('display', null);
        d3.select('#' + bookName + 'Loader').style('display', 'none');
        context.selector ? context.selector() : contentNodeD3.html(text);
      }, 0);
    });
  }

  function parseMetaDataFile(fileStr, bookUris) {
    var booksToFind = 2;
    var bookIdHash = {};
    bookIdHash[bookUris.book1_id] = true;
    bookIdHash[bookUris.book2_id] = true;

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

    return [
      bookIdHash[bookUris.book1_id],
      bookIdHash[bookUris.book2_id]
    ];
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

  function parseTextFile(fileStr, mapper) {
    var data = [];
    fileStr.split('\n').forEach(function (row) {
      if (row) {
        row = row.split('\t');
        data.push(mapper(row));
      }
    });
    return data;
  }


})(window.dataLoader = {});