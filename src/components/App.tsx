import React, { useState, useEffect, useRef, FormEvent } from "react";
import { 
  User, Product, Order, Notification, WebsiteSettings, 
  CartItem, ServerStats 
} from "./types";
import { 
  Shield, Key, Coins, ShoppingCart, Users, Play, 
  Sparkles, ExternalLink, MessageSquare, Menu, X, 
  Lock, Copy, Check, Info, Bell, AlertTriangle, ChevronRight, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MineRiftLogo from "./assets/minerift-logo.png";
import ParticleBackground from "./components/ParticleBackground";
import StoreCard, { StoreCardSkeleton } from "./components/StoreCard";
import LazyRender from "./components/LazyRender";
import QRCheckoutModal from "./components/QRCheckoutModal";
import UserDashboard from "./components/UserDashboard";
import AdminConsole from "./components/AdminConsole";
import AuthPage from "./components/AuthPage";
import GlowButton from "./components/GlowButton";
import AnimatedCounter from "./components/AnimatedCounter";

export default function App() {
  // Navigation State: 'home' | 'store' | 'dashboard' | 'admin' | 'auth'
  const [currentTab, setCurrentTab] = useState<"home" | "store" | "dashboard" | "admin" | "auth">("home");
  const [authSubMode, setAuthSubMode] = useState<"login" | "register" | "forgot">("login");
  
  // App states
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ServerStats>({ registeredUsers: 142, ordersCompleted: 387, onlinePlayers: 67, totalPurchases: 45900 });
  const [settings, setSettings] = useState<WebsiteSettings>({
    websiteName: "MineRift",
    logo: "⚔️",
    serverIP: "play.minerift.in",
    port: 19132,
    discordLink: "https://discord.gg/minerift",
    storeBanner: "https://w.wallhaven.cc/full/g7/wallhaven-g7y7yd.png",
    homepageContent: {
      heroTitle: "India's Premium Minecraft Network",
      heroSubtitle: "Experience survival, factions, and customized skyblock with a zero-lag gaming environment, custom ranks, and an active gaming community.",
      featuresTitle: "Why MineRift?",
      featuresSubtitle: "Crafted for enthusiasts who demand stable networking, fair play, and pure excitement."
    },
    maintenanceMode: false,
    maintenanceMessage: "MineRift is undergoing major expansion updates! Back soon in 2 hours.",
    countdownTimer: "",
    primaryColor: "#a855f7",
    secondaryColor: "#06b6d4",
    footerContent: "© 2026 MineRift Server & Store. We are not affiliated with Mojang AB or Microsoft.",
    socialLinks: { twitter: "https://twitter.com/minerift", youtube: "https://youtube.com/minerift", discord: "https://discord.gg/minerift" }
  });

  // Data collections
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<(User & { isAdmin?: boolean }) | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]); // Admin only
  const [allOrdersList, setAllOrdersList] = useState<Order[]>([]); // Admin only
  
  // Shopping cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("minerift_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [showCartDropdown, setShowCartDropdown] = useState(false);

  // Authentication inputs
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Active Order state
  const [activeCheckoutOrder, setActiveCheckoutOrder] = useState<Order | null>(null);

  // Store filter
  const [storeCategory, setStoreCategory] = useState<"all" | "ranks" | "keys" | "coins">("all");

  // Mobile nav drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom animated trailing cursor coordinate tracking
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [scrolled, setScrolled] = useState(false);
  const [heroParallax, setHeroParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Throttled scroll listener via requestAnimationFrame for passive scroll mechanics
  useEffect(() => {
    let active = false;
    const handleScroll = () => {
      if (!active) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          active = false;
        });
        active = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem("minerift_cart", JSON.stringify(cart));
  }, [cart]);

  // Load configuration and data on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch public details
        const [statsRes, settingsRes, productsRes] = await Promise.all([
          fetch("/api/stats").then(r => r.json()),
          fetch("/api/settings").then(r => r.json()),
          fetch("/api/products").then(r => r.json())
        ]);
        setStats(statsRes);
        setSettings(settingsRes);
        setProducts(productsRes);

        // Check login session
        const storedToken = localStorage.getItem("minerift_token");
        if (storedToken) {
          const profileRes = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${storedToken}` }
          });
          if (profileRes.ok) {
            const loggedInUser = await profileRes.json();
            setUser(loggedInUser);
            // Fetch relevant private orders and notifications
            await refreshUserData(storedToken, loggedInUser);
          } else {
            localStorage.removeItem("minerift_token");
          }
        }
      } catch (err) {
        console.error("Failure fetching API endpoints", err);
      } finally {
        // Minimum delay for gorgeous splash screen animation sequence
        setTimeout(() => setLoading(false), 1400);
      }
    };
    loadData();
  }, []);

  // Admin email check helper
  const isAdminEmail = (email: string | undefined) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower === 'minerift@gmail.com' || lower === 'xorg7888@gmail.com';
  };

  // Hero Parallax Handlers
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20; // Parallax factor
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    setHeroParallax({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setHeroParallax({ x: 0, y: 0 });
  };

  // Fetch / Refresh private data
  const refreshUserData = async (token: string, currentUser: any) => {
    try {
      const [ordersRes, notificationsRes] = await Promise.all([
        fetch("/api/orders", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/notifications", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json())
      ]);
      setOrders(ordersRes);
      setNotifications(notificationsRes);

      // If user is Admin, fetch system resources
      if (currentUser && isAdminEmail(currentUser.email)) {
        const [adminUsers, adminOrders, adminProducts] = await Promise.all([
          fetch("/api/admin/users", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
          fetch("/api/admin/orders", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
          fetch("/api/admin/products", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json())
        ]);
        setUsersList(adminUsers);
        setAllOrdersList(adminOrders);
        setProducts(adminProducts);
      }
    } catch (err) {
      console.error("Error updating administrative telemetry", err);
    }
  };

  const handleRefreshData = async () => {
    const token = localStorage.getItem("minerift_token");
    if (token && user) {
      await refreshUserData(token, user);
    }
  };

  // Copy Server IP helper
  const copyIPToClipboard = () => {
    navigator.clipboard.writeText(settings.serverIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // ---------------------------------------------------------
  // SHOPPING CART CONTROLS
  // ---------------------------------------------------------
  const handleAddToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setShowCartDropdown(true);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  // ---------------------------------------------------------
  // AUTHENTICATION INTERACTIVE LOGIC
  // ---------------------------------------------------------
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const isLogin = authSubMode === "login";
    const isForgot = authSubMode === "forgot";

    if (isForgot) {
      if (!authForm.email) {
        setAuthError("Please provide your email address.");
        return;
      }
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authForm.email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAuthSuccess(data.message);
      } catch (err: any) {
        setAuthError(err.message);
      }
      return;
    }

    if (isLogin) {
      if (!authForm.email || !authForm.password) {
        setAuthError("Email and password inputs are required.");
        return;
      }
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authForm.email, password: authForm.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem("minerift_token", data.token);
        setUser(data.user);
        setAuthSuccess("Login successful! Welcome to MineRift.");
        await refreshUserData(data.token, data.user);
        
        // Redirect to dashboard
        setTimeout(() => {
          setCurrentTab("dashboard");
          setAuthForm({ username: "", email: "", password: "", confirmPassword: "" });
        }, 800);
      } catch (err: any) {
        setAuthError(err.message);
      }
    } else {
      // Register Mode
      if (!authForm.username || !authForm.email || !authForm.password || !authForm.confirmPassword) {
        setAuthError("All registration fields must be completed.");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
            confirmPassword: authForm.confirmPassword
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem("minerift_token", data.token);
        setUser(data.user);
        setAuthSuccess("Registration completed! Profile created.");
        await refreshUserData(data.token, data.user);

        setTimeout(() => {
          setCurrentTab("dashboard");
          setAuthForm({ username: "", email: "", password: "", confirmPassword: "" });
        }, 800);
      } catch (err: any) {
        setAuthError(err.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("minerift_token");
    setUser(null);
    setOrders([]);
    setNotifications([]);
    setCurrentTab("home");
  };

  // ---------------------------------------------------------
  // ORDER PAYMENT PROCESSORS
  // ---------------------------------------------------------
  const handleInitiateCheckout = async () => {
    if (!user) {
      setAuthSubMode("login");
      setCurrentTab("auth");
      alert("Please login or create an account before checkout.");
      return;
    }

    if (cart.length === 0) {
      alert("Your shopping cart is empty.");
      return;
    }

    try {
      const token = localStorage.getItem("minerift_token");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          totalPrice: calculateCartTotal()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActiveCheckoutOrder(data);
      setShowCartDropdown(false);
    } catch (err: any) {
      alert("Failed to compile order: " + err.message);
    }
  };

  const handleSubmitCheckoutPayment = async (minecraftUsername: string, screenshotBase64: string, notes: string) => {
    if (!activeCheckoutOrder) return;
    const token = localStorage.getItem("minerift_token");

    const res = await fetch(`/api/orders/${activeCheckoutOrder.id}/submit-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        minecraftUsername,
        screenshotBase64,
        paymentNotes: notes
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Reset shopping state
    setCart([]);
    setActiveCheckoutOrder(null);
    alert("🎉 Payment proof submitted successfully! Admins are reviewing your order. Ranks & Coins are incoming.");
    
    // Switch to Dashboard to inspect status
    await refreshUserData(token, user);
    setCurrentTab("dashboard");
  };

  // ---------------------------------------------------------
  // ADMINISTRATIVE ACTION DISPATCHERS
  // ---------------------------------------------------------
  const handleAdminUpdateSettings = async (newSettings: Partial<WebsiteSettings>) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(newSettings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setSettings(data.settings);
  };

  const handleAdminAddProduct = async (prod: Omit<Product, "id">) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(prod)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await refreshUserData(token, user);
  };

  const handleAdminUpdateProduct = async (id: string, prod: Partial<Product>) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(prod)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await refreshUserData(token, user);
  };

  const handleAdminDeleteProduct = async (id: string) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await refreshUserData(token, user);
  };

  const handleAdminReviewOrder = async (id: string, action: "approve" | "reject", feedback: string) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch(`/api/admin/orders/${id}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ action, feedback })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await refreshUserData(token, user);
    alert(`Order #${id} has been ${action}d! User notified.`);
  };

  const handleAdminCompleteOrder = async (id: string, notes: string) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch(`/api/admin/orders/${id}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ deliveryNotes: notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await refreshUserData(token, user);
    alert(`🎉 Order completed! Server rewards dispatched successfully.`);
  };

  const handleAdminUpdateUser = async (id: string, updates: Partial<User & { resetPassword?: string }>) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await refreshUserData(token, user);
  };

  const handleMarkNotificationRead = async (id: string) => {
    const token = localStorage.getItem("minerift_token");
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      await refreshUserData(token, user);
    }
  };

  // Filter store products list
  const filteredProducts = products.filter(p => {
    if (storeCategory === "all") return p.enabled;
    return p.category === storeCategory && p.enabled;
  });

  return (
    <div className="min-h-screen text-slate-100 font-sans relative overflow-x-hidden select-none bg-[#030008]">
      {/* Dynamic Cursor Glowing Aura (Desktop Hover Trailing) */}
      <div 
        className="hidden md:block fixed w-[400px] h-[400px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 -z-20 transition-transform duration-75 mix-blend-screen opacity-30 blur-[80px]"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(6,182,212,0.06) 60%, transparent 100%)"
        }}
      />

      {/* Persistent Particle Mesh Background */}
      <ParticleBackground />

      {/* Floating Copy IP Floating Success Alert */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs tracking-wider border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.4)] uppercase flex items-center gap-2"
          >
            <Check className="w-4 h-4 animate-scale" /> Copied Server Address! Ready to Play!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gorgeous Intro Loading Splash Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 bg-[#030008] z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-10 bg-purple-500/10 blur-[80px] rounded-full" />
              <h1 className="text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 mb-2 drop-shadow-[0_0_35px_rgba(168,85,247,0.3)]">
                MINERIFT
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-[0.4em] font-medium">
                PREMIUM MINECRAFT STORE
              </p>
              
              <div className="w-32 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto mt-6 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-y-0 w-1/2 bg-white"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL MAINTENANCE GATES LOCKOUT */}
      <AnimatePresence>
        {settings.maintenanceMode && (!user || user.email !== "minerift@gmail.com") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#030008] z-[90] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute -inset-10 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="relative max-w-md p-8 rounded-2xl border border-rose-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
              <h1 className="text-3xl font-black text-slate-100 tracking-wide">Under Maintenance</h1>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                {settings.maintenanceMessage}
              </p>
              
              <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-slate-500">
                Are you an administrator? Click below to override and sign in.
              </div>

              <div className="mt-4 flex gap-3 justify-center">
                <GlowButton
                  variant="ghost"
                  onClick={() => {
                    setAuthSubMode("login");
                    setCurrentTab("auth");
                    // Turn off maintenance representation locally so they can fill forms
                    setSettings({ ...settings, maintenanceMode: false });
                  }}
                  className="!text-xs font-bold"
                >
                  Admin Bypass Login
                </GlowButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRIMARY GLASSMORPHIC NAV HEADER */}
      <header className={`sticky top-0 w-full z-40 transition-all duration-300 border-b ${
        scrolled 
          ? "bg-slate-950/80 backdrop-blur-xl border-white/10 shadow-lg shadow-black/20" 
          : "bg-slate-950/20 backdrop-blur-md border-white/0"
      }`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${
          scrolled ? "h-12" : "h-16"
        }`}>
          
          {/* Logo Brand */}
          <div 
            onClick={() => setCurrentTab("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img 
              src={MineRiftLogo} 
              alt="MineRift Logo" 
              className="h-9 w-auto object-contain group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {settings.websiteName}
            </span>
          </div>

          {/* Desktop Navigation Link Tickers */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setCurrentTab("home")}
              className={`text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                currentTab === "home" ? "text-purple-400" : "text-slate-300 hover:text-white"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab("store")}
              className={`text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                currentTab === "store" ? "text-purple-400" : "text-slate-300 hover:text-white"
              }`}
            >
              Store
            </button>
            
            {user ? (
              <button
                onClick={() => setCurrentTab("dashboard")}
                className={`text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                  currentTab === "dashboard" ? "text-purple-400" : "text-slate-300 hover:text-white"
                }`}
              >
                My Account
              </button>
            ) : (
              <button
                onClick={() => { setAuthSubMode("login"); setCurrentTab("auth"); }}
                className={`text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                  currentTab === "auth" ? "text-purple-400" : "text-slate-300 hover:text-white"
                }`}
              >
                Sign In
              </button>
            )}

            {isAdminEmail(user?.email) && (
              <button
                onClick={() => setCurrentTab("admin")}
                className={`text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                  currentTab === "admin" ? "text-rose-400" : "text-slate-400 hover:text-rose-300"
                }`}
              >
                Console
              </button>
            )}
          </nav>

          {/* Cart Icon & Actions */}
          <div className="flex items-center gap-3">
            {/* Shopping Cart button trigger */}
            <div className="relative">
              <button
                onClick={() => setShowCartDropdown(!showCartDropdown)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors relative cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-[8px] font-black text-white">
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Shopping Cart Dropdown Card */}
              <AnimatePresence>
                {showCartDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl z-50 text-slate-100"
                  >
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-3 border-b border-white/5 pb-2">
                      My Shopping Cart
                    </h3>

                    {cart.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">Your shopping cart is empty.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-200 truncate">{item.product.name}</p>
                              <p className="text-[10px] text-slate-500">₹{item.product.price} x {item.quantity}</p>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[11px] font-mono font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {cart.length > 0 && (
                      <div className="border-t border-white/5 pt-3 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-400">Total Price:</span>
                          <span className="text-amber-400 font-mono text-sm">₹{calculateCartTotal()}</span>
                        </div>
                        
                        <GlowButton
                          variant="primary"
                          glowColor="purple"
                          fullWidth
                          onClick={handleInitiateCheckout}
                          className="!text-xs font-bold !py-2"
                        >
                          Checkout Securely
                        </GlowButton>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV BAR DRAWER OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 bg-[#030008]/95 z-50 p-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-lg font-black tracking-wider text-purple-400 uppercase">MineRift Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => { setCurrentTab("home"); setMobileMenuOpen(false); }}
                  className="text-left text-sm font-bold uppercase tracking-wider py-2 text-slate-300 hover:text-white"
                >
                  Home Dashboard
                </button>
                <button
                  onClick={() => { setCurrentTab("store"); setMobileMenuOpen(false); }}
                  className="text-left text-sm font-bold uppercase tracking-wider py-2 text-slate-300 hover:text-white"
                >
                  E-Commerce Store
                </button>
                {user ? (
                  <button
                    onClick={() => { setCurrentTab("dashboard"); setMobileMenuOpen(false); }}
                    className="text-left text-sm font-bold uppercase tracking-wider py-2 text-slate-300 hover:text-white"
                  >
                    My Profile & Orders
                  </button>
                ) : (
                  <button
                    onClick={() => { setAuthSubMode("login"); setCurrentTab("auth"); setMobileMenuOpen(false); }}
                    className="text-left text-sm font-bold uppercase tracking-wider py-2 text-slate-300 hover:text-white"
                  >
                    Login / Sign In
                  </button>
                )}

                {isAdminEmail(user?.email) && (
                  <button
                    onClick={() => { setCurrentTab("admin"); setMobileMenuOpen(false); }}
                    className="text-left text-sm font-bold uppercase text-rose-400 tracking-wider py-2"
                  >
                    Super Admin Console
                  </button>
                )}
              </div>
            </div>

            <div className="text-center p-4 bg-slate-900/40 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-500 block uppercase">Minecraft Server Host</span>
              <span className="text-xs font-mono text-cyan-400 font-bold select-all">{settings.serverIP}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE ROUTING PAGES LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow">
        
        {/* ========================================================= */}
        {/* PAGE 1: HOME PANEL                                        */}
        {/* ========================================================= */}
        {currentTab === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
            className="space-y-16"
          >
            
            {/* Hero Banner Grid */}
            <div 
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative py-12 md:py-20"
            >
              {/* Backlight Glow Mesh overlay */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none" />
              <div className="absolute top-1/3 right-1/4 -translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

              {/* LEFT COLUMN: Texts & Connection Cockpit */}
              <div className="lg:col-span-7 space-y-8 relative z-10 text-center lg:text-left flex flex-col items-center lg:items-start w-full">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-cyan-400 border border-cyan-500/35 bg-cyan-500/10 uppercase mx-auto lg:mx-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  Live Minecraft Server Online
                </div>

                <div className="space-y-4 max-w-2xl text-center lg:text-left">
                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight text-white uppercase select-none">
                    India's Premium <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                      Minecraft Hub
                    </span>
                  </h1>
                  
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                    {settings.homepageContent.heroSubtitle}
                  </p>
                </div>

                {/* CONNECTION DETAILS GLASSMORPHISM GRID */}
                <div className="space-y-4 w-full max-w-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block text-center lg:text-left ml-1">
                    System Credentials
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {/* Server IP glassmorphism card */}
                    <div className="group/ip p-4 rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300 shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-cyan-500/[0.01] group-hover/ip:bg-cyan-500/[0.03] transition-colors pointer-events-none" />
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                        Server IP Address
                      </span>
                      <span className="text-base font-extrabold text-cyan-400 font-mono tracking-wide mt-2 select-all">
                        {settings.serverIP}
                      </span>
                    </div>

                    {/* Port glassmorphism card */}
                    <div className="group/port p-4 rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-purple-500/[0.01] group-hover/port:bg-purple-500/[0.03] transition-colors pointer-events-none" />
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                        Connection Port
                      </span>
                      <span className="text-base font-extrabold text-purple-400 font-mono tracking-wide mt-2 select-all">
                        {settings.port}
                      </span>
                    </div>
                  </div>

                  {/* Copy Connection Glow Button */}
                  <GlowButton
                    variant="primary"
                    glowColor="purple"
                    onClick={copyIPToClipboard}
                    className="w-full !py-3.5 !text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group active:scale-[0.98] transition-transform"
                  >
                    <Copy className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                    Copy Credentials To Clipboard
                  </GlowButton>
                </div>

                {/* Navigation Button row */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                  <GlowButton
                    variant="secondary"
                    glowColor="cyan"
                    onClick={() => setCurrentTab("store")}
                    className="!text-xs font-black uppercase tracking-wider"
                  >
                    Open Server Store
                  </GlowButton>
                  
                  <a href={settings.discordLink} target="_blank" rel="noreferrer">
                    <button className="px-6 py-3 rounded-lg font-bold text-xs bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 active:scale-95 duration-150">
                      <MessageSquare className="w-4 h-4 text-[#5865F2]" /> Join Discord Community
                    </button>
                  </a>
                </div>
              </div>

              {/* RIGHT COLUMN: Floating, Glowing Hero Character Art */}
              <div className="lg:col-span-5 relative z-10 flex justify-center items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: heroParallax.x,
                    y: heroParallax.y,
                  }}
                  transition={{
                    opacity: { duration: 0.8, ease: "easeOut" },
                    scale: { duration: 0.8, ease: "easeOut" },
                    x: { type: "spring", stiffness: 100, damping: 20 },
                    y: { type: "spring", stiffness: 100, damping: 20 }
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="relative w-full max-w-md select-none flex justify-center items-center"
                >
                  {/* Soft Radial light behind the logo */}
                  <div className="absolute inset-0 bg-radial from-purple-500/25 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-85 w-[110%] h-[110%] animate-[pulse_6s_infinite_ease-in-out]" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-cyan-500/15 rounded-full blur-[110px] pointer-events-none opacity-80" />

                  <motion.img
                    animate={{
                      y: [0, -15, 0],
                    }}
                    transition={{
                      y: {
                        repeat: Infinity,
                        duration: 5,
                        ease: "easeInOut"
                      }
                    }}
                    src={MineRiftLogo}
                    alt="MineRift Logo"
                    loading="eager"
                    referrerPolicy="no-referrer"
                    style={{
                      background: 'transparent',
                      mixBlendMode: 'screen',
                    }}
                    className="w-full h-auto object-contain max-h-[440px] pointer-events-none transition-all duration-500 hover:scale-[1.03] select-none filter drop-shadow-[0_0_20px_rgba(168,85,247,0.45)] drop-shadow-[0_0_50px_rgba(6,182,212,0.25)]"
                  />
                </motion.div>
              </div>
            </div>

            {/* Smooth Mouse Wheel Scroll Indicator */}
            <div className="flex flex-col items-center justify-center py-4 pointer-events-none">
              <span className="text-[9px] uppercase tracking-[0.25em] font-black text-slate-500 mb-2">
                Explore Kingdom Below
              </span>
              <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center p-1.5 bg-slate-950/40 backdrop-blur-sm">
                <motion.div 
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                />
              </div>
            </div>

            {/* Core Features list section */}
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider">High performance</span>
                <h2 className="text-3xl font-black text-slate-100 mt-1">
                  {settings.homepageContent.featuresTitle}
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto">
                  {settings.homepageContent.featuresSubtitle}
                </p>
              </div>

              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300"
                >
                  <span className="text-xl">⚡</span>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2.5">24/7 Live Servers</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-normal">
                    Hosted on dedicated high-memory servers with 99.9% uptime, guaranteeing you never lose your progress or experience downtime.
                  </p>
                </motion.div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300"
                >
                  <span className="text-xl">🛍️</span>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2.5">Fast Perks Delivery</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-normal">
                    Once UPI proof is reviewed, item rewards are delivered directly into your player profile instantly on the active server.
                  </p>
                </motion.div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300"
                >
                  <span className="text-xl">🔒</span>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2.5">Secure UPI QR</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-normal">
                    Direct payment verification under manual super admin reviews. Guaranteed zero security leak risks or fraud.
                  </p>
                </motion.div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300"
                >
                  <span className="text-xl">⚔️</span>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2.5">Premium Custom Ranks</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-normal">
                    Grants exclusive kits, Fly commands, Custom prefixes, and high inventory safety configurations.
                  </p>
                </motion.div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300"
                >
                  <span className="text-xl">👥</span>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2.5">Active Community</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-normal">
                    Connect with thousands of gamers across Indian states. Engage in daily server PvP battles or collaborative build seasons.
                  </p>
                </motion.div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300"
                >
                  <span className="text-xl">🎮</span>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2.5">Lag Free Performance</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-normal">
                    Tailored with optimized chunks rendering, customized network wrappers, and zero-lag server engines.
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Testimonials list */}
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider">Testimonials</span>
                <h2 className="text-3xl font-black text-slate-100 mt-1">What Our Players Say</h2>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ willChange: "transform, opacity" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="p-5 rounded-xl border border-white/5 bg-black/30 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src="https://mc-heads.net/avatar/VortexPlayer/40" 
                      alt="player" 
                      loading="lazy" 
                      className="w-8 h-8 rounded" 
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-200">Vortex_Pro_PvP</h4>
                      <span className="text-[8px] uppercase tracking-wider text-purple-400">Vortex Rank Holder</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "Awesome server! I bought the Vortex rank and received it within 10 minutes of uploading my screenshot. The fly perk works flawlessly!"
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-white/5 bg-black/30 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src="https://mc-heads.net/avatar/VenomMaster/40" 
                      alt="player" 
                      loading="lazy" 
                      className="w-8 h-8 rounded" 
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-200">Karan_MC</h4>
                      <span className="text-[8px] uppercase tracking-wider text-cyan-400">Coin Package Buyer</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "Zero lag on survival mode. I bought 1000 Coins package, payment flow with QR was seamless. Strongly recommend MineRift to Indian players!"
                  </p>
                </div>
              </motion.div>
            </div>

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* PAGE 2: STORE FRONT CATALOG                               */}
        {/* ========================================================= */}
        {currentTab === "store" && (
          <motion.div
            key="store"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
            className="space-y-8"
          >
            {/* Header Banner */}
            <div className="relative rounded-2xl overflow-hidden h-48 border border-purple-500/15 flex flex-col justify-center px-6 sm:px-12 relative">
              <img
                src={settings.storeBanner}
                alt="Store Banner"
                className="absolute inset-0 w-full h-full object-cover opacity-40 brightness-75 hover:scale-[1.01] transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
              
              <div className="relative space-y-2">
                <span className="text-[9px] uppercase font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full tracking-widest inline-block">
                  Official MineRift Store
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-wide">
                  Server Ranks, Keys, & Coins
                </h1>
                <p className="text-slate-400 text-xs max-w-md leading-normal">
                  Elevate your Minecraft adventure! Unlock supreme custom abilities, fly commands, and premium loot keys.
                </p>
              </div>
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
                {(["all", "ranks", "keys", "coins"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStoreCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      storeCategory === cat
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/15"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                Showing {filteredProducts.length} items
              </span>
            </div>

            {/* Grid of Store Cards */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {products.length === 0 ? (
                // Show beautiful pulse skeleton placeholders while data loads
                Array.from({ length: 3 }).map((_, i) => (
                  <StoreCardSkeleton key={`skeleton-${i}`} />
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center p-12 bg-black/20 border border-white/5 rounded-2xl">
                  <p className="text-xs text-slate-500 italic">No products found in this category.</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <LazyRender
                    key={product.id}
                    placeholder={<StoreCardSkeleton />}
                  >
                    <StoreCard
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  </LazyRender>
                ))
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* PAGE 3: USER PROFILE & DASHBOARD                          */}
        {/* ========================================================= */}
        {currentTab === "dashboard" && user && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
          >
            <UserDashboard
              user={user}
              orders={orders}
              notifications={notifications}
              settings={settings}
              onLogout={handleLogout}
              onRefreshData={handleRefreshData}
              onMarkNotificationRead={handleMarkNotificationRead}
            />
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* PAGE 4: AUTH REGISTRATION & LOGIN PANEL                   */}
        {/* ========================================================= */}
        {currentTab === "auth" && (
          <AuthPage
            onAuthSuccess={async (token, user) => {
              localStorage.setItem("minerift_token", token);
              setUser(user);
              await refreshUserData(token, user);
              setCurrentTab("dashboard");
            }}
            onBackToHome={() => setCurrentTab("home")}
          />
        )}

        {/* ========================================================= */}
        {/* PAGE 5: ADMIN CONTROL COCKPIT PANEL                       */}
        {/* ========================================================= */}
        {currentTab === "admin" && isAdminEmail(user?.email) && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
          >
            <AdminConsole
              stats={stats}
              users={usersList}
              products={products}
              orders={allOrdersList}
              settings={settings}
              onUpdateSettings={handleAdminUpdateSettings}
              onAddProduct={handleAdminAddProduct}
              onUpdateProduct={handleAdminUpdateProduct}
              onDeleteProduct={handleAdminDeleteProduct}
              onReviewOrder={handleAdminReviewOrder}
              onCompleteOrder={handleAdminCompleteOrder}
              onUpdateUser={handleAdminUpdateUser}
            />
          </motion.div>
        )}

      </main>

      {/* FOOTER AREA */}
      <footer className="border-t border-white/5 bg-black/60 py-10 mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img 
                src={MineRiftLogo} 
                alt="MineRift Logo" 
                className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.35)]"
                referrerPolicy="no-referrer"
              />
              <span className="text-lg font-black tracking-wider text-purple-400">{settings.websiteName}</span>
            </div>
            <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
              India's premium customized server ecosystem, offering ranks, gold packages, and stable non-lag gameplay networks.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Connect Address</h4>
            <div className="text-xs text-slate-400 font-mono space-y-1.5">
              <p>Server Host: <span className="text-cyan-400 font-bold select-all">{settings.serverIP}</span></p>
              <p>Host Port: <span className="text-cyan-400 font-bold select-all">{settings.port}</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Legal & Community</h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              {settings.footerContent}
            </p>
            
            {/* Social row */}
            <div className="flex gap-3 pt-1">
              <a href={settings.socialLinks.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <span className="text-sm">Twitter</span>
              </a>
              <a href={settings.socialLinks.youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <span className="text-sm">YouTube</span>
              </a>
              <a href={settings.socialLinks.discord} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <span className="text-sm">Discord</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* PERSISTENT MODAL WIZARDS */}
      <AnimatePresence>
        {activeCheckoutOrder && (
          <QRCheckoutModal
            order={activeCheckoutOrder}
            onClose={() => setActiveCheckoutOrder(null)}
            onSubmitPayment={handleSubmitCheckoutPayment}
          />
        )}
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl border border-emerald-500/30 bg-slate-950/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(16,185,129,0.18)] flex items-center gap-3.5 max-w-sm select-none"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Portal Access Loaded</h4>
              <p className="text-[10px] text-slate-400 font-medium font-mono">IP & Port copied to clipboard!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
