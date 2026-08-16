/**
 * Search page — member and group search, plus the switch that tells the
 * React canvas map whether to look for events or for items on sale.
 */
(function ($) {
  'use strict';

  UI.initTabs('#search-tabs');

  // ---------------------------------------------------------------- members
  $('#member-search').on('submit', function (e) {
    e.preventDefault();
    var params = UI.formValues($(this));
    var $t = $('#member-results').html('<p class="loading">Searching…</p>');

    API.get('/api/users/search', params)
      .done(function (res) {
        if (!res.users.length) {
          $t.html('<p class="empty">No member matched those filters.</p>');
          return;
        }
        $t.html(res.users.map(function (u) {
          return '<article class="item-card">' +
            '<div class="item-body" style="align-items:center;text-align:center">' +
              '<img src="' + UI.escape(u.avatar) + '" alt="" ' +
                'style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin:0 auto">' +
              '<h3 class="item-title" style="margin-top:.5rem">' +
                '<a href="/profile/' + UI.escape(u.username) + '">' +
                UI.escape(u.displayName || u.username) + '</a></h3>' +
              '<p class="item-meta">@' + UI.escape(u.username) +
                (u.location ? ' &middot; ' + UI.escape(u.location) : '') + '</p>' +
              (u.bio ? '<p class="item-meta">' + UI.escape(u.bio) + '</p>' : '') +
              '<p class="item-meta">' + (u.friends || []).length + ' friends</p>' +
            '</div>' +
          '</article>';
        }).join(''));
        UI.toast(res.total + ' member' + (res.total === 1 ? '' : 's') + ' found');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#member-search').on('reset', function () {
    $('#member-results').empty();
  });

  // ---------------------------------------------------------------- groups
  $('#group-search').on('submit', function (e) {
    e.preventDefault();
    var params = UI.formValues($(this));
    var $t = $('#group-results').html('<p class="loading">Searching…</p>');

    API.get('/api/groups/search', params)
      .done(function (res) {
        if (!res.groups.length) {
          $t.html('<p class="empty">No group matched those filters.</p>');
          return;
        }
        $t.html(res.groups.map(function (g) {
          var members = (g.members || []).length;
          return '<article class="item-card">' +
            '<img class="item-image" src="' + UI.escape(g.coverImage || '/img/default-cover.svg') + '" alt="">' +
            '<div class="item-body">' +
              '<span class="badge">' + UI.escape(g.category) + '</span>' +
              (g.isPrivate ? ' <span class="badge badge-private">Private</span>' : '') +
              '<h3 class="item-title"><a href="/groups/' + g._id + '">' + UI.escape(g.name) + '</a></h3>' +
              (g.brand ? '<p class="item-meta">' + UI.escape(g.brand) + '</p>' : '') +
              '<p class="item-meta">' + members + ' member' + (members === 1 ? '' : 's') + '</p>' +
            '</div>' +
          '</article>';
        }).join(''));
        UI.toast(res.total + ' group' + (res.total === 1 ? '' : 's') + ' found');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#group-search').on('reset', function () {
    $('#group-results').empty();
  });

  // ---------------------------------------------------------------- map mode
  // Re-renders the React map with the other mode when the dropdown changes.
  $('#area-mode').on('change', function () {
    var node = document.getElementById('area-map');
    if (!node || !node._reactRoot) return;

    var props = JSON.parse(node.getAttribute('data-props') || '{}');
    props.mode = $(this).val();
    node.setAttribute('data-props', JSON.stringify(props));

    node._reactRoot.render(React.createElement(node._reactComponent, props));
  });
})(jQuery);
