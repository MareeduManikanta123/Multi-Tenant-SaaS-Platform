import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isTenantAdmin = user?.role === 'tenant_admin';
  const isRegularUser = user?.role === 'user';

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold hover:text-blue-100 transition">
            SaaS Platform
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            <Link to="/" className="hover:text-blue-100 transition">
              Dashboard
            </Link>

            {isSuperAdmin && (
              <Link to="/subscriptions" className="hover:text-blue-100 transition">
                Subscriptions
              </Link>
            )}

            {isSuperAdmin && (
              <Link to="/projects" className="hover:text-blue-100 transition">
                All Projects
              </Link>
            )}

            {!isSuperAdmin && (
              <Link to="/projects" className="hover:text-blue-100 transition">
                Projects
              </Link>
            )}

            {!isSuperAdmin && (isTenantAdmin || isRegularUser) && (
              <Link to="/users" className="hover:text-blue-100 transition">
                Team
              </Link>
            )}

            {isSuperAdmin && (
              <span className="text-blue-100 text-sm bg-blue-700 px-3 py-1 rounded-full">
                System Admin
              </span>
            )}

            {isTenantAdmin && (
              <span className="text-blue-100 text-sm bg-blue-700 px-3 py-1 rounded-full">
                Tenant Admin
              </span>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-blue-700 px-4 py-2 rounded-lg hover:bg-blue-800 transition"
              >
                <span>{user?.fullName}</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-xl z-10">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold">{user?.fullName}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Role: <span className="font-semibold capitalize">
                        {user?.role === 'tenant_admin' ? 'Tenant Admin' :
                         user?.role === 'super_admin' ? 'System Admin' : 'User'}
                      </span>
                    </p>
                    {user?.tenant?.name && (
                      <p className="text-sm text-gray-600 mt-1">
                        Tenant: <span className="font-semibold">{user.tenant.name}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden flex items-center justify-center w-10 h-10 hover:bg-blue-700 rounded"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 space-y-2 pb-4">
            <Link
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Dashboard
            </Link>

            {isSuperAdmin && (
              <Link
                to="/subscriptions"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Subscriptions
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                to="/projects"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                All Projects
              </Link>
            )}

            {!isSuperAdmin && (
              <Link
                to="/projects"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Projects
              </Link>
            )}

            {!isSuperAdmin && (isTenantAdmin || isRegularUser) && (
              <Link
                to="/users"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Team
              </Link>
            )}

            <button
              onClick={() => {
                handleLogout();
                setShowMobileMenu(false);
              }}
              className="block w-full text-left px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
