export interface Product {
  id: string;
  name: string;
  code: string;
  barcode: string;
  category_id: string | null;
  quantity: number;
  warehouse_id: string | null;
  description: string;
  image?: string;
  created_by: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_by: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  notes?: string;
  created_by: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  created_by: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  created_by: string | null;
  created_at: string;
}

export type MovementType = 'in' | 'out';

export interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  type: MovementType;
  quantity: number;
  entity_id: string;
  entity_type: 'supplier' | 'client';
  date: string;
  notes?: string;
  unit?: string;
  created_by: string | null;
  created_at: string;
}
