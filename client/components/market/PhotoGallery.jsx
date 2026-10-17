import React, { useState } from 'react';

/*
  A listing's photos: the first one big, the rest as thumbnails underneath.
  Clicking a thumbnail puts it in the big spot. With no photos at all the
  placeholder car is shown.
*/
export default function PhotoGallery({ photos }) {
  const list = photos && photos.length ? photos : ['/img/default-car.svg'];
  const [main, setMain] = useState(list[0]);

  return (
    <>
      <img src={main} alt=""
           style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
      {list.length > 1 && (
        <div className="people" style={{ marginTop: '.75rem' }}>
          {list.map((photo) => (
            <img key={photo} className="thumb" src={photo} alt="" onClick={() => setMain(photo)}
                 style={{
                   width: 70, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)',
                   border: photo === main ? '2px solid var(--brand)' : '1px solid var(--border)', cursor: 'pointer',
                 }} />
          ))}
        </div>
      )}
    </>
  );
}
