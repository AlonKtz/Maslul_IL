/*
  The feed page. One timeline that mixes events and marketplace listings
  together, from your friends and from the groups you are in.
*/
(function ($) {
  'use strict';

  var currentFilter = 'all';
  var currentPage = 1;

  // ---------------------------------------------------------------- rendering

  // the top of every feed item: avatar, name, where they are from and what they
  // drive. Both events and listings use it, only the verb changes.
  function posterBlock(person, car, verb, when) {
    var name = person ? (person.displayName || person.username) : 'member';
    var profile = person ? '/profile/' + UI.escape(person.username) : '#';
    var details = [];
    if (person && person.location) details.push(UI.escape(person.location));
    if (car) {
      details.push('drives a ' + UI.escape(car.year + ' ' + car.make + ' ' + car.model));
    }
    return '<a href="' + profile + '">' +
        '<img src="' + UI.escape(person ? person.avatar : '/img/default-avatar.svg') + '" alt="">' +
      '</a>' +
      '<div>' +
        '<a class="feed-name" href="' + profile + '"><strong>' + UI.escape(name) + '</strong></a>' +
        '<span class="muted small"> ' + verb + '</span>' +
        (details.length ? '<p class="feed-who small">' + details.join(' &middot; ') + '</p>' : '') +
        '<p class="muted small" style="margin:0">' + UI.formatDateTime(when) + '</p>' +
      '</div>';
  }

  function eventItem(ev, car) {
    return '<article class="card feed-item">' +
      '<div class="feed-head">' +
        posterBlock(ev.host, car,
          'is hosting' + (ev.group ? ' in ' + UI.escape(ev.group.name) : ''), ev.createdAt) +
        '<span class="badge ' + (ev.type === 'race' ? 'badge-race' : 'badge-meet') + '">' +
          UI.escape(ev.type === 'race' ? (ev.raceType || 'Race') : 'Meet') + '</span>' +
      '</div>' +
      '<h3 style="margin:.6rem 0 .2rem">' +
        '<a href="/events/' + ev._id + '">' + UI.escape(ev.title) + '</a></h3>' +
      '<p class="item-meta">' + UI.escape(ev.city) + ' &middot; ' + UI.formatDateTime(ev.startsAt) + '</p>' +
      (ev.description ? '<p class="muted small">' + UI.escape(ev.description.slice(0, 160)) + '</p>' : '') +
      '<div class="form-actions" style="margin-top:.75rem">' +
        '<a class="btn btn-ghost" href="/events/' + ev._id + '">Open</a>' +
        '<span class="muted small">' + (ev.attendees || []).length + ' going</span>' +
      '</div>' +
    '</article>';
  }

  function listingItem(li, car) {
    var photo = (li.photos && li.photos.length) ? li.photos[0] : '';
    return '<article class="card feed-item">' +
      '<div class="feed-head">' +
        posterBlock(li.seller, car, 'is selling', li.createdAt) +
        '<span class="badge">' + UI.escape(li.category) + '</span>' +
      '</div>' +
      (photo ? '<img class="item-image" src="' + UI.escape(photo) + '" alt="" ' +
        'style="margin-top:.6rem;border-radius:var(--radius-sm)">' : '') +
      '<h3 style="margin:.6rem 0 .2rem">' +
        '<a href="/market/' + li._id + '">' + UI.escape(li.title) + '</a></h3>' +
      '<p class="price">' + UI.formatPrice(li.price) + '</p>' +
      '<p class="item-meta">' + UI.escape(li.condition) + ' &middot; ' + UI.escape(li.city) + '</p>' +
    '</article>';
  }

  function render(items, append) {
    var html = items.map(function (item) {
      // item.car is the poster's first car, the server adds it to every item
      return item.kind === 'event'
        ? eventItem(item.data, item.car)
        : listingItem(item.data, item.car);
    }).join('');

    if (append) $('#feed-items').append(html);
    else $('#feed-items').html(html);
  }

  function emptyMessage(circle) {
    if (!circle.friends && !circle.groups) {
      return '<p class="empty">Your feed is empty because you have not added any ' +
        'friends or joined any groups yet.<br>' +
        '<a href="/search">Find people</a> or <a href="/groups">browse groups</a> to get started.</p>';
    }
    return '<p class="empty">Nothing here yet. When your friends host an event or ' +
      'list something for sale, it shows up here.</p>';
  }

  // ---------------------------------------------------------------- loading
  function load(append) {
    if (!append) {
      currentPage = 1;
      $('#feed-items').html('<p class="loading">Loading…</p>');
    }

    API.get('/api/feed', { filter: currentFilter, page: currentPage })
      .done(function (res) {
        if (!res.items.length && !append) {
          $('#feed-items').html(emptyMessage(res.circle));
          $('#load-more').hide();
          return;
        }
        render(res.items, append);
        $('#load-more').toggle(Boolean(res.hasMore));
      })
      .fail(function (jq) {
        $('#feed-items').html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>');
      });
  }

  function loadSidebar() {
    API.get('/api/feed/suggestions').done(function (res) {
      $('#my-groups').html(res.groups.length
        ? res.groups.map(function (g) {
            return '<a class="person" href="/groups/' + g._id + '"><span>' +
              UI.escape(g.name) + '</span></a>';
          }).join('')
        : '<p class="muted small">You have not joined a group yet.</p>');

      $('#suggestions').html(res.suggestions.length
        ? res.suggestions.map(function (u) {
            return '<a class="person" href="/profile/' + UI.escape(u.username) + '">' +
              '<img src="' + UI.escape(u.avatar) + '" alt="">' +
              '<span>' + UI.escape(u.displayName || u.username) + '</span></a>';
          }).join('')
        : '<p class="muted small">Nobody new to suggest.</p>');
    });
  }

  // ---------------------------------------------------------------- events
  $('#feed-tabs').on('click', '.tab', function () {
    var $tab = $(this);
    $tab.addClass('is-active').siblings('.tab').removeClass('is-active');
    currentFilter = $tab.data('filter');
    load(false);
  });

  $('#load-more').on('click', function () {
    currentPage += 1;
    load(true);
  });

  // ---------------------------------------------------------------- start
  load(false);
  loadSidebar();
})(jQuery);
