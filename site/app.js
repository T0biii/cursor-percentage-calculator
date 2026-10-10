(function () {
  var MODES = ["of", "ratio", "change", "adjust"];
  var STORAGE_KEY = "prozentrechner.lang";
  var copyTimer = 0;

  var state = {
    lang: initialLang(),
    mode: "of",
    direction: "increase",
    copied: false,
  };

  var els = {
    eyebrow: document.getElementById("eyebrow"),
    lede: document.getElementById("lede"),
    langLabel: document.getElementById("lang-label"),
    lang: document.getElementById("lang"),
    modes: document.getElementById("modes"),
    labelA: document.getElementById("label-a"),
    labelB: document.getElementById("label-b"),
    inputA: document.getElementById("input-a"),
    inputB: document.getElementById("input-b"),
    direction: document.getElementById("direction"),
    directionLegend: document.getElementById("direction-legend"),
    increaseLabel: document.getElementById("increase-label"),
    decreaseLabel: document.getElementById("decrease-label"),
    resultLabel: document.getElementById("result-label"),
    resultValue: document.getElementById("result-value"),
    resultDetail: document.getElementById("result-detail"),
    formulaLine: document.getElementById("formula-line"),
    formulaLabel: document.getElementById("formula-label"),
    formula: document.getElementById("formula"),
    copy: document.getElementById("copy"),
    footer: document.getElementById("footer"),
    description: document.querySelector('meta[name="description"]'),
  };

  function initialLang() {
    var codes = Object.keys(window.ProzentI18n);
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("lang");
    if (fromUrl && window.ProzentI18n[fromUrl]) return fromUrl;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && window.ProzentI18n[saved]) return saved;
    } catch (err) {
      /* private mode */
    }
    var browser = (navigator.language || "en").toLowerCase();
    for (var i = 0; i < codes.length; i++) {
      if (browser === codes[i] || browser.indexOf(codes[i] + "-") === 0) return codes[i];
    }
    return "en";
  }

  function dict() {
    return window.ProzentI18n[state.lang];
  }

  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] == null ? "" : vars[key];
    });
  }

  function formatAmount(n) {
    if (Object.is(n, -0)) n = 0;
    return new Intl.NumberFormat(dict().locale, { maximumFractionDigits: 6 }).format(n);
  }

  function formatResult(n, kind) {
    var text = formatAmount(n);
    if (kind === "percent") {
      if (state.mode === "change" && n > 0) text = "+" + text;
      text += dict().percentMark;
    }
    return text;
  }

  function rememberLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* ignore */
    }
    var url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);
  }

  function renderLangOptions() {
    var codes = Object.keys(window.ProzentI18n);
    els.lang.textContent = "";
    codes.forEach(function (code) {
      var option = document.createElement("option");
      option.value = code;
      option.textContent = window.ProzentI18n[code].name;
      option.selected = code === state.lang;
      els.lang.appendChild(option);
    });
  }

  function renderModes() {
    var t = dict();
    els.modes.setAttribute("aria-label", t.modesLabel);
    els.modes.textContent = "";
    MODES.forEach(function (mode) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "mode";
      button.setAttribute("role", "tab");
      button.id = "mode-" + mode;
      button.setAttribute("aria-selected", mode === state.mode ? "true" : "false");
      button.tabIndex = mode === state.mode ? 0 : -1;
      button.textContent = t.modes[mode];
      button.addEventListener("click", function () {
        state.mode = mode;
        state.copied = false;
        render();
      });
      button.addEventListener("keydown", onModeKey);
      els.modes.appendChild(button);
    });
  }

  function onModeKey(event) {
    var keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (keys.indexOf(event.key) === -1) return;
    event.preventDefault();
    var index = MODES.indexOf(state.mode);
    if (event.key === "ArrowRight") index = (index + 1) % MODES.length;
    if (event.key === "ArrowLeft") index = (index - 1 + MODES.length) % MODES.length;
    if (event.key === "Home") index = 0;
    if (event.key === "End") index = MODES.length - 1;
    state.mode = MODES[index];
    state.copied = false;
    render();
    var next = document.getElementById("mode-" + state.mode);
    if (next) next.focus();
  }

  function renderFields() {
    var t = dict();
    var labels = t.fields[state.mode];
    els.labelA.textContent = labels[0];
    els.labelB.textContent = labels[1];
    els.inputA.setAttribute("aria-label", labels[0]);
    els.inputB.setAttribute("aria-label", labels[1]);
    var showDirection = state.mode === "adjust";
    els.direction.hidden = !showDirection;
    els.directionLegend.textContent = t.directionLabel;
    els.increaseLabel.textContent = t.increase;
    els.decreaseLabel.textContent = t.decrease;
  }

  function currentResult() {
    return window.ProzentCalc.calculate({
      mode: state.mode,
      a: els.inputA.value,
      b: els.inputB.value,
      direction: state.direction,
    });
  }

  function renderResult() {
    var t = dict();
    var result = currentResult();
    els.resultValue.classList.remove("is-up", "is-down");
    els.formulaLine.hidden = true;
    els.resultDetail.textContent = "";
    els.copy.disabled = true;

    if (result.status === "empty") {
      els.resultLabel.textContent = t.idle;
      els.resultValue.textContent = "—";
      return;
    }
    if (result.status === "invalid") {
      els.resultLabel.textContent = t.invalid;
      els.resultValue.textContent = "—";
      return;
    }
    if (result.status === "zero") {
      els.resultLabel.textContent = t.divideByZero;
      els.resultValue.textContent = "—";
      return;
    }

    var a = formatAmount(result.a);
    var b = formatAmount(result.b);
    var shown = formatResult(result.value, result.kind);
    var hintKey = state.mode;
    if (state.mode === "adjust") {
      hintKey = state.direction === "decrease" ? "adjustDecrease" : "adjustIncrease";
    }
    els.resultLabel.textContent = fill(t.hints[hintKey], {
      a: a,
      b: b,
      mark: t.percentMark,
    });
    els.resultValue.textContent = shown;
    if (state.mode === "change") {
      if (result.value > 0) els.resultValue.classList.add("is-up");
      if (result.value < 0) els.resultValue.classList.add("is-down");
    }

    if (result.delta != null && result.delta !== 0) {
      var deltaNumber = state.mode === "adjust" ? Math.abs(result.delta) : result.delta;
      var deltaText = formatAmount(deltaNumber);
      var deltaKey = "difference";
      if (state.mode === "adjust") {
        deltaKey = state.direction === "decrease" ? "deltaDecrease" : "deltaIncrease";
      }
      els.resultDetail.textContent = fill(t[deltaKey], { delta: deltaText });
    }

    var formulaKey = state.mode;
    if (state.mode === "adjust") {
      formulaKey = state.direction === "decrease" ? "adjustDecrease" : "adjustIncrease";
    }
    els.formula.textContent = fill(t.formulas[formulaKey], {
      a: a,
      b: b,
      result: shown,
    });
    els.formulaLine.hidden = false;
    els.copy.disabled = false;
  }

  function render() {
    var t = dict();
    document.documentElement.lang = state.lang;
    document.title = t.pageTitle;
    if (els.description) els.description.setAttribute("content", t.description);
    els.eyebrow.textContent = t.eyebrow;
    els.lede.textContent = t.lede;
    els.langLabel.textContent = t.langLabel;
    els.formulaLabel.textContent = t.formulaLabel;
    els.footer.textContent = t.footer;
    els.copy.textContent = state.copied ? t.copied : t.copy;
    renderModes();
    renderFields();
    renderResult();
  }

  els.lang.addEventListener("change", function () {
    state.lang = els.lang.value;
    state.copied = false;
    rememberLang(state.lang);
    render();
  });

  function onInput() {
    state.copied = false;
    renderResult();
    els.copy.textContent = dict().copy;
  }

  els.inputA.addEventListener("input", onInput);
  els.inputB.addEventListener("input", onInput);
  els.direction.addEventListener("change", function (event) {
    if (event.target.name !== "direction") return;
    state.direction = event.target.value;
    state.copied = false;
    renderResult();
    els.copy.textContent = dict().copy;
  });

  document.getElementById("calc").addEventListener("submit", function (event) {
    event.preventDefault();
  });

  els.copy.addEventListener("click", function () {
    var text = els.resultValue.textContent;
    if (!text || text === "—") return;
    var done = function (ok) {
      state.copied = ok;
      els.copy.textContent = ok ? dict().copied : dict().copyFailed;
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(function () {
        state.copied = false;
        els.copy.textContent = dict().copy;
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          done(true);
        },
        function () {
          done(false);
        }
      );
      return;
    }
    done(false);
  });

  renderLangOptions();
  render();
})();
