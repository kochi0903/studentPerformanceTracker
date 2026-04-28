import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase-config';
import { setUser, setLoading } from './store/authSlice';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/dashboard/Dashboard';
import AppLayout from './components/layout/AppLayout';
import BatchList from './components/batch/BatchList';
import StudentList from './components/student/StudentList';
import LiveSession from './components/live/LiveSession';
import { Loader2 } from 'lucide-react';

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F5F3FF]">
    <Loader2 className="animate-spin text-indigo-500" size={32} />
  </div>
);

const ProtectedRoute = ({ children, theaterMode = false }) => {
  const { user, loading } = useSelector((state) => state.auth);
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout theaterMode={theaterMode}>{children}</AppLayout>;
};

function App() {
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
        }));
      } else {
        dispatch(setUser(null));
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, [dispatch]);

  if (initializing) return <FullPageLoader />;

  return (
    <Router>
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/batches"  element={<ProtectedRoute><BatchList /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
        <Route path="/live/:batchId" element={<ProtectedRoute theaterMode={true}><LiveSession /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
