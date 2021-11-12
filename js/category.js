$(function () {
  $.getJSON("./data/category.json", function () { })
    .done(function (data) {
      for (var i in data) {
        $('#category-list').append(
          '<dt><a href="search.html?category=' + data[i].id + '">' + data[i].display + '</a></dt><dd>' + data[i].description + '</dd>'
        );
      }
      loaded();
    })
    .fail(function () {
      alert("Couldn't get the data");
    });
  window.setTimeout(loaded, 5000);
});
