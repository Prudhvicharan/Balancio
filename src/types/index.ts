export type PaymentMethod = 'cash' | 'venmo' | 'bank' | 'amex' | 'zelle' | 'paypal' | 'other';

export type TransactionType = 'lent' | 'received';

export interface Friend {
  id: string;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  friendId: string;
  type: TransactionType;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
  createdAt: string;
}

export interface FriendWithStats extends Friend {
  totalLent: number;
  totalReceived: number;
  balance: number;
  transactions: Transaction[];
  lastActivity?: string;
}

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface DashboardStats {
  totalLent: number;
  totalReceived: number;
  totalOutstanding: number;
  friendCount: number;
  activeDebtors: number;
}
