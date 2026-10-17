import React from 'react';

// the red box under a form that says what is wrong with it
export default function FormError({ message }) {
  return (
    <p className="form-error" role="alert" style={{ display: message ? 'block' : 'none' }}>
      {message}
    </p>
  );
}
