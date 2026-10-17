// one meet or race (views/pages/event.ejs)
import { mount } from '../lib/mount';
import LocalDateTime from '../components/common/LocalDateTime';
import LikeButton from '../components/common/LikeButton';
import Comments from '../components/common/Comments';
import AttendButton from '../components/events/AttendButton';
import DeleteEventButton from '../components/events/DeleteEventButton';
import CircuitCanvas from '../components/events/CircuitCanvas';

mount({ LocalDateTime, LikeButton, Comments, AttendButton, DeleteEventButton, CircuitCanvas });
