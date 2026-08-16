/**
 * Meets & races page.
 * Everything here talks to the server with jQuery Ajax (through API) and
 * re-renders the lists in place — the page itself never reloads.
 */
(function ($) {
  'use strict';

  var CURRENT_USER_ID = $('body').data('user-id') || '';

  // ---------------------------------------------------------------- rendering
  function eventCard(ev) {
    var isHost = ev.host && String(ev.host._id) === String(CURRENT_USER_ID);
    var typeClass = ev.type === 'race' ? 'badge-race' : 'badge-meet';
    var typeLabel = ev.type === 'race' ? (ev.raceType || 'Race') : 'Meet';

    var html =
      '<article class="item-card" data-id="' + ev._id + '">' +
        '<img class="item-image" src="' + UI.escape(ev.coverImage || '/img/default-event.svg') + '" alt="">' +
        '<div class="item-body">' +
          '<span class="badge ' + typeClass + '">' + UI.escape(typeLabel) + '</span>' +
          '<h3 class="item-title"><a href="/events/' + ev._id + '">' + UI.escape(ev.title) + '</a></h3>' +
          '<p class="item-meta">' + UI.escape(ev.city) +
            (ev.address ? ' &middot; ' + UI.escape(ev.address) : '') + '</p>' +
          '<p class="item-meta">' + UI.formatDateTime(ev.startsAt) + '</p>' +
          '<p class="item-meta">Hosted by ' +
            UI.escape(ev.host ? (ev.host.displayName || ev.host.username) : 'unknown') + '</p>' +
        '</div>' +
        '<div class="item-actions">' +
          (isHost
            ? '<button class="btn btn-ghost btn-edit" type="button">Edit</button>' +
              '<button class="btn btn-ghost btn-delete" type="button">Delete</button>'
            : '<button class="btn btn-ghost btn-attend" type="button">Going / not going</button>') +
          '<a class="btn btn-ghost" href="/events/' + ev._id + '">Open</a>' +
        '</div>' +
      '</article>';
    return html;
  }

  function render($target, events, emptyMessage) {
    if (!events.length) {
      $target.html('<p class="empty">' + emptyMessage + '</p>');
      return;
    }
    $target.html(events.map(eventCard).join(''));
  }

  // ---------------------------------------------------------------- loading
  function loadInto($target, params, emptyMessage) {
    $target.html('<p class="loading">Loading…</p>');
    API.get('/api/events', params)
      .done(function (res) { render($target, res.events, emptyMessage); })
      .fail(function (jq) {
        $target.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>');
      });
  }

  function loadAll() {
    loadInto($('#events-all'), {}, 'No upcoming events yet. Be the first to host one.');
  }
  function loadMine() {
    loadInto($('#events-mine'), { mine: 'true' }, 'You are not hosting anything yet.');
  }
  function loadGoing() {
    loadInto($('#events-going'), { attending: 'true' }, 'You have not marked yourself as going to anything.');
  }

  // ---------------------------------------------------------------- search
  $('#event-search').on('submit', function (e) {
    e.preventDefault();
    var params = UI.formValues($(this));
    $('#events-all').html('<p class="loading">Searching…</p>');

    API.get('/api/events/search', params)
      .done(function (res) {
        render($('#events-all'), res.events, 'Nothing matched those filters.');
        UI.toast(res.total + ' event' + (res.total === 1 ? '' : 's') + ' found');
        // Make sure the user is looking at the list they just filtered.
        $('#event-tabs .tab[data-tab="panel-all"]').trigger('click');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#clear-search').on('click', function () {
    $('#event-search')[0].reset();
    loadAll();
  });

  // ---------------------------------------------------------------- create / edit
  UI.initToggle('#toggle-create', '#create-panel');

  // The race-format field only makes sense for races.
  $('#ev-type').on('change', function () {
    $('#race-type-wrap').toggle($(this).val() === 'race');
  });

  function resetForm() {
    var form = $('#event-form')[0];
    form.reset();
    $('#event-form input[name="id"]').val('');
    $('#race-type-wrap').hide();
    API.clearError('#event-error');
    $('#event-form button[type="submit"]').text('Publish event');
  }

  $('#cancel-edit').on('click', function () {
    resetForm();
    $('#create-panel').removeClass('is-open');
  });

  $('#event-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#event-error');

    var $form = $(this);
    var id = $form.find('input[name="id"]').val();
    var payload = UI.formValues($form, true);
    delete payload.id;
    delete payload.imageFile;

    // ---- client-side validation, so we do not bother the server with
    // ---- input we already know is wrong.
    if (!payload.title || payload.title.length < 3) {
      return API.showError('#event-error', 'Give the event a title of at least 3 characters.');
    }
    if (!payload.city) {
      return API.showError('#event-error', 'Choose the city where it happens.');
    }
    if (!payload.startsAt) {
      return API.showError('#event-error', 'Choose the date and time.');
    }
    if (payload.type === 'race' && !payload.raceType) {
      return API.showError('#event-error', 'Choose the race format.');
    }
    payload.startsAt = new Date(payload.startsAt).toISOString();
    payload.maxAttendees = Number(payload.maxAttendees || 0);

    var $button = $form.find('button[type="submit"]').prop('disabled', true).text('Saving…');

    // Upload the cover photo first (if one was chosen), then save the event.
    var file = $('#ev-image')[0].files[0];
    var uploaded = file ? UI.uploadImage(file) : $.Deferred().resolve(null).promise();

    uploaded
      .then(function (up) {
        if (up && up.url) payload.coverImage = up.url;
        return id ? API.put('/api/events/' + id, payload) : API.post('/api/events', payload);
      })
      .done(function () {
        UI.toast(id ? 'Event updated' : 'Event published');
        resetForm();
        $('#create-panel').removeClass('is-open');
        loadAll();
        loadMine();
      })
      .fail(function (jq) { API.showError('#event-error', API.errorMessage(jq)); })
      .always(function () {
        $button.prop('disabled', false).text(id ? 'Save changes' : 'Publish event');
      });
  });

  // ---------------------------------------------------------------- card actions
  // One delegated handler covers every card in every tab, including cards
  // that are added after this script runs.
  $('.grid').on('click', '.btn-delete', function () {
    var $card = $(this).closest('.item-card');
    var id = $card.data('id');
    if (!window.confirm('Delete this event? This cannot be undone.')) return;

    API.del('/api/events/' + id)
      .done(function () {
        $card.fadeOut(200, function () { $(this).remove(); });
        UI.toast('Event deleted');
        loadMine();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('.grid').on('click', '.btn-attend', function () {
    var id = $(this).closest('.item-card').data('id');
    API.post('/api/events/' + id + '/attend')
      .done(function (res) {
        UI.toast(res.attending ? 'You are going' : 'You are no longer going');
        loadGoing();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('.grid').on('click', '.btn-edit', function () {
    var id = $(this).closest('.item-card').data('id');

    API.get('/api/events', { mine: 'true', limit: 50 }).done(function (res) {
      var ev = res.events.filter(function (e) { return String(e._id) === String(id); })[0];
      if (!ev) return UI.toast('Could not load that event', true);

      $('#create-panel').addClass('is-open');
      $('#event-form input[name="id"]').val(ev._id);
      $('#ev-title').val(ev.title);
      $('#ev-type').val(ev.type).trigger('change');
      $('#ev-racetype').val(ev.raceType || '');
      $('#ev-city').val(ev.city);
      $('#ev-address').val(ev.address || '');
      $('#ev-desc').val(ev.description || '');
      $('#ev-max').val(ev.maxAttendees || 0);

      // datetime-local wants "YYYY-MM-DDTHH:mm" in local time.
      var d = new Date(ev.startsAt);
      var pad = function (n) { return String(n).padStart(2, '0'); };
      $('#ev-starts').val(
        d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
      );

      $('#event-form button[type="submit"]').text('Save changes');
      $('html, body').animate({ scrollTop: $('#create-panel').offset().top - 20 }, 250);
    });
  });

  // ---------------------------------------------------------------- start
  UI.initTabs('#event-tabs');

  $(document).on('tab:shown', function (e, target) {
    if (target === 'panel-mine') loadMine();
    if (target === 'panel-going') loadGoing();
  });

  loadAll();
})(jQuery);
