const sleep = ms => new Promise(res => setTimeout(res, ms));

async function getUserCA(id) {
  while (true) {
    try {
      const res = await fetch(`https://omc-information.herokuapp.com/ca?id=${id}`, { mode: 'cors' });
      const data = await res.json();
      return data;
    } catch (e) {
      await sleep(3000);
    }
  }
}