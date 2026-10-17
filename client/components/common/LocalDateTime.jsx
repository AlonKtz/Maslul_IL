import React from 'react';
import { formatDateTime, formatDate } from '../../lib/format';

/*
  A date written in the browser, so it shows in the reader's own timezone
  rather than the server's. dateOnly leaves the time out.
*/
export default function LocalDateTime({ value, dateOnly }) {
  return <span>{dateOnly ? formatDate(value) : formatDateTime(value)}</span>;
}
