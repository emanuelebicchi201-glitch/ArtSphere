
import { User, Artwork, Category, UserRole, ArtworkStatus, Order } from './types';

const INITIAL_ARTISTS: User[] = [
  {
    id: 'a1',
    name: 'Elena Vance',
    email: 'elena@art.com',
    role: UserRole.ARTIST,
    bio: 'Contemporary abstract painter exploring the intersection of light and emotion.',
    avatar: 'https://picsum.photos/seed/elena/200',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'a2',
    name: 'Julian Thorne',
    email: 'julian@art.com',
    role: UserRole.ARTIST,
    bio: 'Sculptor specializing in sustainable materials and organic forms.',
    avatar: 'https://picsum.photos/seed/julian/200',
    joinedAt: new Date().toISOString()
  }
];

const INITIAL_ARTWORKS: Artwork[] = [
  {
    id: 'w1',
    artistId: 'a1',
    artistName: 'Elena Vance',
    title: 'Ethereal Dawn',
    description: 'A study of morning light using heavy impasto techniques.',
    category: Category.PAINTINGS,
    tags: ['abstract', 'light', 'impasto'],
    price: 1200,
    imageUrl: 'https://picsum.photos/seed/ethereal/800/1000',
    status: ArtworkStatus.AVAILABLE,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w2',
    artistId: 'a1',
    artistName: 'Elena Vance',
    title: 'Midnight Echo',
    description: 'Deep blues and charcoal textures exploring silence.',
    category: Category.PAINTINGS,
    tags: ['blue', 'moody', 'modern'],
    price: 950,
    imageUrl: 'https://picsum.photos/seed/midnight/800/1000',
    status: ArtworkStatus.AVAILABLE,
    createdAt: new Date().toISOString()
  }
];

// Initialize database with defaults if empty
const initializeStorage = () => {
  if (!localStorage.getItem('as_users')) {
    localStorage.setItem('as_users', JSON.stringify(INITIAL_ARTISTS));
  }
  if (!localStorage.getItem('as_artworks')) {
    localStorage.setItem('as_artworks', JSON.stringify(INITIAL_ARTWORKS));
  }
  if (!localStorage.getItem('as_orders')) {
    localStorage.setItem('as_orders', JSON.stringify([]));
  }
};

initializeStorage();

export const getStore = () => {
  try {
    const users = JSON.parse(localStorage.getItem('as_users') || '[]');
    const artworks = JSON.parse(localStorage.getItem('as_artworks') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('as_current_user') || 'null');
    const orders = JSON.parse(localStorage.getItem('as_orders') || '[]');
    return { users, artworks, currentUser, orders };
  } catch (e) {
    console.error("Database read error:", e);
    return { users: [], artworks: [], currentUser: null, orders: [] };
  }
};

export const saveArtworks = (artworks: Artwork[]) => {
  try {
    localStorage.setItem('as_artworks', JSON.stringify(artworks));
    return true;
  } catch (e) {
    console.error("Storage limit exceeded:", e);
    const msg = "Storage Limit Reached: The browser database is full. \n\nTo continue publishing, please delete some older artworks from your portfolio to free up space.";
    alert(msg);
    return false;
  }
};

export const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem('as_users', JSON.stringify(users));
  } catch (e) {
    console.error("User storage error:", e);
  }
};

export const saveOrders = (orders: Order[]) => {
  try {
    localStorage.setItem('as_orders', JSON.stringify(orders));
  } catch (e) {
    console.error("Order storage error:", e);
  }
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('as_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('as_current_user');
  }
};
