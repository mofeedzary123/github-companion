import { useState } from 'react';
import { useArmory } from '@/contexts/ArmoryContext';
import { Weapon, WeaponStatus } from '@/types/armory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Pencil, Trash2, Printer, Search, Plus, AlertTriangle } from 'lucide-react';
import { printWeaponReport } from '@/utils/armoryPrint';

const statuses: WeaponStatus[] = ['موجود بالمخزن', 'مُصرف', 'تحت الصيانة', 'تالف'];
const statusColors: Record<string, string> = {
  'موجود بالمخزن': 'bg-success/10 text-success',
  'مُصرف': 'bg-warning/10 text-warning',
  'تحت الصيانة': 'bg-primary/10 text-primary',
  'تالف': 'bg-destructive/10 text-destructive',
};

interface Props { search: string; }

const WeaponsTab = ({ search }: Props) => {
  const { weapons, deleteWeapon, addWeapon, updateWeapon, warehouses, getWarehouseName, movements } = useArmory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Weapon | null>(null);
  const [form, setForm] = useState({ name: '', type: '', serialNumber: '', status: 'موجود بالمخزن' as WeaponStatus, warehouseId: '', quantity: 1, notes: '' });

  const filtered = weapons.filter(w =>
    w.name.includes(search) || w.serialNumber.includes(search) || w.type.includes(search)
  );

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', type: '', serialNumber: '', status: 'موجود بالمخزن', warehouseId: warehouses[0]?.id || '', quantity: 1, notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (w: Weapon) => {
    setEditItem(w);
    setForm({ name: w.name, type: w.type, serialNumber: w.serialNumber, status: w.status, warehouseId: w.warehouseId, quantity: w.quantity, notes: w.notes || '' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.serialNumber || !form.warehouseId) return;
    if (editItem) updateWeapon({ ...editItem, ...form });
    else addWeapon(form);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!deleteWeapon(id)) return;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> إدارة الأسلحة</h3>
        <Button onClick={openAdd} size="sm" className="gradient-primary text-primary-foreground rounded-xl"><Plus size={14} className="ml-1" /> إضافة سلاح</Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="p-3 font-black">#</th>
                <th className="p-3 font-black">اسم السلاح</th>
                <th className="p-3 font-black">النوع</th>
                <th className="p-3 font-black">الرقم التسلسلي</th>
                <th className="p-3 font-black text-center">الكمية</th>
                <th className="p-3 font-black">المخزن</th>
                <th className="p-3 font-black">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((w, idx) => (
                <tr key={w.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="p-3 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="p-3 font-bold flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" />
                    {w.name}
                    {w.quantity <= 2 && w.quantity > 0 && <AlertTriangle size={12} className="text-warning" />}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{w.type}</td>
                  <td className="p-3 text-xs font-mono font-bold text-primary">{w.serialNumber}</td>
                  <td className="p-3 text-center font-black">{w.quantity}</td>
                  <td className="p-3 text-xs text-muted-foreground">{getWarehouseName(w.warehouseId)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${statusColors[w.status] || ''}`}>{w.status}</span></td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(w)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(w.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 size={14} /></button>
                      <button onClick={() => printWeaponReport(w, getWarehouseName(w.warehouseId), movements.filter(m => m.itemType === 'سلاح' && m.itemId === w.id))} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-16 text-center"><div className="flex flex-col items-center opacity-30"><Search size={40} className="mb-2" /><p className="font-black">لا يوجد أسلحة</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xl font-black text-primary flex items-center gap-2"><ShieldCheck size={24} />{editItem ? 'تعديل سلاح' : 'إضافة سلاح جديد'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-bold text-sm">اسم السلاح *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="مثلاً: AK47" /></div>
              <div className="space-y-2"><Label className="font-bold text-sm">نوع السلاح</Label><Input value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="مثلاً: بندقية آلية" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-bold text-sm">الرقم التسلسلي *</Label><Input value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} placeholder="S/N" /></div>
              <div className="space-y-2"><Label className="font-bold text-sm">الكمية *</Label><Input type="number" min={1} value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-sm">الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as WeaponStatus})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">المخزن *</Label>
                <Select value={form.warehouseId} onValueChange={v => setForm({...form, warehouseId: v})}>
                  <SelectTrigger><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="font-bold text-sm">ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">{editItem ? 'حفظ' : 'إضافة'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeaponsTab;
