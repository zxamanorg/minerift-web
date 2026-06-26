import React, { useState, FormEvent } from "react";
import { 
  User, Product, Order, WebsiteSettings, ServerStats 
} from "../types";
import { 
  Shield, Key, Coins, Settings, Users, Clipboard, 
  TrendingUp, Activity, Plus, Check, X, Ban, Trash2, 
  RefreshCw, Edit, Save, AlertCircle, Eye, Power
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MineRiftLogo from "../assets/minerift-logo.png";
import GlowButton from "./GlowButton";

interface AdminConsoleProps {
  stats: ServerStats;
  users: User[];
  products: Product[];
  orders: Order[];
  settings: WebsiteSettings;
  onUpdateSettings: (newSettings: Partial<WebsiteSettings>) => Promise<void>;
  onAddProduct: (prod: Omit<Product, "id">) => Promise<void>;
  onUpdateProduct: (id: string, prod: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onReviewOrder: (id: string, action: "approve" | "reject", notes: string) => Promise<void>;
  onCompleteOrder: (id: string, deliveryNotes: string) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<User & { resetPassword?: string }>) => Promise<void>;
}

export default function AdminConsole({
  stats,
  users,
  products,
  orders,
  settings,
  onUpdateSettings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onReviewOrder,
  onCompleteOrder,
  onUpdateUser
}: AdminConsoleProps) {
  const [adminTab, setAdminTab] = useState<"overview" | "orders" | "products" | "users" | "settings">("overview");

  // Local form states
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);

  // Products builder state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "ranks" as Product["category"],
    description: "",
    price: 0,
    imageUrl: "",
    enabled: true
  });

  // Settings states
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({ ...settings });

  // Users password overrides
  const [passwordOverrides, setPasswordOverrides] = useState<Record<string, string>>({});
  const [coinsOverrides, setCoinsOverrides] = useState<Record<string, number>>({});

  // Calculations
  const pendingOrdersCount = orders.filter(o => o.status === 'submitted' || o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const grossRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  // Handle settings update
  const handleSaveSettings = async () => {
    try {
      await onUpdateSettings(settingsForm);
      alert("Website settings saved successfully!");
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    }
  };

  // Handle product save (create/update)
  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, productForm);
        alert("Product updated successfully!");
      } else {
        await onAddProduct(productForm);
        alert("Product added successfully!");
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: "", category: "ranks", description: "", price: 0, imageUrl: "", enabled: true });
    } catch (err: any) {
      alert("Error saving product: " + err.message);
    }
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      description: prod.description,
      price: prod.price,
      imageUrl: prod.imageUrl,
      enabled: prod.enabled
    });
    setShowProductModal(true);
  };

  const handleDeleteProductClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this product? This is irreversible.")) {
      try {
        await onDeleteProduct(id);
        alert("Product deleted!");
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between border-b border-purple-500/10 pb-4">
        <div className="flex items-center gap-3.5">
          <img 
            src={MineRiftLogo} 
            alt="MineRift Logo" 
            className="h-11 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[10px] uppercase font-black text-rose-400 tracking-wider">Super Administrator Cockpit</span>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-indigo-400">
              MineRift Control Center
            </h2>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-xl mt-3 sm:mt-0">
          {(["overview", "orders", "products", "users", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                adminTab === tab
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Analytics Cards */}
      {adminTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Total Registered Users</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-slate-100">{users.length}</span>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Review Pending Orders</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-yellow-400">{pendingOrdersCount}</span>
                <Clipboard className="w-5 h-5 text-yellow-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Gross Stores Revenue</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-emerald-400">₹{grossRevenue + stats.totalPurchases}</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Completed Deliveries</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-cyan-400">{completedOrdersCount + stats.ordersCompleted}</span>
                <Check className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Recent Audit log list */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-500" />
              Recent Operations Log
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {orders.slice(0, 5).map((o, index) => (
                <div key={index} className="p-3 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-bold">Order #{o.id} - {o.username || o.userEmail}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Total Value: ₹{o.totalPrice} • Updated {new Date(o.updatedAt).toLocaleString()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase ${
                    o.status === 'completed' ? 'text-emerald-400 bg-emerald-400/5 border border-emerald-400/20' : 'text-yellow-400 bg-yellow-400/5 border border-yellow-400/20'
                  }`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {adminTab === "orders" && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">Pending & Completed Orders</h3>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No store orders created yet.</p>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/40 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-3 gap-3">
                  <div>
                    <span className="text-[9px] text-slate-500 block">ORDER ID</span>
                    <span className="text-xs font-mono font-bold text-slate-300">#{ord.id}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">MC IGN</span>
                    <span className="text-xs font-bold text-cyan-400">{ord.username || "Not Specified"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">EMAIL</span>
                    <span className="text-xs text-slate-400 truncate max-w-[120px] inline-block">{ord.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">TOTAL VALUE</span>
                    <span className="text-xs font-black text-emerald-400">₹{ord.totalPrice}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">STATUS</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      ord.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-[9px] text-slate-500 uppercase font-black">Line Items</span>
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-black/10 rounded border border-white/5 text-slate-300">
                      <span>[{it.category.toUpperCase()}] {it.name}</span>
                      <span>Qty: {it.quantity} x ₹{it.price}</span>
                    </div>
                  ))}
                </div>

                {/* Proof screenshot preview */}
                {ord.screenshotUrl && (
                  <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold mb-2">User Uploaded UPI Receipt</span>
                    <div className="flex items-start gap-4">
                      <div className="relative w-28 h-28 border border-white/10 rounded-lg overflow-hidden group">
                        <img 
                          src={ord.screenshotUrl} 
                          alt="Transaction Screenshot" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <button
                          type="button"
                          onClick={() => setReviewingOrder(ord)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Inspect
                        </button>
                      </div>
                      <div className="flex-1 text-xs space-y-1 text-slate-400">
                        {ord.paymentNotes && <p><span className="text-purple-400">User notes:</span> {ord.paymentNotes}</p>}
                        <p><span className="text-slate-500">Submitted at:</span> {new Date(ord.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Operations Actions */}
                {ord.status === 'submitted' && (
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Approval Notes (Reviewer feedback)</label>
                        <input
                          type="text"
                          placeholder="Payment confirmed! Proceeding to dispatch..."
                          value={feedbackNotes[ord.id] || ""}
                          onChange={(e) => setFeedbackNotes({ ...feedbackNotes, [ord.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <GlowButton
                          variant="primary"
                          glowColor="purple"
                          onClick={() => onReviewOrder(ord.id, "approve", feedbackNotes[ord.id] || "Approved by Super Admin")}
                          className="flex-1 !py-2 !text-xs"
                        >
                          Approve Payment
                        </GlowButton>
                        <button
                          onClick={() => onReviewOrder(ord.id, "reject", feedbackNotes[ord.id] || "Payment receipt rejected. Please try again.")}
                          className="flex-1 py-2 px-4 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reject Order
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {ord.status === 'approved' && (
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Server Dispatch / Delivery Notes</label>
                        <input
                          type="text"
                          placeholder="Vortex rank added inside server database."
                          value={deliveryNotes[ord.id] || ""}
                          onChange={(e) => setDeliveryNotes({ ...deliveryNotes, [ord.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <GlowButton
                          variant="secondary"
                          glowColor="cyan"
                          onClick={() => onCompleteOrder(ord.id, deliveryNotes[ord.id] || "Dispatch finalized. Enjoy your server perks!")}
                          className="w-full !py-2 !text-xs"
                        >
                          Dispatch Goods (Complete Order)
                        </GlowButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Products management Tab */}
      {adminTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">Product Catalog</h3>
            <GlowButton
              variant="primary"
              glowColor="purple"
              onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
              className="!py-2 !text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </GlowButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div key={prod.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase font-black tracking-wide">
                    {prod.category}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${prod.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
                
                <h4 className="text-sm font-bold text-slate-200 truncate">{prod.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 mb-3">{prod.description}</p>
                
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                  <span className="text-sm font-black text-emerald-400">₹{prod.price}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProductClick(prod)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProductClick(prod.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Status Tab */}
      {adminTab === "users" && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">Registered Player Accounts</h3>
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/5 text-slate-500">
                  <th className="p-3">Player IGN / Email</th>
                  <th className="p-3">Coins Balance</th>
                  <th className="p-3">Unlocked items</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-bold">{user.username}</span>
                        <span className="text-[10px] text-slate-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-amber-400 font-bold">
                      <div className="flex items-center gap-2">
                        <span>{user.coins} Coins</span>
                        <input
                          type="number"
                          placeholder="+/-"
                          className="w-16 px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[10px] text-slate-200"
                          value={coinsOverrides[user.id] ?? ""}
                          onChange={(e) => setCoinsOverrides({ ...coinsOverrides, [user.id]: Number(e.target.value) })}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              await onUpdateUser(user.id, { coins: coinsOverrides[user.id] });
                              alert("User coins updated!");
                              setCoinsOverrides({ ...coinsOverrides, [user.id]: 0 });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <p className="truncate text-[10px] text-slate-400">
                        Ranks: {user.purchasedRanks.join(", ") || "None"} • Keys: {user.purchasedKeys.length}
                      </p>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                        user.isBanned 
                          ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" 
                          : "text-emerald-400 bg-emerald-500/10 border border-emerald-400/20"
                      }`}>
                        {user.isBanned ? "BANNED" : "ACTIVE"}
                      </span>
                    </td>
                    <td className="p-3 text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUpdateUser(user.id, { isBanned: !user.isBanned })}
                          className={`p-1.5 rounded text-xs font-semibold cursor-pointer ${
                            user.isBanned 
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                              : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                        <input
                          type="password"
                          placeholder="Reset Pwd"
                          className="w-24 px-1.5 py-1 bg-black/40 border border-white/10 rounded text-[10px] text-slate-200"
                          onChange={(e) => setPasswordOverrides({ ...passwordOverrides, [user.id]: e.target.value })}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const pass = passwordOverrides[user.id];
                              if (pass) {
                                await onUpdateUser(user.id, { resetPassword: pass });
                                alert(`Password reset for ${user.username}!`);
                              }
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings management Tab */}
      {adminTab === "settings" && (
        <div className="p-5 rounded-xl border border-white/5 bg-slate-900/40 space-y-4">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-2">Global Settings Override</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Website Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                value={settingsForm.websiteName}
                onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Discord Invite Link</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                value={settingsForm.discordLink}
                onChange={(e) => setSettingsForm({ ...settingsForm, discordLink: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Minecraft Server IP (Host)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                value={settingsForm.serverIP}
                onChange={(e) => setSettingsForm({ ...settingsForm, serverIP: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Minecraft Port</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                value={settingsForm.port}
                onChange={(e) => setSettingsForm({ ...settingsForm, port: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Store Hero Image Background URL</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                value={settingsForm.storeBanner}
                onChange={(e) => setSettingsForm({ ...settingsForm, storeBanner: e.target.value })}
              />
            </div>

            {/* Maintenance Mode Gates */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300">Maintenance Lockout</span>
                <span className="text-[10px] text-slate-500">Lock general player access</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm({ ...settingsForm, maintenanceMode: !settingsForm.maintenanceMode })}
                className={`p-2 rounded-lg cursor-pointer ${
                  settingsForm.maintenanceMode 
                    ? "bg-rose-500/20 border border-rose-500/30 text-rose-400" 
                    : "bg-slate-800 border border-white/10 text-slate-400"
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>

          {settingsForm.maintenanceMode && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Custom Lockout Message</label>
              <textarea
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none resize-none"
                rows={2}
                value={settingsForm.maintenanceMessage}
                onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMessage: e.target.value })}
              />
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-white/5">
            <GlowButton
              variant="primary"
              glowColor="purple"
              onClick={handleSaveSettings}
              className="!text-xs font-bold"
            >
              <Save className="w-4 h-4" /> Save Settings
            </GlowButton>
          </div>
        </div>
      )}

      {/* Inspect screenshot modal */}
      <AnimatePresence>
        {reviewingOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-5 text-center">
              <button
                onClick={() => setReviewingOrder(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-sm font-bold text-slate-200 mb-4">Inspection: Order #{reviewingOrder.id}</h4>
              <div className="w-full max-h-[70vh] overflow-y-auto rounded-lg border border-white/10">
                <img 
                  src={reviewingOrder.screenshotUrl} 
                  alt="Review Transaction Details" 
                  className="w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-purple-500/20 rounded-2xl p-6 shadow-2xl text-slate-200"
            >
              <button
                onClick={() => setShowProductModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-purple-400 mb-4">
                {editingProduct ? "Modify Product" : "Launch New Product"}
              </h3>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Store Category</label>
                  <select
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as Product["category"] })}
                  >
                    <option value="ranks">Ranks (Perks)</option>
                    <option value="keys">Crate Keys</option>
                    <option value="coins">Coins Packages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Product Description</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none resize-none"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Image URL</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <GlowButton
                    type="submit"
                    variant="primary"
                    glowColor="purple"
                    className="!text-xs font-bold"
                  >
                    Save Changes
                  </GlowButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
