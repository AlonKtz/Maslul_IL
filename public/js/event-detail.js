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

  // ---------------------------------------------------------------- circuit
  // draws the track on the canvas and sends a little car round it.
  // the layout is a list of [x, y] points between 0 and 1, scaled to fit.
  (function drawCircuit() {
    var canvas = document.getElementById('circuit-canvas');
    var dataTag = document.getElementById('circuit-data');
    if (!canvas || !dataTag) return;

    var data;
    try { data = JSON.parse(dataTag.textContent); } catch (err) { return; }

    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var pad = 34;

    // scale the 0..1 layout into the canvas with a margin
    var pts = data.layout.map(function (p) {
      return [pad + p[0] * (W - pad * 2), pad + p[1] * (H - pad * 2)];
    });
    if (data.closed) pts.push(pts[0]);   // join back to the start for a lap

    // total length in pixels, and where each segment starts, so I can place
    // the car at any fraction of the way round
    var segLen = [], total = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segLen.push(d); total += d;
    }

    function pointAt(fraction) {
      var dist = fraction * total, i = 0;
      while (i < segLen.length - 1 && dist > segLen[i]) { dist -= segLen[i]; i++; }
      var t = segLen[i] ? dist / segLen[i] : 0;
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t,
      ];
    }

    function drawTrack() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1216';
      ctx.fillRect(0, 0, W, H);

      // the tarmac, drawn as a thick line with round joins so corners look
      // like corners and not like folded paper
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.strokeStyle = '#2b343d';
      ctx.lineWidth = 18;
      ctx.stroke();

      // the centre line
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = '#4a5663';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // start and finish
      var s = pts[0], e = pts[pts.length - 1];
      ctx.fillStyle = '#e8edf2';
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      ctx.fillText('START', s[0] + 12, s[1] - 12);
      if (!data.closed) ctx.fillText('FINISH', e[0] - 44, e[1] - 12);
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath(); ctx.arc(s[0], s[1], 5, 0, 7); ctx.fill();
      if (!data.closed) {
        ctx.fillStyle = '#e63946';
        ctx.beginPath(); ctx.arc(e[0], e[1], 5, 0, 7); ctx.fill();
      }
    }

    // the car is a red dot with a glow. it lives on requestAnimationFrame,
    // which the browser pauses in a hidden tab, so the static track is
    // always drawn first and the car is only an extra on top
    var start = null;
    var LAP_MS = data.closed ? 6000 : 4000;
    function frame(now) {
      if (!start) start = now;
      var f = ((now - start) % LAP_MS) / LAP_MS;
      drawTrack();
      var p = pointAt(f);
      ctx.shadowColor = '#e63946'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#e63946';
      ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      window.requestAnimationFrame(frame);
    }

    drawTrack();
    window.requestAnimationFrame(frame);
  })();

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
