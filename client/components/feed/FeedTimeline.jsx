import React, { useEffect, useState } from 'react';
import { api, errorText } from '../../lib/api';
import Loading from '../common/Loading';
import Empty from '../common/Empty';
import FeedEventItem from './FeedEventItem';
import FeedCarItem from './FeedCarItem';

/*
  The timeline: meets, races and new garage cars from me, my friends and my
  groups, newest first (GET /api/feed). filter is the tab FeedPage has
  selected; "Load more" adds the next page under the current one.
*/
export default function FeedTimeline({ filter }) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [circle, setCircle] = useState(null);
  const [error, setError] = useState('');


  useEffect(() => {
    let alive = true;
    if (page === 1) setItems(null);
    api.get('/api/feed', { filter, page })
      .then((res) => {
        if (!alive) return;
        setItems((prev) => (page === 1 ? res.items : (prev || []).concat(res.items)));
        setHasMore(Boolean(res.hasMore));
        setCircle(res.circle);
        setError('');
      })
      .catch((err) => alive && setError(errorText(err)));
    return () => { alive = false; };
  }, [filter, page]);

  let body;
  if (error) body = <Empty>{error}</Empty>;
  else if (items === null) body = <Loading />;
  else if (!items.length) {
    body = circle && !circle.friends && !circle.groups ? (
      <p className="empty">
        Your feed is empty because you have not added any friends or joined any groups yet.<br />
        <a href="/search">Find people</a> or <a href="/groups">browse groups</a> to get started.
      </p>
    ) : (
      <Empty>Nothing here yet. When your friends host an event or add a car to their garage, it shows up here.</Empty>
    );
  } else {
    body = items.map((item) => (item.kind === 'event'
      ? <FeedEventItem key={'e' + item.data._id} event={item.data} car={item.car} />
      : <FeedCarItem key={'c' + item.data._id} car={item.data} posterCar={item.car} />));
  }

  return (
    <div>
      <div id="feed-items">{body}</div>
      {hasMore && items && (
        <div className="form-actions">
          <button className="btn btn-ghost" type="button" onClick={() => setPage(page + 1)}>Load more</button>
        </div>
      )}
    </div>
  );
}
