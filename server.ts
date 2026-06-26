import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { 
  User, Product, Order, Notification, WebsiteSettings, 
  CartItem, ServerStats, OrderItem 
} from './src/types';

const app = express();
app.use(compression());
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'minerift_premium_secret_key_2026_99321';
const DB_FILE = path.join(process.cwd(), 'db.json');

// Ensure JSON parsing support with generous size limit for base64 screenshot uploads
app.use(express.json({ limit: '15mb' }));

// ---------------------------------------------------------
// DATABASE CONTROLLER & PRE-POPULATED DATA
// ---------------------------------------------------------
interface Database {
  users: User[];
  products: Product[];
  orders: Order[];
  notifications: Notification[];
  settings: WebsiteSettings;
  stats: ServerStats;
}

const DEFAULT_HASHED_ADMIN_PASSWORD = crypto.createHash('sha256').update('mineriftcloud').digest('hex');

const DEFAULT_SETTINGS: WebsiteSettings = {
  websiteName: "MineRift",
  logo: "⚔️",
  serverIP: "play.minerift.in",
  port: 19132,
  discordLink: "https://discord.gg/minerift",
  storeBanner: "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=1200&q=80",
  homepageContent: {
    heroTitle: "India's Premium Minecraft Network",
    heroSubtitle: "Experience survival, factions, and customized skyblock with a zero-lag gaming environment, custom ranks, and an active gaming community.",
    featuresTitle: "Why MineRift?",
    featuresSubtitle: "Crafted for enthusiasts who demand stable networking, fair play, and pure excitement."
  },
  maintenanceMode: false,
  maintenanceMessage: "MineRift is undergoing major expansion updates! Back soon in 2 hours.",
  countdownTimer: "",
  primaryColor: "#a855f7", // purple-500
  secondaryColor: "#06b6d4", // cyan-500
  footerContent: "© 2026 MineRift Server & Store. We are not affiliated with Mojang AB or Microsoft.",
  socialLinks: {
    twitter: "https://twitter.com/minerift",
    youtube: "https://youtube.com/minerift",
    discord: "https://discord.gg/minerift"
  }
};

const DEFAULT_PRODUCTS: Product[] = [
  // RANKS
  {
    id: "rank-vortex",
    category: "ranks",
    name: "Vortex",
    description: "Premium Tier 1. Grants fly permissions, custom prefix [Vortex], and 3 monthly common keys.",
    price: 299,
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "rank-duper",
    category: "ranks",
    name: "Duper",
    description: "Grants 2x custom drops, double voting power, [Duper] prefix, and auto-sorting inventory.",
    price: 499,
    imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "rank-warrior",
    category: "ranks",
    name: "Warrior",
    description: "Custom combat armor sets, PvP prefix [Warrior], combat keep-inventory, and daily kit access.",
    price: 799,
    imageUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "rank-terrorist",
    category: "ranks",
    name: "Terrorist",
    description: "Exclusive explosive kit, double TNT damage limits, customized prefix [Terrorist], and explosive particle trails.",
    price: 1199,
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "rank-spiderman",
    category: "ranks",
    name: "SpiderMan",
    description: "Web shooter gadgets, high jump, fall-damage immunity, unique prefix [SpiderMan], and climb boost abilities.",
    price: 1499,
    imageUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "rank-shullvenom",
    category: "ranks",
    name: "ShullVenom",
    description: "The absolute supreme rank. Shulker box commands, black particles, venom venomous kit, custom pet, and priority slot access.",
    price: 2499,
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },

  // KEYS
  {
    id: "key-party",
    category: "keys",
    name: "Party Key",
    description: "Opens the Party Crate for a chance at high-tier random drops for everyone online.",
    price: 49,
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "key-common",
    category: "keys",
    name: "Common Key",
    description: "Standard key to unlock resources, extra food, and common tools.",
    price: 19,
    imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "key-rare",
    category: "keys",
    name: "Rare Key",
    description: "Unlock legendary enchantments, diamond gear, and premium consumables.",
    price: 99,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "key-koth",
    category: "keys",
    name: "KOTH Key",
    description: "Unlock massive riches from King of the Hill chests. Includes God Armor potential.",
    price: 199,
    imageUrl: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "key-spawner",
    category: "keys",
    name: "Spawner Key",
    description: "Grants random spawn crates with custom entities like Iron Golem, Blaze, or Creeper.",
    price: 299,
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },

  // COINS
  {
    id: "coins-100",
    category: "coins",
    name: "100 Coins Package",
    description: "Increments server wallet by 100 Gold Coins.",
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "coins-500",
    category: "coins",
    name: "500 Coins Package",
    description: "Increments server wallet by 500 Gold Coins + 50 bonus coins.",
    price: 500,
    imageUrl: "https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "coins-1000",
    category: "coins",
    name: "1000 Coins Package",
    description: "Increments server wallet by 1000 Gold Coins + 150 bonus coins.",
    price: 1000,
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "coins-5000",
    category: "coins",
    name: "5000 Coins Package",
    description: "Increments server wallet by 5000 Gold Coins + 1000 bonus coins.",
    price: 5000,
    imageUrl: "https://images.unsplash.com/photo-1561414927-6d86591d0c4f?auto=format&fit=crop&w=400&q=80",
    enabled: true
  },
  {
    id: "coins-10000",
    category: "coins",
    name: "10000 Coins Package",
    description: "The King's Wallet. Increments server wallet by 10000 Gold Coins + 2500 bonus coins.",
    price: 10000,
    imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=400&q=80",
    enabled: true
  }
];

