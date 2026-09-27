import { create } from 'zustand';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom storage using IndexedDB for larger dataset support
// Fallback for non-browser environments (Node.js test environments)
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof indexedDB === 'undefined') return null;
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof indexedDB === 'undefined') return;
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof indexedDB === 'undefined') return;
    await del(name);
  },
};

export interface Brand {
  id: string;
  name: string;
  category: string;
  bottleSize: string;
  defaultPrice: number;
  brandCode?: string;
  manufacturer?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyInventory {
  date: string; // YYYY-MM-DD
  brandId: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  presentStock: number;
}

export interface StockInTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  brandId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface StockOutTransaction {
  id: string;
  date: string;
  time: string;
  brandId: string;
  quantity: number;
  priceAtSale: number;
  notes?: string;
}

export interface Settings {
  shopName: string;
  shopAddress: string;
  currency: string;
  lowStockThreshold: number;
  dateFormat: string;
}

interface AppState {
  brands: Brand[];
  dailyInventory: DailyInventory[];
  stockInTransactions: StockInTransaction[];
  stockOutTransactions: StockOutTransaction[];
  settings: Settings;
  currentDate: string; // YYYY-MM-DD

  // Actions
  addBrand: (brand: Brand) => void;
  updateBrand: (id: string, brand: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;

  addStockIn: (transaction: StockInTransaction) => void;
  addStockOut: (transaction: StockOutTransaction) => void;

  startNewDay: (newDate: string) => void;

  updateSettings: (settings: Partial<Settings>) => void;
  clearData: () => void;
  importData: (data: Partial<AppState>) => void;
}

const initialState = {
  brands: [],
  dailyInventory: [],
  stockInTransactions: [],
  stockOutTransactions: [],
  currentDate: new Date().toISOString().split('T')[0],
  settings: {
    shopName: 'Wine & Liquor Shop',
    shopAddress: '',
    currency: '₹',
    lowStockThreshold: 10,
    dateFormat: 'DD MMM YYYY'
  }
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),

      updateBrand: (id, updatedFields) => set((state) => ({
        brands: state.brands.map((b) => b.id === id ? { ...b, ...updatedFields, updatedAt: new Date().toISOString() } : b)
      })),

      deleteBrand: (id) => set((state) => ({
        brands: state.brands.filter((b) => b.id !== id)
      })),

      addStockIn: (transaction) => set((state) => {
        const { currentDate, dailyInventory } = state;
        let inventoryIndex = dailyInventory.findIndex(inv => inv.date === currentDate && inv.brandId === transaction.brandId);

        const newInventory = [...dailyInventory];

        if (inventoryIndex === -1) {
          // Find previous day's present stock if any
          const previousInv = [...dailyInventory]
            .filter(inv => inv.brandId === transaction.brandId && inv.date < currentDate)
            .sort((a, b) => b.date.localeCompare(a.date))[0];

          const openingStock = previousInv ? previousInv.presentStock : 0;

          newInventory.push({
            date: currentDate,
            brandId: transaction.brandId,
            openingStock,
            stockIn: transaction.quantity,
            stockOut: 0,
            presentStock: openingStock + transaction.quantity
          });
        } else {
          const inv = { ...newInventory[inventoryIndex] };
          inv.stockIn += transaction.quantity;
          inv.presentStock = inv.openingStock + inv.stockIn - inv.stockOut;
          newInventory[inventoryIndex] = inv;
        }

        return {
          stockInTransactions: [...state.stockInTransactions, transaction],
          dailyInventory: newInventory
        };
      }),

      addStockOut: (transaction) => set((state) => {
        const { currentDate, dailyInventory } = state;
        let inventoryIndex = dailyInventory.findIndex(inv => inv.date === currentDate && inv.brandId === transaction.brandId);

        const newInventory = [...dailyInventory];

        if (inventoryIndex === -1) {
          const previousInv = [...dailyInventory]
            .filter(inv => inv.brandId === transaction.brandId && inv.date < currentDate)
            .sort((a, b) => b.date.localeCompare(a.date))[0];

          const openingStock = previousInv ? previousInv.presentStock : 0;

          if (openingStock < transaction.quantity) {
             throw new Error('Insufficient stock.');
          }

          newInventory.push({
            date: currentDate,
            brandId: transaction.brandId,
            openingStock,
            stockIn: 0,
            stockOut: transaction.quantity,
            presentStock: openingStock - transaction.quantity
          });
        } else {
          const inv = { ...newInventory[inventoryIndex] };
          if (inv.presentStock < transaction.quantity) {
             throw new Error('Insufficient stock.');
          }
          inv.stockOut += transaction.quantity;
          inv.presentStock = inv.openingStock + inv.stockIn - inv.stockOut;
          newInventory[inventoryIndex] = inv;
        }

        return {
          stockOutTransactions: [...state.stockOutTransactions, transaction],
          dailyInventory: newInventory
        };
      }),

      startNewDay: (newDate) => set((state) => {
        const { currentDate, dailyInventory, brands } = state;
        if (newDate <= currentDate) return {}; // Prevent moving backwards or same day

        const newDailyInventory = [...dailyInventory];

        brands.filter(b => b.active).forEach(brand => {
          // Get the most recent inventory for this brand up to current date
          const lastInv = [...dailyInventory]
            .filter(inv => inv.brandId === brand.id && inv.date <= currentDate)
            .sort((a, b) => b.date.localeCompare(a.date))[0];

          const openingStock = lastInv ? lastInv.presentStock : 0;

          newDailyInventory.push({
            date: newDate,
            brandId: brand.id,
            openingStock,
            stockIn: 0,
            stockOut: 0,
            presentStock: openingStock
          });
        });

        return {
          currentDate: newDate,
          dailyInventory: newDailyInventory
        };
      }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      clearData: () => set(initialState),

      importData: (data) => set((state) => ({
        ...state,
        ...data
      }))
    }),
    {
      name: 'wine-shop-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
