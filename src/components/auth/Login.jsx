import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../../firebase/firebase-config";
import { setUser, setLoading, setError } from "../../store/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const handleGoogleLogin = async () => {
    dispatch(setLoading(true));
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      dispatch(setUser({ uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL }));
      navigate("/");
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const u = result.user;
      dispatch(setUser({ uid: u.uid, email: u.email, name: u.displayName }));
      navigate("/");
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle2 className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Welcome back
          </h1>
          <p className="text-sm text-gray-500">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-sm">

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="social-btn w-full gap-3 py-2.5 mb-5 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google" className="w-4 h-4"
            />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 font-medium">or email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={15} />
                <input
                  type="email" required
                  className="input-field pl-9"
                  placeholder="name@company.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</label>
                <Link to="/forgot" className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-medium">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={15} />
                <input
                  type={showPassword ? "text" : "password"} required
                  className="input-field pl-9 pr-10"
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          New here?{" "}
          <Link to="/signup" className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
