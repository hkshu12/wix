import { Link, Outlet } from 'react-router-dom';
import { AppMenuNav } from './AppMenuNav';
import { ThemeToggle } from '../theme/ThemeToggle';
import { isAndroidApp } from '../lib/platform';
import { APP_DISPLAY_NAME } from '../lib/appMeta';
import './AppChrome.css';

export function AppChrome() {
  const android = isAndroidApp();

  return (
    <div className={`app-chrome ${android ? 'app-chrome--android' : 'app-chrome--web'}`}>
      <header className="app-chrome__header">
        <div className="app-chrome__start">
          <Link className="app-chrome__back" to="/studio">
            {android ? '← 混音台' : '← 返回混音台'}
          </Link>
          <div>
            <h1>{APP_DISPLAY_NAME}</h1>
            <p>{android ? '应用信息与管理' : '设置与版本信息'}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {!android ? <AppMenuNav variant="tabs" /> : null}

      <main className="app-chrome__main">
        <Outlet />
      </main>
    </div>
  );
}
