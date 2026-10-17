import React from 'react';

/*
  A yellow Israeli style plate (12-345-67). The number is made up from the
  car's id: ids made around the same time look almost the same, so the whole
  id is hashed into seven digits and the same car always gets the same plate.
*/
export function plateFor(id) {
  const s = String(id || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) % 10000000;
  const d = String(hash).padStart(7, '0');
  return d.slice(0, 2) + '-' + d.slice(2, 5) + '-' + d.slice(5, 7);
}

export default function NumberPlate({ carId }) {
  return <div className="plate"><span className="plate-il">IL</span>{plateFor(carId)}</div>;
}
