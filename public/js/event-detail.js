/*
  One event's page. Saying you are going, likes and comments, all over ajax.
*/
(function ($) {
  'use strict';

  var eventId = $('main').data('event-id');
  var CURRENT_USER_ID = $('body').data('user-id') || '';

  // I format the date here rather than on the server, so it shows in whatever
  // timezone the person reading it is in
  var $when = $('#event-when');
  $when.text(UI.formatDateTime($when.data('value')));

  // ---------------------------------------------------------------- comments
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
      $('#comments').html('<p class="muted small">No comments yet.</p>');
      return;
    }
    $('#comments').html(comments.map(commentRow).join(''));
  }

  $('#comment-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#comment-error');

    var text = $.trim($('#comment-text').val());
    if (!text) return API.showError('#comment-error', 'Write something first.');
    if (text.length > 500) return API.showError('#comment-error', 'Comments are limited to 500 characters.');

    var $button = $(this).find('button[type="submit"]').prop('disabled', true).text('Posting…');

    API.post('/api/events/' + eventId + '/comments', { text: text })
      .done(function (res) {
        $('#comment-text').val('');
        renderComments(res.comments);
        UI.toast('Comment posted');
      })
      .fail(function (jq) { API.showError('#comment-error', API.errorMessage(jq)); })
      .always(function () { $button.prop('disabled', false).text('Post comment'); });
  });

  $('#comments').on('click', '.btn-del-comment', function () {
    var $row = $(this).closest('.comment');
    API.del('/api/events/' + eventId + '/comments/' + $row.data('id'))
      .done(function () {
        $row.slideUp(180, function () { $(this).remove(); });
        UI.toast('Comment removed');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- RSVP
  $('#attend-btn').on('click', function () {
    var $btn = $(this).prop('disabled', true);

    API.post('/api/events/' + eventId + '/attend')
      .done(function (res) {
        $btn.text(res.attending ? 'Cancel attendance' : 'I am going');
        $('#attendee-count').text(res.count);
        UI.toast(res.attending ? 'You are going' : 'You are no longer going');
        // reload so the list of faces in the sidebar matches the new count
        window.setTimeout(function () { window.location.reload(); }, 600);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); })
      .always(function () { $btn.prop('disabled', false); });
  });

  // ---------------------------------------------------------------- like
  $('#like-btn').on('click', function () {
    API.post('/api/events/' + eventId + '/like')
      .done(function (res) { $('#like-count').text(res.likes); })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- delete
  $('#delete-event').on('click', function () {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;

    API.del('/api/events/' + eventId)
      .done(function () {
        UI.toast('Event deleted');
        window.setTimeout(function () { window.location.href = '/events'; }, 500);
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- start
  // the server already put the comments in the page as json, so the first
  // render needs no extra request
  var initial = [];
  try {
    initial = JSON.parse($('#event-comments').text());
  } catch (err) {
    initial = [];
  }
  renderComments(initial);
})(jQuery);
