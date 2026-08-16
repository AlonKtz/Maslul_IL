/**
 * Administration page — the site administrator's extra abilities:
 * search every member, change roles, and moderate recent content.
 */
(function ($) {
  'use strict';

  var CURRENT_USER_ID = String($('body').data('user-id') || '');

  UI.initTabs('#admin-tabs');

  // ---------------------------------------------------------------- overview
  function loadOverview() {
    API.get('/api/admin/overview').done(function (res) {
      $('#admin-counts').html(Object.keys(res.counts).map(function (key) {
        return '<div><strong style="font-size:1.6rem" class="glow">' + res.counts[key] +
          '</strong><br><span class="muted small">' + key + '</span></div>';
      }).join(''));
    });
  }

  // ---------------------------------------------------------------- members
  function memberRow(u) {
    var isSelf = String(u._id) === CURRENT_USER_ID;
    return '<div class="comment" data-id="' + u._id + '">' +
      '<img src="' + UI.escape(u.avatar) + '" alt="">' +
      '<div class="comment-body">' +
        '<div class="comment-author">' +
          '<a href="/profile/' + UI.escape(u.username) + '">' +
            UI.escape(u.displayName || u.username) + '</a> ' +
          '<span class="badge">' + UI.escape(u.role) + '</span>' +
        '</div>' +
        '<div class="muted small">@' + UI.escape(u.username) +
          (u.location ? ' &middot; ' + UI.escape(u.location) : '') +
          ' &middot; joined ' + UI.formatDate(u.createdAt) + '</div>' +
      '</div>' +
      (isSelf
        ? '<span class="muted small">that is you</span>'
        : '<button class="btn btn-ghost small btn-role" type="button" data-role="' +
            (u.role === 'admin' ? 'user' : 'admin') + '">' +
            (u.role === 'admin' ? 'Make member' : 'Make admin') + '</button>') +
    '</div>';
  }

  function loadMembers(params) {
    var $t = $('#admin-members').html('<p class="loading">Loading…</p>');

    API.get('/api/admin/members', params || {})
      .done(function (res) {
        $t.html(res.users.length
          ? res.users.map(memberRow).join('')
          : '<p class="empty">No member matched.</p>');
      })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  $('#admin-member-search').on('submit', function (e) {
    e.preventDefault();
    loadMembers(UI.formValues($(this)));
  });

  $('#admin-member-search').on('reset', function () {
    setTimeout(function () { loadMembers({}); }, 0);
  });

  $('#admin-members').on('click', '.btn-role', function () {
    var $row = $(this).closest('.comment');
    var role = $(this).data('role');

    if (!window.confirm('Change this member\'s role to "' + role + '"?')) return;

    API.post('/api/admin/members/' + $row.data('id') + '/role', { role: role })
      .done(function () {
        UI.toast('Role updated');
        $('#admin-member-search').trigger('submit');
        loadOverview();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- content
  function loadContent() {
    API.get('/api/admin/content').done(function (res) {
      $('#admin-events').html(res.events.length
        ? res.events.map(function (ev) {
            return '<div class="comment" data-id="' + ev._id + '" data-kind="event">' +
              '<div class="comment-body">' +
                '<div class="comment-author"><a href="/events/' + ev._id + '">' +
                  UI.escape(ev.title) + '</a></div>' +
                '<div class="muted small">' +
                  UI.escape(ev.host ? (ev.host.displayName || ev.host.username) : 'unknown') +
                  ' &middot; ' + UI.escape(ev.city) +
                  ' &middot; ' + UI.formatDate(ev.createdAt) + '</div>' +
              '</div>' +
              '<button class="btn btn-ghost small btn-remove" type="button">Remove</button>' +
            '</div>';
          }).join('')
        : '<p class="muted small">Nothing yet.</p>');

      $('#admin-listings').html(res.listings.length
        ? res.listings.map(function (li) {
            return '<div class="comment" data-id="' + li._id + '" data-kind="listing">' +
              '<div class="comment-body">' +
                '<div class="comment-author"><a href="/market/' + li._id + '">' +
                  UI.escape(li.title) + '</a></div>' +
                '<div class="muted small">' +
                  UI.escape(li.seller ? (li.seller.displayName || li.seller.username) : 'unknown') +
                  ' &middot; ' + UI.formatPrice(li.price) +
                  ' &middot; ' + UI.formatDate(li.createdAt) + '</div>' +
              '</div>' +
              '<button class="btn btn-ghost small btn-remove" type="button">Remove</button>' +
            '</div>';
          }).join('')
        : '<p class="muted small">Nothing yet.</p>');
    });
  }

  // Administrators may delete anybody's content — the ownership checks in the
  // controllers allow it for the admin role.
  $('#panel-content').on('click', '.btn-remove', function () {
    var $row = $(this).closest('.comment');
    var kind = $row.data('kind');

    if (!window.confirm('Remove this ' + kind + '? This cannot be undone.')) return;

    var url = (kind === 'event' ? '/api/events/' : '/api/listings/') + $row.data('id');

    API.del(url)
      .done(function () {
        $row.fadeOut(180, function () { $(this).remove(); });
        UI.toast(kind.charAt(0).toUpperCase() + kind.slice(1) + ' removed');
        loadOverview();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- start
  loadOverview();
  loadMembers({});

  var contentLoaded = false;
  $(document).on('tab:shown', function (e, target) {
    if (target === 'panel-content' && !contentLoaded) {
      contentLoaded = true;
      loadContent();
    }
  });
})(jQuery);
