
onmessage = function (e) {
  var srtFileUrl = e.data[0];
  var bookUris = e.data[1];
  var config = e.data[2];
  var output = [];
  loadXhr(srtFileUrl, onSrtTextLoaded);
  function onSrtTextLoaded(srtDataText) {
    var srtData;
    loadXhr(config.meta_data_path, function (metaDataText) {
      postMessage([srtData, parseMetaDataFile(metaDataText, config, bookUris)]);
    });
    srtData = parseSrtFile(srtDataText, config);
  }
}

function parseSrtFile(fileStr, config) {
  var data = [];
  fileStr.split('\n').forEach(function (row) {
    if (row) {
      row = row.split('\t');
      data.push(extractRow(row, config.srt_data_mapping));
    }
  });
  return data;
}
function parseMetaDataFile(fileStr, config, bookUris) {
  var booksToFind = 2;
  var bookIdHash = {};
  config.bookSequence.forEach(function (bookName) {
    bookIdHash[bookUris[bookName]] = true;
  });

  fileStr.split('\n').some(function (row) {
    if (row) {
      row = row.split('\t');
      var bookId = row[config.meta_data_book_id_cell];
      if (bookIdHash[bookId]) {
        bookIdHash[bookId] = extractRow(row, config.meta_data_mapping);
        booksToFind--;
      }
    }
    return booksToFind <= 0;
  });

  return config.bookSequence.map(function (bookName) {
    return bookIdHash[bookUris[bookName]];
  });
}

function loadXhr(url, callback) {
  var baseUrl = location.href.replace(location.pathname, '/');
  var xhr = new XMLHttpRequest();
  console.log(url);
  xhr.open('GET', baseUrl + url, true);
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        callback(xhr.responseText);
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.onerror = function (e) {
    console.error(xhr.statusText);
  };
  xhr.send(null);
}

var typesForConversion = {
  'number': function (output, value, schema) { output[schema.key] = Number(value); },
  'string': function (output, value, schema) { output[schema.key] = value; },
  'normalizedText': function (output, value, schema) { output[schema.key] = deNormalizeItemText(value); },
  'extract': function (output, value, schema) {
    var extracts = extractIdAndMs(value);
    output[schema.key] = extracts[0];
    output[schema.key2] = Number(extracts[1]);
  },
  'ceil': function (output, value, schema) { output[schema.key] = Math.ceil(value / schema.use); }
};

function extractRow(row, mapping) {

  return mapping.reduce(function (output, schema) {
    var process = typesForConversion[schema.type];
    process(output, row[schema.cell], schema);
    return output;
  }, {});
}

function extractIdAndMs(txtString) {
  var match = txtString.match(/(\w+)-ara1\.ms(\d+)/);
  if (match) {
    return [match[1], match[2]];   // [book_id, ms_id]
  } else {
    return [];
  }
}

function deNormalizeItemText(text) {
  text = text.replace(/-+/g, '');           // removes dashes
  text = text.replace(/ +/g, ' ').trim();   // remove possible double spaces
  // -------------------------------------

  var alifs = '[إأٱآا]';
  var alifRepl = '[إأٱآا]';
  // -------------------------------------
  var alifMaqsura = '[يى]';
  var alifMaqsuraRepl = '[يى]';
  // -------------------------------------
  var taMarbutas = 'ة';
  var taMarbutasRepl = '[هة]';
  // -------------------------------------
  var hamzas = '[ؤئء]';
  //var hamzasRepl  = '[ؤئءوي]';
  var hamzasRepl = '[يى]?[ؤئءوي]';
  // -------------------------------------

  // Applying deNormalization ::
  text = text.replace(new RegExp(alifs, 'g'), alifRepl);
  text = text.replace(new RegExp(alifMaqsura, 'g'), alifMaqsuraRepl);
  text = text.replace(new RegExp(taMarbutas, 'g'), taMarbutasRepl);
  text = text.replace(new RegExp(hamzas, 'g'), hamzasRepl);
  // -------------------------------------

  //text = text.replace(/ /g, '[\\s\\w\\#\\n\\@\\$\\|\\(\\)-]+');
  //text = text.replace(/ /g, '((\\W+(\\d+)?)?(Page\\w+)?)+');       // new from max
  text = text.replace(/ /g, '(\\W+(\\d+)?)?(note\\w+|Page\\w+)?');  // old from max
  // text = text.replace(/ /g, '(\W+(\d+)?)?(note\w+|<[^<]+>|Page\w+)?');
  // -------------------------------------

  return new RegExp(text);
}