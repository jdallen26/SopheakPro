(function () {
  'use strict';

  // private helpers (not exposed)
  function isDateObject(v) {
    return v instanceof Date && !isNaN(v.getTime());
  }
  function isDateString(s) {
    if (typeof s !== 'string') return false;
    const t = s.trim();
    if (!t) return false;
    if (!/[0-9]/.test(t) || !/[-\/:T ]/.test(t)) return false;
    return !isNaN(Date.parse(t));
  }
  function isIntegerString(s) {
    return typeof s === 'string' && /^[+-]?\d+$/.test(s.trim());
  }
  function isFloatString(s) {
    if (typeof s !== 'string') return false;
    const t = s.trim();
    if (t === '' || isIntegerString(t)) return false;
    return /^[+-]?(?:\d*\.\d+|\d+\.\d*)(?:[eE][+-]?\d+)?$/.test(t) || (Number.isFinite(Number(t)) && !Number.isInteger(Number(t)));
  }
  function isBooleanString(s) {
    return typeof s === 'string' && /^(true|false)$/i.test(s.trim());
  }
  function isNumericString(s) {
    if (typeof s !== 'string') return false;
    const t = s.trim();
    if (t === '') return false;
    const n = Number(t);
    return Number.isFinite(n);
  }

  // public API: detectType
  function detectType(value) {
    if (value === null) return 'null';
    if (typeof value === 'undefined') return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'function') return 'function';
    if (typeof value === 'object') return 'object';

    if (typeof value === 'string') {
      const s = value.trim();
      if (s === '') return 'string';
      if (isBooleanString(s)) return 'boolean-string';
      if (/^null$/i.test(s)) return 'null-string';
      if (isDateString(s)) return 'date-string';
      if (isIntegerString(s)) return 'integer-string';
      if (isFloatString(s)) return 'float-string';
      if (isNumericString(s)) return 'numeric-string';
      return 'string';
    }
    if (isDateObject(value)) return 'date';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return 'nan';
      if (!Number.isFinite(value)) return 'infinite';
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    return typeof value;
  }

  // expose only detectType
  window.detectType = detectType;
})();
