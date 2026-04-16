import { create } from 'zustand';
import type { Friend, Transaction } from '@/types';
import { generateId, getTodayISO } from '@/lib/utils';

interface StoreState {
  user: { id: string; email: string } | null;
  setUser: (user: { id: string; email: string } | null) => void;

  friends: Friend[];
  transactions: Transaction[];

  // Friend actions
  addFriend: (data: { name: string; notes?: string }) => Friend;
  updateFriend: (id: string, data: Partial<Pick<Friend, 'name' | 'notes'>>) => void;
  deleteFriend: (id: string) => void;

  // Transaction actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'friendId' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;

  replaceAll: (friends: Friend[], transactions: Transaction[]) => void;
  clearAll: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  friends: [],
  transactions: [],

      addFriend: (data) => {
        const now = new Date().toISOString();
        const friend: Friend = {
          id: generateId(),
          name: data.name.trim(),
          notes: data.notes?.trim(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ friends: [...state.friends, friend] }));
        return friend;
      },

      updateFriend: (id, data) => {
        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === id
              ? { ...f, ...data, name: data.name?.trim() ?? f.name, updatedAt: new Date().toISOString() }
              : f
          ),
        }));
      },

      deleteFriend: (id) => {
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== id),
          transactions: state.transactions.filter((t) => t.friendId !== id),
        }));
      },

      addTransaction: (data) => {
        const txn: Transaction = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          date: data.date || getTodayISO(),
        };
        set((state) => ({ transactions: [...state.transactions, txn] }));
        return txn;
      },

      updateTransaction: (id, data) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

  replaceAll: (friends, transactions) => {
    set({ friends, transactions });
  },

  clearAll: () => {
    set({ friends: [], transactions: [], user: null });
  },
}));
