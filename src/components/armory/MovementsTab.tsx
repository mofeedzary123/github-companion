import { useState } from 'react';
import { useArmory } from '@/contexts/ArmoryContext';
import { MovementOperation } from '@/types/armory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Trash2, Printer, Search, Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { printMovementReport } from '@/utils/armoryPrint';

const operationIcons: Record<string, any> = { 'وارد': ArrowDownCircle, 'صادر': ArrowUpCircle, 'تحويل': RefreshCw, 'إرجاع': RotateCcw };
const operationColors: Record<string, string> = { 'وارد': 'bg-success/10 text-success', 'صادر': 'bg-destructive/10 text-destructive', 'تحويل': 'bg-primary/10 text-primary', 'إرجاع': 'bg-warning/10 text-warning' };
const operations: MovementOperation[] = ['وارد', 'صادر', 'تحويل', 'إرجاع'];

interface Props { search: string; }

const MovementsTab = ({ search }: Props) => {
  const { movements, addMovement, deleteMovement, weapons, ammo, warehouses, recipients, getItemName, getWarehouseName, getRecipientName } = useArmory();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [form, setForm] = useState({
    operation: 'وارد' as MovementOperation, 
    itemType: 'سلاح' as 'سلاح' | 'ذخيرة',
    itemId: '', 
    quantity: 1, 
    date: new Date().toISOString().split('T')[0],
    recipientId: '', 
    supplierId: '', 
    warehouseId: '', 
    documentNumber: '', 
    reason: '', 
    notes: '',
    sourceName: '',
    weaponName: '',
    weaponSerial: '',
    weaponType: '',
  });

  const filtered = movements.filter(m => {
    const name = getItemName(m.itemType, m.itemId);
    const recipient = m.recipientId ? getRecipientName(m.recipientId) : '';
    return name.includes(search) || recipient.includes(search) || m.date.includes(search);
  });

  const openAdd = () => {
    setForm({ 
      operation: 'وارد', 
      itemType: 'سلاح', 
      itemId: '', 
      quantity: 1, 
      date: new Date().toISOString().split('T')[0], 
      recipientId: '', 
      supplierId: '', 
      warehouseId: warehouses[0]?.id || '', 
      documentNumber: '', 
      reason: '', 
      notes: '',
      sourceName: '',
      weaponName: '',
      weaponSerial: '',
      weaponType: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.warehouseId || form.quantity <= 0) return;
    // For weapon disbursement, itemId is optional if weapon details are provided manually
    if (form.itemType === 'سلاح' && !form.itemId && !form.weaponName) return;
    if (form.itemType === 'ذخيرة' && !form.itemId) return;
    addMovement(form);
    setDialogOpen(false);
  };

  const itemOptions = form.itemType === 'سلاح' ? weapons : ammo;

  // Check if operation needs source/supplier
  const needsSource = form.operation === 'وارد';
  const needsRecipient = form.operation === 'صادر' || form.operation === 'تحويل';
  const isWeaponDisburse = form.operation === 'صادر' && form.itemType === 'سلاح';

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm flex items-center gap-2"><History size={16} className="text-primary" /> سجل الحركات</h3>
        <Button onClick={openAdd} size="sm" className="gradient-primary text-primary-foreground rounded-xl"><Plus size={14} className="ml-1" /> تسجيل حركة</Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-3 font-black text-right">التاريخ</th>
                <th className="p-3 font-black text-center">العملية</th>
                <th className="p-3 font-black text-center">النوع</th>
                <th className="p-3 font-black text-right">الصنف</th>
                <th className="p-3 font-black text-center">الكمية</th>
                <th className="p-3 font-black text-right">المخزن</th>
                <th className="p-3 font-black text-right">المستلم/المورد</th>
                <th className="p-3 font-black text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(m => {
                const Icon = operationIcons[m.operation] || History;
                const itemName = m.weaponName ? `${m.weaponName} (${m.weaponSerial || ''})` : getItemName(m.itemType, m.itemId);
                const personName = m.recipientId ? getRecipientName(m.recipientId) : m.sourceName || m.supplierId || '-';
                return (
                  <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 text-xs text-muted-foreground">{m.date}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${operationColors[m.operation]}`}>
                        <Icon size={12} /> {m.operation}
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs">{m.itemType}</td>
                    <td className="p-3 font-bold text-xs">{itemName}</td>
                    <td className="p-3 text-center font-black">{m.quantity}</td>
                    <td className="p-3 text-xs text-muted-foreground">{getWarehouseName(m.warehouseId)}</td>
                    <td className="p-3 text-xs">{personName}</td>
                    <td className="p-3 flex justify-center gap-1">
                      <button onClick={() => deleteMovement(m.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 size={14} /></button>
                      <button onClick={() => {
                        const itemName2 = m.weaponName ? `${m.weaponName} (${m.weaponSerial || ''})` : getItemName(m.itemType, m.itemId);
                        const person = m.recipientId ? getRecipientName(m.recipientId) : m.sourceName || m.supplierId || '-';
                        printMovementReport(m, itemName2, getWarehouseName(m.warehouseId), person);
                      }} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Printer size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
        <DialogContent dir="rtl" className="max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xl font-black text-primary flex items-center gap-2 border-b pb-4"><History size={24} /> تسجيل حركة جديدة</DialogTitle></DialogHeader>
          
          <div className="grid gap-4 mt-6">
            {/* نوع العملية */}
            <div className="space-y-2">
              <Label className="font-black text-sm">نوع العملية *</Label>
              <div className="grid grid-cols-4 gap-2">
                {operations.map(op => (
                  <Button 
                    key={op} 
                    type="button" 
                    variant={form.operation === op ? 'default' : 'outline'}
                    className={`text-xs font-black rounded-xl ${form.operation === op ? (op === 'وارد' ? 'bg-success hover:bg-success/90 text-white' : op === 'صادر' ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-primary hover:bg-primary/90 text-white') : ''}`}
                    onClick={() => setForm({...form, operation: op})}>
                    {op}
                  </Button>
                ))}
              </div>
            </div>

            {/* نوع العهدة */}
            <div className="space-y-2">
              <Label className="font-black text-sm">نوع العهدة *</Label>
              <Select value={form.itemType} onValueChange={v => setForm({...form, itemType: v as any, itemId: ''})}>
                <SelectTrigger className="rounded-xl border-primary/20"><SelectValue /></SelectTrigger>
                <SelectContent className="font-bold">
                  <SelectItem value="سلاح">سلاح عسكري</SelectItem>
                  <SelectItem value="ذخيرة">ذخيرة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* اختيار الصنف */}
            <div className="space-y-2">
              <Label className="font-black text-sm">اختيار الصنف {!isWeaponDisburse && '*'}</Label>
              <Select value={form.itemId} onValueChange={v => setForm({...form, itemId: v})}>
                <SelectTrigger className="rounded-xl border-primary/20">
                  <SelectValue placeholder="اختر من القائمة" />
                </SelectTrigger>
                <SelectContent className="font-bold">
                  {itemOptions.length > 0 ? (
                    itemOptions.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {form.itemType === 'سلاح' ? `${item.name} - ${item.type} (${item.serialNumber})` : `${item.type} - عيار ${item.caliber}`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs opacity-50">لا توجد عهدة مسجلة - أضف من تبويب الأسلحة أو الذخائر أولاً</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* حقول السلاح اليدوية لحركة صرف سلاح */}
            {isWeaponDisburse && (
              <div className="space-y-3 bg-secondary/20 p-3 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-1">
                <h4 className="font-black text-xs text-destructive">أو أدخل بيانات السلاح يدوياً</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="font-bold text-xs">اسم السلاح</Label><Input className="rounded-xl text-sm" value={form.weaponName} onChange={e => setForm({...form, weaponName: e.target.value})} placeholder="اسم السلاح" /></div>
                  <div className="space-y-1"><Label className="font-bold text-xs">رقم السلاح</Label><Input className="rounded-xl text-sm" value={form.weaponSerial} onChange={e => setForm({...form, weaponSerial: e.target.value})} placeholder="الرقم التسلسلي" /></div>
                </div>
                <div className="space-y-1"><Label className="font-bold text-xs">نوع السلاح</Label><Input className="rounded-xl text-sm" value={form.weaponType} onChange={e => setForm({...form, weaponType: e.target.value})} placeholder="مثلاً: بندقية آلية" /></div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-black text-sm">الكمية *</Label><Input type="number" min={1} className="rounded-xl" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} /></div>
              <div className="space-y-2"><Label className="font-black text-sm">التاريخ *</Label><Input type="date" className="rounded-xl" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-sm">المخزن *</Label>
              <Select value={form.warehouseId} onValueChange={v => setForm({...form, warehouseId: v})}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                <SelectContent className="font-bold">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* جهة الصادر / المورد */}
            {needsSource && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Label className="font-black text-sm text-success">المورد / جهة الوارد</Label>
                <Input className="rounded-xl border-success/30" value={form.sourceName} onChange={e => setForm({...form, sourceName: e.target.value})} placeholder="اسم المورد أو الجهة الموردة" />
              </div>
            )}

            {needsRecipient && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                <Label className="font-black text-sm text-destructive">المستلم العسكري</Label>
                <Select value={form.recipientId} onValueChange={v => setForm({...form, recipientId: v})}>
                  <SelectTrigger className="rounded-xl border-destructive/30"><SelectValue placeholder="اختر المستلم" /></SelectTrigger>
                  <SelectContent className="font-bold">{recipients.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.militaryId})</SelectItem>)}</SelectContent>
                </Select>
                {form.operation === 'صادر' && (
                  <div className="space-y-2">
                    <Label className="font-black text-sm text-destructive">جهة الصرف</Label>
                    <Input className="rounded-xl border-destructive/30" value={form.sourceName} onChange={e => setForm({...form, sourceName: e.target.value})} placeholder="اسم جهة الصرف" />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-black text-sm">رقم المستند</Label><Input className="rounded-xl" value={form.documentNumber} onChange={e => setForm({...form, documentNumber: e.target.value})} placeholder="رقم السند" /></div>
              <div className="space-y-2"><Label className="font-black text-sm">السبب</Label><Input className="rounded-xl" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="سبب الحركة" /></div>
            </div>

            <div className="space-y-2"><Label className="font-black text-sm">ملاحظات</Label><Textarea className="rounded-xl resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="ملاحظات إضافية..." /></div>
            
            <div className="flex justify-end gap-3 mt-4 border-t pt-4">
              <Button variant="outline" className="rounded-xl px-6 font-bold" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground rounded-xl px-8 font-black shadow-lg">حفظ الحركة</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MovementsTab;
