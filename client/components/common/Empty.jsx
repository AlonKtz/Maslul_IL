import React from 'react';

// the grey "nothing here" message used by every list
export default function Empty({ children }) {
  return <p className="empty">{children}</p>;
}
