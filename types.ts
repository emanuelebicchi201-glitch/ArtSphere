
export enum UserRole {
  ARTIST = 'ARTIST',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN'
}

export enum Category {
  PAINTINGS = 'Paintings',
  SCULPTURES = 'Sculptures',
  INDOOR_ART = 'Indoor Art',
  MIXED_MEDIA = 'Other / Mixed Media'
}

export enum ArtworkStatus {
  AVAILABLE = 'Available',
  SOLD = 'Sold',
  RESERVED = 'Reserved'
}

export interface PaymentAccount {
  type: 'PayPal' | 'Revolut';
  identifier: string; // email for paypal, username/tag for revolut
  connectedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  paymentAccount?: PaymentAccount; // Mandatory for Artists
}

export interface Artwork {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  description: string;
  category: Category;
  tags: string[];
  price: number;
  imageUrl: string;
  status: ArtworkStatus;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  artistId: string;
  artworkId: string;
  artworkTitle: string;
  amount: number;
  paymentMethod: 'PayPal' | 'Revolut';
  status: 'Completed' | 'Pending' | 'Canceled';
  createdAt: string;
}
