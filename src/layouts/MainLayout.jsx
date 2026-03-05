import { Link, Outlet, useLocation } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/nominations', label: 'Nominations' },
    { path: '/voting', label: 'Voting' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/noticeboard', label: 'Notice Board' },
  ];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">📚</span>
          <h1>Book Club</h1>
        </div>
        <nav className="nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; 2026 Book Club. Happy Reading!</p>
      </footer>
    </div>
  );
};

export default MainLayout;
