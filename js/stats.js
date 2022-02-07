let local_storage = {};

const aryMax = function (a, b) { return Math.max(a, b); }

let user = '';

const point_step = 100;
const point_min = 100;
const point_max = 800;
const point_len = 8;
const point_color_main = ['#888888', '#aa6644', '#44cc44', '#44eeee', '#4444ff', '#eeee44', '#ff8844', '#ff4444'];
const point_color_sub = ['#dddddd', '#eeddcc', '#ddffdd', '#ddffff', '#ddddff', '#ffffdd', '#ffeedd', '#ffdddd'];

const count_step = 10;
const num_color_main = ['#ffffff', '#ffffff', '#ffffff', '#008888', '#ffffff', '#888800', '#ffffff', '#ffffff'];
const num_color_sub = ['#888888', '#aa6644', '#44cc44', '#22bbbb', '#4444ff', '#bbbb22', '#ff8844', '#ff4444'];

let total_count = 0;
let total_point_sum = 0;
let total_count_by_point = Array(point_len).fill(0);
let chart_by_point;

$(function () {
  window.setTimeout(loaded, 5000);

  // get localStorage
  local_storage = getStorage();
  $('#user-id').val(local_storage.UserId);

  // get problem
  $.getJSON("./data/problem.json", function () { })
    .done(function (data) {

      let point_label = [];
      for (let i = point_min; i <= point_max; i += point_step) {
        if (i == point_min) point_label.push(`~${i}`);
        else if (i == point_max) point_label.push(`${i}~`);
        else point_label.push(`${i}`);
      }

      for (let i in data) {
        let point = Math.floor((Math.min(Math.max(data[i].point, point_min), point_max) - point_min) / point_step);
        total_count_by_point[point]++;
        total_count++;
        total_point_sum += data[i].point;
      }

      $('#ca-count').children('.value').text(0);
      $('#ca-count').children('.value').attr('max', total_count);
      $('#ca-point-sum').children('.value').text(0);
      $('#ca-point-sum').children('.value').attr('max', total_point_sum);

      chart_by_point = new Chart($('#stats-chart'), {
        type: 'bar',
        data: {
          labels: point_label,
          datasets: [
            {
              label: 'CA',
              data: Array(point_len).fill(0),
              backgroundColor: point_color_main,
              stack: 'stack'
            },
            {
              label: 'Non-CA',
              data: total_count_by_point,
              backgroundColor: point_color_sub,
              borderColor: point_color_main,
              borderWidth: 1,
              stack: 'stack'
            }
          ]
        },
        options: {
          plugins: {
            tooltip: {
              enabled: false
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              min: 0,
              max: Math.floor(total_count_by_point.reduce(aryMax) / count_step + 1) * count_step,
              ticks: {
                stepSize: count_step
              }
            }
          },
          layout: {
            padding: {
              left: 20,
              right: 20,
              top: 20,
              bottom: 20
            }
          }
        },
        plugins: [{
          beforeDraw: function (c) {
            let ctx = c.ctx;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
          },
          afterDraw: function (c) {
            let ctx = c.ctx;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';;
            c.data.datasets.forEach(function (d, s) {
              let meta = c.getDatasetMeta(s);
              if (!meta.hidden) {
                meta.data.forEach(function (e, i) {
                  if (d.data[i] == 0) return;
                  ctx.fillStyle = (d.label == 'CA' ? num_color_main[i] : num_color_sub[i]);
                  ctx.fillText(d.data[i].toString(), e.x, (e.base + e.y) / 2);
                });
              }
            });
          }
        }]
      });
      $('#stats-chart').attr('width', 600);
      localLoad();

      $('#user-load').on('click', userLoad);
      $('#image-download').on('click', downloadImage);
      loaded();
    })
    .fail(function () {
      alert("Couldn't get the data of problems");
    });
});

async function localLoad() {
  $('#loading-mark').show();
  user = local_storage.UserId;
  if (isDataOld(local_storage.CALastLoad)) {
    const data = await getUserCA(user);
    if (data.ca.length) {
      local_storage.CALastLoad = Math.floor(Date.now() / 1000);
      local_storage.CALastUpdate = data.lastupdate;
      local_storage.UserId = user;
      local_storage.CAstatus = {};
      data.ca.forEach(id => { local_storage.CAstatus[id] = true; });
      saveStorage(local_storage);
    }
  }
  $('#data-update-date').text(`(データ更新：${updateDateStr(local_storage.CALastUpdate)})`);
  $.getJSON("./data/problem.json", function () { })
    .done(function (pdata) {
      updateChartByPoint(pdata, x => local_storage.CAstatus[x]);
    });
  $('#loading-mark').hide();
}

