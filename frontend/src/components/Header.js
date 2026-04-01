import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LayoutDashboard, LogOut, Crown, Menu, X } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSubscribed = user?.subscription_status === 'active';

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-[#E4DFD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2" data-testid="logo-link">
            <BookOpen className="w-8 h-8 text-[#2D5A27]" />
            <span className="font-heading font-bold text-xl text-[#1A2E16]">MiLesson Plan</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-[#4A5B46] hover:text-[#1A2E16] font-medium transition-colors"
              data-testid="nav-generator"
            >
              <BookOpen className="w-4 h-4" />
              Generator
            </Link>
            <Link 
              to="/myhub" 
              className="flex items-center gap-2 text-[#4A5B46] hover:text-[#1A2E16] font-medium transition-colors"
              data-testid="nav-myhub"
            >
              <LayoutDashboard className="w-4 h-4" />
              MyHub
            </Link>
            {!isSubscribed && (
              <Link 
                to="/subscribe" 
                className="flex items-center gap-2 bg-[#D95D39] text-white px-4 py-2 rounded-lg hover:bg-[#BD4D2D] transition-colors font-medium"
                data-testid="nav-subscribe"
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-3">
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full border-2 border-[#E4DFD5]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2D5A27] flex items-center justify-center text-white font-medium">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-[#1A2E16] font-medium">{user.name}</span>
                  {isSubscribed && (
                    <span className="bg-[#E5A93D] text-[#1A2E16] text-xs px-2 py-0.5 rounded-full font-semibold">
                      PRO
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[#7A8A76] hover:text-[#D95D39] transition-colors"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="mobile-menu-btn"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-[#E4DFD5]">
            <nav className="flex flex-col gap-4">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-[#4A5B46] font-medium"
                onClick={() => setMenuOpen(false)}
              >
                <BookOpen className="w-4 h-4" />
                Generator
              </Link>
              <Link 
                to="/myhub" 
                className="flex items-center gap-2 text-[#4A5B46] font-medium"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" />
                MyHub
              </Link>
              {!isSubscribed && (
                <Link 
                  to="/subscribe" 
                  className="flex items-center gap-2 text-[#D95D39] font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </Link>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 text-[#7A8A76] font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
