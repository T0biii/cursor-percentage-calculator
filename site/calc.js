(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.ProzentCalc = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function parseNumber(raw) {
    if (typeof raw !== "string") return { status: "empty" };

    var s = raw.trim().replace(/[\s\u00a0\u202f_]/g, "").replace(/\u2212/g, "-");
    if (s === "" || /^[+-]?[.,]?$/.test(s)) return { status: "empty" };

    var negative = s.charAt(0) === "-";
    if (s.charAt(0) === "+" || s.charAt(0) === "-") s = s.slice(1);
    if (s === "") return { status: "empty" };

    var commas = (s.match(/,/g) || []).length;
    var dots = (s.match(/\./g) || []).length;

    if (commas > 0 && dots > 0) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else if (commas > 1) {
      s = stripGrouping(s, ",");
    } else if (dots > 1) {
      s = stripGrouping(s, ".");
    } else if (commas === 1) {
      s = s.replace(",", ".");
    }

    if (!/^\d+(\.\d+)?$/.test(s)) return { status: "invalid" };

    var value = Number((negative ? "-" : "") + s);
    if (typeof value !== "number" || !isFinite(value)) return { status: "invalid" };
    return { status: "ok", value: value };
  }

  function stripGrouping(s, sep) {
    var parts = s.split(sep);
    var last = parts[parts.length - 1];
    for (var i = 0; i < parts.length; i++) {
      if (!/^\d+$/.test(parts[i])) return s;
    }
    if (last.length === 3) {
      for (var j = 1; j < parts.length; j++) {
        if (parts[j].length !== 3) return s;
      }
      return parts.join("");
    }
    var head = parts.slice(0, -1).join("");
    if (head === "") return s;
    return head + "." + last;
  }

  function calculate(input) {
    var parsedA = parseNumber(input.a);
    var parsedB = parseNumber(input.b);
    if (parsedA.status === "invalid" || parsedB.status === "invalid") {
      return { status: "invalid" };
    }
    if (parsedA.status === "empty" || parsedB.status === "empty") {
      return { status: "empty" };
    }

    var a = parsedA.value;
    var b = parsedB.value;

    if (input.mode === "of") {
      return { status: "ok", kind: "amount", value: (b * a) / 100, delta: null, a: a, b: b };
    }

    if (input.mode === "ratio") {
      if (b === 0) return { status: "zero" };
      return { status: "ok", kind: "percent", value: (a / b) * 100, delta: null, a: a, b: b };
    }

    if (input.mode === "change") {
      if (a === 0) return { status: "zero" };
      var delta = b - a;
      return { status: "ok", kind: "percent", value: (delta / a) * 100, delta: delta, a: a, b: b };
    }

    if (input.mode === "adjust") {
      var signed = input.direction === "decrease" ? -1 : 1;
      var change = (a * b) / 100 * signed;
      return { status: "ok", kind: "amount", value: a + change, delta: change, a: a, b: b };
    }

    return { status: "invalid" };
  }

  return { parseNumber: parseNumber, calculate: calculate };
});
