import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product, Category, Warehouse, Supplier, Client, StockMovement } from '@/types/warehouse';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WarehouseContextType {
  products: Product[];
  categories: Category[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  clients: Client[];
  movements: StockMovement[];
  loading: boolean;
  addProduct: (p: Omit<Product, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<boolean>;
  addCategory: (c: Omit<Category, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;
  addWarehouse: (w: Omit<Warehouse, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  updateWarehouse: (w: Warehouse) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<boolean>;
  addSupplier: (s: Omit<Supplier, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  updateSupplier: (s: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<boolean>;
  addClient: (c: Omit<Client, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  updateClient: (c: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<boolean>;
  addMovement: (m: Omit<StockMovement, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  updateMovement: (m: StockMovement) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  getCategoryName: (id: string) => string;
  getWarehouseName: (id: string) => string;
  getSupplierName: (id: string) => string;
  getClientName: (id: string) => string;
  getProductName: (id: string) => string;
  getUserName: (id: string | null) => string;
  isLinkedToMovement: (type: 'product' | 'category' | 'warehouse' | 'supplier' | 'client', id: string) => boolean;
  refreshAll: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [catRes, whRes, supRes, clRes, prodRes, movRes, profRes] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('warehouses').select('*'),
      supabase.from('suppliers').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('products').select('*'),
      supabase.from('stock_movements').select('*'),
      supabase.from('profiles').select('user_id, display_name'),
    ]);
    if (catRes.data) setCategories(catRes.data as any);
    if (whRes.data) setWarehouses(whRes.data as any);
    if (supRes.data) setSuppliers(supRes.data as any);
    if (clRes.data) setClients(clRes.data as any);
    if (prodRes.data) setProducts(prodRes.data as any);
    if (movRes.data) setMovements(movRes.data as any);
    if (profRes.data) {
      const map: Record<string, string> = {};
      profRes.data.forEach((p: any) => { map[p.user_id] = p.display_name; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('warehouse-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => { supabase.from('categories').select('*').then(r => { if (r.data) setCategories(r.data as any); }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouses' }, () => { supabase.from('warehouses').select('*').then(r => { if (r.data) setWarehouses(r.data as any); }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => { supabase.from('suppliers').select('*').then(r => { if (r.data) setSuppliers(r.data as any); }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => { supabase.from('clients').select('*').then(r => { if (r.data) setClients(r.data as any); }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { supabase.from('products').select('*').then(r => { if (r.data) setProducts(r.data as any); }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => { supabase.from('stock_movements').select('*').then(r => { if (r.data) setMovements(r.data as any); }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const showError = (msg: string) => toast({ title: 'خطأ', description: msg, variant: 'destructive' });

  // ---- Products ----
  const addProduct = useCallback(async (p: Omit<Product, 'id' | 'created_at' | 'created_by'>) => {
    const { error } = await supabase.from('products').insert({ ...p, created_by: user?.id });
    if (error) showError(error.message);
  }, [user]);

  const updateProduct = useCallback(async (p: Product) => {
    const { error } = await supabase.from('products').update({
      name: p.name, code: p.code, barcode: p.barcode, category_id: p.category_id,
      quantity: p.quantity, warehouse_id: p.warehouse_id, description: p.description, image: p.image
    }).eq('id', p.id);
    if (error) showError(error.message);
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    if (movements.some(m => m.product_id === id)) return false;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showError(error.message); return false; }
    return true;
  }, [movements]);

  // ---- Categories ----
  const addCategory = useCallback(async (c: Omit<Category, 'id' | 'created_at' | 'created_by'>) => {
    const { error } = await supabase.from('categories').insert({ ...c, created_by: user?.id });
    if (error) showError(error.message);
  }, [user]);

  const updateCategory = useCallback(async (c: Category) => {
    const { error } = await supabase.from('categories').update({ name: c.name, description: c.description }).eq('id', c.id);
    if (error) showError(error.message);
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    if (products.some(p => p.category_id === id)) return false;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { showError(error.message); return false; }
    return true;
  }, [products]);

  // ---- Warehouses ----
  const addWarehouse = useCallback(async (w: Omit<Warehouse, 'id' | 'created_at' | 'created_by'>) => {
    const { error } = await supabase.from('warehouses').insert({ ...w, created_by: user?.id });
    if (error) showError(error.message);
  }, [user]);

  const updateWarehouse = useCallback(async (w: Warehouse) => {
    const { error } = await supabase.from('warehouses').update({ name: w.name, location: w.location, manager: w.manager, notes: w.notes }).eq('id', w.id);
    if (error) showError(error.message);
  }, []);

  const deleteWarehouse = useCallback(async (id: string): Promise<boolean> => {
    if (movements.some(m => m.warehouse_id === id) || products.some(p => p.warehouse_id === id)) return false;
    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) { showError(error.message); return false; }
    return true;
  }, [movements, products]);

  // ---- Suppliers ----
  const addSupplier = useCallback(async (s: Omit<Supplier, 'id' | 'created_at' | 'created_by'>) => {
    const { error } = await supabase.from('suppliers').insert({ ...s, created_by: user?.id });
    if (error) showError(error.message);
  }, [user]);

  const updateSupplier = useCallback(async (s: Supplier) => {
    const { error } = await supabase.from('suppliers').update({ name: s.name, phone: s.phone, email: s.email, address: s.address, notes: s.notes }).eq('id', s.id);
    if (error) showError(error.message);
  }, []);

  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    if (movements.some(m => m.entity_type === 'supplier' && m.entity_id === id)) return false;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) { showError(error.message); return false; }
    return true;
  }, [movements]);

  // ---- Clients ----
  const addClient = useCallback(async (c: Omit<Client, 'id' | 'created_at' | 'created_by'>) => {
    const { error } = await supabase.from('clients').insert({ ...c, created_by: user?.id });
    if (error) showError(error.message);
  }, [user]);

  const updateClient = useCallback(async (c: Client) => {
    const { error } = await supabase.from('clients').update({ name: c.name, phone: c.phone, address: c.address, notes: c.notes }).eq('id', c.id);
    if (error) showError(error.message);
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    if (movements.some(m => m.entity_type === 'client' && m.entity_id === id)) return false;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { showError(error.message); return false; }
    return true;
  }, [movements]);

  // ---- Movements ----
  const addMovement = useCallback(async (m: Omit<StockMovement, 'id' | 'created_at' | 'created_by'>) => {
    const { error } = await supabase.from('stock_movements').insert({ ...m, created_by: user?.id });
    if (error) { showError(error.message); return; }
    // Update product quantity
    const product = products.find(p => p.id === m.product_id);
    if (product) {
      const newQty = m.type === 'in' ? product.quantity + m.quantity : product.quantity - m.quantity;
      await supabase.from('products').update({ quantity: newQty }).eq('id', m.product_id);
    }
  }, [user, products]);

  const updateMovement = useCallback(async (m: StockMovement) => {
    const old = movements.find(x => x.id === m.id);
    if (old) {
      const product = products.find(p => p.id === old.product_id);
      if (product) {
        // Reverse old movement
        let qty = old.type === 'in' ? product.quantity - old.quantity : product.quantity + old.quantity;
        // Apply new movement
        qty = m.type === 'in' ? qty + m.quantity : qty - m.quantity;
        await supabase.from('products').update({ quantity: qty }).eq('id', m.product_id);
      }
    }
    const { error } = await supabase.from('stock_movements').update({
      product_id: m.product_id, warehouse_id: m.warehouse_id, type: m.type,
      quantity: m.quantity, entity_id: m.entity_id, entity_type: m.entity_type,
      date: m.date, notes: m.notes, unit: m.unit || 'قطعة'
    }).eq('id', m.id);
    if (error) showError(error.message);
  }, [movements, products]);

  const deleteMovement = useCallback(async (id: string) => {
    const m = movements.find(x => x.id === id);
    if (m) {
      const product = products.find(p => p.id === m.product_id);
      if (product) {
        const newQty = m.type === 'in' ? product.quantity - m.quantity : product.quantity + m.quantity;
        await supabase.from('products').update({ quantity: newQty }).eq('id', m.product_id);
      }
    }
    const { error } = await supabase.from('stock_movements').delete().eq('id', id);
    if (error) showError(error.message);
  }, [movements, products]);

  // ---- Helpers ----
  const getCategoryName = useCallback((id: string) => categories.find(c => c.id === id)?.name || '-', [categories]);
  const getWarehouseName = useCallback((id: string) => warehouses.find(w => w.id === id)?.name || '-', [warehouses]);
  const getSupplierName = useCallback((id: string) => suppliers.find(s => s.id === id)?.name || '-', [suppliers]);
  const getClientName = useCallback((id: string) => clients.find(c => c.id === id)?.name || '-', [clients]);
  const getProductName = useCallback((id: string) => products.find(p => p.id === id)?.name || '-', [products]);
  const getUserName = useCallback((id: string | null) => {
    if (!id) return '-';
    return profiles[id] || '-';
  }, [profiles]);

  const isLinkedToMovement = useCallback((type: 'product' | 'category' | 'warehouse' | 'supplier' | 'client', id: string): boolean => {
    switch (type) {
      case 'product': return movements.some(m => m.product_id === id);
      case 'warehouse': return movements.some(m => m.warehouse_id === id);
      case 'supplier': return movements.some(m => m.entity_type === 'supplier' && m.entity_id === id);
      case 'client': return movements.some(m => m.entity_type === 'client' && m.entity_id === id);
      case 'category': return products.some(p => p.category_id === id && movements.some(m => m.product_id === p.id));
      default: return false;
    }
  }, [movements, products]);

  return (
    <WarehouseContext.Provider value={{
      products, categories, warehouses, suppliers, clients, movements, loading,
      addProduct, updateProduct, deleteProduct,
      addCategory, updateCategory, deleteCategory,
      addWarehouse, updateWarehouse, deleteWarehouse,
      addSupplier, updateSupplier, deleteSupplier,
      addClient, updateClient, deleteClient,
      addMovement, updateMovement, deleteMovement,
      getCategoryName, getWarehouseName, getSupplierName, getClientName, getProductName, getUserName,
      isLinkedToMovement, refreshAll: fetchAll,
    }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
};
