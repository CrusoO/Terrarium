import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import initialItems from '../data/initialItems';

const useInventoryStore = create(
  persist(
    (set, get) => ({
      items: initialItems,
      searchQuery: '',
      filterCategory: 'All',
      filterLowStock: false,
      selectedItemId: null,
      view: 'dashboard', // 'dashboard' | 'inventory' | 'detail'

      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterCategory: (c) => set({ filterCategory: c }),
      setFilterLowStock: (v) => set({ filterLowStock: v }),
      setSelectedItemId: (id) => set({ selectedItemId: id }),
      setView: (v) => set({ view: v }),

      openDetail: (id) => set({ selectedItemId: id, view: 'detail' }),
      goBack: () => set({ view: 'inventory', selectedItemId: null }),

      addItem: (item) =>
        set((state) => ({ items: [item, ...state.items] })),

      updateQuantity: (id, delta, reason) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const newQty = Math.max(0, item.quantity + delta);
            return {
              ...item,
              quantity: newQty,
              lastUpdated: new Date().toISOString().split('T')[0],
              history: [
                {
                  date: new Date().toISOString().split('T')[0],
                  change: delta,
                  reason: reason || (delta > 0 ? 'Restock' : 'Adjustment'),
                  user: 'Staff',
                },
                ...(item.history || []),
              ],
            };
          }),
        })),

      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          selectedItemId: null,
          view: 'inventory',
        })),

      getFilteredItems: () => {
        const { items, searchQuery, filterCategory, filterLowStock } = get();
        return items.filter((item) => {
          const q = searchQuery.toLowerCase();
          const matchSearch =
            !q ||
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q);
          const matchCategory =
            filterCategory === 'All' || item.category === filterCategory;
          const matchLow = !filterLowStock || item.quantity <= item.minStock;
          return matchSearch && matchCategory && matchLow;
        });
      },

      getStats: () => {
        const { items } = get();
        const totalItems = items.length;
        const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
        const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);
        const lowStock = items.filter((i) => i.quantity <= i.minStock && i.quantity > 0).length;
        const outOfStock = items.filter((i) => i.quantity === 0).length;
        return { totalItems, totalUnits, totalValue, lowStock, outOfStock };
      },

      getCategories: () => {
        const { items } = get();
        const cats = [...new Set(items.map((i) => i.category))].sort();
        return ['All', ...cats];
      },
    }),
    {
      name: 'inventory-store',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useInventoryStore;
