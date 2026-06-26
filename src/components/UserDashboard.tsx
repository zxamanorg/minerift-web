import { useState, useEffect } from "react";
import { User, Order, Notification, WebsiteSettings } from "../types";
import { 
  Shield, Key, Coins, Settings, Bell, Clock, 
  CheckCircle, AlertCircle, RefreshCw, LogOut, ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import MineRiftLogo from "../assets/minerift-logo.png";
import GlowButton from "./GlowButton";

interface UserDashboardProps {
  user: User & { isAdmin?: boolean };
  orders: Order[];
  notifications: Notification[];
  settings: WebsiteSettings;
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
  onMarkNotificationRead: (id: string) => Promise<void>;
}

export default function UserDashboard({
  user,
  orders,
  notifications,
  settings,
  onLogout,
  onRefreshData,
  onMarkNotificationRead
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "notifications">("profile");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshData();
    setRefreshing(false);
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 bg-yellow-400/5 border-yellow-400/20";
      case "submitted":
        return "text-blue-400 bg-blue-400/5 border-blue-400/20";
      case "approved":
        return "text-indigo-400 bg-indigo-400/5 border-indigo-400/20";
      case "rejected":
        return "text-rose-400 bg-rose-400/5 border-rose-400/20";
      case "completed":
        return "text-emerald-400 bg-emerald-400/5 border-emerald-400/20";
    }
  };

  // Pre-fetch some player avatars. Since user may not have set an IGN yet, we fallback to Steve or their current username
  const ign = orders.length > 0 ? orders[0].username : user.username;
  const avatarUrl = `https://mc-heads.net/avatar/${ign || "Steve"}/120`;

  return (
    <div className="w-full space-y-8 relative">
      {/* Fixed Low-Opacity Space Wallpaper Background */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-25">
        <img
          src="https://w.wallhaven.cc/full/5w/wallhaven-5wlpk8.png"
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient dark mask to ensure maximum readability and gorgeous atmospheric bleeding */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-slate-950/50" />
        <div className="absolute inset-0 bg-slate-950/40" />
      </div>

      {/* Top Main Dashboard Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative rounded-3xl overflow-hidden h-48 border border-purple-500/20 flex flex-col justify-center px-6 sm:px-12 shadow-[0_16px_48px_rgba(0,0,0,0.5)] group"
      >
        <img
          src="https://w.wallhaven.cc/full/5w/wallhaven-5wlpk8.png"
          alt="Dashboard Banner"
          loading="eager"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-85 brightness-110 hover:scale-[1.01] transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none z-10" />
        
        <div className="relative space-y-2.5 z-20">
          <span className="text-[9px] uppercase font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full tracking-widest inline-block">
            Portal Access Live
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-wide uppercase">
            {user.username}'s Fortress
          </h1>
          <p className="text-slate-400 text-xs max-w-md leading-normal font-medium">
            Manage your credentials, dispatch orders, and monitor your in-game coins in real-time.
          </p>
        </div>
      </motion.div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6"
      >
      {/* Side Profile Info Card */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, x: -15, y: 10 },
          show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
        }}
        style={{ willChange: "transform, opacity" }}
        className="lg:col-span-1 flex flex-col gap-5"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md p-6 text-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
          
          {/* Centered Premium Logo */}
          <div className="flex justify-center mb-6 relative group">
            <div className="absolute -inset-1 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
            <img 
              src={MineRiftLogo} 
              alt="MineRift Logo" 
              className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.35)] hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="relative w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden border border-purple-500/20 p-1 bg-black/40">
            <img 
              src={avatarUrl} 
              alt="Player Skin"
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/120";
              }}
            />
          </div>

          <h3 className="text-lg font-black text-slate-100 tracking-wide truncate">
            {user.username}
          </h3>
          <p className="text-slate-400 text-xs truncate mb-3">{user.email}</p>

          {user.isAdmin && (
            <span className="inline-block px-3 py-1 rounded-full text-[9px] font-bold text-red-400 border border-red-500/30 bg-red-500/10 uppercase tracking-widest mb-4">
              SUPER ADMIN
            </span>
          )}

          {/* Wallets & Inventories */}
          <div className="space-y-2 border-t border-white/5 pt-4 text-left">
            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Wallet Coins:
              </span>
              <span className="font-bold text-amber-400 font-mono">{user.coins} Gold</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Unlocked Ranks:
              </span>
              <span className="font-bold text-purple-400">{user.purchasedRanks.length || "None"}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Unlocked Keys:
              </span>
              <span className="font-bold text-cyan-400">{user.purchasedKeys.length || "None"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 space-y-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            
            <button
              onClick={onLogout}
              className="w-full py-2 px-4 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Unlocked goodies list */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">My Virtual Inventory</h4>
          <div className="space-y-3">
            {user.purchasedRanks.length > 0 ? (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Server Ranks</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {user.purchasedRanks.map((r, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase text-purple-400 tracking-wide">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {user.purchasedKeys.length > 0 ? (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Crate Keys Available</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {user.purchasedKeys.map((k, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 tracking-wide">
                      🔑 {k}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {user.purchasedRanks.length === 0 && user.purchasedKeys.length === 0 && (
              <p className="text-xs text-slate-500 italic">No ranks or keys unlocked yet. Shop our items to get started!</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Contents Tabs */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, x: 15, y: 10 },
          show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
        }}
        style={{ willChange: "transform, opacity" }}
        className="lg:col-span-3 flex flex-col gap-5"
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "profile" 
                ? "text-purple-400 border-b-2 border-purple-500" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "orders" 
                ? "text-purple-400 border-b-2 border-purple-500" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Orders History
            {orders.length > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1.5 py-0.5 rounded-full bg-purple-600 text-[8px] font-bold text-white">
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "notifications" 
                ? "text-purple-400 border-b-2 border-purple-500" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-600 text-[8px] font-bold text-white animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Panel contents */}
        <div className="w-full">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile welcome */}
              <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Welcome back, <span className="text-purple-400">{user.username}</span>!
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 max-w-xl leading-relaxed">
                  Join India's most advanced Minecraft network! Open Minecraft, add server <span className="text-cyan-400 font-mono font-bold select-all">{settings.serverIP}</span> (Port: {settings.port}), and experience premium gameplay.
                </p>
                <div className="flex gap-4 mt-4">
                  <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 text-center flex-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold">Server Host IP</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold select-all">{settings.serverIP}</span>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 text-center flex-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold">Minecraft Port</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold select-all">{settings.port}</span>
                  </div>
                </div>
              </div>

              {/* Quick statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs text-slate-500 uppercase font-bold tracking-wider">Recent Order</h5>
                    {orders.length > 0 ? (
                      <div className="mt-1">
                        <p className="text-sm font-bold text-slate-200">
                          Order #{orders[0].id}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          Total: ₹{orders[0].totalPrice} • 
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8px] ${getStatusColor(orders[0].status)}`}>
                            {orders[0].status}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">No orders submitted yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Bell className="w-5 h-5 animate-swing" />
                  </div>
                  <div>
                    <h5 className="text-xs text-slate-500 uppercase font-bold tracking-wider">Latest Unread Alert</h5>
                    {notifications.filter(n => !n.read).length > 0 ? (
                      <p className="text-xs text-slate-300 font-medium line-clamp-2 mt-1.5">
                        {notifications.filter(n => !n.read)[0].message}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1.5">No new notifications.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center p-8 bg-black/20 border border-white/5 rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No orders found</p>
                  <p className="text-[10px] text-slate-500 mt-1">You haven't purchased anything yet. Head to the store!</p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-md flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Order Ref ID</span>
                        <span className="text-xs font-mono font-bold text-slate-300">#{ord.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Minecraft ID</span>
                        <span className="text-xs font-bold text-cyan-400">{ord.username || "Not Specified"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Submission Date</span>
                        <span className="text-xs text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Status</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(ord.status)}`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Purchased Items</span>
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-xs text-slate-300 p-2 bg-black/10 rounded border border-white/5">
                          <span className="flex items-center gap-1.5">
                            <span className="text-purple-400 font-bold">[{it.category.toUpperCase()}]</span> 
                            {it.name}
                          </span>
                          <span className="text-slate-400">Qty: {it.quantity} x ₹{it.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Feedback notes if any */}
                    {(ord.paymentNotes || ord.deliveryNotes) && (
                      <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-400 space-y-1">
                        {ord.paymentNotes && (
                          <p>
                            <span className="text-purple-400 font-semibold">Payment Notes:</span> {ord.paymentNotes}
                          </p>
                        )}
                        {ord.deliveryNotes && (
                          <p>
                            <span className="text-cyan-400 font-semibold">Admin Dispatch Notes:</span> {ord.deliveryNotes}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-xs text-slate-400">Payment Screenshot</span>
                      <div className="flex items-center gap-4">
                        {ord.screenshotUrl ? (
                          <a 
                            href={ord.screenshotUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View Uploaded Proof
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-rose-400">Screenshot Required</span>
                        )}
                        <span className="text-sm font-black text-slate-100">
                          Total Paid: ₹{ord.totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center p-8 bg-black/20 border border-white/5 rounded-2xl">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No alerts found</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && onMarkNotificationRead(notif.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      notif.read 
                        ? "bg-slate-900/20 border-white/5 text-slate-400" 
                        : "bg-purple-500/5 border-purple-500/20 text-slate-200 shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:border-purple-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs leading-relaxed">{notif.message}</p>
                      {!notif.read && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping mt-1.5" />
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-2 block">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  </div>
  );
}
