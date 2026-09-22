/* Optional Part A completion marker for hub status. Both parts stay open. */
(function (global) {
  'use strict';
  var KEY = 'rateLaws.initialRatesComplete';

  function read() {
    try {
      return global.localStorage.getItem(KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function write() {
    try {
      global.localStorage.setItem(KEY, '1');
    } catch (e) { /* degrade: in-memory only */ }
  }

  var memoryDone = read();

  global.RateLock = {
    key: KEY,
    isGraphingUnlocked: function () {
      return memoryDone || read();
    },
    markInitialRatesComplete: function () {
      memoryDone = true;
      write();
    }
  };
})(typeof window !== 'undefined' ? window : this);
