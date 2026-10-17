/*
  Loaded on every page (views/partials/footer.ejs).

  Starts the Hebrew / English translation first, so it is already watching
  when the page components start filling the page, then puts the shared
  components into their spots: the top bar controls, the toast, and the
  sign in forms.
*/
import '../lib/i18n';
import { mount } from '../lib/mount';
import Toast from '../components/common/Toast';
import LanguageSwitch from '../components/nav/LanguageSwitch';
import ThemeToggle from '../components/nav/ThemeToggle';
import MobileMenu from '../components/nav/MobileMenu';
import LogoutButton from '../components/nav/LogoutButton';
import DemoLoginButton from '../components/auth/DemoLoginButton';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

mount({ Toast, LanguageSwitch, ThemeToggle, MobileMenu, LogoutButton, DemoLoginButton, LoginForm, RegisterForm });