async function userLoad() {
  $('#loading-mark').show();
  user = $('#user-id').val();
  const data = await getUserCA(user);
  $('#data-update-date').text(`(データ更新：${updateDateStr(data.lastupdate)})`);
  $.getJSON("./data/problem.json", function () { })
    .done(function (pdata) {
      updateChartByPoint(pdata, x => data.ca.includes(x));
    });
  $('#loading-mark').hide();
}

function updateChartByPoint(pdata, fn) {
  let ca_count = 0;
  let ca_point_sum = 0;
  let ca_count_by_point = Array(point_len).fill(0);

  pdata.forEach(d => {
    let point = Math.floor((Math.min(Math.max(d.point, point_min), point_max) - point_min) / point_step);
    if (fn(d.problemid)) {
      ca_count_by_point[point]++;
      ca_count++;
      ca_point_sum += d.point;
    }
  });
  let non_ca_count_by_point = Array(point_len).fill(0);
  for (let i = 0; i < point_len; i++) non_ca_count_by_point[i] = total_count_by_point[i] - ca_count_by_point[i];

  chart_by_point.data.datasets[0].data = ca_count_by_point;
  chart_by_point.data.datasets[1].data = non_ca_count_by_point;
  chart_by_point.update();
  $('#ca-count').children('.value').text(ca_count);
  $('#ca-count').children('.value').attr('max', total_count);
  $('#ca-point-sum').children('.value').text(ca_point_sum);
  $('#ca-point-sum').children('.value').attr('max', total_point_sum);
}

function downloadImage() {
  if (!user) return;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`${user}'s CA Data`, 20, 40);
  ctx.fillRect(10, 50, 780, 1);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#bbbbbb';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('OMC Categorizer', 780, 40);

  ctx.fillStyle = '#000000';
  let y = 100;
  let x = 100;
  $('.stats-data').each(function () {
    let name = $(this).children('.name').text();
    let val = parseInt($(this).children('.value').text());
    let val_max = parseInt($(this).children('.value').attr('max'));

    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    let name_width = ctx.measureText(name).width;
    ctx.fillStyle = '#bbffbb';
    ctx.fillRect(x - name_width / 2, y, name_width, 5);
    ctx.fillStyle = '#000000';
    ctx.fillText(name, x, y);

    y += 75;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    if (val_max < 1e4) {
      ctx.font = '24px sans-serif';
      let val_width = ctx.measureText(val).width;
      ctx.fillText(val, x + 80, y + 10);
      ctx.font = '14px sans-serif';
      ctx.fillText('/' + val_max, x + 80 + val_width, y + 10);
    } else {
      ctx.font = '24px sans-serif';
      ctx.fillText(val, x + 80, y);
      ctx.font = '14px sans-serif';
      ctx.fillText('/' + val_max, x + 100, y + 20);
    }

    ctx.beginPath();
    ctx.arc(x, y, 55, -Math.PI / 2, val / val_max * 2 * Math.PI - Math.PI / 2, false);
    ctx.lineTo(x, y);
    ctx.fillStyle = '#33ee33';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 55, val / val_max * 2 * Math.PI - Math.PI / 2, 3 * Math.PI / 2, false);
    ctx.lineTo(x, y);
    ctx.fillStyle = '#dddddd';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 40, 0, 2 * Math.PI, false);
    ctx.lineTo(x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#000000';
    if (val == val_max) ctx.fillText('100%', x, y + 9);
    else ctx.fillText(('0' + (100 * val / val_max).toFixed(1)).slice(-4) + '%', x, y + 9);
    y += 100;
  });

  ctx.drawImage(document.getElementById('stats-chart'), 280, 70, 510, 390);

  ctx.clearRect(canvas.width - 1, canvas.height - 1, 1, 1);

  let link = document.createElement('a');
  link.href = canvas.toDataURL('chart');
  link.download = `stats_${user}.png`;
  link.click();
}
