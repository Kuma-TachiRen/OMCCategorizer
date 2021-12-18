var storage_available = false;

function getStorage() {
  storage_available = isLocalStorageAvailable();
  var local_storage = {};
  if (storage_available) {
    try {
      if (localStorage.getItem('OMCCategorization')) local_storage = JSON.parse(localStorage.getItem('OMCCategorization'));
    } catch (e) { }
    if (!local_storage.CAstatus) local_storage.CAstatus = {};
    if (!local_storage.ShowNonCAInfo) local_storage.ShowNonCAInfo = false;
    if (!local_storage.UserId) local_storage.UserId = '';
    if (!local_storage.CALastLoad) local_storage.CALastLoad = 0;
    if (!local_storage.CALastUpdate) local_storage.CALastUpdate = 0;
    saveStorage(local_storage);
  }
  return local_storage;
}

function isDataOld(lastload) {
  return Date.now() / 1000 - lastload > 3600 * 12;
}

function updateDateStr(time) {
  var date = new Date(time * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${('0' + date.getHours().toString()).slice(-2)}:${('0' + date.getMinutes().toString()).slice(-2)}`;
}

function saveStorage(local_storage) {
  if (storage_available) {
    localStorage.setItem('OMCCategorization', JSON.stringify(local_storage));
  }
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
