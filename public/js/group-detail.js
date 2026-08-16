/**
 * Single group page: membership, the manager's settings form and the
 * manager-only approve / reject / remove controls.
 */
(function ($) {
  'use strict';

  var groupId = $('main').data('group-id');

  // ---------------------------------------------------------------- events list
  function loadEvents() {
    var $t = $('#group-events').html('<p class="loading">Loading…</p>');

    API.get('/api/events', { group: groupId })
      .done(function (res) {
        if (!res.events.length) {
          $t.html('<p class="empty">This group has no upcoming events.</p>');
          return;
        }
        $t.html(res.events.map(function (ev) {
          return '<article class="item-card">' +
            '<img class="item-image" src="' + UI.escape(ev.coverImage || '/img/default-event.svg') + '" alt="">' +
            '<div class="item-body">' +
              '<span class="badge ' + (ev.type === 'race' ? 'badge-race' : 'badge-meet') + '">' +
                UI.escape(ev.type === 'race' ? (ev.raceType || 'Race') : 'Meet') + '</span>' +
              '<h3 class="item-title"><a href="/events/' + ev._id + '">' + UI.escape(ev.title) + '</a></h3>' +
              '<p class="item-meta">' + UI.escape(ev.city) + '</p>' +
              '<p class="item-meta">' + UI.formatDateTime(ev.startsAt) + '</p>' +
            '</div>' +
          '</article>';
        }).join(''));
      })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  // ---------------------------------------------------------------- membership
  $('#join-group').on('click', function () {
    API.post('/api/groups/' + groupId + '/join')
      .done(function (res) {
        UI.toast(res.pending ? 'Request sent to the manager' : 'You joined the group');
        window.setTimeout(function () { window.location.reload(); }, 700);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#leave-group').on('click', function () {
    if (!window.confirm('Leave this group?')) return;

    API.post('/api/groups/' + groupId + '/leave')
      .done(function () {
        UI.toast('You left the group');
        window.setTimeout(function () { window.location.reload(); }, 700);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- manager: settings
  UI.initToggle('#toggle-edit', '#edit-panel');

  $('#group-edit-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#edit-error');

    var payload = UI.formValues($(this), true);
    payload.isPrivate = $('#e-private').is(':checked');

    if (!payload.name || payload.name.length < 2) {
      return API.showError('#edit-error', 'The group needs a name of at least 2 characters.');
    }

    var $button = $(this).find('button[type="submit"]').prop('disabled', true).text('Saving…');

    API.put('/api/groups/' + groupId, payload)
      .done(function () {
        UI.toast('Group updated');
        window.setTimeout(function () { window.location.reload(); }, 700);
      })
      .fail(function (jq) { API.showError('#edit-error', API.errorMessage(jq)); })
      .always(function () { $button.prop('disabled', false).text('Save changes'); });
  });

  $('#delete-group').on('click', function () {
    if (!window.confirm('Delete this group? Its events will be removed too.')) return;

    API.del('/api/groups/' + groupId)
      .done(function () {
        UI.toast('Group deleted');
        window.setTimeout(function () { window.location.href = '/groups'; }, 600);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- manager: requests
  $('#pending').on('click', '.btn-approve, .btn-reject', function () {
    var $person = $(this).closest('.person');
    var approve = $(this).hasClass('btn-approve');
    var url = '/api/groups/' + groupId + (approve ? '/approve' : '/reject');

    API.post(url, { userId: $person.data('user-id') })
      .done(function () {
        UI.toast(approve ? 'Member approved' : 'Request rejected');
        $person.fadeOut(200, function () {
          $(this).remove();
          if (!$('#pending .person').length) {
            $('#pending').after('<p class="muted small" id="no-pending">No requests waiting.</p>');
          }
        });
        if (approve) window.setTimeout(function () { window.location.reload(); }, 700);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- manager: members
  $('#members').on('click', '.btn-remove-member', function () {
    var $person = $(this).closest('.person');
    if (!window.confirm('Remove this member from the group?')) return;

    API.post('/api/groups/' + groupId + '/remove-member', { userId: $person.data('user-id') })
      .done(function () {
        UI.toast('Member removed');
        $person.fadeOut(200, function () { $(this).remove(); });
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- start
  loadEvents();
})(jQuery);
