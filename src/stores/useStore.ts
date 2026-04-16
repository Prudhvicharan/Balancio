import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Friend, Transaction } from '@/types';
import { generateId, getTodayISO } from '@/lib/utils';

export interface BackupData {
  version: number;
  exportedAt: string;
  friends: Friend[];
  transactions: Transaction[];
}

interface StoreState {
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

  // Backup / sync
  exportData: () => BackupData;
  importData: (data: BackupData, mode: 'replace' | 'merge') => void;
  replaceAll: (friends: Friend[], transactions: Transaction[]) => void;
  clearAll: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
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

      exportData: () => ({
        version: 1,
        exportedAt: new Date().toISOString(),
        friends: get().friends,
        transactions: get().transactions,
      }),

      importData: (data, mode) => {
        if (mode === 'replace') {
          set({ friends: data.friends, transactions: data.transactions });
        } else {
          // Merge: add records not already present (by ID)
          set((state) => {
            const existingFriendIds = new Set(state.friends.map((f) => f.id));
            const existingTxnIds = new Set(state.transactions.map((t) => t.id));
            return {
              friends: [
                ...state.friends,
                ...data.friends.filter((f) => !existingFriendIds.has(f.id)),
              ],
              transactions: [
                ...state.transactions,
                ...data.transactions.filter((t) => !existingTxnIds.has(t.id)),
              ],
            };
          });
        }
      },

      replaceAll: (friends, transactions) => {
        set({ friends, transactions });
      },

      clearAll: () => {
        set({ friends: [], transactions: [] });
      },
    }),
    {
      name: 'balancio-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

