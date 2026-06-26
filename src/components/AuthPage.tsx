import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Chrome, 
  MessageSquare, 
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MineRiftLogo from "../assets/minerift-logo.png";
import GlowButton from "./GlowButton";

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
  onBackToHome: () => void;
}

export default function AuthPage({ onAuthSuccess, onBackToHome }: AuthPageProps) {
  const [subMode, setSubMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Password strength checker states
  const [strength, setStrength] = useState({
    score: 0, // 0 to 4
    hasMinLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUpper: false,
  });

  // Calculate password strength
  useEffect(() => {
    if (subMode !== "register") return;

    const minLength = password.length >= 8;
    const hasNum = /\d/.test(password);
    const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUp = /[A-Z]/.test(password);

    let score = 0;
    if (password.length > 0) score += 1;
    if (minLength) score += 1;
    if (hasNum) score += 1;
    if (hasUp && hasSpec) score += 1;

    setStrength({
      score,
      hasMinLength: minLength,
      hasNumber: hasNum,
      hasSpecial: hasSpec,
      hasUpper: hasUp,
    });
  }, [password, subMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (subMode === "forgot") {
      if (!email) {
        setError("Please enter your email address.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Recovery failed");
        setSuccess(data.message || "A reset link has been sent to your email!");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (subMode === "login") {
      if (!email || !password) {
        setError("Email and password are required.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Incorrect credentials");

        setSuccess("Welcome back, Warrior! Logging you in...");
        if (rememberMe) {
          localStorage.setItem("minerift_remembered_email", email);
        } else {
          localStorage.removeItem("minerift_remembered_email");
        }

        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1200);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Register Mode
      if (!username || !email || !password || !confirmPassword) {
        setError("All registration fields must be completed.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, confirmPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        setSuccess("Success! Your MineRift legend begins now!");
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1200);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Pre-populate remembered email if checked previously
  useEffect(() => {
    const saved = localStorage.getItem("minerift_remembered_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden select-none">
      {/* Dynamic Backlight Spheres */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none animate-[pulse_6s_infinite_ease-in-out]" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none animate-[pulse_8s_infinite_ease-in-out_1s]" />

      {/* Floating Sparkle Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-10 left-12 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
        <div className="absolute bottom-16 left-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-10 w-1 h-1 bg-white rounded-full animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-950/65 backdrop-blur-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-12 min-h-[600px] relative z-10"
      >
        {/* LEFT PANEL: Branding & Visuals (Desktop Split Screen) */}
        <div className="hidden md:flex md:col-span-5 relative bg-slate-950 flex-col justify-between p-8 overflow-hidden border-r border-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-purple-950/30 z-10" />
          
          {/* Animated decorative mesh */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Floating Neon Orbs */}
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-[80px]" />

          {/* Top Branding Header */}
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase cursor-pointer relative z-20"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            Back to Hub
          </button>

          {/* Central Captivating Content */}
          <div className="relative z-20 space-y-5 my-auto">
            {/* Logo Brand above titles */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative w-44 h-auto mb-2 drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            >
              <img 
                src={MineRiftLogo} 
                alt="MineRift Logo" 
                className="w-full h-auto filter"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Next-Gen Gaming Network
            </div>
            <h2 className="text-3xl font-black text-white leading-tight tracking-wide">
              YOUR ADVENTURE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                STARTS HERE
              </span>
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Connect to the ultimate zero-lag Minecraft experience. Claim your customized ranks, unlock legendary keys, and rule the leaderboards.
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="relative z-20 border-t border-white/5 pt-4 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">SECURE ENDPOINT</span>
            <span className="text-[10px] text-purple-400/80 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED OK
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Auth Interactive Card Column */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center p-6 sm:p-10 md:p-12 relative">
          
          {/* Neon Top/Bottom Borders on Focus */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          {/* Top bar on Mobile */}
          <div className="md:hidden flex items-center justify-between mb-8">
            <button 
              onClick={onBackToHome}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-[10px] font-bold tracking-widest uppercase cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
              Back
            </button>
            <img
              src={MineRiftLogo}
              alt="MineRift Logo"
              className="h-7 w-auto drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Center Glowing/Floating Logo */}
          <div className="flex justify-center mb-4 relative group select-none">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 blur-xl group-hover:from-purple-500/20 group-hover:to-cyan-500/20 transition-all duration-300 pointer-events-none" />
            <motion.img
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              src={MineRiftLogo}
              alt="MineRift Logo"
              className="h-14 w-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.35)] object-contain relative z-10"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Title & Toggle Switcher Row */}
          <div className="space-y-6 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
                {subMode === "login" && "Aura Portal"}
                {subMode === "register" && "Create Chronicles"}
                {subMode === "forgot" && "Reclaim Access"}
              </h1>
              <p className="text-xs text-slate-400 font-sans">
                {subMode === "login" && "Enter your credentials to enter the battlefield."}
                {subMode === "register" && "Enlist yourself in the ranks of the supreme fighters."}
                {subMode === "forgot" && "Recover your keys to re-authenticate with the database."}
              </p>
            </div>

            {/* Premium Sliding Segmented Control */}
            <div className="p-1 rounded-xl bg-slate-900/60 border border-white/5 flex items-center relative overflow-hidden">
              <button
                type="button"
                onClick={() => { setSubMode("login"); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-center text-xs font-extrabold uppercase tracking-widest relative z-10 transition-colors duration-300 ${
                  subMode === "login" ? "text-slate-100" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setSubMode("register"); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-center text-xs font-extrabold uppercase tracking-widest relative z-10 transition-colors duration-300 ${
                  subMode === "register" ? "text-slate-100" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Register
              </button>
              
              {/* Sliding background layer */}
              <div 
                className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-500/30 transition-all duration-300 ease-out ${
                  subMode === "login" ? "left-1 w-[48%]" : "left-[51%] w-[48%]"
                } ${subMode === "forgot" ? "opacity-0 scale-90" : "opacity-100"}`}
              />
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* 1. MINECRAFT USERNAME / IGN (Register Only) */}
            <AnimatePresence mode="popLayout">
              {subMode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative group"
                >
                  <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 ml-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-400" /> Minecraft Username / IGN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Steve_PvP"
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all group-hover:border-white/20 placeholder-slate-600 font-medium"
                    />
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. EMAIL ADDRESS */}
            <div className="relative group">
              <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 ml-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-purple-400" /> Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all group-hover:border-white/20 placeholder-slate-600 font-medium"
                />
                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 3. PASSWORD (Login & Register Only) */}
            {subMode !== "forgot" && (
              <div className="relative group">
                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 ml-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-purple-400" /> Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all group-hover:border-white/20 placeholder-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* PASSWORD STRENGTH BAR (Register Only) */}
            <AnimatePresence>
              {subMode === "register" && password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    <span>Aura Shield Strength</span>
                    <span className={
                      strength.score <= 1 ? "text-rose-400" :
                      strength.score <= 3 ? "text-amber-400" : "text-emerald-400"
                    }>
                      {strength.score <= 1 && "Weak"}
                      {strength.score === 2 && "Fair"}
                      {strength.score === 3 && "Strong"}
                      {strength.score >= 4 && "Indestructible"}
                    </span>
                  </div>
                  {/* Dynamic Strength Bar */}
                  <div className="h-1 rounded-full bg-white/5 flex gap-1 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      strength.score <= 1 ? "bg-rose-500 w-[25%]" :
                      strength.score === 2 ? "bg-amber-500 w-[50%]" :
                      strength.score === 3 ? "bg-cyan-500 w-[75%]" : "bg-emerald-500 w-[100%]"
                    }`} />
                  </div>
                  {/* Indicators Checkbox Row */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 pl-1">
                    <span className={`flex items-center gap-1 font-bold ${strength.hasMinLength ? "text-emerald-400" : ""}`}>
                      ● 8+ Characters
                    </span>
                    <span className={`flex items-center gap-1 font-bold ${strength.hasNumber ? "text-emerald-400" : ""}`}>
                      ● Contains Number
                    </span>
                    <span className={`flex items-center gap-1 font-bold ${strength.hasUpper ? "text-emerald-400" : ""}`}>
                      ● Capital Letter
                    </span>
                    <span className={`flex items-center gap-1 font-bold ${strength.hasSpecial ? "text-emerald-400" : ""}`}>
                      ● Special Character
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. CONFIRM PASSWORD (Register Only) */}
            <AnimatePresence>
              {subMode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative group"
                >
                  <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 ml-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-purple-400" /> Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-11 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all group-hover:border-white/20 placeholder-slate-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* REMEMBER ME & FORGOT PASSWORD (Login Only) */}
            {subMode === "login" && (
              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center gap-2 text-slate-400 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-black/20 text-purple-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  Remember Me
                </label>
                <button
                  type="button"
                  onClick={() => setSubMode("forgot")}
                  className="text-purple-400 hover:text-purple-300 transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* FORGOT PASSWORD GO BACK (Forgot Only) */}
            {subMode === "forgot" && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSubMode("login")}
                  className="text-purple-400 hover:text-purple-300 transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            )}

            {/* ALERTS & NOTIFICATIONS CONTAINER */}
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span className="font-sans leading-relaxed">{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  <span className="font-sans leading-relaxed">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBMIT BUTTON */}
            <GlowButton
              type="submit"
              variant="primary"
              glowColor="purple"
              disabled={loading}
              className="w-full !py-3.5 !text-xs font-black uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  PROCESSING TRANSACTION
                </>
              ) : (
                <>
                  {subMode === "login" && "AUTHENTICATE AURA PROFILE"}
                  {subMode === "register" && "INITIALIZE NEW CHRONICLE"}
                  {subMode === "forgot" && "GENERATE RECOVERY LINK"}
                </>
              )}
            </GlowButton>
          </form>


        </div>
      </motion.div>
    </div>
  );
}
