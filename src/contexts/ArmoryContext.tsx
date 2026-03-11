import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Weapon, Ammo, ArmoryWarehouse, Recipient, ArmoryMovement } from '@/types/armory';
import { useToast } from '@/hooks/use-toast';

interface ArmoryContextType {
  weapons: Weapon[];
  ammo: Ammo[];
  warehouses: ArmoryWarehouse[];
  recipients: Recipient[];
  movements: ArmoryMovement[];
  addWeapon: (item: any) => void;
  updateWeapon: (item: Weapon) => void;
  deleteWeapon: (id: string) => void;
  addAmmo: (item: any) => void;
  updateAmmo: (item: Ammo) => void;
  deleteAmmo: (id: string) => void;
  addWarehouse: (item: any) => void;
  updateWarehouse: (item: ArmoryWarehouse) => void;
  deleteWarehouse: (id: string) => boolean;
  addRecipient: (item: any) => void;
  updateRecipient: (item: Recipient) => void;
  deleteRecipient: (id: string) => void;
  addMovement: (move: any) => void;
  deleteMovement: (id: string) => void;
  getItemName: (type: 'سلاح' | 'ذخيرة', id: string) => string;
  getWarehouseName: (id: string) => string;
  getRecipientName: (id: string) => string;
}

const ArmoryContext = createContext<ArmoryContextType | undefined>(undefined);

export const ArmoryProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  // تحميل البيانات من LocalStorage عند بدء التشغيل
  const loadData = (key: string) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  };

  const [weapons, setWeapons] = useState<Weapon[]>(() => loadData('armory_weapons'));
  const [ammo, setAmmo] = useState<Ammo[]>(() => loadData('armory_ammo'));
  const [warehouses, setWarehouses] = useState<ArmoryWarehouse[]>(() => loadData('armory_warehouses'));
  const [recipients, setRecipients] = useState<Recipient[]>(() => loadData('armory_recipients'));
  const [movements, setMovements] = useState<ArmoryMovement[]>(() => loadData('armory_movements'));

  // حفظ البيانات تلقائياً عند أي تغيير
  useEffect(() => {
    localStorage.setItem('armory_weapons', JSON.stringify(weapons));
    localStorage.setItem('armory_ammo', JSON.stringify(ammo));
    localStorage.setItem('armory_warehouses', JSON.stringify(warehouses));
    localStorage.setItem('armory_recipients', JSON.stringify(recipients));
    localStorage.setItem('armory_movements', JSON.stringify(movements));
  }, [weapons, ammo, warehouses, recipients, movements]);

  // --- إدارة الأسلحة ---
  const addWeapon = (item: any) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setWeapons([...weapons, newItem]);
    toast({ title: "تم الإضافة", description: "تم تسجيل السلاح في العهدة بنجاح" });
  };

  const updateWeapon = (updated: Weapon) => {
    setWeapons(weapons.map(w => w.id === updated.id ? updated : w));
  };

  const deleteWeapon = (id: string) => {
    setWeapons(weapons.filter(w => w.id !== id));
    toast({ title: "تم الحذف", description: "تم حذف السلاح من السجلات" });
  };

  // --- إدارة الذخيرة ---
  const addAmmo = (item: any) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setAmmo([...ammo, newItem]);
    toast({ title: "تم الإضافة", description: "تم تسجيل كمية الذخيرة" });
  };

  const updateAmmo = (updated: Ammo) => {
    setAmmo(ammo.map(a => a.id === updated.id ? updated : a));
  };

  const deleteAmmo = (id: string) => {
    setAmmo(ammo.filter(a => a.id !== id));
  };

  // --- إدارة المخازن ---
  const addWarehouse = (item: any) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setWarehouses([...warehouses, newItem]);
  };

  const updateWarehouse = (updated: ArmoryWarehouse) => {
    setWarehouses(warehouses.map(w => w.id === updated.id ? updated : w));
  };

  const deleteWarehouse = (id: string) => {
    const isUsed = weapons.some(w => w.warehouseId === id) || ammo.some(a => a.warehouseId === id);
    if (isUsed) return false;
    setWarehouses(warehouses.filter(w => w.id !== id));
    return true;
  };

  // --- إدارة المستلمين ---
  const addRecipient = (item: any) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setRecipients([...recipients, newItem]);
  };

  const updateRecipient = (updated: Recipient) => {
    setRecipients(recipients.map(r => r.id === updated.id ? updated : r));
  };

  const deleteRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
  };

  // --- إدارة الحركات وتحديث الكميات تلقائياً ---
  const addMovement = (move: any) => {
    const newMove = { ...move, id: Math.random().toString(36).substr(2, 9) };
    setMovements([newMove, ...movements]);

    // تحديث كمية السلاح أو الذخيرة تلقائياً
    if (move.itemType === 'سلاح') {
      setWeapons(prev => prev.map(w => {
        if (w.id === move.itemId) {
          const newQty = move.operation === 'وارد' ? w.quantity + move.quantity : w.quantity - move.quantity;
          return { ...w, quantity: Math.max(0, newQty) };
        }
        return w;
      }));
    } else {
      setAmmo(prev => prev.map(a => {
        if (a.id === move.itemId) {
          const newQty = move.operation === 'وارد' ? a.totalRounds + move.quantity : a.totalRounds - move.quantity;
          return { ...a, totalRounds: Math.max(0, newQty) };
        }
        return a;
      }));
    }

    toast({ title: "تم تسجيل الحركة", description: `تمت عملية ال${move.operation} بنجاح` });
  };

  const deleteMovement = (id: string) => {
    setMovements(movements.filter(m => m.id !== id));
  };

  // --- دوال المساعدة لجلب الأسماء ---
  const getItemName = (type: 'سلاح' | 'ذخيرة', id: string) => {
    if (type === 'سلاح') {
      const w = weapons.find(i => i.id === id);
      return w ? w.name : 'صنف غير معروف';
    }
    const a = ammo.find(i => i.id === id);
    return a ? `${a.type} (${a.caliber})` : 'ذخيرة غير معروفة';
  };

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || 'مخزن غير محدد';
  const getRecipientName = (id: string) => recipients.find(r => r.id === id)?.name || 'غير محدد';

  return (
    <ArmoryContext.Provider value={{
      weapons, ammo, warehouses, recipients, movements,
      addWeapon, updateWeapon, deleteWeapon,
      addAmmo, updateAmmo, deleteAmmo,
      addWarehouse, updateWarehouse, deleteWarehouse,
      addRecipient, updateRecipient, deleteRecipient,
      addMovement, deleteMovement,
      getItemName, getWarehouseName, getRecipientName
    }}>
      {children}
    </ArmoryContext.Provider>
  );
};

export const useArmory = () => {
  const context = useContext(ArmoryContext);
  if (context === undefined) {
    throw new Error('useArmory must be used within an ArmoryProvider');
  }
  return context;
};

