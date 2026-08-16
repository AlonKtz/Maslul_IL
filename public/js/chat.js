/**
 * Chat page.
 *
 * The live part runs over Socket.io; the conversation list and the message
 * search use ordinary Ajax. The two work together: a message that arrives on
 * the socket is added to the thread straight away, without a reload.
 */
(function ($) {
  'use strict';

  var CURRENT_USER_ID = String($('body').data('user-id') || '');
  var peerId = null;      // who we are talking to right now
  var typingTimer = null;

  var socket = io();      // connects with the session cookie

  // ---------------------------------------------------------------- status
  function setConnection(text, ok) {
    $('#connection')
      .text(text)
      .css('color', ok ? 'var(--ok)' : 'var(--muted)');
  }

  socket.on('connect', function () { setConnection('connected', true); });
  socket.on('disconnect', function () { setConnection('disconnected', false); });
  socket.on('connect_error', function (err) {
    setConnection('offline', false);
    UI.toast(err.message || 'Chat connection failed', true);
  });

  // ---------------------------------------------------------------- rendering
  function bubble(msg) {
    var mine = String(msg.from._id || msg.from) === CURRENT_USER_ID;
    return '<div class="bubble ' + (mine ? 'is-mine' : 'is-theirs') + '" data-id="' + msg._id + '">' +
      '<div class="bubble-text">' + UI.escape(msg.text) + '</div>' +
      '<div class="bubble-time">' + UI.formatDateTime(msg.createdAt) +
        (mine
          ? ' <button class="bubble-edit" type="button" title="Edit">edit</button>' +
            ' <button class="bubble-delete" type="button" title="Delete">&times;</button>'
          : '') +
      '</div>' +
    '</div>';
  }

  function scrollToBottom() {
    var el = document.getElementById('thread');
    if (el) el.scrollTop = el.scrollHeight;
  }

  function renderThread(messages) {
    if (!messages.length) {
      $('#thread').html('<p class="empty">No messages yet. Say hello.</p>');
      return;
    }
    $('#thread').html(messages.map(bubble).join(''));
    scrollToBottom();
  }

  // ---------------------------------------------------------------- opening
  function openConversation(id, name, avatar) {
    peerId = String(id);

    $('#peer-name').text(name);
    $('#peer-avatar').attr('src', avatar || '/img/default-avatar.svg').prop('hidden', false);
    $('#chat-text, #chat-form button').prop('disabled', false);
    $('#thread').html('<p class="loading">Loading…</p>');
    API.clearError('#chat-error');

    // Ask the server for the history over the socket.
    socket.emit('history:load', { withUserId: peerId }, function (res) {
      if (!res || res.error) {
        $('#thread').html('<p class="empty">' + UI.escape((res && res.error) || 'Could not load.') + '</p>');
        return;
      }
      renderThread(res.messages);
      loadConversations();     // unread counts have changed
    });
  }

  $('#friend-list').on('click', '.chat-open', function () {
    var $b = $(this);
    openConversation($b.data('user-id'), $b.data('user-name'), $b.data('user-avatar'));
  });

  $('#conversations').on('click', '.chat-open', function () {
    var $b = $(this);
    openConversation($b.data('user-id'), $b.data('user-name'), $b.data('user-avatar'));
  });

  // ---------------------------------------------------------------- sending
  $('#chat-form').on('submit', function (e) {
    e.preventDefault();
    API.clearError('#chat-error');

    var text = $.trim($('#chat-text').val());

    // Client-side checks first.
    if (!peerId) return API.showError('#chat-error', 'Choose somebody to talk to first.');
    if (!text) return API.showError('#chat-error', 'Write something first.');
    if (text.length > 1000) return API.showError('#chat-error', 'Message is too long.');

    $('#chat-text').val('');

    socket.emit('message:send', { to: peerId, text: text }, function (res) {
      if (!res || res.error) {
        API.showError('#chat-error', (res && res.error) || 'Could not send.');
      }
    });
  });

  // ---------------------------------------------------------------- incoming
  socket.on('message:new', function (msg) {
    var fromId = String(msg.from._id || msg.from);
    var toId = String(msg.to._id || msg.to);
    var other = fromId === CURRENT_USER_ID ? toId : fromId;

    // Only append it if that conversation is the one on screen.
    if (peerId && other === peerId) {
      if ($('#thread .empty').length) $('#thread').empty();
      $('#thread').append(bubble(msg));
      scrollToBottom();
    } else if (fromId !== CURRENT_USER_ID) {
      UI.toast('New message from ' + (msg.from.displayName || msg.from.username));
    }

    loadConversations();
  });

  // ---------------------------------------------------------------- typing
  $('#chat-text').on('input', function () {
    if (!peerId) return;

    socket.emit('typing', { to: peerId, typing: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      socket.emit('typing', { to: peerId, typing: false });
    }, 1200);
  });

  socket.on('typing', function (data) {
    if (!peerId || String(data.userId) !== peerId) return;
    $('#typing-indicator').text(data.typing ? $('#peer-name').text() + ' is typing…' : '');
  });

  // ---------------------------------------------------------------- presence
  socket.on('presence', function (data) {
    var $dot = $('[data-presence="' + data.userId + '"]');
    $dot.toggleClass('is-online', Boolean(data.online));
    if (peerId && String(data.userId) === peerId) {
      $('#peer-status').text(data.online ? 'online' : 'offline');
    }
  });

  // ---------------------------------------------------------------- edit
  // A member may correct something they already sent.
  $('#thread').on('click', '.bubble-edit', function () {
    var $bubble = $(this).closest('.bubble');
    var $text = $bubble.find('.bubble-text');
    var current = $text.text();

    var updated = window.prompt('Edit your message:', current);
    if (updated === null) return;                 // cancelled

    updated = $.trim(updated);
    if (!updated) return UI.toast('A message cannot be empty.', true);
    if (updated === current) return;
    if (updated.length > 1000) return UI.toast('Message is too long.', true);

    API.put('/api/messages/' + $bubble.data('id'), { text: updated })
      .done(function () {
        $text.text(updated);
        UI.toast('Message updated');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- delete
  $('#thread').on('click', '.bubble-delete', function () {
    var $bubble = $(this).closest('.bubble');

    API.del('/api/messages/' + $bubble.data('id'))
      .done(function () {
        $bubble.fadeOut(180, function () { $(this).remove(); });
        loadConversations();
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  // ---------------------------------------------------------------- list
  function loadConversations() {
    API.get('/api/messages/conversations').done(function (res) {
      if (!res.conversations.length) {
        $('#conversations').html('<p class="muted small">No conversations yet.</p>');
        return;
      }
      $('#conversations').html(res.conversations.map(function (c) {
        return '<button class="conversation chat-open" type="button" ' +
            'data-user-id="' + c.user._id + '" ' +
            'data-user-name="' + UI.escape(c.user.displayName || c.user.username) + '" ' +
            'data-user-avatar="' + UI.escape(c.user.avatar) + '">' +
          '<img src="' + UI.escape(c.user.avatar) + '" alt="">' +
          '<span class="conversation-body">' +
            '<span class="conversation-name">' +
              UI.escape(c.user.displayName || c.user.username) +
              (c.unread ? ' <span class="badge badge-race">' + c.unread + '</span>' : '') +
            '</span>' +
            '<span class="muted small">' + UI.escape(c.lastMessage.text.slice(0, 38)) + '</span>' +
          '</span>' +
        '</button>';
      }).join(''));
    });
  }

  // ---------------------------------------------------------------- search
  $('#message-search').on('submit', function (e) {
    e.preventDefault();
    var params = UI.formValues($(this));
    var $t = $('#message-results').html('<p class="loading">Searching…</p>');

    API.get('/api/messages/search', params)
      .done(function (res) {
        if (!res.messages.length) {
          $t.html('<p class="empty">Nothing matched.</p>');
          return;
        }
        $t.html('<div class="search-results">' + res.messages.map(function (m) {
          var who = String(m.from._id) === CURRENT_USER_ID
            ? 'You → ' + UI.escape(m.to.displayName || m.to.username)
            : UI.escape(m.from.displayName || m.from.username) + ' → you';
          return '<div class="comment">' +
            '<div class="comment-body">' +
              '<div class="comment-author">' + who +
                ' <span class="muted small">' + UI.formatDateTime(m.createdAt) + '</span></div>' +
              '<div>' + UI.escape(m.text) + '</div>' +
            '</div>' +
          '</div>';
        }).join('') + '</div>');
        UI.toast(res.total + ' message' + (res.total === 1 ? '' : 's') + ' found');
      })
      .fail(function (jq) { UI.toast(API.errorMessage(jq), true); });
  });

  $('#message-search').on('reset', function () { $('#message-results').empty(); });

  // ---------------------------------------------------------------- start
  loadConversations();

  // Arriving from "Message" on a profile opens that conversation directly.
  var openWith = $('main').data('open-with');
  if (openWith) {
    API.get('/api/users/' + openWith).done(function (res) {
      openConversation(res.user._id, res.user.displayName || res.user.username, res.user.avatar);
    });
  }
})(jQuery);
