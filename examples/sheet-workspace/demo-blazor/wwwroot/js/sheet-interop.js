window.sheetInterop = {
  blur: function (el) {
    if (el && typeof el.blur === "function") el.blur();
  },
  focusSelect: function (el) {
    if (!el) return;
    el.focus();
    if (typeof el.select === "function") el.select();
  },
  getSelection: function (el) {
    if (!el) return [0, 0];
    var start = typeof el.selectionStart === "number" ? el.selectionStart : 0;
    var end = typeof el.selectionEnd === "number" ? el.selectionEnd : start;
    return [start, end];
  },
  setSelection: function (el, pos) {
    if (!el) return;
    el.focus();
    if (typeof el.setSelectionRange === "function") {
      el.setSelectionRange(pos, pos);
    }
  },
};
