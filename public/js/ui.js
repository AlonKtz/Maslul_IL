/*
  Helper functions that all the pages share. Escaping text, the little popup
  messages, formatting dates and prices, tabs, and uploading images.
  All written with jQuery like the rest of the client code.
*/
window.UI = (function ($) {
  'use strict';

  // makes text from the database safe to put into html. everything a user
  // typed goes through this before I render it. if somebody names their car
  // <script>something</script> it shows up as plain text instead of running.
  function escape(value) {
    return $('<div>').text(value === undefined || value === null ? '' : value).html();
  }

  // the little message that slides in at the bottom corner
  var toastTimer = null;
  function toast(message, isError) {
    var $t = $('#toast');
    if (!$t.length) return;
    $t.text(message).toggleClass('is-error', Boolean(isError)).addClass('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $t.removeClass('is-visible'); }, 3200);
  }

  // "14 Aug 2026, 19:30"
  function formatDateTime(value) {
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + hh + ':' + mm;
  }

  function formatDate(value) {
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return formatDateTime(value).split(',')[0];
  }

  // "₪ 12,500"
  function formatPrice(value) {
    var n = Number(value) || 0;
    return '₪ ' + n.toLocaleString('en-US');
  }

  // Wires a set of .tab buttons to their .tab-panel targets.
  // Each button carries data-tab="<panel id>".
  function initTabs(containerSelector) {
    $(containerSelector).on('click', '.tab', function () {
      var $btn = $(this);
      var target = $btn.data('tab');
      $btn.addClass('is-active').siblings('.tab').removeClass('is-active');
      $('#' + target).addClass('is-active').siblings('.tab-panel').removeClass('is-active');
      $(document).trigger('tab:shown', [target]);
    });
  }

  // Shows/hides a panel, used by the "Add …" buttons.
  function initToggle(buttonSelector, panelSelector) {
    $(buttonSelector).on('click', function () {
      $(panelSelector).toggleClass('is-open');
    });
  }

  // Uploads one image and hands back its URL. Uses FormData, so we bypass the
  // JSON helper in api.js and call $.ajax directly.
  function uploadImage(file) {
    var form = new FormData();
    form.append('image', file);
    return $.ajax({
      url: '/api/upload',
      type: 'POST',
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
    });
  }

  function uploadImages(fileList) {
    var form = new FormData();
    for (var i = 0; i < fileList.length && i < 6; i++) form.append('images', fileList[i]);
    return $.ajax({
      url: '/api/upload/many',
      type: 'POST',
      data: form,
      processData: false,
      contentType: false,
      dataType: 'json',
    });
  }

  // Reads a form into a plain object, skipping empty values so that optional
  // filters are simply left out of the query.
  function formValues($form, keepEmpty) {
    var out = {};
    $form.serializeArray().forEach(function (field) {
      var value = $.trim(field.value);
      if (keepEmpty || value !== '') out[field.name] = value;
    });
    return out;
  }

  return {
    escape: escape,
    toast: toast,
    formatDateTime: formatDateTime,
    formatDate: formatDate,
    formatPrice: formatPrice,
    initTabs: initTabs,
    initToggle: initToggle,
    uploadImage: uploadImage,
    uploadImages: uploadImages,
    formValues: formValues,
  };
})(jQuery);
