(() => {
  "use strict";

  const root = document.documentElement;
  if (root.dataset.layoutTool !== "true") return;

  const params = new URLSearchParams(window.location.search);
  const titleInput = document.querySelector("[data-title-y]");
  const copyInput = document.querySelector("[data-copy-y]");
  const dividerInput = document.querySelector("[data-divider-y]");
  const buttonsInput = document.querySelector("[data-buttons-size]");
  const titleOutput = document.querySelector("[data-title-y-output]");
  const copyOutput = document.querySelector("[data-copy-y-output]");
  const dividerOutput = document.querySelector("[data-divider-y-output]");
  const buttonsOutput = document.querySelector("[data-buttons-size-output]");
  const headerChoices = Array.from(document.querySelectorAll("[data-header-choice]"));
  const deviceChoices = Array.from(document.querySelectorAll("[data-device-choice]"));
  const targetNote = document.querySelector("[data-layout-target-note]");
  const resetButton = document.querySelector("[data-layout-reset]");

  const required = [
    titleInput, copyInput, dividerInput, buttonsInput,
    titleOutput, copyOutput, dividerOutput, buttonsOutput,
    targetNote, resetButton,
  ];
  if (required.some((element) => !element) || headerChoices.length !== 2 || deviceChoices.length !== 2) return;

  const settings = {
    web: {
      title: { parameter: "titleY", property: "--photo-title-y-web", fallback: 49 },
      copy: { parameter: "copyY", property: "--photo-copy-y-web", fallback: 45 },
      divider: { parameter: "lineY", property: "--photo-divider-y-web", fallback: 62 },
      buttons: { parameter: "buttons", fallback: 79 },
    },
    mobile: {
      title: { parameter: "mTitleY", property: "--photo-title-y-mobile", fallback: 0 },
      copy: { parameter: "mCopyY", property: "--photo-copy-y-mobile", fallback: 0 },
      divider: { parameter: "mLineY", property: "--photo-divider-y-mobile", fallback: 0 },
      buttons: { parameter: "mButtons", fallback: 120 },
    },
  };

  const inputs = {
    title: { input: titleInput, output: titleOutput, unit: "px" },
    copy: { input: copyInput, output: copyOutput, unit: "px" },
    divider: { input: dividerInput, output: dividerOutput, unit: "px" },
    buttons: { input: buttonsInput, output: buttonsOutput, unit: "%" },
  };

  const buttonBaselines = {
    web: { shell: 5, padY: 1.105, padX: 1.87, font: 1.224 },
    mobile: { shell: 5, padY: 0.690625, padX: 1.16875, font: 0.765 },
  };

  let activeDevice = params.get("target");
  if (activeDevice !== "web" && activeDevice !== "mobile") {
    activeDevice = window.matchMedia("(max-width: 720px)").matches ? "mobile" : "web";
  }

  function clamp(value, input, fallback) {
    const minimum = Number(input.min);
    const maximum = Number(input.max);
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.round(number)));
  }

  function replaceUrl() {
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }

  function setButtonVariables(device, percentage) {
    const scale = percentage / 100;
    const baseline = buttonBaselines[device];
    root.style.setProperty(`--visibility-shell-padding-${device}`, `${(baseline.shell * scale).toFixed(2)}px`);
    root.style.setProperty(`--visibility-button-pad-y-${device}`, `${(baseline.padY * scale).toFixed(4)}rem`);
    root.style.setProperty(`--visibility-button-pad-x-${device}`, `${(baseline.padX * scale).toFixed(4)}rem`);
    root.style.setProperty(`--visibility-button-font-${device}`, `${(baseline.font * scale).toFixed(4)}rem`);
  }

  function applyValue(device, key, rawValue, updateUrl = true) {
    const control = inputs[key];
    const definition = settings[device][key];
    const value = clamp(rawValue, control.input, definition.fallback);

    if (key === "buttons") setButtonVariables(device, value);
    else root.style.setProperty(definition.property, `${value}px`);

    if (device === activeDevice) {
      control.input.value = String(value);
      control.output.value = `${value}${control.unit === "px" ? " px" : "%"}`;
    }

    if (updateUrl) {
      if (value === definition.fallback) params.delete(definition.parameter);
      else params.set(definition.parameter, String(value));
      replaceUrl();
    }
  }

  function initializeDevice(device) {
    Object.keys(inputs).forEach((key) => {
      const definition = settings[device][key];
      applyValue(device, key, params.get(definition.parameter) ?? definition.fallback, false);
    });
  }

  function showDevice(device, updateUrl = true) {
    activeDevice = device;
    deviceChoices.forEach((choice) => {
      choice.checked = choice.value === device;
    });
    Object.keys(inputs).forEach((key) => {
      const definition = settings[device][key];
      const value = params.get(definition.parameter) ?? definition.fallback;
      const control = inputs[key];
      const normalized = clamp(value, control.input, definition.fallback);
      control.input.value = String(normalized);
      control.output.value = `${normalized}${control.unit === "px" ? " px" : "%"}`;
    });
    targetNote.textContent = `Editing ${device === "web" ? "Web" : "Mobile"} values. Negative positions move up.`;
    if (updateUrl) {
      params.set("target", device);
      replaceUrl();
    }
  }

  function setHeader(value, updateUrl = true) {
    const navy = value === "navy";
    if (navy) root.dataset.headerPreview = "navy";
    else delete root.dataset.headerPreview;
    headerChoices.forEach((choice) => {
      choice.checked = choice.value === (navy ? "navy" : "cream");
    });
    if (updateUrl) {
      if (navy) params.set("header", "navy");
      else params.delete("header");
      replaceUrl();
    }
  }

  initializeDevice("web");
  initializeDevice("mobile");
  setHeader(params.get("header") === "navy" ? "navy" : "cream", false);
  showDevice(activeDevice, false);

  Object.entries(inputs).forEach(([key, control]) => {
    control.input.addEventListener("input", () => {
      applyValue(activeDevice, key, control.input.value);
    });
  });

  headerChoices.forEach((choice) => {
    choice.addEventListener("change", () => {
      if (choice.checked) setHeader(choice.value);
    });
  });

  deviceChoices.forEach((choice) => {
    choice.addEventListener("change", () => {
      if (choice.checked) showDevice(choice.value);
    });
  });

  resetButton.addEventListener("click", () => {
    Object.keys(inputs).forEach((key) => {
      applyValue(activeDevice, key, settings[activeDevice][key].fallback);
    });
  });
})();
