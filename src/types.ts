export interface User {
  id: string;
  username: string;
  email: string;
  coins: number;
  purchasedRanks: string[];
  purchasedKeys: string[];
  isBanned: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  category: 'ranks' | 'keys' | 'coins';
  name: string;
  description: string;
  price: number; // Price in INR (₹)
  imageUrl: string;
  enabled: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  category: 'ranks' | 'keys' | 'coins';
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  username: string; // Minecraft Username
  userEmail: string; // Registered email of user
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed';
  screenshotUrl?: string;
  paymentNotes?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SocialLinks {
  twitter: string;
  youtube: string;
  discord: string;
}

export interface WebsiteSettings {
  websiteName: string;
  logo: string;
  serverIP: string;
  port: number;
  discordLink: string;
  storeBanner: string;
  homepageContent: {
    heroTitle: string;
    heroSubtitle: string;
    featuresTitle: string;
    featuresSubtitle: string;
  };
  maintenanceMode: boolean;
  maintenanceMessage: string;
  countdownTimer: string; // Date string or empty
  primaryColor: string; // e.g., purple hex or tailwind class
  secondaryColor: string; // e.g., cyan hex or tailwind class
  footerContent: string;
  socialLinks: SocialLinks;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ServerStats {
  registeredUsers: number;
  ordersCompleted: number;
  onlinePlayers: number;
  totalPurchases: number;
}
