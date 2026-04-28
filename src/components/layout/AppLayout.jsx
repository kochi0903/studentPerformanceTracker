import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  PlayCircle,
  Settings,
  LogOut,
  CheckCircle2,
  Menu,
  X,
  Keyboard,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/firebase-config';
import { logout } from '../../store/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from '../common/KeyboardShortcutsHelp';
import CreateBatchModal from '../batch/CreateBatchModal';
import { batchService } from '../../services/batchService';
import { setBatches, setLoading, setError } from '../../store/batchSlice';

/* ── Sidebar navigation link ─────────────────────────── */
const SidebarLink = ({ to, icon: Icon, label, badge, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 group ${
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={18}
          className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600 transition-colors'}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};

/* ── Active batch mini-card ──────────────────────────── */
const ActiveBatchCard = ({ activeBatch, onNavigate }) => (
  <button
    onClick={onNavigate}
    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors duration-150 cursor-pointer group"
  >
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
      Active Batch
    </p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
            activeBatch ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Layers size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {activeBatch ? activeBatch.name : 'None selected'}
          </p>
          {activeBatch && (
            <p className="text-[11px] text-gray-500">Week {activeBatch.currentWeek}</p>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
    </div>
  </button>
);

/* ── Sidebar content (shared desktop + mobile) ───────── */
const SidebarContent = ({ user, activeBatch, onNavigate, closeMobileMenu, onCreateBatch, onHelp, onSignOut }) => (
  <div className="flex flex-col h-full">

    {/* Logo */}
    <div className="px-4 py-5 flex items-center gap-3 border-b border-gray-100">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <CheckCircle2 className="text-white" size={16} />
      </div>
      <div>
        <h1 className="text-sm font-semibold text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Antigravity
        </h1>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Tracker</p>
      </div>
    </div>

    {/* Active batch */}
    <div className="px-4 py-4 border-b border-gray-100">
      <ActiveBatchCard
        activeBatch={activeBatch}
        onNavigate={() => { onNavigate('/batches'); closeMobileMenu(); }}
      />
    </div>

    {/* Nav */}
    <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div>
        <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Workspace
        </p>
        <div className="space-y-0.5">
          <SidebarLink to="/"         icon={LayoutDashboard} label="Dashboard"    onClick={closeMobileMenu} />
          <SidebarLink to="/batches"  icon={Layers}          label="My Batches"   onClick={closeMobileMenu} />
          <SidebarLink to="/students" icon={Users}           label="Students"     onClick={closeMobileMenu} />
        </div>
      </div>

      <div>
        <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Management
        </p>
        <div className="space-y-0.5">
          <SidebarLink to="/settings" icon={Settings} label="Settings" onClick={closeMobileMenu} />
          <button
            onClick={onCreateBatch}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors duration-150 cursor-pointer"
          >
            <Plus size={18} className="text-indigo-500" />
            <span className="text-sm font-medium">New Batch</span>
          </button>
        </div>
      </div>
    </nav>

    {/* Footer */}
    <div className="px-4 py-4 border-t border-gray-100 space-y-1">
      <button
        onClick={onHelp}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 cursor-pointer group"
      >
        <Keyboard size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        <span className="text-sm font-medium flex-1 text-left">Shortcuts</span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-500">?</kbd>
      </button>

      {/* User row */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {user?.name?.[0] || 'T'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'Trainer'}</p>
          <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
        </div>
      </div>

      <button
        onClick={onSignOut}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer group"
      >
        <LogOut size={16} className="text-red-400 group-hover:text-red-500 transition-colors" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  </div>
);

/* ── Main layout ─────────────────────────────────────── */
const AppLayout = ({ children, theaterMode = false }) => {
  const user = useSelector((state) => state.auth.user);
  const { batches, activeBatch } = useSelector((state) => state.batch);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const fetchBatches = async () => {
        dispatch(setLoading(true));
        try {
          const data = await batchService.getBatches(user.uid);
          dispatch(setBatches(data));
        } catch (err) {
          dispatch(setError(err.message));
        }
      };
      fetchBatches();
    }
  }, [user?.uid, dispatch]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useKeyboardShortcuts({
    '?':      () => setIsHelpOpen(true),
    Escape:   () => { setIsHelpOpen(false); setIsMobileMenuOpen(false); },
    d:        () => !theaterMode && navigate('/'),
    b:        () => !theaterMode && navigate('/batches'),
    s:        () => !theaterMode && navigate('/students'),
    l:        () => !theaterMode && navigate('/sessions'),
  });

  if (theaterMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
        <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <main className="h-screen w-full overflow-hidden relative">{children}</main>
        <button
          onClick={() => navigate('/')}
          className="fixed top-5 right-5 p-2.5 bg-white/10 hover:bg-white/20 text-white/40 hover:text-white rounded-lg transition-colors duration-150 z-[100] cursor-pointer"
          title="Exit Session"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  const sharedProps = {
    user,
    activeBatch,
    onNavigate: navigate,
    closeMobileMenu,
    onCreateBatch: () => setIsCreateBatchOpen(true),
    onHelp: () => setIsHelpOpen(true),
    onSignOut: handleSignOut,
  };

  return (
    <div className="flex min-h-screen bg-[#F5F3FF]">
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <CreateBatchModal isOpen={isCreateBatchOpen} onClose={() => setIsCreateBatchOpen(false)} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-200 bg-white flex-col sticky top-0 h-screen">
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-gray-900/40 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 lg:hidden flex flex-col border-r border-gray-200"
            >
              <button
                onClick={closeMobileMenu}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              <SidebarContent {...sharedProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-white" size={14} />
            </div>
            <h1 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
              Antigravity
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
