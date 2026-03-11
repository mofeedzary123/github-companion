import { useState } from 'react';
import { useArmory } from '@/contexts/ArmoryContext';
import { Ammo } from '@/types/armory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Pencil, Trash2, Printer, Search, Plus, AlertTriangle } from 'lucide-react';
import { printAmmoReport } from '@/utils/armoryPrint';

interface Props { search: string; }

const AmmoTab = ({ search }: Props) => {
  const { ammo, deleteAmmo, addAmmo, updateAmmo, warehouses, getWarehouseName, movements } = useArmory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Ammo | null>(null);
  const [form, setForm] = useState({ type: '', caliber: '', boxCount: 0, roundsPerBox: 0, totalRounds: 0, warehouseId: '', notes: '' });

  const filtered = ammo.filter(a => a.type.includes(search) || a.caliber.includes(search));

  const openAdd = () => {
    setEditItem(null);
    setForm({ type: '', caliber: '', boxCount: 0, roundsPerBox: 0, totalRounds: 0, warehouseId: warehouses[0]?.id || '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (a: Ammo) => {
    setEditItem(a);
    setForm({ type: a.type, caliber: a.caliber, boxCount: a.boxCount, roundsPerBox: a.roundsPerBox, totalRounds: a.totalRounds, warehouseId: a.warehouseId, notes: a.notes || '' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.type || !form.caliber || !form.warehouseId) return;
    const total = form.boxCount * form.roundsPerBox || form.totalRounds;
    if (editItem) updateAmmo({ ...editItem, ...form, totalRounds: total });
    else addAmmo({ ...form, totalRounds: total });
    setDialogOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm flex items-center gap-2"><Target size={16} className="text-primary" /> إدارة الذخائر</h3>
        <Button onClick={openAdd} size="sm" className="gradient-primary text-primary-foreground rounded-xl"><Plus size={14} className="ml-1" /> إضافة ذخيرة</Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="p-3 font-black">#</th>
                <th className="p-3 font-black">النوع</th>
                <th className="p-3 font-black">العيار</th>
                <th className="p-3 font-black text-center">عدد الصناديق</th>
                <th className="p-3 font-black text-center">طلقات/صندوق</th>
                <th className="p-3 font-black text-center">الإجمالي</th>
                <th className="p-3 font-black">المخزن</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((a, idx) => (
                <tr key={a.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="p-3 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="p-3 font-bold flex items-center gap-2">
                    <Target size={14} className="text-primary" />
                    {a.type}
                    {a.totalRounds <= 100 && a.totalRounds > 0 && <AlertTriangle size={12} className="text-warning" />}
                  </td>
                  <td className="p-3 text-xs font-mono font-bold text-primary">{a.caliber}</td>
                  <td className="p-3 text-center">{a.boxCount}</td>
                  <td className="p-3 text-center">{a.roundsPerBox}</td>
                  <td className="p-3 text-center font-black text-lg">{a.totalRounds.toLocaleString()}</td>
                  <td className="p-3 text-xs text-muted-foreground">{getWarehouseName(a.warehouseId)}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Pencil size={14} /></button>
                      <button onClick={() => deleteAmmo(a.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 size={14} /></button>
                      <button onClick={() => printAmmoReport(a, getWarehouseName(a.warehouseId), movements.filter(m => m.itemType === 'ذخيرة' && m.itemId === a.id))} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-16 text-center"><div className="flex flex-col items-center opacity-30"><Search size={40} className="mb-2" /><p className="font-black">لا يوجد ذخائر</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg rounded-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black text-primary flex items-center gap-2"><Target size={24} />{editItem ? 'تعديل ذخيرة' : 'إضافة ذخيرة'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-bold text-sm">نوع الذخيرة *</Label><Input value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="مثلاً: طلق كلاش" /></div>
              <div className="space-y-2"><Label className="font-bold text-sm">العيار *</Label><Input value={form.caliber} onChange={e => setForm({...form, caliber: e.target.value})} placeholder="مثلاً: 7.62" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4 bg-secondary/20 p-3 rounded-xl border border-dashed">
              <div className="space-y-2"><Label className="font-bold text-xs text-muted-foreground">عدد الصناديق</Label><Input type="number" value={form.boxCount} onChange={e => setForm({...form, boxCount: Number(e.target.value)})} /></div>
              <div className="space-y-2"><Label className="font-bold text-xs text-muted-foreground">طلقات/صندوق</Label><Input type="number" value={form.roundsPerBox} onChange={e => setForm({...form, roundsPerBox: Number(e.target.value)})} /></div>
              <div className="space-y-2"><Label className="font-bold text-xs text-muted-foreground">الإجمالي</Label><Input type="number" value={form.boxCount * form.roundsPerBox || form.totalRounds} readOnly className="bg-muted" /></div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">المخزن *</Label>
              <Select value={form.warehouseId} onValueChange={v => setForm({...form, warehouseId: v})}>
                <SelectTrigger><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="font-bold text-sm">ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">{editItem ? 'حفظ' : 'إضافة'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AmmoTab;
