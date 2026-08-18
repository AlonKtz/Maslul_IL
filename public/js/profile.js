/*
  The profile page. Editing your own details, and the friend buttons.
*/
(function ($) {
  'use strict';

  var profileId = $('main').data('profile-id');

  // ---------------------------------------------------------------- edit profile
  UI.initToggle('#toggle-edit', '#edit-panel');

  $('#profile-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#profile-error');

    var $form = $(this);
    var payload = UI.formValues($form, true);
    delete payload.avatarFile;

    // check the input before sending it
    if (payload.newPassword && payload.newPassword.length < 6) {
      return API.showError('#profile-error', 'The new password must be at least 6 characters.');
    }
    if (payload.newPassword && !payload.currentPassword) {
      return API.showError('#profile-error', 'Enter your current password to change it.');
    }
    if (!payload.newPassword) {
      // they left the password boxes empty, so strip those fields out entirely
      delete payload.newPassword;
      delete payload.currentPassword;
    }

    var $button = $form.find('button[type="submit"]').prop('disabled', true).text('Saving…');

    var file = $('#p-avatar')[0].files[0];
    var uploaded = file ? UI.uploadImage(file) : $.Deferred().resolve(null).promise();

    uploaded
      .then(function (up) {
        if (up && up.url) payload.avatar = up.url;
        return API.put('/api/users/' + profileId, payload);
      })
      .done(function () {
        UI.toast('Profile saved');
        window.setTimeout(function () { window.location.reload(); }, 700);
      })
      .fail(function (jq) { API.showError('#profile-error', API.errorMessage(jq)); })
      .always(function () { $button.prop('disabled', false).text('Save profile'); });
  });

  // ---------------------------------------------------------------- delete account
  $('#delete-account').on('click', function () {
    if (!window.confirm('Delete your account? Your cars, events and listings go with it. This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure?')) return;

    API.del('/api/users/' + profileId)
      .done(function (res) { window.location.href = (res && res.redirect) || '/'; })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- friends
  $('#friend-btn').on('click', function () {
    var $btn = $(this).prop('disabled', true);

    API.post('/api/users/' + profileId + '/friend-request')
      .done(function () {
        UI.toast('Friend request sent');
        $btn.text('Request sent');
      })
      .fail(function (jq) {
        UI.toast(API.errorMessage(jq), true);
        $btn.prop('disabled', false);
      });
  });

  $('#unfriend-btn').on('click', function () {
    if (!window.confirm('Remove this friend?')) return;

    API.post('/api/users/' + profileId + '/unfriend')
      .done(function () {
        UI.toast('Friend removed');
        window.setTimeout(function () { window.location.reload(); }, 700);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- incoming requests
  // this block only exists on your own profile, and only when somebody has
  // actually sent you a request
  var $requests = $('#requests');
  if ($requests.length) {
    API.get('/api/users/' + profileId).done(function (res) {
      var ids = (res.user && res.user.friendRequests) || [];
      if (!ids.length) {
        $requests.html('<p class="muted small">No requests.</p>');
        return;
      }
      // I only have their ids, so look each one up to get a name and a picture
      var lookups = ids.map(function (id) { return API.get('/api/users/' + id); });

      $.when.apply($, lookups).done(function () {
        var responses = ids.length === 1 ? [arguments[0]] : Array.prototype.slice.call(arguments);
        var html = responses.map(function (r) {
          var u = (r[0] || r).user;
          if (!u) return '';
          return '<span class="person" data-user-id="' + u._id + '">' +
            '<img src="' + UI.escape(u.avatar) + '" alt="">' +
            '<span>' + UI.escape(u.displayName || u.username) + '</span>' +
            '<button class="btn btn-ghost small btn-accept" type="button">Accept</button>' +
          '</span>';
        }).join('');
        $requests.html(html || '<p class="muted small">No requests.</p>');
      });
    });

    $requests.on('click', '.btn-accept', function () {
      var $person = $(this).closest('.person');

      API.post('/api/users/' + $person.data('user-id') + '/accept')
        .done(function () {
          UI.toast('Friend added');
          window.setTimeout(function () { window.location.reload(); }, 700);
        })
        .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
    });
  }
})(jQuery);
