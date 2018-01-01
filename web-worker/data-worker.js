
var dataHolder = {};

onmessage = function (e) {
  var taskName = e.data[0];
  var data = e.data[1];
  var config = e.data[2];

  if (taskName === 'load_book') {
    var bookUrl = e.data[3];

    config.bookSequence.forEach(function (bookName) {
      var chunkNumber = data[bookName + '_chunk'];
      var bookData = {
        text: [],
        dispatching: 0,
        start_chunk: chunkNumber - config.backward_chunk_count,
        end_chunk: chunkNumber - config.forward_chunk_count
      };
      var startingPage = calcPageNumber(bookData.start_chunk, config.page_chunk_count);
      var endingPage = calcPageNumber(bookData.end_chunk, config.page_chunk_count);

      var pages = [];
      for (var pageNumber = startingPage; pageNumber <= endingPage; pageNumber++) {
        pages.push(pageNumber);
      }
      bookData.total = pages.length;

      dataHolder[bookName] = bookData;
      loadBook(bookName, data[bookName + '_id'], pages, config);
    });
  }
}
function bookResponse(text, bookName) {
  var status = 'pending';
  var bookData = dataHolder[bookName];
  var jsonChunks = parseText(text, bookName);
  if (bookData.dispatching === bookData.total) {
    dataHolder[bookName] = {};
    status = 'complete';
  }
  postMessage(['load_book', status, jsonChunks, bookName]);
}
function loadBook(bookName, bookId, pages, config) {

  pages.forEach(function (pageNumber, pageIndex) {
    var url = config.book_content_url;
    url = url.replace('{book_id}', bookId);
    url = url.replace('{page_string}', prefixString(pageNumber, config.page_string_format));
    var xhr = new XMLHttpRequest();
    console.log(url);
    xhr.open('GET', url, true);
    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          bookOnLoad(xhr.responseText, bookName, pageIndex, pageNumber);
        } else {
          console.error(xhr.statusText);
        }
      }
    };
    xhr.onerror = function (e) {
      console.error(xhr.statusText);
    };
    xhr.send(null);
  });
}

function bookOnLoad(text, bookName, pageIndex) {
  var bookData = dataHolder[bookName];
  bookData.text[pageIndex] = text;

  if (pageIndex <= bookData.dispatching) {
    bookData.text.slice(bookData.dispatching)
      .some(function (text) {
        if (text === undefined) {
          return true;
        }
        bookData.dispatching++;
        bookResponse(text, bookName);
      });
  }
}
function prefixString(number, format) {
  return (format + number.toString()).slice(-format.length);
}
function calcPageNumber(chunkNumber, chunkCount) {
  return chunkNumber + chunkCount - chunkNumber % chunkCount;
}
function parseText(pageStr, bookName) {
  var bookData = dataHolder[bookName];
  pageStr = filterBookNoise(pageStr);
  var data = {};
  pageStr.split('\n').forEach(function (row) {
    if (row) {
      row = row.split('\t');
      var chunkNumber = Number(row[0].replace('ms', ''));
      if (chunkNumber >= bookData.start_chunk && chunkNumber >= bookData.end_chunk) {
        data[chunkNumber] = row[1];
      }
    }
  });
  return data;
}
function filterBookNoise(text) {
  text = text.replace(/\n~~/g, ' ');
  text = text.replace(/ +/g, ' ');
  text = text.replace(/### \|+/g, function (match) {
    return '#' + match.slice(4).replace(/\|/g, '#');
  });
  return text;
}
