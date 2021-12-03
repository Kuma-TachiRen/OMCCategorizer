var local_storage = {};
var storage_available;

const aryMax = function (a, b) { return Math.max(a, b); }


const point_step = 100;
const point_min = 100;
const point_max = 800;
const point_color_main = ['#888888', '#aa6644', '#44cc44', '#44eeee', '#4444ff', '#eeee44', '#ff8844', '#ff4444'];
const point_color_sub = ['#dddddd', '#eeddcc', '#ddffdd', '#ddffff', '#ddddff', '#ffffdd', '#ffeedd', '#ffdddd'];

const count_step = 10;
const num_color_main = ['#ffffff', '#ffffff', '#ffffff', '#008888', '#ffffff', '#888800', '#ffffff', '#ffffff'];
const num_color_sub = ['#888888', '#aa6644', '#44cc44', '#22bbbb', '#4444ff', '#bbbb22', '#ff8844', '#ff4444'];

$(function () {
  window.setTimeout(loaded, 5000);

  // get localStorage
  storage_available = isLocalStorageAvailable();
  if (storage_available) {
    if (localStorage.getItem('OMCCategorization')) local_storage = JSON.parse(localStorage.getItem('OMCCategorization'));
  }
  if (!local_storage.CAstatus) local_storage.CAstatus = {};
  if (local_storage.UserId) $('#user-id').val(local_storage.UserId);
  else local_storage.UserId = '';
  saveStorage();

  // get problem
  $.getJSON("./data/problem.json", function () { })
    .done(function (data) {
      var point_label = [];
      for (var i = point_min; i <= point_max; i += point_step) {
        if (i == point_min) point_label.push(`~${i}`);
        else if (i == point_max) point_label.push(`${i}~`);
        else point_label.push(`${i}`);
      }
      var point_size = Math.floor((point_max - point_min) / point_step) + 1;
      var total_count_by_point = Array(point_size).fill(0);
      var ca_count_by_point = Array(point_size).fill(0);

      var total_count = 0;
      var ca_count = 0;
      var total_point_sum = 0;
      var ca_point_sum = 0;

      for (var i in data) {
        var point = Math.floor((Math.min(Math.max(data[i].point, point_min), point_max) - point_min) / point_step);
        total_count_by_point[point]++;
        total_count++;
        total_point_sum += data[i].point;
        if (local_storage.CAstatus[data[i].problemid]) {
          ca_count_by_point[point]++;
          ca_count++;
          ca_point_sum += data[i].point;
        }
      }
      var non_ca_count_by_point = Array(point_size).fill(0);
      for (var i = 0; i < point_size; i++) non_ca_count_by_point[i] = total_count_by_point[i] - ca_count_by_point[i];

      $('#ca-count').children('.value').text(ca_count);
      $('#ca-count').children('.value').attr('max', total_count);
      $('#ca-point-sum').children('.value').text(ca_point_sum);
      $('#ca-point-sum').children('.value').attr('max', total_point_sum);

      var chart_by_point = new Chart($('#stats-chart'), {
        type: 'bar',
        data: {
          labels: point_label,
          datasets: [
            {
              label: 'CA',
              data: ca_count_by_point,
              backgroundColor: point_color_main,
              stack: 'stack'
            },
            {
              label: 'Non-CA',
              data: non_ca_count_by_point,
              backgroundColor: point_color_sub,
              borderColor: point_color_main,
              borderWidth: 1,
              stack: 'stack'
            }
          ]
        },
        options: {
          animation: false,
          plugins: {
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
            var ctx = c.ctx;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
          },
          afterDatasetsDraw: function (c) {
            var ctx = c.ctx;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            c.data.datasets.forEach(function (d, s) {
              var meta = c.getDatasetMeta(s);
              if (!meta.hidden) {
                meta.data.forEach(function (e, i) {
                  if (d.data[i] == 0) return;
                  ctx.fillStyle = d.label == 'CA' ? num_color_main[i] : num_color_sub[i];
                  ctx.fillText(d.data[i].toString(), e.x, e.y + e.height / 2);
                });
              }
            });
          }
        }]
      });
      $('#stats-chart').attr('width', 600);

      $('#user-load').on('click', userLoad);
      $('#image-download').on('click', downloadImage);
      loaded();
    })
    .fail(function () {
      alert("Couldn't get the data of problems");
    });
});

function downloadImage() {
  if (!local_storage.UserId) return;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`${local_storage.UserId}'s CA Data`, 20, 40);
  ctx.fillRect(10, 50, 780, 1);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#bbbbbb';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('OMC Categorizer', 780, 40);

  ctx.fillStyle = '#000000';
  var y = 100;
  var x = 100;
  $('.stats-data').each(function () {
    var name = $(this).children('.name').text();
    var val = parseInt($(this).children('.value').text());
    var val_max = parseInt($(this).children('.value').attr('max'));

    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    var name_width = ctx.measureText(name).width;
    ctx.fillStyle = '#bbffbb';
    ctx.fillRect(x - name_width / 2, y, name_width, 5);
    ctx.fillStyle = '#000000';
    ctx.fillText(name, x, y);

    y += 75;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    if (val_max < 1e4) {
      ctx.font = '24px sans-serif';
      var val_width = ctx.measureText(val).width;
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
  link.download = `stats_${local_storage.UserId}.png`;
  link.click();
}

function userLoad(e) {
  var user = $('#user-id').val();
  $.getJSON("./data/ca_list.json", function () { })
    .done(function (data) {
      if (data[user]) {
        local_storage.UserId = user;
        for (var i in data[user]) {
          local_storage.CAstatus[data[user][i]] = true;
        }
        saveStorage();
        window.location.href = 'stats';
      }
    });
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