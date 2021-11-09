var plOptions = {
  valueNames: ['pl_name', 'pl_point', 'pl_field', 'pl_category', 'pl_keyword']
};
var probList;
var probname;
var field;
var fieldexact;
var point_min;
var point_max;
var category;
var keyword;

window.onload = function () {
  $(document).ready(function () {
    probname = getParam('name');
    if (probname) {
      $('#f-name').val(probname);
    } else {
      probname = "";
    }
    field = getParam('field');
    if (field) {
      var num = parseInt(field);
      $('#f-field-a').prop('checked', (num & 1) != 0);
      $('#f-field-c').prop('checked', (num & 2) != 0);
      $('#f-field-g').prop('checked', (num & 4) != 0);
      $('#f-field-n').prop('checked', (num & 8) != 0);
    } else {
      field = 0;
    }
    fieldexact = getParam('field_exact') == 'true';
    $('#f-field-exact').prop('checked', fieldexact);
    point_min = parseInt(getParam('point_min'));
    if (point_min) {
      $('#f-point-min').val(point_min);
    } else {
      point_min = 100;
    }
    point_max = parseInt(getParam('point_max'));
    if (point_max) {
      $('#f-point-max').val(point_max);
    } else {
      point_max = 1000;
    }
    category = getParam('category');
    if (category) {
      $('#f-category').val(category);
    } else {
      category = "";
    }
    keyword = getParam('keyword');
    if (keyword) {
      $('#f-keyword').val(keyword);
    } else {
      keyword = "";
    }

    $.getJSON("./data/problem.json", function () { })
      .done(function (data) {
        for (var i in data) {
          if (filter(data[i])) {
            $('#problem-data').append(
              '<tr>'
              + '<td class="pl_name"><a href="https://onlinemathcontest.com/contests/' + data[i].link + '">' + data[i].name + '</td>'
              + '<td class="pl_point">' + data[i].point + '</td>'
              + '<td class="pl_field">' + numToField(data[i].field) + '</td>'
              + '<td class="pl_category">' + data[i].category.join('/') + '</td>'
              + '<td class="pl_keyword">' + data[i].keyword.join('/') + '</td>'
              + '</tr>'
            );
          }
        }
      })
      .fail(function () {
        alert("Couldn't get the data");
      });
    if ($('#problem-data').length>1) {
      probList = new List('problem-list', plOptions);
      probList.sort('pl_name', { order: 'asc' });
    }
    $('#f-apply').on('click', filterApply);
    $('#f-reset').on('click', function () {
      window.location.href = 'search.html';
    });
  });
}

function filter(data) {
  if (probname && (data.name.indexOf(probname) == -1)) return false;
  if (field) {
    if (fieldexact) {
      if (data.field != num) return false;
    } else {
      if ((data.field & num) == 0) return false;
    }
  }
  if (point_min && point_max && ((data.point < point_min) || (data.point > point_max))) return false;
  return true;
}


function filterApply() {
  var params = [];
  if ($('#f-name').val()) params.push('name=' + $('#f-name').val());
  var num = 0;
  if ($('#f-field-a').prop('checked')) num += 1;
  if ($('#f-field-c').prop('checked')) num += 2;
  if ($('#f-field-g').prop('checked')) num += 4;
  if ($('#f-field-n').prop('checked')) num += 8;
  if (num) params.push('field=' + num);
  if ($('#f-field-exact').prop('checked')) params.push('field_exact=true');
  if ($('#f-point-min').val()) params.push('point_min=' + $('#f-point-min').val());
  if ($('#f-point-max').val()) params.push('point_max=' + $('#f-point-max').val());
  if ($('#f-category').val()) params.push('category=' + $('#f-category').val());
  if ($('#f-keyword').val()) params.push('keyword=' + $('#f-keyword').val());
  if (params.length == 0) window.location.href = 'search.html';
  else window.location.href = 'search.html?' + params.join('&');
}


function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function numToField(num) {
  var field = [];
  if (num & 1) field.push('A');
  if (num & 2) field.push('C');
  if (num & 4) field.push('G');
  if (num & 8) field.push('N');
  return field.join('/');
}