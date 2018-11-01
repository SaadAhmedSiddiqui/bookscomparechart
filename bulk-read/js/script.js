(function (window) {
  'use strict';
  window.loadCSV = loadCSV;
  window.exportCSV = exportCSV;

  function loadCSV(input) {
    var reader = new FileReader();
    reader.onloadend = function () {
      var inputText = reader.result;
      // var inputRows = d3.csvParseRows(inputText);
      var inputRows = d3.tsvParseRows(inputText);
      var dataTable = document.getElementById('dataTable');
      var tableBody = dataTable.querySelector('tbody');
      dataTable.removeAttribute('hidden');

      d3.selectAll('#dataTable tr:not(#rowTemplate)').remove();

      inputRows.forEach(function (dataRow) {
        var nodeClone = document.getElementById('rowTemplate').cloneNode(true);
        nodeClone.removeAttribute('id');
        var params = {
          book1Name: dataRow[0],
          book2Name: dataRow[6],
          book1Content: window.processColoring(dataRow[1], dataRow[7], 'difference-deletion'),
          book2Content: window.processColoring(dataRow[7], dataRow[1], 'difference-addition')
        };
        nodeClone.querySelectorAll('td').forEach(function (td) {
          td.innerHTML = replaceParams(td.innerHTML, params);
        });
        nodeClone.removeAttribute('hidden');
        tableBody.append(nodeClone);
      });
    }
    reader.readAsText(input.files[0], 'utf-8')
  }
  function exportCSV() {
    if (document.getElementById('fileInput').files.length === 0) {
      return;
    }
    var csvOutputArray = [];
    d3.selectAll('#dataTable tr:not(#rowTemplate)')
      .each(function () {
        var outputRow = [this.querySelector('.questioner select').value];
        d3.select(this).selectAll('td:not(.questioner)')
          .each(function () {
            outputRow.push(this.textContent);
          });
        csvOutputArray.push(outputRow);
      });

    var blob = new Blob([d3.csvFormatRows(csvOutputArray)], {
      encoding: "UTF-8",
      type: "text/csv;charset=UTF-8"
    });
    var fileName = document.getElementById('fileInput').files[0].name.replace(/\.csv$/, '_output.csv');
    window.saveAs(blob, fileName);
  }
  function replaceParams(str, replacements) {
    for (const paramName in replacements) {
      str = str.replace('{{' + paramName + '}}', replacements[paramName]);
    }
    return str;
  }
})(window);