var plOptions = {
  valueNames: ['pl-writer', 'pl-name', 'pl-point', 'pl-field', 'pl-category', 'pl-keyword'],
  page: 50,
  pagination: {
    paginationClass: 'pagination',
    innerWindow: 3,
    outerWindow: 1,
  }
};
var probList;
var param = {};

var categorydic = {};

var typelist = {
  b: '4b',
  n: '無印',
  e: '4e',
  v: '有志',
  o: '旧'
}

var local_storage = {};

$(function () {
  window.setTimeout(loaded, 5000);
  // get URL parameter
  var param_changed = false;
  function chkboxCheck(paramid, htmlid) {
    param[paramid] = getParam(paramid) == 'true';
    if (param[paramid]) {
      $('#' + htmlid).prop('checked', true);
      param_changed = true;
    }
  }
  param.name = getParam('name');
  if (param.name) {
    $('#f-name').val(param.name);
    param_changed = true;
  } else {
    param.name = "";
  }
  chkboxCheck('name_not', 'f-name-not');
  param.field = getParam('field');
  if (param.field) {
    var num = parseInt(param.field);
    if ((num & 1) != 0) $('#f-field-a').prop('checked', true);
    if ((num & 2) != 0) $('#f-field-c').prop('checked', true);
    if ((num & 4) != 0) $('#f-field-g').prop('checked', true);
    if ((num & 8) != 0) $('#f-field-n').prop('checked', true);
    param_changed = true;
  } else {
    param.field = 0;
  }
  chkboxCheck('field_exact', 'f-field-exact')
  param.point_min = parseInt(getParam('point_min'));
  if (Number.isInteger(param.point_min)) {
    $('#f-point-min').val(param.point_min);
  } else {
    param.point_min = 0;
  }
  param.point_max = parseInt(getParam('point_max'));
  if (Number.isInteger(param.point_max)) {
    $('#f-point-max').val(param.point_max);
  } else {
    param.point_max = 1000;
  }
  if (!(param.point_min == 0 && param.point_max == 1000)) param_changed = true;
  param.category = getParam('category');
  if (param.category) param_changed = true;
  param.keyword = getParam('keyword');
  if (param.keyword) {
    $('#f-keyword').val(param.keyword);
    param_changed = true;
  } else {
    param.keyword = '';
  }
  chkboxCheck('ca', 'f-ca');
  chkboxCheck('ca_not', 'f-ca-not');

  param.type = {};
  param.type_any = false;
  for (let key in typelist) {
    param.type[key] = getParam('type_' + key) == 'true';
    if (param.type[key]) {
      $('#f-type-' + key).prop('checked', true);
      param_changed = true;
      param.type_any = true;
    }
  };

  if (param_changed) $('#setting').attr('open', true);

  if (getParam('writer_show') == 'true') {
    param.writer_show = true;
    $('#pl-name-head').before('<th class="sort" data-sort="pl-writer" width="100px">writer</th>');
    param.writer = getParam('writer');
    if (!param.writer) param.writer = '';
  }

  // get localStorage
  local_storage = getStorage();
  $('#user-id').val(local_storage.UserId);
  $('#f-non-ca-info').prop('checked', local_storage.ShowNonCAInfo);
  if (!local_storage.ShowNonCAInfo) {
    $('#problem-list').attr('hide-non-ca-info', true);
  }

  // get category
  $.getJSON("./data/category.json", function () { })
    .done(function (data) {
      for (var i in data) {
        categorydic[data[i].id] = paramLink({ category: `'${data[i].id}'` }, data[i].display);
        $('#f-category').append(`<option value="${data[i].id}">${data[i].display}</option>`);
        if (data[i].id == param.category) {
          $('#f-category').val(data[i].id);
        }
      }

      // get problem
      $.getJSON("./data/problem.json", function () { })
        .done(function (data) {
          var count_match = 0;
          var count_total = 0;
          var column_list = [];
          for (var i in data) {
            count_total++;
            if (filter(data[i])) {
              column_list.push(problemColumn(data[i]));
              count_match++;
            }
          }
          $('#problem-data').append(column_list.join(''));
          $('#search-result').text(`検索結果：${count_match}/${count_total}件`);
          if (count_match) {
            $('#problem-list').append('<ul class="pagination"></ul>');
            probList = new List('problem-list', plOptions);
            probList.sort('pl-name', { order: 'asc' });
          }
          if ($('#user-id').val() && (Date.now() / 1000 - local_storage.CALastUpdate > 3600 * 12)) userLoad();
          $('#user-load').on('click', userLoad);
          loaded();
        })
        .fail(function () {
          alert("Couldn't get the data of problems");
        });
    })
    .fail(function () {
      alert("Couldn't get the data of categories");
    });

  $('#f-apply').on('click', applyFilter);
  $('#f-reset').on('click', function () {
    window.location.href = 'search';
  });
});

function paramLink(p, d) {
  return `<a onclick="applyFilter({},{${Object.entries(p).map((e) => { return `${e[0]}:${e[1]}`; }).join(',')}})">${d}</a>`;
}

function numToField(num) {
  var field = [];
  if (num & 1) field.push(paramLink({ field: 1 }, 'A'));
  if (num & 2) field.push(paramLink({ field: 2 }, 'C'));
  if (num & 4) field.push(paramLink({ field: 4 }, 'G'));
  if (num & 8) field.push(paramLink({ field: 8 }, 'N'));
  return field.join('/');
}

