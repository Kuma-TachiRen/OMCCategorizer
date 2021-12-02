var local_storage = {};
var storage_available;

const aryMax = function (a, b) { return Math.max(a, b); }

const point_step = 100;
const point_min = 100;
const point_max = 800;
const point_color = ['#888888', '#aa6644', '#44cc44', '#44ffff', '#4444ff', '#eeee44', '#ff8844', '#ff4444'];
const point_color_light = ['#dddddd', '#eeddcc', '#cceecc', '#ddffff', '#ddddff', '#ffffdd', '#ffeedd', '#ffdddd'];

$(function () {
  window.setTimeout(loaded, 5000);

  // get localStorage
  storage_available = isLocalStorageAvailable();
  if (storage_available) {
    if (localStorage.getItem('OMCCategorization')) local_storage = JSON.parse(localStorage.getItem('OMCCategorization'));
  }
  if (!local_storage.CAstatus) local_storage.CAstatus = {};
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
      $('#ca-count').children('.value').attr('max', `/${total_count}`);
      $('#ca-point-sum').children('.value').text(ca_point_sum);
      $('#ca-point-sum').children('.value').attr('max', `/${total_point_sum}`);
      var chart_by_point = new Chart($('#status-chart'), {
        type: 'bar',
        data: {
          labels: point_label,
          datasets: [
            {
              label: 'CA',
              data: ca_count_by_point,
              backgroundColor: point_color,
              stack: 'stack'
            },
            {
              label: 'Non-CA',
              data: non_ca_count_by_point,
              backgroundColor: point_color_light,
              borderColor: point_color,
              borderWidth: 1,
              stack: 'stack'
            }
          ]
        },
        options: {
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              min: 0,
              max: Math.floor(total_count_by_point.reduce(aryMax) / 5) * 5 + 5,
              ticks: {
                stepSize: 5
              }
            }
          }
        }
      });

      loaded();
    })
    .fail(function () {
      alert("Couldn't get the data of problems");
    });
});

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
