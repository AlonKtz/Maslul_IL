// a member's profile (views/pages/profile.ejs)
import { mount } from '../lib/mount';
import ProfileActions from '../components/profile/ProfileActions';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import FriendRequests from '../components/profile/FriendRequests';

mount({ ProfileActions, ProfileEditForm, FriendRequests });