function problemColumn(data) {
  var categories = [];
  for (var i in data.category) {
    categories.push(categorydic[data.category[i]]);
  }
  var keywords = [];
  for (var i in data.keyword) {
    keywords.push(paramLink({ keyword: `'${data.keyword[i]}'` }, data.keyword[i]));
  }
  var isCA = '';
  if (local_storage.CAstatus[data.problemid]) {
    isCA = ' ca=true';
  }
  return `<tr class="problem-column" id="prob-${data.problemid}"${isCA}>`
    + (param.writer_show ? `<td class="pl-writer"><a href="https://onlinemathcontest.com/users/${data.writer}" target="_blank" rel="noopener noreferrer">${data.writer}</a></td>` : '')
    + `<td class="pl-name"><p hidden>${data.name}</p>`
    + `<a type="${data.type}" type-disp="${typelist[data.type]}" href="https://onlinemathcontest.com/contests/${data.contestid}/tasks/${data.problemid}" target="_blank" rel="noopener noreferrer">${data.name}</a></td>`
    + `<td class="pl-point">${paramLink({ point_min: data.point, point_max: data.point }, data.point)}</td>`
    + `<td class="pl-field"><span class="pl-hasinfo">${numToField(data.field)}</span></td>`
    + `<td class="pl-category"><span class="pl-hasinfo">${categories.join(' / ')}</span></td>`
    + `<td class="pl-keyword"><span class="pl-hasinfo">${keywords.join(' / ')}</span></td>`
    + `</tr>`
}

function filter(data) {
  if (!local_storage.ShowNonCAInfo && !local_storage.CAstatus[data.problemid]) {
    data.field = 0;
    data.category = [];
    data.keyword = [];
  }
  if (!param.name_not) {
    if (param.name && (data.name.indexOf(param.name) == -1)) return false;
  } else {
    if (param.name && (data.name.indexOf(param.name) != -1)) return false;
  }
  if (param.field) {
    if (param.field_exact) {
      if (data.field != param.field) return false;
    } else {
      if ((data.field & param.field) == 0) return false;
    }
  }
  if (param.point_min && param.point_max && ((data.point < param.point_min) || (data.point > param.point_max))) return false;
  if (param.category && !data.category.includes(param.category)) return false;
  if (param.keyword && !data.keyword.includes(param.keyword)) return false;
  if (param.ca && !param.ca_not && !local_storage.CAstatus[data.problemid]) return false;
  if (!param.ca && param.ca_not && local_storage.CAstatus[data.problemid]) return false;
  if (param.type_any && !param.type[data.type]) return false;
  if (param.writer_show && data.writer.indexOf(param.writer) == -1) return false;
  return true;
}

function applyFilter(event, param_add = {}) {
  var newparam = {};
  if ($('#f-name').val()) newparam['name'] = $('#f-name').val();
  if ($('#f-name-not').prop('checked')) newparam['name_not'] = true;
  var num = 0;
  if ($('#f-field-a').prop('checked')) num += 1;
  if ($('#f-field-c').prop('checked')) num += 2;
  if ($('#f-field-g').prop('checked')) num += 4;
  if ($('#f-field-n').prop('checked')) num += 8;
  if (num) newparam['field'] = num;
  if ($('#f-field-exact').prop('checked')) newparam['field_exact'] = true;
  if ($('#f-point-min').val() && $('#f-point-max').val() && !($('#f-point-min').val() == 0 && $('#f-point-max').val() == 1000)) {
    newparam['point_min'] = $('#f-point-min').val();
    newparam['point_max'] = $('#f-point-max').val();
  }
  if ($('#f-category').val()) newparam['category'] = $('#f-category').val();
  if ($('#f-keyword').val()) newparam['keyword'] = $('#f-keyword').val();
  if ($('#f-ca').prop('checked')) newparam['ca'] = true;
  if ($('#f-ca-not').prop('checked')) newparam['ca_not'] = true;
  if ($('#f-ca-show').prop('checked')) newparam['ca_show'] = true;
  for (let key in typelist) {
    if ($(`#f-type-${key}`).prop('checked')) newparam[`type_${key}`] = true;
  };
  if (param.writer_show) newparam['writer_show'] = true;
  if (param.writer) newparam['writer'] = param.writer;
  for (let key in param_add) { newparam[key] = param_add[key]; }

  local_storage.ShowNonCAInfo = $('#f-non-ca-info').prop('checked');
  saveStorage(local_storage);

  // page move
  if (newparam.length == 0) window.location.href = 'search';
  else window.location.href = 'search?'
    + Object.entries(newparam).map((e) => {
      let key = e[0];
      let value = encodeURI(e[1]);
      return `${key}=${value}`;
    }).join('&');
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

async function userLoad() {
  $('#loading-mark').show();
  var user = $('#user-id').val();
  const data = await getUserCA(user);
  if (data.ca.length) {
    local_storage.CALastUpdate = Math.floor(Date.now() / 1000);
    local_storage.UserId = user;
    local_storage.CAstatus = {};
    data.ca.forEach(id => {
      var elm = probList.items.find(c => c.elm.id == `prob-${id}`).elm;
      $(elm).attr('ca', true);
      $(elm).find('.pl-hasinfo').attr('show', true);
      local_storage.CAstatus[id] = true;
    });
    saveStorage(local_storage);
  }
  $('#loading-mark').hide();
}