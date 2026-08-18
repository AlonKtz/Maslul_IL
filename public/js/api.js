/*
  My little ajax wrapper, built on jQuery.

  Every call the browser makes to my server goes through this file. I did it
  this way so the json headers and the error handling are written once instead
  of being copy pasted into every page script.
*/
window.API = (function ($) {
  'use strict';

  // the actual request. gives back a jQuery promise with the json in it
  function request(method, url, data) {
    return $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      dataType: 'json',
      data: data ? JSON.stringify(data) : undefined,
    });
  }

  // digs the error message out of a failed request so I can show something
  // useful instead of just "error"
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

    // puts an error message into an element. every form on the site uses this
    showError: function (selector, message) {
      $(selector).text(message).show();
    },
    clearError: function (selector) {
      $(selector).text('').hide();
    },
  };
})(jQuery);
