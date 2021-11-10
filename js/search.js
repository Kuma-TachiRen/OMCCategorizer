var plOptions = {
  valueNames: ['pl_name', 'pl_point', 'pl_field', 'pl_category', 'pl_keyword'],
  page: 100,
  pagination: {
    paginationClass: 'pagination',
    innerWindow: 3,
    outerWindow: 1,
  }
};
var probList;
var probname;
var field;
var fieldexact;
var point_min;
var point_max;
var category;
var keyword;

var categorydic = {};

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
    keyword = getParam('keyword');
    if (keyword) {
      $('#f-keyword').val(keyword);
    } else {
      keyword = '';
    }

    $.getJSON("./data/category.json", function () { })
      .done(function (data) {
        for (var i in data) {
          categorydic[data[i].id] = '<a href=search?category=' + data[i].id + '>' + data[i].display + '</a>';
          $('#f-category').append('<option value="' + data[i].id + '">' + data[i].display + '</option>');
          if (data[i].id == category) {
            $('#f-category').val(data[i].id);
          }
        }

        $.getJSON("./data/problem.json", function () { })
          .done(function (data) {
            var count = 0;
            for (var i in data) {
              if (filter(data[i])) {
                var categories = [];
                for (var j in data[i].category) {
                  categories.push(categorydic[data[i].category[j]]);
                }
                $('#problem-data').append(
                  '<tr>'
                  + '<td class="pl_name"><p hidden>' + data[i].name + '</p><a href="https://onlinemathcontest.com/contests/' + data[i].contestid + '/tasks/' + data[i].problemid + '">' + data[i].name + '</a></td>'
                  + '<td class="pl_point"><a href="search?point_min='+data[i].point+'&point_max='+data[i].point+'">' + data[i].point + '</a></td>'
                  + '<td class="pl_field">' + numToField(data[i].field) + '</td>'
                  + '<td class="pl_category">' + categories.join('/') + '</td>'
                  + '<td class="pl_keyword">' + data[i].keyword.join('/') + '</td>'
                  + '</tr>'
                );
                count++;
              }
            }
            $('#search-result').text('検索結果：'+count+'件');
            if (count) {
              $('#problem-list').append('<ul class="pagination"></ul>');
              probList = new List('problem-list', plOptions);
              probList.sort('pl_name', { order: 'asc' });
            }
          })
          .fail(function () {
            alert("Couldn't get the data of problems");
          });
      })
      .fail(function () {
        alert("Couldn't get the data of categories");
      });

    $('#f-apply').on('click', filterApply);
    $('#f-reset').on('click', function () {
      window.location.href = 'search';
    });
  });
}

function filter(data) {
  if (probname && (data.name.indexOf(probname) == -1)) return false;
  if (field) {
    if (fieldexact) {
      if (data.field != field) return false;
    } else {
      if ((data.field & field) == 0) return false;
    }
  }
  if (point_min && point_max && ((data.point < point_min) || (data.point > point_max))) return false;
  if (category && !data.category.includes(category)) return false;
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
  if (params.length == 0) window.location.href = 'search';
  else window.location.href = 'search?' + params.join('&');
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
  if (num & 1) field.push('<a href="search?field=1">A</a>');
  if (num & 2) field.push('<a href="search?field=2">C</a>');
  if (num & 4) field.push('<a href="search?field=4">G</a>');
  if (num & 8) field.push('<a href="search?field=8">N</a>');
  return field.join('/');
}