// Read/Write DB helper with memory caching
let cachedDB: Database | null = null;

function readDB(): Database {
  if (cachedDB) {
    return cachedDB;
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDB: Database = {
      users: [
        {
          id: "admin-uid-1",
          username: "MineRiftAdmin",
          email: "minerift@gmail.com",
          coins: 100000,
          purchasedRanks: ["ShullVenom"],
          purchasedKeys: ["Spawner Key"],
          isBanned: false,
          createdAt: new Date().toISOString()
        }
      ],
      products: DEFAULT_PRODUCTS,
      orders: [
        {
          id: "order-1",
          userId: "admin-uid-1",
          username: "MineRift_PvP",
          userEmail: "minerift@gmail.com",
          items: [
            { id: "oi-1", productId: "rank-vortex", name: "Vortex", category: "ranks", price: 299, quantity: 1 }
          ],
          totalPrice: 299,
          status: "completed",
          screenshotUrl: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=400&q=80",
          paymentNotes: "Welcome kit delivered.",
          deliveryNotes: "Delivered live on server by Admin.",
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString()
        }
      ],
      notifications: [
        {
          id: "notif-1",
          userId: "admin-uid-1",
          message: "Welcome to MineRift Server & Store! Let's conquer the server.",
          read: false,
          createdAt: new Date().toISOString()
        }
      ],
      settings: DEFAULT_SETTINGS,
      stats: {
        registeredUsers: 142,
        ordersCompleted: 387,
        onlinePlayers: 67,
        totalPurchases: 45900
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
    cachedDB = initialDB;
    return initialDB;
  }
  try {
    cachedDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return cachedDB!;
  } catch (err) {
    console.error("Failed to parse DB_FILE, recreating...", err);
    cachedDB = {
      users: [],
      products: DEFAULT_PRODUCTS,
      orders: [],
      notifications: [],
      settings: DEFAULT_SETTINGS,
      stats: { registeredUsers: 0, ordersCompleted: 0, onlinePlayers: 0, totalPurchases: 0 }
    };
    return cachedDB;
  }
}

function writeDB(db: Database) {
  cachedDB = db;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Ensure the DB is initialized immediately
let databaseState = readDB();

// Password hashing helper (SHA256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ---------------------------------------------------------
// MIDDLEWARES
// ---------------------------------------------------------
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded; // { id, email, username }
    next();
  });
}

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower === 'minerift@gmail.com' || lower === 'xorg7888@gmail.com';
}

function adminOnly(req: any, res: any, next: any) {
  authenticateToken(req, res, () => {
    if (isAdminEmail(req.user.email)) {
      next();
    } else {
      res.status(403).json({ error: "Unauthorized access: Administrative permissions required." });
    }
  });
}

// ---------------------------------------------------------
// AUTHENTICATION ROUTES
// ---------------------------------------------------------

