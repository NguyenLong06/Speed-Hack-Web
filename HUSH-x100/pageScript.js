(function () {
  const DEFAULT_CONFIG = {
    speed: 1.0,
    cbSetIntervalChecked: true,
    cbSetTimeoutChecked: true,
    cbPerformanceNowChecked: true,
    cbDateNowChecked: true,
    cbRequestAnimationFrameChecked: false,
  };
  let speedConfig = { ...DEFAULT_CONFIG };

  const emptyFunction = () => {};

  const originalClearInterval = window.clearInterval;
  const originalClearTimeout = window.clearTimeout;
  const originalSetInterval = window.setInterval;
  const originalSetTimeout = window.setTimeout;
  const originalPerformanceNow = window.performance.now.bind(window.performance);
  const originalDateNow = Date.now;
  const originalRequestAnimationFrame = window.requestAnimationFrame;

  const scaled = (timeout, enabled) =>
    enabled ? timeout / speedConfig.speed : timeout;

  // ---- Intervals: tracked by the id handed to the page (Map = O(1) lookup) ----
  const intervals = new Map();

  const reloadTimers = () => {
    intervals.forEach((timer) => {
      originalClearInterval(timer.realId);
      timer.realId = originalSetInterval(
        timer.handler,
        scaled(timer.timeout, speedConfig.cbSetIntervalChecked),
        ...timer.args
      );
    });
  };

  window.addEventListener("message", (e) => {
    if (e.source === window && e.data && e.data.command === "setSpeedConfig") {
      speedConfig = e.data.config;
      reloadTimers();
    }
  });

  window.postMessage({ command: "getSpeedConfig" }, "*");

  window.clearInterval = (id) => {
    const timer = intervals.get(id);
    if (timer) {
      originalClearInterval(timer.realId);
      intervals.delete(id);
    }
    originalClearInterval(id);
  };

  window.clearTimeout = (id) => {
    // Browsers share the id space between timeouts and intervals.
    const timer = intervals.get(id);
    if (timer) {
      originalClearInterval(timer.realId);
      intervals.delete(id);
    }
    originalClearTimeout(id);
  };

  window.setInterval = (handler, timeout, ...args) => {
    timeout = timeout || 0;
    const id = originalSetInterval(
      handler,
      scaled(timeout, speedConfig.cbSetIntervalChecked),
      ...args
    );
    intervals.set(id, { realId: id, handler, timeout, args });
    return id;
  };

  window.setTimeout = (handler, timeout, ...args) =>
    originalSetTimeout(
      handler,
      scaled(timeout || 0, speedConfig.cbSetTimeoutChecked),
      ...args
    );

  // ---- Fake clock: advances by (real delta * speed) ----
  const createClock = (readRealTime, isEnabled) => {
    let value = null;
    let previous = null;
    return () => {
      const real = readRealTime();
      if (value === null) {
        value = real;
      } else {
        value += (real - previous) * (isEnabled() ? speedConfig.speed : 1);
      }
      previous = real;
      return Math.floor(value);
    };
  };

  window.performance.now = createClock(
    originalPerformanceNow,
    () => speedConfig.cbPerformanceNowChecked
  );

  Date.now = createClock(originalDateNow, () => speedConfig.cbDateNowChecked);

  // ---- requestAnimationFrame ----
  (function () {
    const rafClock = createClock(
      originalDateNow,
      () => speedConfig.cbRequestAnimationFrameChecked
    );
    const ticks = new Map(); // callback -> accumulated frame ticks

    const newRequestAnimationFrame = (callback) =>
      originalRequestAnimationFrame(() => {
        const now = rafClock();

        if (!ticks.has(callback)) {
          ticks.set(callback, 0);
          callback(now);
        } else if (speedConfig.cbRequestAnimationFrameChecked) {
          let tick = ticks.get(callback) + speedConfig.speed;

          if (tick >= 1) {
            // Callbacks re-register themselves; mute rAF while repeating.
            while (tick >= 1) {
              callback(now);
              window.requestAnimationFrame = emptyFunction;
              tick -= 1;
            }
            window.requestAnimationFrame = newRequestAnimationFrame;
          } else {
            window.requestAnimationFrame(callback);
          }
          ticks.set(callback, tick);
        } else {
          callback(now);
        }
      });

    window.requestAnimationFrame = newRequestAnimationFrame;
  })();
})();
