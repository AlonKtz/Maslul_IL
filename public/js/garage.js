/*
  The garage page. Two tabs, one for your own cars and one for searching
  through everybody else's.
*/
(function ($) {
  'use strict';

  var CURRENT_USER_ID = $('body').data('user-id') || '';

  // ---------------------------------------------------------------- rendering
  function carCard(car) {
    var isOwner = car.owner && String(car.owner._id) === String(CURRENT_USER_ID);
    var spec = [car.engine, car.horsepower ? car.horsepower + ' hp' : '', car.color]
      .filter(Boolean).join(' &middot; ');

    return '<article class="item-card" data-id="' + car._id + '">' +
      '<img class="item-image" src="' + UI.escape(car.photo || '/img/default-car.svg') + '" alt="">' +
      '<div class="item-body">' +
        '<span class="badge">' + UI.escape(car.category) + '</span>' +
        '<h3 class="item-title">' + UI.escape(car.year + ' ' + car.make + ' ' + car.model) + '</h3>' +
        (spec ? '<p class="item-meta">' + spec + '</p>' : '') +
        (car.description ? '<p class="item-meta">' + UI.escape(car.description) + '</p>' : '') +
        '<p class="item-meta">' +
          (car.owner
            ? '<a href="/profile/' + UI.escape(car.owner.username) + '">' +
              UI.escape(car.owner.displayName || car.owner.username) + '</a>'
            : 'unknown owner') +
        '</p>' +
      '</div>' +
      (isOwner
        ? '<div class="item-actions">' +
            '<button class="btn btn-ghost btn-edit" type="button">Edit</button>' +
            '<button class="btn btn-ghost btn-delete" type="button">Delete</button>' +
          '</div>'
        : '') +
    '</article>';
  }

  function render($target, cars, emptyMessage) {
    if (!cars.length) {
      $target.html('<p class="empty">' + emptyMessage + '</p>');
      return;
    }
    $target.html(cars.map(carCard).join(''));
  }

  function loadMine() {
    var $t = $('#cars-mine').html('<p class="loading">Loading…</p>');
    API.get('/api/cars', { mine: 'true' })
      .done(function (res) { render($t, res.cars, 'Your garage is empty. Add your first car.'); })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  function loadAll() {
    var $t = $('#cars-all').html('<p class="loading">Loading…</p>');
    API.get('/api/cars')
      .done(function (res) { render($t, res.cars, 'No cars have been added yet.'); })
      .fail(function (jq) { $t.html('<p class="empty">' + UI.escape(API.errorMessage(jq)) + '</p>'); });
  }

  // ---------------------------------------------------------------- search
  $('#car-search').on('submit', function (e) {
    e.preventDefault();
    var params = UI.formValues($(this));

    // make sure the ranges make sense before sending them
    if (params.yearFrom && params.yearTo && Number(params.yearFrom) > Number(params.yearTo)) {
      return UI.toast('The "year from" cannot be later than the "year to".', true);
    }
    if (params.hpMin && params.hpMax && Number(params.hpMin) > Number(params.hpMax)) {
      return UI.toast('The minimum horsepower cannot be above the maximum.', true);
    }

    var $t = $('#cars-all').html('<p class="loading">Searching…</p>');

    API.get('/api/cars/search', params)
      .done(function (res) {
        render($t, res.cars, 'No car matched those filters.');
        UI.toast(res.total + ' car' + (res.total === 1 ? '' : 's') + ' found');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#clear-search').on('click', function () {
    $('#car-search')[0].reset();
    loadAll();
  });

  // ---------------------------------------------------------------- create / edit
  UI.initToggle('#toggle-create', '#create-panel');

  function resetForm() {
    $('#car-form')[0].reset();
    $('#car-form input[name="id"]').val('');
    API.clearError('#car-error');
    $('#car-form button[type="submit"]').text('Save car');
  }

  $('#cancel-edit').on('click', function () {
    resetForm();
    $('#create-panel').removeClass('is-open');
  });

  $('#car-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#car-error');

    var $form = $(this);
    var id = $form.find('input[name="id"]').val();
    var payload = UI.formValues($form, true);
    delete payload.id;
    delete payload.photoFile;

    // check the input before sending it
    if (!payload.make) return API.showError('#car-error', 'Enter the make.');
    if (!payload.model) return API.showError('#car-error', 'Enter the model.');
    var year = Number(payload.year);
    if (!payload.year || isNaN(year) || year < 1900 || year > 2027) {
      return API.showError('#car-error', 'Enter a realistic year.');
    }
    var hp = payload.horsepower === '' ? 0 : Number(payload.horsepower);
    if (isNaN(hp) || hp < 0 || hp > 2000) {
      return API.showError('#car-error', 'Horsepower must be between 0 and 2000.');
    }

    payload.year = year;
    payload.horsepower = hp;

    var $button = $form.find('button[type="submit"]').prop('disabled', true).text('Saving…');

    var file = $('#c-photo')[0].files[0];
    var uploaded = file ? UI.uploadImage(file) : $.Deferred().resolve(null).promise();

    uploaded
      .then(function (up) {
        if (up && up.url) payload.photo = up.url;
        return id ? API.put('/api/cars/' + id, payload) : API.post('/api/cars', payload);
      })
      .done(function () {
        UI.toast(id ? 'Car updated' : 'Car added to your garage');
        resetForm();
        $('#create-panel').removeClass('is-open');
        loadMine();
      })
      .fail(function (jq) { API.showError('#car-error', API.errorMessage(jq)); })
      .always(function () {
        $button.prop('disabled', false).text(id ? 'Save changes' : 'Save car');
      });
  });

  // ---------------------------------------------------------------- card actions
  $('.grid').on('click', '.btn-delete', function () {
    var $card = $(this).closest('.item-card');
    if (!window.confirm('Remove this car from your garage?')) return;

    API.del('/api/cars/' + $card.data('id'))
      .done(function () {
        $card.fadeOut(200, function () { $(this).remove(); });
        UI.toast('Car removed');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('.grid').on('click', '.btn-edit', function () {
    var id = $(this).closest('.item-card').data('id');

    API.get('/api/cars/' + id).done(function (res) {
      var car = res.car;
      $('#create-panel').addClass('is-open');
      $('#car-form input[name="id"]').val(car._id);
      $('#c-make').val(car.make);
      $('#c-model').val(car.model);
      $('#c-year').val(car.year);
      $('#c-category').val(car.category);
      $('#c-engine').val(car.engine || '');
      $('#c-hp').val(car.horsepower || '');
      $('#c-color').val(car.color || '');
      $('#c-desc').val(car.description || '');

      $('#car-form button[type="submit"]').text('Save changes');
      $('html, body').animate({ scrollTop: $('#create-panel').offset().top - 20 }, 250);
    }).fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- start
  UI.initTabs('#garage-tabs');

  var browseLoaded = false;
  $(document).on('tab:shown', function (e, target) {
    if (target === 'panel-browse' && !browseLoaded) {
      browseLoaded = true;
      loadAll();
    }
  });

  loadMine();
})(jQuery);
