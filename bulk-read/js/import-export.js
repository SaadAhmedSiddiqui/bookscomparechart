// to turn off skip header: remove line with comment id ##1 in this script
// to remove drop down: remove lines and para with comment id ##2 in this script and index.html as well

(function (window) {
  'use strict';
  window.loadCSV = loadCSV;
  window.exportCSV = exportCSV;
  window.toggleMarking = toggleMarking;
  window.isMarkingsOn = true;
  window.currentText = undefined;

  function loadCSV(input) {
    var reader = new FileReader();
    reader.onloadend = function () {
      window.currentText = reader.result;
      d3.select('#bulkLoader').style('display', null);
      d3.select('#dataTable').style('display', 'none');
      setTimeout(function () {
        loadCurrentTextOnToDom();
        d3.select('#bulkLoader').style('display', 'none');
      });
    }
    reader.readAsText(input.files[0], 'utf-8')
  }
  function toggleMarking() {
    window.isMarkingsOn = !window.isMarkingsOn;
    d3.select('#bulkLoader').style('display', null);
    d3.select('#dataTable').style('display', 'none');
    setTimeout(function () {
      loadCurrentTextOnToDom();
      d3.select('#bulkLoader').style('display', 'none');
    });
  }
  function loadCurrentTextOnToDom() {
    // var inputRows = d3.csvParseRows(inputText);
    var dataTable = document.getElementById('dataTable');
    var tableBody = dataTable.querySelector('tbody');
    var inputRows = d3.tsvParseRows(window.currentText);
    var col = {
      name1: 0,
      name2: 6,
      content1: 1,
      content2: 7
    };
    d3.selectAll('#dataTable tr:not(#rowTemplate)').remove();

    processRow(inputRows.shift(), false);    // ##1 line deals first row as header

    inputRows.forEach(function (dataRow) {
      processRow(dataRow, window.isMarkingsOn);
    });

    d3.select('#dataTable').style('display', null);
    function processRow(dataRow, isMarkingOn) {
      var nodeClone = document.getElementById('rowTemplate').cloneNode(true);
      nodeClone.removeAttribute('id');
      var params = {
        book1Name: dataRow[col.name1],
        book2Name: dataRow[col.name2]
      };
      if (isMarkingOn) {
        params.book1Content = window.processColoring(dataRow[col.content1], dataRow[col.content2], 'difference-deletion');
        params.book2Content = window.processColoring(dataRow[col.content2], dataRow[col.content1], 'difference-addition');
      } else {
        params.book1Content = dataRow[col.content1];
        params.book2Content = dataRow[col.content2];
      }
      nodeClone.querySelectorAll('td').forEach(function (td) {
        td.innerHTML = replaceParams(td.innerHTML, params);
      });
      nodeClone.removeAttribute('hidden');
      tableBody.append(nodeClone);
    }
  }
  function exportCSV() {
    if (document.getElementById('fileInput').files.length === 0) {
      return;
    }
    var csvOutputArray = [];
    d3.selectAll('#dataTable tr:not(#rowTemplate)')
      .each(function () {
        var outputRow = [];
        this.querySelector('.questioner select').value  // ##2 line drop down value
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