// Registration
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  const db = readDB();
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: "Email address already registered" });
  }

  const newId = 'user_' + Math.random().toString(36).substr(2, 9);
  const newUser: User = {
    id: newId,
    username: username.trim(),
    email: email.toLowerCase().trim(),
    coins: 0,
    purchasedRanks: [],
    purchasedKeys: [],
    isBanned: false,
    createdAt: new Date().toISOString()
  };

  // Keep passwords/hash inside a private mapping or hash stored in a meta field if desired.
  // To keep db.json secure and single-file, we will store credentials in an auxiliary map
  // or a system key in db.json if needed. Let's store password hash right inside db.json user object securely!
  (newUser as any).passwordHash = hashPassword(password);

  db.users.push(newUser);
  db.stats.registeredUsers += 1;
  writeDB(db);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Return clean user info without passwordHash
  const { passwordHash, ...cleanUser } = newUser as any;
  res.status(201).json({ token, user: cleanUser });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = readDB();

  // Super Admin Check
  if (email.toLowerCase() === 'minerift@gmail.com' || email.toLowerCase() === 'xorg7888@gmail.com') {
    const inputHash = hashPassword(password);
    if (inputHash === DEFAULT_HASHED_ADMIN_PASSWORD) {
      const username = email.toLowerCase() === 'xorg7888@gmail.com' ? "xorg7888" : "MineRiftAdmin";
      const id = email.toLowerCase() === 'xorg7888@gmail.com' ? "admin-uid-2" : "admin-uid-1";
      const adminToken = jwt.sign(
        { id, email: email.toLowerCase(), username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token: adminToken,
        user: {
          id,
          username,
          email: email.toLowerCase(),
          coins: 100000,
          purchasedRanks: ["ShullVenom"],
          purchasedKeys: ["Spawner Key"],
          isBanned: false,
          isAdmin: true,
          createdAt: new Date().toISOString()
        }
      });
    } else if (email.toLowerCase() === 'minerift@gmail.com') {
      return res.status(401).json({ error: "Invalid admin password" });
    }
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "User not found with this email" });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Your account is banned from MineRift Store & Server." });
  }

  const userHash = (user as any).passwordHash;
  if (userHash && hashPassword(password) === userHash) {
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { passwordHash, ...cleanUser } = user as any;
    if (isAdminEmail(user.email)) {
      cleanUser.isAdmin = true;
    }
    return res.json({ token, user: cleanUser });
  }

  res.status(401).json({ error: "Invalid email or password credentials" });
});

// Get current profile
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const db = readDB();
  
  const user = db.users.find(u => u.id === req.user.id || u.email.toLowerCase() === req.user.email.toLowerCase());
  if (user) {
    if (user.isBanned) {
      return res.status(403).json({ error: "Your account has been banned" });
    }
    const { passwordHash, ...cleanUser } = user as any;
    if (isAdminEmail(user.email)) {
      cleanUser.isAdmin = true;
    }
    return res.json(cleanUser);
  }

  if (req.user.email === 'minerift@gmail.com') {
    return res.json({
      id: "admin-uid-1",
      username: "MineRiftAdmin",
      email: "minerift@gmail.com",
      coins: 100000,
      purchasedRanks: ["ShullVenom"],
      purchasedKeys: ["Spawner Key"],
      isBanned: false,
      isAdmin: true,
      createdAt: new Date().toISOString()
    });
  }

  if (req.user.email === 'xorg7888@gmail.com') {
    return res.json({
      id: "admin-uid-2",
      username: "xorg7888",
      email: "xorg7888@gmail.com",
      coins: 100000,
      purchasedRanks: ["ShullVenom"],
      purchasedKeys: ["Spawner Key"],
      isBanned: false,
      isAdmin: true,
      createdAt: new Date().toISOString()
    });
  }

  return res.status(404).json({ error: "Profile not found" });
});

// Simulated forgot password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const db = readDB();
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase()) || email.toLowerCase() === 'minerift@gmail.com';
  if (!exists) {
    return res.status(404).json({ error: "Email not found" });
  }
  res.json({ message: "Password reset link sent to your registered email successfully! Check your inbox or spam folder." });
});

