(function () {
  function Levenshtein() {

  }
  Levenshtein.prototype.coreProcess = function coreProcess(sourceStr) {
    sourceStr = sourceStr.replace(/\s+/gm, ' ');
    sourceStr = sourceStr.replace(/\s*\n\s*/gm, ' ');
    var allwords = sourceStr.split(' ');


  }
  Levenshtein.prototype.processMatrix = function processMatrix(a, b) {
    if (a.length === 0)
      return '';
    if (b.length === 0)
      return '';

    var matrix = [];
    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
      matrix[i] = new Int8Array(a.length + 1);
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
            Math.min(matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1));
          // deletion
        }
      }
    }
    console.log(matrix);

    var i = 0
    var oi = -1;
    var j = 0
    var oj = -1;
    var column1 = '';
    var column2 = '';
    var oi = -1;
    do {

      console.log(i, j, '-', matrix[i][j], matrix[i + 1][j + 1], '-', matrix[i + 1][j], matrix[i][j + 1]);

      if (matrix[i][j] === matrix[i + 1][j + 1]) {
        recordString(i, j);
        i++;
        j++;
      } else if (matrix[i][j] === matrix[i][j + 1]) {
        recordString(i, j);
        j++;
      } else if (matrix[i][j] === matrix[i + 1][j]) {
        recordString(i, j);
        i++;
      } else {
        recordEditString(i, j);
        i++;
        j++;
      }

    } while (i < b.length && j < a.length);
    column1 += b.slice(i).replace(/./g, '[$&]');
    column2 += a.slice(j).replace(/./g, '[$&]');
    // console.log(b.length);
    return [column2, column1];
    function recordString(i, j) {
      if (i !== oi) {
        column1 += b[i];
        oi = i;
      }
      if (j !== oj) {
        column2 += a[j];
        oj = j;
      }

    }
    function recordEditString(i, j) {
      if (i !== oi) {
        column1 += '[' + b[i] + ']';
        oi = i;
      }
      if (j !== oj) {
        column2 += '[' + a[j] + ']';
        oj = j;
      }

    }
  }

  window.Levenshtein = {}
})();