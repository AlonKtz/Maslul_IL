/**
 * Shared Ajax helper built on jQuery.
 * Every call from the client to our own server goes through here, so error
 * handling and JSON headers live in one place instead of being repeated.
 */
window.API = (function ($) {
  'use strict';

  // Core request. Returns a jQuery promise that resolves with the JSON body.
  function request(method, url, data) {
    return $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      dataType: 'json',
      data: data ? JSON.stringify(data) : undefined,
    });
  }

  // Pulls a readable message out of a failed jQuery Ajax response.
  function errorMessage(jqXHR) {
    if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
      return jqXHR.responseJSON.error;
    }
    if (jqXHR && jqXHR.status === 0) {
      return 'Cannot reach the server. Check your connection.';
    }
    return 'Something went wrong. Please try again.';
  }

  return {
    get: function (url, params) {
      return $.ajax({ url: url, type: 'GET', data: params, dataType: 'json' });
    },
    post: function (url, data) {
      return request('POST', url, data);
    },
    put: function (url, data) {
      return request('PUT', url, data);
    },
    del: function (url) {
      return request('DELETE', url);
    },
    errorMessage: errorMessage,

    // Shows an error string inside a given element (used by all forms).
    showError: function (selector, message) {
      $(selector).text(message).show();
    },
    clearError: function (selector) {
      $(selector).text('').hide();
    },
  };
})(jQuery);
