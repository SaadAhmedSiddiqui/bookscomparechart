'use strict';
window.processColoring = (function () {

  return function processColoring(text1, text2, colorClass) {
    var output = '';
    for (var globalIndex = 0; globalIndex < text1.length; globalIndex++) {
      if (text2[globalIndex] === undefined || text1[globalIndex] === text2[globalIndex]) {
        text1Append(globalIndex);

      } else if (compareOmission(globalIndex)) {
        globalIndex = traverseExtension(globalIndex, 'difference-deletion', compareOmission, text1Append);

      } else if (compareInsertion(globalIndex)) {
        globalIndex = traverseExtension(globalIndex, 'difference-addition', compareInsertion, text1Append);

      } else if (compareDifference(globalIndex)) {
        globalIndex = traverseExtension(globalIndex, colorClass, compareDifference, text1Append);
      } else {
        console.log('should not go here');
        text1Append(globalIndex);
      }
    }
    return output;
    function compareOmission(j) {
      return text1[j] === '-';
    }
    function compareInsertion(j) {
      return text2[j] === '-';
    }
    function compareDifference(j) {
      return text1[j] !== '-' && text2[j] !== '-' && text1[j] !== text2[j];
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
})();
