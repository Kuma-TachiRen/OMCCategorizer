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
var param = {};

var categorydic = {};

var local_storage = {};
var storage_available;

window.onload = function () {
  $(document).ready(function () {
    // get URL parameter
    param.probname = getParam('name');
    if (param.probname) {
      $('#f-name').val(param.probname);
    } else {
      param.probname = "";
    }
    param.name_not = getParam('name_not') == 'true';
    if (param.name_not) $("#f-name-not").prop('checked', true);
    param.field = getParam('field');
    if (param.field) {
      var num = parseInt(param.field);
      if ((num & 1) != 0) $('#f-field-a').prop('checked', true);
      if ((num & 2) != 0) $('#f-field-c').prop('checked', true);
      if ((num & 4) != 0) $('#f-field-g').prop('checked', true);
      if ((num & 8) != 0) $('#f-field-n').prop('checked', true);
    } else {
      param.field = 0;
    }
    param.fieldexact = getParam('field_exact') == 'true';
    if (param.fieldexact) $('#f-field-exact').prop('checked', true);
    param.point_min = parseInt(getParam('point_min'));
    if (param.point_min) {
      $('#f-point-min').val(param.point_min);
    } else {
      param.point_min = 0;
    }
    param.point_max = parseInt(getParam('point_max'));
    if (param.point_max) {
      $('#f-point-max').val(param.point_max);
    } else {
      param.point_max = 1000;
    }
    param.category = getParam('category');
    param.keyword = getParam('keyword');
    if (param.keyword) {
      $('#f-keyword').val(param.keyword);
    } else {
      param.keyword = '';
    }
    param.ca = getParam('ca') == 'true';
    if (param.ca) $('#f-ca').prop('checked', true);
    param.ca_not = getParam('ca_not') == 'true';
    if (param.ca_not) $('#f-ca-not').prop('checked', true);

    // get localStorage
    storage_available = isLocalStorageAvailable();
    if (storage_available) {
      if (localStorage.getItem('OMCCategorization')) local_storage = JSON.parse(localStorage.getItem('OMCCategorization'));
    }
    if (!local_storage.CAstatus) local_storage.CAstatus = {};
    if (!local_storage.CAshow) local_storage.CAshow = false;
    else $('#f-ca-show').prop('checked', true);
    saveStorage();

    // get category
    $.getJSON("./data/category.json", function () { })
      .done(function (data) {
        for (var i in data) {
          categorydic[data[i].id] = '<a href=search?category=' + data[i].id + '>' + data[i].display + '</a>';
          $('#f-category').append('<option value="' + data[i].id + '">' + data[i].display + '</option>');
          if (data[i].id == param.category) {
            $('#f-category').val(data[i].id);
          }
        }

        // get problem
        $.getJSON("./data/problem.json", function () { })
          .done(function (data) {
            var count_match = 0;
            var count_total = 0;
            for (var i in data) {
              count_total++;
              if (filter(data[i])) {
                $('#problem-data').append(problemColumn(data[i]));
                count_match++;
              }
            }
            $('#search-result').text('検索結果：' + count_match + '/' + count_total + '件');
            if (count_match) {
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

    $('#f-apply').on('click', applyClick);
    $('#f-reset').on('click', function () {
      window.location.href = 'search';
    });
  });
}

function problemColumn(data) {
  var categories = [];
  for (var j in data.category) {
    categories.push(categorydic[data.category[j]]);
  }
  var isCA = (local_storage.CAstatus[data.problemid] ? 'ca=true ' : '');
  var isVol = (data.voluntary ? 'voluntary=true ' : '');
  return '<tr class="problem-column"' + isCA + '>'
    + '<td class="pl_name"><p hidden>' + data.name + '</p>'
    + (local_storage.CAshow ? '<span class="ca-circle" ' + isCA + 'id="ca-' + data.problemid + '" onclick="caClick(' + data.problemid + ')"></span>' : '')
    + '<a ' + isVol + 'href="https://onlinemathcontest.com/contests/' + data.contestid + '/tasks/' + data.problemid + '">' + data.name + '</a></td>'
    + '<td class="pl_point"><a href="search?point_min=' + data.point + '&point_max=' + data.point + '">' + data.point + '</a></td>'
    + '<td class="pl_field">' + numToField(data.field) + '</td>'
    + '<td class="pl_category">' + categories.join('/') + '</td>'
    + '<td class="pl_keyword">' + data.keyword.join('/') + '</td>'
    + '</tr>'
}

function caClick(id) {
  if (local_storage.CAstatus[id]) {
    $('#ca-' + id).removeAttr('ca');
    $('#ca-' + id).parent().parent().removeAttr('ca');
    local_storage.CAstatus[id] = false;
  } else {
    $('#ca-' + id).attr('ca', true);
    $('#ca-' + id).parent().parent().attr('ca', true);
    local_storage.CAstatus[id] = true;
  }
  saveStorage();
}

function filter(data) {
  if (param.name_not) {
    if (param.probname && (data.name.indexOf(param.probname) == -1)) return false;
  } else {
    if (param.probname && (data.name.indexOf(param.probname) != -1)) return false;
  }
  if (param.field) {
    if (param.fieldexact) {
      if (data.field != param.field) return false;
    } else {
      if ((data.field & param.field) == 0) return false;
    }
  }
  if (param.point_min && param.point_max && ((data.point < param.point_min) || (data.point > param.point_max))) return false;
  if (param.category && !data.category.includes(param.category)) return false;
  if (param.ca && !param.ca_not && !local_storage.CAstatus[data.problemid]) return false;
  if (!param.ca && param.ca_not && local_storage.CAstatus[data.problemid]) return false;
  return true;
}


function applyClick() {
  var newparams = [];
  if ($('#f-name').val()) newparams.push('name=' + $('#f-name').val());
  if ($('#f-name-not').prop('checked')) newparams.push('name-not=true');
  var num = 0;
  if ($('#f-field-a').prop('checked')) num += 1;
  if ($('#f-field-c').prop('checked')) num += 2;
  if ($('#f-field-g').prop('checked')) num += 4;
  if ($('#f-field-n').prop('checked')) num += 8;
  if (num) newparams.push('field=' + num);
  if ($('#f-field-exact').prop('checked')) newparams.push('field_exact=true');
  if ($('#f-point-min').val()) newparams.push('point_min=' + $('#f-point-min').val());
  if ($('#f-point-max').val()) newparams.push('point_max=' + $('#f-point-max').val());
  if ($('#f-category').val()) newparams.push('category=' + $('#f-category').val());
  if ($('#f-keyword').val()) newparams.push('keyword=' + $('#f-keyword').val());
  if ($('#f-ca').prop('checked')) newparams.push('ca=true');
  if ($('#f-ca-not').prop('checked')) newparams.push('ca_not=true');
  local_storage.CAshow = ($('#f-ca-show').prop('checked') == true);
  saveStorage();
  // page move
  if (newparams.length == 0) window.location.href = 'search';
  else window.location.href = 'search?' + newparams.join('&');
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

function isLocalStorageAvailable() {
  var dummy = 'dummy';
  try {
    localStorage.setItem(dummy, dummy);
    localStorage.removeItem(dummy);
    return true;
  } catch (e) {
    return false;
  }
}

function saveStorage() {
  if (storage_available) {
    localStorage.setItem('OMCCategorization', JSON.stringify(local_storage));
  }
}

function numToField(num) {
  var field = [];
  if (num & 1) field.push('<a href="search?field=1">A</a>');
  if (num & 2) field.push('<a href="search?field=2">C</a>');
  if (num & 4) field.push('<a href="search?field=4">G</a>');
  if (num & 8) field.push('<a href="search?field=8">N</a>');
  return field.join('/');
}