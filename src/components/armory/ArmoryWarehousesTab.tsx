import { useState } from 'react';
import { useArmory } from '@/contexts/ArmoryContext';
import { ArmoryWarehouse } from '@/types/armory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Warehouse, Plus, Pencil, Trash2, ChevronDown, ChevronUp, ShieldCheck, Target, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WarehousesTab = () => {
  const { warehouses, deleteWarehouse, addWarehouse, updateWarehouse, weapons, ammo, movements, getItemName } = useArmory();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editWh, setEditWh] = useState<ArmoryWarehouse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', location: '', notes: '' });

  const openAdd = () => { setEditWh(null); setForm({ name: '', location: '', notes: '' }); setDialogOpen(true); };
  const openEdit = (w: ArmoryWarehouse) => { setEditWh(w); setForm({ name: w.name, location: w.location, notes: w.notes || '' }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.name) return;
    if (editWh) updateWarehouse({ ...editWh, ...form });
    else addWarehouse(form);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!deleteWarehouse(id)) toast({ title: 'لا يمكن الحذف', description: 'مرتبط بأصناف', variant: 'destructive' });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm flex items-center gap-2"><Warehouse size={16} className="text-primary" /> إدارة المخازن</h3>
        <Button onClick={openAdd} size="sm" className="gradient-primary text-primary-foreground rounded-xl"><Plus size={14} className="ml-1" /> إضافة مخزن</Button>
      </div>

      <div className="space-y-3">
        {warehouses.map(wh => {
          const whWeapons = weapons.filter(w => w.warehouseId === wh.id);
          const whAmmo = ammo.filter(a => a.warehouseId === wh.id);
          const whMov = movements.filter(m => m.warehouseId === wh.id);
          const isExp = expanded === wh.id;
          return (
            <div key={wh.id} className="bg-card border rounded-2xl shadow-card overflow-hidden">
              <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-secondary/10 transition-colors" onClick={() => setExpanded(isExp ? null : wh.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><Warehouse size={18} /></div>
                  <div>
                    <h4 className="font-black text-sm">{wh.name}</h4>
                    <p className="text-xs text-muted-foreground">{wh.location} • {whWeapons.length} سلاح • {whAmmo.length} ذخيرة • {whMov.length} حركة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); openEdit(wh); }} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Pencil size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(wh.id); }} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 size={14} /></button>
                  {isExp ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </div>
              {isExp && (
                <div className="border-t p-4 bg-secondary/5 space-y-3">
                  {whWeapons.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">الأسلحة:</p>
                      {whWeapons.map(w => (
                        <div key={w.id} className="flex justify-between items-center p-2 bg-background rounded-lg border mb-1">
                          <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /><span className="font-bold text-sm">{w.name}</span><span className="text-[10px] text-muted-foreground">({w.serialNumber})</span></div>
                          <span className="font-black text-sm">{w.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {whAmmo.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">الذخائر:</p>
                      {whAmmo.map(a => (
                        <div key={a.id} className="flex justify-between items-center p-2 bg-background rounded-lg border mb-1">
                          <div className="flex items-center gap-2"><Target size={14} className="text-primary" /><span className="font-bold text-sm">{a.type}</span><span className="text-[10px] text-muted-foreground">({a.caliber})</span></div>
                          <span className="font-black text-sm">{a.totalRounds.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {whWeapons.length === 0 && whAmmo.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا يوجد أصناف</p>}
                </div>
              )}
            </div>
          );
        })}

        {warehouses.length === 0 && (
          <div className="bg-card border rounded-2xl p-12 text-center"><Search size={40} className="mx-auto mb-2 opacity-20" /><p className="font-black text-muted-foreground">لا يوجد مخازن</p></div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black text-primary flex items-center gap-2"><Warehouse size={24} />{editWh ? 'تعديل مخزن' : 'إضافة مخزن'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div className="space-y-2"><Label className="font-bold text-sm">اسم المخزن *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="space-y-2"><Label className="font-bold text-sm">الموقع</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
            <div className="space-y-2"><Label className="font-bold text-sm">ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">{editWh ? 'حفظ' : 'إضافة'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WarehousesTab;
