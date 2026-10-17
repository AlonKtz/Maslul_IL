import React from 'react';
import { formatDateTime } from '../../lib/format';

// one message in the thread. my own get edit and delete
export default function MessageBubble({ message, mine, onEdit, onDelete }) {
  return (
    <div className={'bubble ' + (mine ? 'is-mine' : 'is-theirs')}>
      <div className="bubble-text">{message.text}</div>
      <div className="bubble-time">
        {formatDateTime(message.createdAt)}
        {mine && (
          <>
            {' '}<button className="bubble-edit" type="button" title="Edit" onClick={() => onEdit(message)}>edit</button>
            {' '}<button className="bubble-delete" type="button" title="Delete" onClick={() => onDelete(message)}>×</button>
          </>
        )}
      </div>
    </div>
  );
}