// ---------------------------------------------------------
// PUBLIC STATS & SETTINGS ENDPOINTS
// ---------------------------------------------------------
app.get('/api/stats', (req, res) => {
  const db = readDB();
  // Provide randomized online player statistics to simulate a highly dynamic ecosystem
  const randomDelta = Math.floor(Math.sin(Date.now() / 100000) * 15);
  const activePlayers = Math.max(25, db.stats.onlinePlayers + randomDelta);
  
  res.json({
    ...db.stats,
    onlinePlayers: activePlayers
  });
});

app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products.filter(p => p.enabled));
});

// ---------------------------------------------------------
// SHOPPING CART & ORDER ENDPOINTS
// ---------------------------------------------------------

// Retrieve user order history
app.get('/api/orders', authenticateToken, (req: any, res) => {
  const db = readDB();
  const userOrders = db.orders.filter(o => o.userId === req.user.id);
  res.json(userOrders);
});

// Create draft order (Pending Payment)
app.post('/api/orders', authenticateToken, (req: any, res) => {
  const { items, totalPrice } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const db = readDB();
  const newOrder: Order = {
    id: 'ord_' + Math.random().toString(36).substr(2, 9),
    userId: req.user.id,
    username: "", // To be specified by user during payment screenshot submission
    userEmail: req.user.email,
    items: items.map((it: any, index: number) => ({
      id: `oi_${index}_` + Math.random().toString(36).substr(2, 5),
      productId: it.product.id,
      name: it.product.name,
      category: it.product.category,
      price: it.product.price,
      quantity: it.quantity
    })),
    totalPrice: totalPrice,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  writeDB(db);

  res.status(201).json(newOrder);
});

// Submit payment screenshot & Minecraft ID
app.post('/api/orders/:id/submit-payment', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { minecraftUsername, screenshotBase64, paymentNotes } = req.body;

  if (!minecraftUsername || !screenshotBase64) {
    return res.status(400).json({ error: "Minecraft username and payment screenshot are required." });
  }

  const db = readDB();
  const orderIndex = db.orders.findIndex(o => o.id === id && o.userId === req.user.id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = db.orders[orderIndex];
  order.username = minecraftUsername.trim();
  order.screenshotUrl = screenshotBase64; // base64 payload stored securely
  order.paymentNotes = paymentNotes || "";
  order.status = 'submitted';
  order.updatedAt = new Date().toISOString();

  // Create real-time notification for admin dashboard info if needed, or user notifications
  db.notifications.push({
    id: 'notif_' + Math.random().toString(36).substr(2, 9),
    userId: req.user.id,
    message: `Your payment for Order ${order.id} is submitted! Administrative review is in progress.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  res.json({ message: "Payment proof submitted successfully! Review pending.", order });
});

// Get user notifications
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  const db = readDB();
  const userNotifs = db.notifications.filter(n => n.userId === req.user.id);
  res.json(userNotifs.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
});

// Read notifications
app.post('/api/notifications/:id/read', authenticateToken, (req: any, res) => {
  const db = readDB();
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (notif) {
    notif.read = true;
    writeDB(db);
  }
  res.json({ success: true });
});

// ---------------------------------------------------------
// SUPER ADMIN INTERFACES (Admin Access Only)
// ---------------------------------------------------------

// Read users list
app.get('/api/admin/users', adminOnly, (req, res) => {
  const db = readDB();
  const cleanUsers = db.users.map(({ passwordHash, ...u }: any) => u);
  res.json(cleanUsers);
});

// Toggle Ban User / Reset Password / Add wallet coins
app.put('/api/admin/users/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const { isBanned, coins, resetPassword } = req.body;

  const db = readDB();
  const user = db.users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (typeof isBanned === 'boolean') {
    user.isBanned = isBanned;
  }
  if (typeof coins === 'number') {
    user.coins = coins;
  }
  if (resetPassword) {
    (user as any).passwordHash = hashPassword(resetPassword);
  }

  writeDB(db);
  const { passwordHash, ...cleanUser } = user as any;
  res.json({ message: "User status updated successfully", user: cleanUser });
});

// Manage Settings
app.post('/api/admin/settings', adminOnly, (req, res) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDB(db);
  res.json({ message: "Settings saved successfully", settings: db.settings });
});

// Admin Product CRUD (Ranks, Keys, Coins)
app.get('/api/admin/products', adminOnly, (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Create product
app.post('/api/admin/products', adminOnly, (req, res) => {
  const { category, name, description, price, imageUrl, enabled } = req.body;
  if (!category || !name || !description || price === undefined) {
    return res.status(400).json({ error: "Incomplete product parameters" });
  }

  const db = readDB();
  const newProduct: Product = {
    id: `prod_${category}_` + Math.random().toString(36).substr(2, 9),
    category,
    name,
    description,
    price: Number(price),
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
    enabled: enabled !== false
  };

  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

// Update product
app.put('/api/admin/products/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const prodIndex = db.products.findIndex(p => p.id === id);

  if (prodIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.products[prodIndex] = {
    ...db.products[prodIndex],
    ...req.body
  };

  writeDB(db);
  res.json(db.products[prodIndex]);
});

// Delete product
app.delete('/api/admin/products/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const filtered = db.products.filter(p => p.id !== id);
  if (filtered.length === db.products.length) {
    return res.status(404).json({ error: "Product not found" });
  }
  db.products = filtered;
  writeDB(db);
  res.json({ success: true, message: "Product deleted successfully" });
});

// View all orders
app.get('/api/admin/orders', adminOnly, (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// Approve / Reject order
app.post('/api/admin/orders/:id/review', adminOnly, (req, res) => {
  const { id } = req.params;
  const { action, feedback } = req.body; // action: 'approve' or 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: "Action must be approve or reject" });
  }

  const db = readDB();
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = action === 'approve' ? 'approved' : 'rejected';
  order.paymentNotes = feedback || "";
  order.updatedAt = new Date().toISOString();

  // Send feedback notification to user
  db.notifications.push({
    id: 'notif_' + Math.random().toString(36).substr(2, 9),
    userId: order.userId,
    message: `Your payment for Order ${order.id} was ${order.status.toUpperCase()} by administration. Notes: ${feedback || 'None'}`,
    read: false,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  res.json({ message: `Order status changed to ${order.status}`, order });
});

// Mark order Complete & Deliver server rank, coin, keys
app.post('/api/admin/orders/:id/complete', adminOnly, (req, res) => {
  const { id } = req.params;
  const { deliveryNotes } = req.body;

  const db = readDB();
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.status !== 'approved' && order.status !== 'submitted') {
    return res.status(400).json({ error: "Order must be Approved/Submitted before completion" });
  }

  order.status = 'completed';
  order.deliveryNotes = deliveryNotes || "Items auto-delivered by Super Admin console.";
  order.updatedAt = new Date().toISOString();

  // Update Server Stats
  db.stats.ordersCompleted += 1;
  db.stats.totalPurchases += order.totalPrice;

  // DELIVER GOODS to the purchasing User profile
  const orderUser = db.users.find(u => u.id === order.userId);
  if (orderUser) {
    order.items.forEach(item => {
      if (item.category === 'ranks') {
        if (!orderUser.purchasedRanks.includes(item.name)) {
          orderUser.purchasedRanks.push(item.name);
        }
      } else if (item.category === 'keys') {
        for (let i = 0; i < item.quantity; i++) {
          orderUser.purchasedKeys.push(item.name);
        }
      } else if (item.category === 'coins') {
        // Extract value from coin package names (e.g., "500 Coins Package" -> 500)
        const numericCoins = parseInt(item.name) || 0;
        orderUser.coins += (numericCoins * item.quantity);
      }
    });
  }

  // Create Success Notification
  db.notifications.push({
    id: 'notif_' + Math.random().toString(36).substr(2, 9),
    userId: order.userId,
    message: `🎉 Order Completed! Your Minecraft rank, coins, or crate keys have been dispatched to ${order.username}. Delivery Notes: ${deliveryNotes || 'None'}`,
    read: false,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  res.json({ message: "Order completed. Deliverables successfully dispatched to user.", order });
});

// ---------------------------------------------------------
// VITE DEV / PRODUCTION INTEGRATION
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MineRift Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
