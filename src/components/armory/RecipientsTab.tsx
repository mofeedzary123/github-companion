import { useState } from 'react';
import { useArmory } from '@/contexts/ArmoryContext';
import { Recipient } from '@/types/armory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Pencil, Trash2, Search, Plus, FileText } from 'lucide-react';
import { printRecipientReport } from '@/utils/armoryPrint';

interface Props { search: string; }

const RecipientsTab = ({ search }: Props) => {
  const { recipients, deleteRecipient, addRecipient, updateRecipient, movements, getItemName, getWarehouseName } = useArmory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Recipient | null>(null);
  const [form, setForm] = useState({ name: '', militaryId: '', unit: '', rank: '', phone: '', notes: '' });

  const filtered = recipients.filter(r => r.name.includes(search) || r.militaryId.includes(search) || r.unit.includes(search));

  const openAdd = () => { setEditItem(null); setForm({ name: '', militaryId: '', unit: '', rank: '', phone: '', notes: '' }); setDialogOpen(true); };
  const openEdit = (r: Recipient) => { setEditItem(r); setForm({ name: r.name, militaryId: r.militaryId, unit: r.unit, rank: r.rank || '', phone: r.phone || '', notes: r.notes || '' }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.name || !form.militaryId) return;
    if (editItem) updateRecipient({ ...editItem, ...form });
    else addRecipient(form);
    setDialogOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm flex items-center gap-2"><Users size={16} className="text-primary" /> المستلمون / الوحدات</h3>
        <Button onClick={openAdd} size="sm" className="gradient-primary text-primary-foreground rounded-xl"><Plus size={14} className="ml-1" /> إضافة مستلم</Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="p-3 font-black">#</th>
                <th className="p-3 font-black">الاسم</th>
                <th className="p-3 font-black">الرقم العسكري</th>
                <th className="p-3 font-black">الرتبة</th>
                <th className="p-3 font-black">الوحدة</th>
                <th className="p-3 font-black text-center">عدد العهد</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r, idx) => {
                const recipientMovements = movements.filter(m => m.recipientId === r.id);
                return (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="p-3 font-bold">{r.name}</td>
                    <td className="p-3 text-xs font-mono font-bold text-primary">{r.militaryId}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.rank || '-'}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.unit}</td>
                    <td className="p-3 text-center font-black">{recipientMovements.length}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Pencil size={14} /></button>
                        <button onClick={() => deleteRecipient(r.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 size={14} /></button>
                        <button onClick={() => printRecipientReport(r, recipientMovements, getItemName, getWarehouseName)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><FileText size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-16 text-center"><div className="flex flex-col items-center opacity-30"><Search size={40} className="mb-2" /><p className="font-black">لا يوجد مستلمين</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg rounded-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black text-primary flex items-center gap-2"><Users size={24} />{editItem ? 'تعديل مستلم' : 'إضافة مستلم'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-bold text-sm">الاسم *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="space-y-2"><Label className="font-bold text-sm">الرقم العسكري *</Label><Input value={form.militaryId} onChange={e => setForm({...form, militaryId: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-bold text-sm">الرتبة</Label><Input value={form.rank} onChange={e => setForm({...form, rank: e.target.value})} /></div>
              <div className="space-y-2"><Label className="font-bold text-sm">الوحدة</Label><Input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label className="font-bold text-sm">الهاتف</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label className="font-bold text-sm">ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">{editItem ? 'حفظ' : 'إضافة'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecipientsTab;
