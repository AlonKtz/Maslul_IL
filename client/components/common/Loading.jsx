import React from 'react';

export default function Loading({ text }) {
  return <p className="loading">{text || 'Loading…'}</p>;
}
