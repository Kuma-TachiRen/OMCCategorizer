window.onload = function () {
  var plOptions = {
    valueNames: ['pl-name', 'pl-point', 'pl-field', 'pl-category', 'pl-keyword']
  };
  var probList = new List('problem-list', plOptions);
  probList.sort('pl-name', { order: 'asc' });

  $(document).ready(function () {
    var name = getParam('name');
    if (name) {
      document.getElementById('f.ProbName').value = name;
    }
    var field = getParam('field');
    if (field) {
      var fnum = parseInt(field);
      document.getElementById('f.FieldA').checked = ((fnum & 1) == 1);
      document.getElementById('f.FieldC').checked = ((fnum & 2) == 2);
      document.getElementById('f.FieldG').checked = ((fnum & 4) == 4);
      document.getElementById('f.FieldN').checked = ((fnum & 8) == 8);
    }
    var category = getParam('category');
    if (category) {
      document.getElementById('f.Category').value = category;
    }

    $.getJSON("./data/problem.json", function () { })
      .done(function (json) {
        for (var i in data) {
          var field = [];
          if (data[i].field & 1) field.push('A');
          if (data[i].field & 2) field.push('C');
          if (data[i].field & 4) field.push('G');
          if (data[i].field & 8) field.push('N');
          $('#problem-data').append(
            '<td class="pl-name"><a href="https://onlinemathcontest.com/contests/' + data[i].link + '">' + data[i].name + '</td>'
            + '<td class="pl-point">' + data[i].point + '</td>'
            + '<td class="pl-field">' + field.Join('/') + '</td>'
            + '<td class="pl-category">' + data[i].category.Join('/') + '</td>'
            + '<td class="pl-keyword">' + data[i].keyword.Join('/') + '</td>'
          );
        }
      })
      .fail(function (json) {
        alert("Failed: Couldn't get the data");
      });
  });

  function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
}