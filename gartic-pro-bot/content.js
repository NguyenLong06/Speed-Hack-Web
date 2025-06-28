let garticInterval = null;

async function loadWords(lang) {
  const res = await fetch(chrome.runtime.getURL(`words_${lang}.txt`));
  return res.text().then(t => t.split('\n').map(w => w.trim().toLowerCase()).filter(w => w));
}

async function loadExtra() {
  const res = await fetch(chrome.runtime.getURL('extra_words.json'));
  return res.json();
}

window.startGarticBot = async (delay = 1000, filterLength = null, lang = "en", action = "guess") => {
  if (garticInterval) return;
  let words = [];

  const langs = lang.split(',');
  for (const l of langs) {
    const w = await loadWords(l);
    words = words.concat(w);
  }

  const extra = await loadExtra();
  words = words.concat(extra.youtube, extra.anime);
  if (filterLength) words = words.filter(w => w.length === filterLength);

  let index = 0;
  garticInterval = setInterval(() => {
    const input = document.querySelector("input.inputChat");
    const button = document.querySelector(".btSend");

    if (input && button && words[index]) {
      input.value = words[index];
      input.dispatchEvent(new Event("input", { bubbles: true }));
      button.click();
      index = (index + 1) % words.length;
    }
  }, delay);
};

window.stopGarticBot = () => {
  clearInterval(garticInterval);
  garticInterval = null;
};