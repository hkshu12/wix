import { NavLink } from 'react-router-dom';
import { useAppUpdate } from './UpdateContext';
import './AppMenuNav.css';

const MENU_ITEMS = [
  { to: '/settings', label: '设置' },
  { to: '/about', label: '关于' },
  { to: '/update', label: '更新', showBadge: true }
] as const;

interface AppMenuNavProps {
  onNavigate?: () => void;
  variant: 'drawer' | 'tabs';
}

export function AppMenuNav({ onNavigate, variant }: AppMenuNavProps) {
  const { updateAvailable } = useAppUpdate();
  const className = variant === 'drawer' ? 'app-menu-nav app-menu-nav--drawer' : 'app-menu-nav app-menu-nav--tabs';

  return (
    <nav className={className} aria-label="应用菜单">
      {MENU_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            `app-menu-nav__link ${isActive ? 'app-menu-nav__link--active' : ''}`
          }
          to={item.to}
          onClick={onNavigate}
        >
          <span>{item.label}</span>
          {'showBadge' in item && item.showBadge && updateAvailable ? (
            <span className="app-menu-nav__badge" aria-label="有可用更新">
              新
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}
