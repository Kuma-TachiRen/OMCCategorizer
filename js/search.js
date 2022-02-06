const plOptions = {
  valueNames: ['pl-writer', 'pl-name', 'pl-point', 'pl-field', 'pl-category', 'pl-keyword'],
  page: 50,
  pagination: {
    paginationClass: 'pagination',
    innerWindow: 3,
    outerWindow: 1,
  }
};
let probList;
let param = {};

let categorydic = {};

let rating = {};
let admin = [];

const typeList = { b: '4b', n: '無印', e: '4e', v: '有志', o: '旧' };
const rateColor = ['#808080', '#804000', '#008000', '#00c0c0', '#0000ff', '#c0c000', '#ff8000', '#ff0000']

let local_storage = {};

$(function () {
  window.setTimeout(loaded, 5000);
  // Get URL parameter
  let param_changed = false;
  function chkboxCheck(paramid, htmlid) {
    param[paramid] = getParam(paramid) == 'true';
    if (param[paramid]) {
      $('#' + htmlid).prop('checked', true);
      param_changed = true;
    }
  }
  // Problem name
  param.name = getParam('name');
  if (param.name) {
    $('#f-name').val(param.name);
    param_changed = true;
  }
  else param.name = '';
  chkboxCheck('name_not', 'f-name-not');
  // Field
  param.field = getParam('field');
  if (param.field) {
    const num = parseInt(param.field);
    if ((num & 1) != 0) $('#f-field-a').prop('checked', true);
    if ((num & 2) != 0) $('#f-field-c').prop('checked', true);
    if ((num & 4) != 0) $('#f-field-g').prop('checked', true);
    if ((num & 8) != 0) $('#f-field-n').prop('checked', true);
    param_changed = true;
  }
  else param.field = 0;

  chkboxCheck('field_exact', 'f-field-exact')
  // Point
  param.point_min = parseInt(getParam('point_min'));
  if (Number.isInteger(param.point_min)) {
    $('#f-point-min').val(param.point_min);
  }
  else param.point_min = 0;
  param.point_max = parseInt(getParam('point_max'));
  if (Number.isInteger(param.point_max)) {
    $('#f-point-max').val(param.point_max);
  }
  else param.point_max = 1000;
  if (!(param.point_min == 0 && param.point_max == 1000)) param_changed = true;
  // Category/Keyword
  param.category = getParam('category');
  if (param.category) param_changed = true;
  param.keyword = getParam('keyword');
  if (param.keyword) {
    $('#f-keyword').val(param.keyword);
    param_changed = true;
  }
  else param.keyword = '';
  // CA
  chkboxCheck('ca', 'f-ca');
  chkboxCheck('ca_not', 'f-ca-not');
  // Contest type
  param.type = {};
  param.type_any = false;
  for (let key in typeList) {
    param.type[key] = getParam('type_' + key) == 'true';
    if (param.type[key]) {
      $('#f-type-' + key).prop('checked', true);
      param_changed = true;
      param.type_any = true;
    }
  };
  // Writer
  chkboxCheck('writer_show', 'f-writer-show');
  param.writer = getParam('writer');
  if (param.writer) {
    $('#f-writer').val(param.writer);
    param_changed = true;
  }
  else param.writer = '';

  if (param_changed) $('#setting').attr('open', true);

  if (getParam('writer_show') == 'true') {
    param.writer_show = true;
    $('#pl-name-head').before('<th class="sort" data-sort="pl-writer" width="100px">writer</th>');
    param.writer = getParam('writer');
    if (!param.writer) param.writer = '';
  }

  // Get local storage
  local_storage = getStorage();
  $('#user-id').val(local_storage.UserId);
  $('#f-non-ca-info').prop('checked', local_storage.ShowNonCAInfo);
  if (!local_storage.ShowNonCAInfo) {
    $('#problem-list').attr('hide-non-ca-info', true);
  }
  $('#data-update-date').text(`(データ更新：${updateDateStr(local_storage.CALastUpdate)})`);


  // Get rating
  $.when(
    $.getJSON("./data/rating.json"),
    $.getJSON("./data/admin.json"),
    $.getJSON("./data/category.json"),
    $.getJSON("./data/problem.json"))
    .done(function (rdata, adata, cdata, pdata) {
      rating = rdata[0];
      admin = adata[0];
      let category = cdata[0];
      let problem = pdata[0];
      for (let i in category) {
        categorydic[category[i].id] = paramLink({ category: `'${category[i].id}'` }, category[i].display);
        $('#f-category').append(`<option value="${category[i].id}">${category[i].display}</option>`);
        if (category[i].id == param.category) {
          $('#f-category').val(category[i].id);
        }
      }
      let count_match = 0, count_total = 0;
      let column_list = [];
      for (let i in problem) {
        count_total++;
        if (filter(problem[i])) {
          column_list.push(problemColumn(problem[i]));
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
      if ($('#user-id').val() && isDataOld(local_storage.CALastLoad)) userLoad();
      $('#user-load').on('click', userLoad);
      loaded();
    })
    .fail(function () {
      alert("Couldn't get the data");
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
  let field = [];
  if (num & 1) field.push(paramLink({ field: 1 }, 'A'));
  if (num & 2) field.push(paramLink({ field: 2 }, 'C'));
  if (num & 4) field.push(paramLink({ field: 4 }, 'G'));
  if (num & 8) field.push(paramLink({ field: 8 }, 'N'));
  return field.join('/');
}

function problemColumn(data) {
  let writer = '';
  if (param.writer_show) {
    let color = '#000000'
    if (admin.includes(data.writer)) color = '#9400d3';
    else if (data.writer in rating) {
      if (rating[data.writer] / 400 >= rateColor.length) color = rateColor[-1];
      else color = rateColor[Math.floor(rating[data.writer] / 400)];
    }
    writer = `<td class="pl-writer"><a style="color:${color}; font-weight:bold;" href="https://onlinemathcontest.com/users/${data.writer}" target="_blank" rel="noopener noreferrer">${data.writer}</a></td>`;
  }
  let categories = data.category.map(x => categorydic[x]);
  let keywords = data.keyword.map(x => paramLink({ keyword: `'${x}'` }, x));
  let isCA = '';
  if (local_storage.CAstatus[data.problemid]) isCA = ' ca=true';
  return `<tr class="problem-column" id="prob-${data.problemid}"${isCA}>`
    + writer
    + `<td class="pl-name"><p hidden>${data.name}</p>`
    + `<a type="${data.type}" type-disp="${typeList[data.type]}" href="https://onlinemathcontest.com/contests/${data.contestid}/tasks/${data.problemid}" target="_blank" rel="noopener noreferrer">${data.name}</a></td>`
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
  if (data.point < param.point_min || data.point > param.point_max) return false;
  if (param.category && !data.category.includes(param.category)) return false;
  if (param.keyword && !data.keyword.includes(param.keyword)) return false;
  if (param.ca && !param.ca_not && !local_storage.CAstatus[data.problemid]) return false;
  if (!param.ca && param.ca_not && local_storage.CAstatus[data.problemid]) return false;
  if (param.type_any && !param.type[data.type]) return false;
  if (param.writer_show && data.writer.indexOf(param.writer) == -1) return false;
  return true;
}

function applyFilter(event, param_add = {}) {
  let newparam = {};
  if ($('#f-name').val()) newparam['name'] = $('#f-name').val();
  if ($('#f-name-not').prop('checked')) newparam['name_not'] = true;
  let num = 0;
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
  for (let key in typeList) {
    if ($(`#f-type-${key}`).prop('checked')) newparam[`type_${key}`] = true;
  };
  if ($('#f-writer-show').prop('checked')) newparam['writer_show'] = true;
  if ($('#f-writer').val()) newparam['writer'] = $('#f-writer').val();
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
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function userLoad() {
  $('#loading-mark').show();
  const user = $('#user-id').val();
  const data = await getUserCA(user);
  $('#data-update-date').text(`(データ更新：${updateDateStr(data.lastupdate)})`);
  if (data.ca.length) {
    local_storage.CALastLoad = Math.floor(Date.now() / 1000);
    local_storage.CALastUpdate = data.lastupdate;
    local_storage.UserId = user;
    local_storage.CAstatus = {};
    data.ca.forEach(id => {
      local_storage.CAstatus[id] = true;
      let col = probList.items.find(c => c.elm.id == `prob-${id}`);
      if (col) {
        $(col.elm).attr('ca', true);
        $(col.elm).find('.pl-hasinfo').attr('show', true);
      }
    });
    saveStorage(local_storage);
  }
  $('#loading-mark').hide();
}