document.getElementById("start").addEventListener("click", () => {
  const delay = +document.getElementById("delay").value;
  const filterLength = +document.getElementById("filterLength").value || null;
  const lang = Array.from(document.querySelectorAll('input[name="lang"]:checked')).map(e => e.value).join(',');
  const action = document.querySelector('input[name="action"]:checked').value;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [delay, filterLength, lang, action],
      func: (d, f, l, a) => window.startGarticBot(d, f, l, a)
    });
  });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.stopGarticBot()
    });
  });
});