/**
 * Groups page — browse, search, create and join communities.
 */
(function ($) {
  'use strict';

  var CURRENT_USER_ID = $('body').data('user-id') || '';

  // ---------------------------------------------------------------- rendering
  function groupCard(g) {
    var isManager = g.admin && String(g.admin._id) === String(CURRENT_USER_ID);
    var memberCount = (g.members || []).length;
    var isMember = (g.members || []).some(function (m) {
      return String(m._id || m) === String(CURRENT_USER_ID);
    });

    return '<article class="item-card" data-id="' + g._id + '">' +
      '<img class="item-image" src="' + UI.escape(g.coverImage || '/img/default-cover.svg') + '" alt="">' +
      '<div class="item-body">' +
        '<span class="badge">' + UI.escape(g.category) + '</span>' +
        (g.isPrivate ? ' <span class="badge badge-private">Private</span>' : '') +
        '<h3 class="item-title"><a href="/groups/' + g._id + '">' + UI.escape(g.name) + '</a></h3>' +
        (g.brand ? '<p class="item-meta">' + UI.escape(g.brand) + '</p>' : '') +
        '<p class="item-meta">' + memberCount + ' member' + (memberCount === 1 ? '' : 's') + '</p>' +
        '<p class="item-meta">Managed by ' +
          UI.escape(g.admin ? (g.admin.displayName || g.admin.username) : 'unknown') + '</p>' +
      '</div>' +
      '<div class="item-actions">' +
        '<a class="btn btn-ghost" href="/groups/' + g._id + '">Open</a>' +
        (isManager
          ? '<button class="btn btn-ghost btn-delete" type="button">Delete</button>'
          : (isMember
              ? '<button class="btn btn-ghost btn-leave" type="button">Leave</button>'
              : '<button class="btn btn-primary btn-join" type="button">Join</button>')) +
      '</div>' +
    '</article>';
  }

  function render($target, groups, emptyMessage) {
    if (!groups.length) {
      $target.html('<p class="empty">' + emptyMessage + '</p>');
      return;
    }
    $target.html(groups.map(groupCard).join(''));
  }

  function loadAll() {
    var $t = $('#groups-all').html('<p class="loading">Loading…</p>');
    API.get('/api/groups')
      .done(function (res) { render($t, res.groups, 'No groups yet. Start the first one.'); })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  function loadMine() {
    var $t = $('#groups-mine').html('<p class="loading">Loading…</p>');
    API.get('/api/groups', { mine: 'true' })
      .done(function (res) { render($t, res.groups, 'You have not joined any group yet.'); })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  // ---------------------------------------------------------------- search
  $('#group-search').on('submit', function (e) {
    e.preventDefault();
    var params = UI.formValues($(this));
    var $t = $('#groups-all').html('<p class="loading">Searching…</p>');

    API.get('/api/groups/search', params)
      .done(function (res) {
        render($t, res.groups, 'No group matched those filters.');
        UI.toast(res.total + ' group' + (res.total === 1 ? '' : 's') + ' found');
        $('#group-tabs .tab[data-tab="panel-all"]').trigger('click');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#clear-search').on('click', function () {
    $('#group-search')[0].reset();
    loadAll();
  });

  // ---------------------------------------------------------------- create
  UI.initToggle('#toggle-create', '#create-panel');

  $('#cancel-edit').on('click', function () {
    $('#group-form')[0].reset();
    API.clearError('#group-error');
    $('#create-panel').removeClass('is-open');
  });

  $('#group-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#group-error');

    var $form = $(this);
    var payload = UI.formValues($form, true);
    delete payload.id;
    payload.isPrivate = $('#g-private').is(':checked');

    if (!payload.name || payload.name.length < 2) {
      return API.showError('#group-error', 'Give the group a name of at least 2 characters.');
    }

    var $button = $form.find('button[type="submit"]').prop('disabled', true).text('Creating…');

    API.post('/api/groups', payload)
      .done(function (res) {
        UI.toast('Group created');
        $form[0].reset();
        $('#create-panel').removeClass('is-open');
        window.location.href = '/groups/' + res.group._id;
      })
      .fail(function (jq) { API.showError('#group-error', API.errorMessage(jq)); })
      .always(function () { $button.prop('disabled', false).text('Create group'); });
  });

  // ---------------------------------------------------------------- membership
  $('.grid').on('click', '.btn-join', function () {
    var id = $(this).closest('.item-card').data('id');

    API.post('/api/groups/' + id + '/join')
      .done(function (res) {
        UI.toast(res.pending ? 'Request sent to the group manager' : 'You joined the group');
        loadAll();
        loadMine();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('.grid').on('click', '.btn-leave', function () {
    var id = $(this).closest('.item-card').data('id');

    API.post('/api/groups/' + id + '/leave')
      .done(function () {
        UI.toast('You left the group');
        loadAll();
        loadMine();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('.grid').on('click', '.btn-delete', function () {
    var $card = $(this).closest('.item-card');
    if (!window.confirm('Delete this group? Its events will be removed too.')) return;

    API.del('/api/groups/' + $card.data('id'))
      .done(function () {
        $card.fadeOut(200, function () { $(this).remove(); });
        UI.toast('Group deleted');
        loadMine();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- start
  UI.initTabs('#group-tabs');

  $(document).on('tab:shown', function (e, target) {
    if (target === 'panel-mine') loadMine();
  });

  loadAll();
})(jQuery);
