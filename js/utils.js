(function (exports) {
  'use strict';

  exports.pick = pick;
  exports.replaceParams = replaceParams;
  exports.selectText = selectText;
  exports.extractRow = extractRow;

  function pick(properties, targetObject, sourceObject) {
    sourceObject = sourceObject || targetObject;
    properties.forEach((property) => {
      targetObject[property] = sourceObject[property];
    });
    return targetObject;
  }
  function replaceParams(string, replacements) {
    for (const paramName in replacements) {
      if (replacements[paramName] || replacements[paramName] === 0) {
        string = string.replace('{' + paramName + '}', replacements[paramName]);
      }
    }
    return string;
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

  function selectText(textNode) {
    var range;
    if (document.body.createTextRange) { // ms
      range = document.body.createTextRange();
      range.moveToElementText(textNode);
      range.select();
    } else if (window.getSelection) {
      var selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  var typesForConversion = {
    'number': function (output, value, schema) { output[schema.key] = Number(value); },
    'string': function (output, value, schema) { output[schema.key] = value; },
    'normalizedText': function (output, value, schema) { output[schema.key] = deNormalizeItemText(value); },
    'extract': function (output, value, schema) {
      var extracts = extractIdAndMs(value);
      output[schema.key] = extracts[0];
      output[schema.key2] = extracts[1];
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


})(window.utils = {});