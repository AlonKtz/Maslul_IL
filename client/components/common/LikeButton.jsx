import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  "Like (3)" on an event, "Save (3)" on a listing. Each press switches my
  like on or off (POST <url>) and shows the new count.
*/
export default function LikeButton({ url, count, label = 'Like' }) {
  const [likes, setLikes] = useState(count || 0);

  async function toggle() {
    try {
      const res = await api.post(url);
      setLikes(res.likes);
    } catch (err) {
      toast(errorText(err), true);
    }
  }

  return (
    <button className="btn btn-ghost" type="button" onClick={toggle}>
      {label + ' ('}<span>{likes}</span>)
    </button>
  );
}
