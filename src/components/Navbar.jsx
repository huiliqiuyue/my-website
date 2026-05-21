import { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/', label: '首页' },
  { to: '/blog', label: '博客' },
  { to: '/showcase', label: '作品展' },
  { to: '/ai', label: 'AI' },
  { to: '/music', label: '音乐' },
  { to: '/games', label: '游戏' },
  { to: '/about', label: '关于' },
];

export default function Navbar() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Close user menu on click outside
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [userMenuOpen]);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-primary-light' : 'text-text-muted hover:text-text'
    }`;

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14 sm:px-6 lg:px-8">
        <NavLink to="/" className="text-lg font-bold tracking-tight text-text hover:text-primary-light transition-colors">
          Blog
        </NavLink>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass} end={to === '/'}>
              {label}
            </NavLink>
          ))}

          {/* Auth button (desktop) */}
          {user ? (
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-text hover:bg-surface-alt transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  {(profile?.display_name || user.email || '?')[0].toUpperCase()}
                </span>
                <span className="hidden lg:inline">{profile?.display_name || user.email?.split('@')[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-surface shadow-lg py-1">
                  <div className="px-3 py-2 text-xs text-text-muted border-b border-border truncate">
                    {user.email}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                  >
                    个人资料
                  </Link>
                  {(profile?.role === 'admin' || profile?.role === 'vip') && (
                    <Link
                      to="/admin/users"
                      onClick={() => setUserMenuOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                    >
                      用户管理
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text hover:border-primary/40 transition-colors"
            >
              登录
            </Link>
          )}

          <button
            onClick={() => setIsDark(!isDark)}
            className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
            aria-label="切换主题"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Mobile right side */}
        <div className="flex items-center gap-2 sm:hidden">
          {user ? (
            <Link to="/blog/new" className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-surface-alt transition-colors" onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            </Link>
          ) : (
            <Link to="/login" className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-surface-alt transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </Link>
          )}
          <button
            onClick={() => setIsDark(!isDark)}
            className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
            aria-label="切换主题"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
            aria-label="菜单"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-surface sm:hidden">
          <div className="flex flex-col px-4 py-3 gap-2">
            {links.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass} onClick={() => setMenuOpen(false)}>
                {label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={handleSignOut} className="text-left text-sm text-text-muted hover:text-text transition-colors py-1">
                退出登录 ({profile?.display_name || user.email?.split('@')[0]})
              </button>
            ) : (
              <Link to="/login" className="text-sm text-text-muted hover:text-text transition-colors" onClick={() => setMenuOpen(false)}>
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
