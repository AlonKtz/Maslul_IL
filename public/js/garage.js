/*
  The garage page. Two tabs, one for your own cars and one for searching
  through everybody else's.
*/
(function ($) {
  'use strict';

  var CURRENT_USER_ID = $('body').data('user-id') || '';

  // ---------------------------------------------------------------- rendering

  // a made up Israeli style plate number (12-345-67) worked out from the car
  // id, so the same car always gets the same plate
  function plateFor(car) {
    // ids made around the same time look almost the same, so hash the whole
    // id into seven digits to get plates that look properly different
    var id = String(car._id || '');
    var hash = 0;
    for (var i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 10000000;
    var digits = String(hash).padStart(7, '0');
    return digits.slice(0, 2) + '-' + digits.slice(2, 5) + '-' + digits.slice(5, 7);
  }

  // every car is parked in its own numbered bay
  function carCard(car, index) {
    var isOwner = car.owner && String(car.owner._id) === String(CURRENT_USER_ID);
    var chips = [
      car.engine ? UI.escape(car.engine) : '',
      car.horsepower ? car.horsepower + ' hp' : '',
      car.color ? UI.escape(car.color) : '',
    ].filter(Boolean).map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('');

    return '<article class="item-card bay-card" data-id="' + car._id + '">' +
      '<div class="bay-photo">' +
        '<img src="' + UI.escape(car.photo || '/img/default-car.svg') + '" alt="">' +
        '<span class="bay-number">Bay ' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="badge bay-type">' + UI.escape(car.category) + '</span>' +
      '</div>' +
      '<div class="bay-body">' +
        '<div class="plate"><span class="plate-il">IL</span>' + plateFor(car) + '</div>' +
        '<h3 class="item-title">' + UI.escape(car.year + ' ' + car.make + ' ' + car.model) + '</h3>' +
        (chips ? '<div class="chips">' + chips + '</div>' : '') +
        (car.description ? '<p class="item-meta">' + UI.escape(car.description) + '</p>' : '') +
        '<p class="item-meta bay-owner">' +
          (car.owner
            ? 'Parked by <a href="/profile/' + UI.escape(car.owner.username) + '">' +
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

  // the spotlight at the top: the most powerful car in my garage, with a
  // horsepower dial and a few numbers about the whole garage
  function renderShowroom(cars) {
    var $s = $('#garage-showroom');
    if (!cars.length) {
      $s.html('<div class="showroom-empty"><h2>Your showroom is empty</h2>' +
        '<p class="muted">Add your first car and it takes the spotlight here.</p></div>');
      return;
    }
    var star = cars.slice().sort(function (a, b) { return (b.horsepower || 0) - (a.horsepower || 0); })[0];
    var totalHp = cars.reduce(function (sum, c) { return sum + (c.horsepower || 0); }, 0);
    var oldest = Math.min.apply(null, cars.map(function (c) { return c.year; }));
    // the dial goes round to 1000 hp
    var dial = Math.min(100, Math.round(((star.horsepower || 0) / 1000) * 100));

    $s.html(
      '<div class="showroom-photo"><img src="' + UI.escape(star.photo || '/img/default-car.svg') + '" alt=""></div>' +
      '<div class="showroom-info">' +
        '<p class="showroom-kicker">In the spotlight</p>' +
        '<h2>' + UI.escape(star.year + ' ' + star.make + ' ' + star.model) + '</h2>' +
        '<div class="plate"><span class="plate-il">IL</span>' + plateFor(star) + '</div>' +
        '<div class="showroom-gauges">' +
          '<div class="dial" style="--dial:' + dial + '"><div><strong>' + (star.horsepower || 0) + '</strong><span>hp</span></div></div>' +
          '<ul class="showroom-specs">' +
            '<li><span>Engine</span>' + UI.escape(star.engine || 'unknown') + '</li>' +
            '<li><span>Colour</span>' + UI.escape(star.color || 'unknown') + '</li>' +
            '<li><span>Body</span>' + UI.escape(star.category || '') + '</li>' +
          '</ul>' +
        '</div>' +
        '<div class="showroom-stats">' +
          '<div><strong>' + cars.length + '</strong><span>car' + (cars.length === 1 ? '' : 's') + '</span></div>' +
          '<div><strong>' + totalHp.toLocaleString('en-US') + '</strong><span>total hp</span></div>' +
          '<div><strong>' + oldest + '</strong><span>oldest</span></div>' +
        '</div>' +
      '</div>'
    );
  }

  function loadMine() {
    var $t = $('#cars-mine').html('<p class="loading">Loading…</p>');
    API.get('/api/cars', { mine: 'true' })
      .done(function (res) {
        renderShowroom(res.cars);
        render($t, res.cars, 'Your garage is empty. Add your first car.');
      })
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
