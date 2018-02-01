(function (exports) {
  'use strict';

  exports.pick = pick;
  exports.replaceParams = replaceParams;
  exports.selectText = selectText;

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


})(window.utils = {});