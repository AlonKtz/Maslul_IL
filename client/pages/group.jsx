// one group (views/pages/group.ejs)
import { mount } from '../lib/mount';
import GroupActions from '../components/groups/GroupActions';
import GroupSettings from '../components/groups/GroupSettings';
import JoinRequests from '../components/groups/JoinRequests';
import GroupEvents from '../components/groups/GroupEvents';
import MemberList from '../components/groups/MemberList';

mount({ GroupActions, GroupSettings, JoinRequests, GroupEvents, MemberList });
