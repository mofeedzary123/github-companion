export type WeaponStatus = 'موجود بالمخزن' | 'مُصرف' | 'تحت الصيانة' | 'تالف' | 'مفقود' | 'جاهز';

export type MovementOperation = 'وارد' | 'صادر' | 'تحويل' | 'إرجاع';

export interface Weapon {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  status: WeaponStatus;
  warehouseId: string;
  quantity: number;
  notes?: string;
}

export interface Ammo {
  id: string;
  type: string;
  caliber: string;
  boxCount: number;
  roundsPerBox: number;
  totalRounds: number;
  warehouseId: string;
  notes?: string;
}

export interface ArmoryWarehouse {
  id: string;
  name: string;
  location?: string;
  notes?: string;
}

export interface Recipient {
  id: string;
  name: string;
  militaryId: string;
  unit: string;
  rank?: string;
  phone?: string;
  weaponName?: string;
  weaponSerial?: string;
  weaponType?: string;
  notes?: string;
}

export interface ArmoryMovement {
  id: string;
  operation: MovementOperation;
  itemType: 'سلاح' | 'ذخيرة';
  itemId: string;
  quantity: number;
  date: string;
  recipientId?: string;
  supplierId?: string;
  warehouseId: string;
  documentNumber?: string;
  reason?: string;
  notes?: string;
  sourceName?: string;
  weaponName?: string;
  weaponSerial?: string;
  weaponType?: string;
}
