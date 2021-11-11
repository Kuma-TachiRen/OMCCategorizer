function loaded() {
    $('#loader').delay(100).fadeOut(500);
    document.getElementById('contents').removeAttribute('loading');
}