import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, sessionEndedMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    clearSessionMessage();
    setSubmitting(true);

    try {
      // Detect client device information
      const ua = navigator.userAgent || "";
      let deviceType = "desktop";
      if (/mobile|android|iphone|ipod|blackberry|iemobile/i.test(ua)) deviceType = "mobile";
      else if (/ipad|tablet|silk/i.test(ua)) deviceType = "tablet";

      let os = "Device";
      if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
      else if (/windows/i.test(ua)) os = "Windows";
      else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
      else if (/android/i.test(ua)) os = "Android";
      else if (/iphone/i.test(ua)) os = "iPhone";
      else if (/ipad/i.test(ua)) os = "iPad";
      else if (/linux/i.test(ua)) os = "Linux";

      let browser = "Web Browser";
      if (/edg\//i.test(ua)) browser = "Edge";
      else if (/chrome/i.test(ua)) browser = "Chrome";
      else if (/firefox/i.test(ua)) browser = "Firefox";
      else if (/safari/i.test(ua)) browser = "Safari";

      const deviceName = `${browser} on ${os}`;

      const { data } = await api.post("/auth/login", {
        email,
        password,
        deviceName,
        deviceType,
      });

      login(data.accessToken, data.user);
      navigate("/dashboard");
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message;

      if (code === "DATABASE_UNAVAILABLE" || code === "DATABASE_TIMEOUT") {
        setError(message || "Database connection failed. Please try again later.");
      } else if (code === "INVALID_CREDENTIALS" || code === "VALIDATION_ERROR") {
        setError(message || "Invalid credentials.");
      } else if (code === "INTERNAL_SERVER_ERROR") {
        setError("Something went wrong. Please try again later.");
      } else {
        setError(err.response?.data?.message || "Unable to connect. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* ─── LEFT SIDE: ANIMATED SVG (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg w-full">
          {/* Animated SVG Illustration */}
          <svg
            viewBox="0 0 500 500"
            className="w-full h-auto drop-shadow-2xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circles */}
            <circle cx="250" cy="250" r="180" className="stroke-indigo-500/20" strokeWidth="2" />
            <circle cx="250" cy="250" r="140" className="stroke-indigo-400/30" strokeWidth="2">
              <animate attributeName="r" values="140;150;140" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="250" r="100" className="stroke-indigo-300/40" strokeWidth="2">
              <animate attributeName="r" values="100;110;100" dur="3s" repeatCount="indefinite" />
            </circle>

            {/* Central gear */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 250 250"
                to="360 250 250"
                dur="12s"
                repeatCount="indefinite"
              />
              <circle cx="250" cy="250" r="45" className="fill-indigo-500/20 stroke-indigo-400" strokeWidth="2" />
              <circle cx="250" cy="250" r="25" className="fill-indigo-400/30 stroke-indigo-300" strokeWidth="2" />
              {/* Gear teeth */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <rect
                  key={deg}
                  x="242"
                  y="195"
                  width="16"
                  height="20"
                  rx="3"
                  className="fill-indigo-400/40"
                  transform={`rotate(${deg} 250 250)`}
                />
              ))}
            </g>

            {/* Orbiting dots */}
            <circle cx="250" cy="130" r="8" className="fill-indigo-300">
              <animate attributeName="cy" values="130;370;130" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="250" r="6" className="fill-purple-300">
              <animate attributeName="cx" values="130;370;130" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="370" cy="250" r="6" className="fill-blue-300">
              <animate attributeName="cx" values="370;130;370" dur="7s" repeatCount="indefinite" />
            </circle>

            {/* Floating dots */}
            <circle cx="100" cy="100" r="4" className="fill-indigo-400/60">
              <animate attributeName="cy" values="100;120;100" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="400" cy="120" r="5" className="fill-purple-400/60">
              <animate attributeName="cy" values="120;100;120" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="120" cy="400" r="4" className="fill-indigo-400/60">
              <animate attributeName="cy" values="400;380;400" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="390" cy="390" r="5" className="fill-purple-400/60">
              <animate attributeName="cy" values="390;370;390" dur="4.5s" repeatCount="indefinite" />
            </circle>

            {/* Shield / Lock icon */}
            <g transform="translate(250, 250)">
              <path
                d="M-30 -45 L30 -45 L35 -15 L25 15 L0 45 L-25 15 L-35 -15 Z"
                className="fill-indigo-500/30 stroke-indigo-300"
                strokeWidth="2"
              >
                <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
              </path>
              <rect x="-10" y="-10" width="20" height="16" rx="3" className="fill-indigo-400/50" />
              <path d="M-6 -10 L-6 -16 A6 6 0 0 1 6 -16 L6 -10" className="stroke-indigo-300" strokeWidth="2" />
            </g>

            {/* Decorative lines */}
            <path
              d="M80 250 L120 250"
              className="stroke-indigo-500/30"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M380 250 L420 250"
              className="stroke-indigo-500/30"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M250 80 L250 120"
              className="stroke-indigo-500/30"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M250 380 L250 420"
              className="stroke-indigo-500/30"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Welcome text in SVG */}
            <text x="250" y="470" className="fill-indigo-200/60 text-sm font-light" textAnchor="middle">
              Secure • Reliable • Trusted
            </text>
          </svg>
        </div>
      </div>

      {/* ─── RIGHT SIDE: LOGIN FORM ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Back to Home button */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-indigo-500/5">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-2 text-slate-400 text-sm">
                Please sign in to your account
              </p>
            </div>

            {/* Session ended message */}
            {sessionEndedMessage && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-amber-300">{sessionEndedMessage}</p>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75v.008h.008v-.008H12z" />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all disabled:opacity-50 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;