// Isolated-world bridge between the popup (chrome.runtime) and pageScript.js (MAIN world).
let speedConfig = {
  speed: 1.0,
  cbSetIntervalChecked: true,
  cbSetTimeoutChecked: true,
  cbPerformanceNowChecked: true,
  cbDateNowChecked: true,
  cbRequestAnimationFrameChecked: false,
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "setSpeedConfig") {
    speedConfig = request.config;
    window.postMessage(request, "*");
  } else if (request.command === "getSpeedConfig") {
    sendResponse(speedConfig);
  }
});

window.addEventListener("message", (e) => {
  if (e.source === window && e.data && e.data.command === "getSpeedConfig") {
    window.postMessage({ command: "setSpeedConfig", config: speedConfig }, "*");
  }
});
