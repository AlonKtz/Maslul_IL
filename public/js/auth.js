/*
  Sign up, sign in and sign out on the browser side.

  The forms go through ajax so the page never reloads. I also check the input
  here before sending it, so the user gets told straight away instead of
  waiting for a round trip to the server.
*/
jQuery(function ($) {
  'use strict';

  // ---------------------------------------------------------------- login
  $('#login-form').on('submit', function (event) {
    event.preventDefault();
    API.clearError('#login-error');

    var username = $.trim($('#login-username').val());
    var password = $('#login-password').val();

    // check it here first. the server checks it again anyway, because anyone can
    // skip this by just calling the endpoint directly
    if (!username || !password) {
      return API.showError('#login-error', 'Please fill in both fields.');
    }

    var $button = $(this).find('button[type="submit"]').prop('disabled', true).text('Signing in...');

    API.post('/auth/login', { username: username, password: password })
      .done(function (res) {
        window.location.href = res.redirect || '/feed';
      })
      .fail(function (jqXHR) {
        API.showError('#login-error', API.errorMessage(jqXHR));
      })
      .always(function () {
        $button.prop('disabled', false).text('Sign in');
      });
  });

  // ---------------------------------------------------------------- register
  $('#register-form').on('submit', function (event) {
    event.preventDefault();
    API.clearError('#register-error');

    var payload = {
      username: $.trim($('#reg-username').val()),
      displayName: $.trim($('#reg-display').val()),
      password: $('#reg-password').val(),
      location: $.trim($('#reg-location').val()),
      bio: $.trim($('#reg-bio').val()),
    };

    if (payload.username.length < 3 || payload.username.length > 20) {
      return API.showError('#register-error', 'Username must be 3-20 characters.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(payload.username)) {
      return API.showError('#register-error', 'Username may only contain letters, numbers and underscore.');
    }
    if (payload.password.length < 6) {
      return API.showError('#register-error', 'Password must be at least 6 characters.');
    }

    var $button = $(this).find('button[type="submit"]').prop('disabled', true).text('Creating...');

    API.post('/auth/register', payload)
      .done(function (res) {
        window.location.href = res.redirect || '/feed';
      })
      .fail(function (jqXHR) {
        API.showError('#register-error', API.errorMessage(jqXHR));
      })
      .always(function () {
        $button.prop('disabled', false).text('Create account');
      });
  });

  // ---------------------------------------------------------------- logout
  $('#logout-btn').on('click', function () {
    API.post('/auth/logout').always(function () {
      window.location.href = '/';
    });
  });
});
