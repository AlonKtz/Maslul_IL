/**
 * Marketplace page — listings CRUD, search and the sold flag, all over Ajax.
 */
(function ($) {
  'use strict';

  var CURRENT_USER_ID = $('body').data('user-id') || '';

  // ---------------------------------------------------------------- rendering
  function listingCard(li) {
    var isSeller = li.seller && String(li.seller._id) === String(CURRENT_USER_ID);
    var photo = (li.photos && li.photos.length) ? li.photos[0] : '/img/default-car.svg';
    var carLine = [li.make, li.model, li.year].filter(Boolean).join(' ');

    return '<article class="item-card" data-id="' + li._id + '">' +
      '<img class="item-image" src="' + UI.escape(photo) + '" alt="">' +
      '<div class="item-body">' +
        '<span class="badge">' + UI.escape(li.category) + '</span>' +
        (li.status === 'sold' ? ' <span class="badge badge-sold">Sold</span>' : '') +
        '<h3 class="item-title"><a href="/market/' + li._id + '">' + UI.escape(li.title) + '</a></h3>' +
        '<p class="price">' + UI.formatPrice(li.price) + '</p>' +
        (carLine ? '<p class="item-meta">' + UI.escape(carLine) + '</p>' : '') +
        '<p class="item-meta">' + UI.escape(li.condition) + ' &middot; ' + UI.escape(li.city) + '</p>' +
        '<p class="item-meta">' +
          UI.escape(li.seller ? (li.seller.displayName || li.seller.username) : 'member') + '</p>' +
      '</div>' +
      '<div class="item-actions">' +
        (isSeller
          ? '<button class="btn btn-ghost btn-edit" type="button">Edit</button>' +
            '<button class="btn btn-ghost btn-sold" type="button">' +
              (li.status === 'sold' ? 'Put back on sale' : 'Mark sold') + '</button>' +
            '<button class="btn btn-ghost btn-delete" type="button">Delete</button>'
          : '<a class="btn btn-ghost" href="/market/' + li._id + '">View</a>') +
      '</div>' +
    '</article>';
  }

  function render($target, listings, emptyMessage) {
    if (!listings.length) {
      $target.html('<p class="empty">' + emptyMessage + '</p>');
      return;
    }
    $target.html(listings.map(listingCard).join(''));
  }

  function loadAll() {
    var $t = $('#listings-all').html('<p class="loading">Loading…</p>');
    API.get('/api/listings')
      .done(function (res) { render($t, res.listings, 'Nothing is for sale yet.'); })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  function loadMine() {
    var $t = $('#listings-mine').html('<p class="loading">Loading…</p>');
    API.get('/api/listings', { mine: 'true' })
      .done(function (res) { render($t, res.listings, 'You have not listed anything yet.'); })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  // ---------------------------------------------------------------- search
  $('#listing-search').on('submit', function (e) {
    e.preventDefault();
    var params = UI.formValues($(this));
    var $t = $('#listings-all').html('<p class="loading">Searching…</p>');

    API.get('/api/listings/search', params)
      .done(function (res) {
        render($t, res.listings, 'Nothing matched those filters.');
        UI.toast(res.total + ' item' + (res.total === 1 ? '' : 's') + ' found');
        $('#market-tabs .tab[data-tab="panel-all"]').trigger('click');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#clear-search').on('click', function () {
    $('#listing-search')[0].reset();
    loadAll();
  });

  // ---------------------------------------------------------------- create / edit
  UI.initToggle('#toggle-create', '#create-panel');

  function resetForm() {
    $('#listing-form')[0].reset();
    $('#listing-form input[name="id"]').val('');
    API.clearError('#listing-error');
    $('#listing-form button[type="submit"]').text('Publish listing');
  }

  $('#cancel-edit').on('click', function () {
    resetForm();
    $('#create-panel').removeClass('is-open');
  });

  $('#listing-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#listing-error');

    var $form = $(this);
    var id = $form.find('input[name="id"]').val();
    var payload = UI.formValues($form, true);
    delete payload.id;
    delete payload.photoFiles;

    // ---- client-side validation
    if (!payload.title || payload.title.length < 3) {
      return API.showError('#listing-error', 'Give the item a title of at least 3 characters.');
    }
    if (payload.price === '' || Number(payload.price) < 0 || isNaN(Number(payload.price))) {
      return API.showError('#listing-error', 'Enter a price of zero or more.');
    }
    if (!payload.category) {
      return API.showError('#listing-error', 'Choose a category.');
    }
    if (!payload.city) {
      return API.showError('#listing-error', 'Choose the city the item is in.');
    }
    if (payload.year && (Number(payload.year) < 1900 || Number(payload.year) > 2027)) {
      return API.showError('#listing-error', 'Enter a realistic year.');
    }

    payload.price = Number(payload.price);
    if (payload.year) payload.year = Number(payload.year); else delete payload.year;

    var $button = $form.find('button[type="submit"]').prop('disabled', true).text('Saving…');

    var files = $('#li-photos')[0].files;
    var uploaded = files.length ? UI.uploadImages(files) : $.Deferred().resolve(null).promise();

    uploaded
      .then(function (up) {
        if (up && up.urls) payload.photos = up.urls;
        return id ? API.put('/api/listings/' + id, payload) : API.post('/api/listings', payload);
      })
      .done(function () {
        UI.toast(id ? 'Listing updated' : 'Listing published');
        resetForm();
        $('#create-panel').removeClass('is-open');
        loadAll();
        loadMine();
      })
      .fail(function (jq) { API.showError('#listing-error', API.errorMessage(jq)); })
      .always(function () {
        $button.prop('disabled', false).text(id ? 'Save changes' : 'Publish listing');
      });
  });

  // ---------------------------------------------------------------- card actions
  $('.grid').on('click', '.btn-delete', function () {
    var $card = $(this).closest('.item-card');
    if (!window.confirm('Delete this listing?')) return;

    API.del('/api/listings/' + $card.data('id'))
      .done(function () {
        $card.fadeOut(200, function () { $(this).remove(); });
        UI.toast('Listing deleted');
        loadAll();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('.grid').on('click', '.btn-sold', function () {
    var id = $(this).closest('.item-card').data('id');
    API.post('/api/listings/' + id + '/sold')
      .done(function (res) {
        UI.toast(res.status === 'sold' ? 'Marked as sold' : 'Back on sale');
        loadMine();
        loadAll();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('.grid').on('click', '.btn-edit', function () {
    var id = $(this).closest('.item-card').data('id');

    API.get('/api/listings', { mine: 'true', limit: 50 }).done(function (res) {
      var li = res.listings.filter(function (l) { return String(l._id) === String(id); })[0];
      if (!li) return UI.toast('Could not load that listing', true);

      $('#create-panel').addClass('is-open');
      $('#listing-form input[name="id"]').val(li._id);
      $('#li-title').val(li.title);
      $('#li-price').val(li.price);
      $('#li-category').val(li.category);
      $('#li-condition').val(li.condition);
      $('#li-city').val(li.city);
      $('#li-make').val(li.make || '');
      $('#li-model').val(li.model || '');
      $('#li-year').val(li.year || '');
      $('#li-desc').val(li.description || '');

      $('#listing-form button[type="submit"]').text('Save changes');
      $('html, body').animate({ scrollTop: $('#create-panel').offset().top - 20 }, 250);
    });
  });

  // ---------------------------------------------------------------- start
  UI.initTabs('#market-tabs');

  $(document).on('tab:shown', function (e, target) {
    if (target === 'panel-mine') loadMine();
  });

  loadAll();
})(jQuery);
