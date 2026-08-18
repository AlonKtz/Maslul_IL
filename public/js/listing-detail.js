/*
  One listing's page. Saving it, asking the seller a question, and if it is
  your own listing, marking it sold or deleting it.
*/
(function ($) {
  'use strict';

  var listingId = $('main').data('listing-id');
  var CURRENT_USER_ID = $('body').data('user-id') || '';

  // format the date here so it shows in the reader's own timezone
  var $when = $('#listed-when');
  $when.text(UI.formatDate($when.data('value')));

  // ---------------------------------------------------------------- photos
  // clicking a thumbnail swaps it into the big image slot
  $('.thumb').on('click', function () {
    $('#main-photo').attr('src', $(this).attr('src'));
  });

  // ---------------------------------------------------------------- questions
  function commentRow(c) {
    var canDelete = c.author && String(c.author._id) === String(CURRENT_USER_ID);
    return '<div class="comment" data-id="' + c._id + '">' +
      '<img src="' + UI.escape(c.author ? c.author.avatar : '/img/default-avatar.svg') + '" alt="">' +
      '<div class="comment-body">' +
        '<div class="comment-author">' +
          UI.escape(c.author ? (c.author.displayName || c.author.username) : 'member') +
          ' <span class="muted small">' + UI.formatDateTime(c.createdAt) + '</span>' +
        '</div>' +
        '<div>' + UI.escape(c.text) + '</div>' +
      '</div>' +
      (canDelete ? '<button class="btn btn-ghost small btn-del-comment" type="button">Remove</button>' : '') +
    '</div>';
  }

  function renderComments(comments) {
    if (!comments || !comments.length) {
      $('#comments').html('<p class="muted small">No questions yet.</p>');
      return;
    }
    $('#comments').html(comments.map(commentRow).join(''));
  }

  $('#comment-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#comment-error');

    var text = $.trim($('#comment-text').val());
    if (!text) return API.showError('#comment-error', 'Write your question first.');
    if (text.length > 500) return API.showError('#comment-error', 'That is too long, 500 characters max.');

    var $button = $(this).find('button[type="submit"]').prop('disabled', true).text('Posting…');

    API.post('/api/listings/' + listingId + '/comments', { text: text })
      .done(function (res) {
        $('#comment-text').val('');
        renderComments(res.comments);
        UI.toast('Question posted');
      })
      .fail(function (jq) { API.showError('#comment-error', API.errorMessage(jq)); })
      .always(function () { $button.prop('disabled', false).text('Post question'); });
  });

  $('#comments').on('click', '.btn-del-comment', function () {
    var $row = $(this).closest('.comment');

    API.del('/api/listings/' + listingId + '/comments/' + $row.data('id'))
      .done(function () {
        $row.slideUp(180, function () { $(this).remove(); });
        UI.toast('Removed');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- save
  $('#like-btn').on('click', function () {
    API.post('/api/listings/' + listingId + '/like')
      .done(function (res) { $('#like-count').text(res.likes); })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- seller only
  $('#toggle-sold').on('click', function () {
    var $btn = $(this);

    API.post('/api/listings/' + listingId + '/sold')
      .done(function (res) {
        UI.toast(res.status === 'sold' ? 'Marked as sold' : 'Back on sale');
        $btn.text(res.status === 'sold' ? 'Put back on sale' : 'Mark as sold');
        // reload so the Sold badge at the top matches the new state
        window.setTimeout(function () { window.location.reload(); }, 600);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#delete-listing').on('click', function () {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;

    API.del('/api/listings/' + listingId)
      .done(function () {
        UI.toast('Listing deleted');
        window.setTimeout(function () { window.location.href = '/market'; }, 500);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- start
  // the server already put the comments in the page as json
  var initial = [];
  try {
    initial = JSON.parse($('#listing-comments').text());
  } catch (err) {
    initial = [];
  }
  renderComments(initial);
})(jQuery);
