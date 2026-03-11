import { useState } from 'react';
import { 
  ShieldCheck, Package, ArrowDownCircle, ArrowUpCircle, 
  Plus, Search, FileText, Trash2, Pencil, BarChart3, 
  Target, Boxes, History, CheckCircle, AlertOctagon,
  ShieldAlert, Printer, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// --- أنواع البيانات للنظام ---
type WeaponStatus = 'جاهز' | 'عهدة' | 'صيانة' | 'تالف';
type ArmoryCategory = 'سلاح خفيف' | 'سلاح متوسط' | 'ذخيرة' | 'مهمات عسكرية';

interface ArmoryItem {
  id: string;
  name: string;
  type: ArmoryCategory;
  serialNumber?: string;
  batchNumber?: string;
  quantity: number;
  status: WeaponStatus;
  warehouse: string;
  lastUpdated: string;
}

interface ArmoryMovement {
  id: string;
  itemId: string;
  type: 'وارد' | 'صادر';
  quantity: number;
  warehouse: string;
  date: string;
  notes?: string;
}

const ArmoryPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inventory');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [items, setItems] = useState<ArmoryItem[]>([
    { id: '1', name: 'كلاشنكوف AK-47', type: 'سلاح خفيف', serialNumber: 'RU-1022', quantity: 20, status: 'جاهز', warehouse: 'مخزن السلاح الرئيسي', lastUpdated: '2026-03-10' },
    { id: '2', name: 'ذخيرة 7.62x39mm', type: 'ذخيرة', batchNumber: 'LOT-2024-A', quantity: 5000, status: 'جاهز', warehouse: 'مستودع الذخيرة المركزي', lastUpdated: '2026-03-09' },
    { id: '3', name: 'قاذف RPG-7', type: 'سلاح متوسط', serialNumber: 'VG-990-X', quantity: 5, status: 'صيانة', warehouse: 'مخزن السلاح الرئيسي', lastUpdated: '2026-03-08' },
    { id: '4', name: 'مسدس ميكاروف 9mm', type: 'سلاح خفيف', serialNumber: 'MK-7721', quantity: 12, status: 'جاهز', warehouse: 'خزنة المهمات الخاصة', lastUpdated: '2026-03-07' },
  ]);

  const [movements, setMovements] = useState<ArmoryMovement[]>([]);

  const [form, setForm] = useState({
    name: '', type: 'سلاح خفيف' as ArmoryCategory, serialNumber: '', 
    batchNumber: '', quantity: 0, warehouse: 'المخزن الرئيسي', status: 'جاهز' as WeaponStatus
  });

  // إضافة صنف جديد مع تسجيل حركة وارد
  const handleAddItem = () => {
    if (!form.name || form.quantity <= 0) {
      toast({ title: 'خطأ في البيانات', description: 'يرجى إكمال الحقول الأساسية', variant: 'destructive' });
      return;
    }
    const newItem: ArmoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...form,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setItems([...items, newItem]);

    // تسجيل حركة وارد تلقائياً عند إضافة صنف جديد
    const newMovement: ArmoryMovement = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: newItem.id,
      type: 'وارد',
      quantity: form.quantity,
      warehouse: form.warehouse,
      date: new Date().toISOString().split('T')[0]
    };
    setMovements([newMovement, ...movements]);

    setIsAddDialogOpen(false);
    toast({ title: 'تم التسجيل', description: 'تمت إضافة الصنف وعملية الوارد بنجاح' });
    setForm({ name: '', type: 'سلاح خفيف', serialNumber: '', batchNumber: '', quantity: 0, warehouse: 'المخزن الرئيسي', status: 'جاهز' });
  };

  const filteredItems = items.filter(item => 
    item.name.includes(search) || item.serialNumber?.includes(search) || item.batchNumber?.includes(search)
  );

  // حذف حركة
  const handleDeleteMovement = (id: string) => {
    setMovements(movements.filter(m => m.id !== id));
    toast({ title: 'تم الحذف', description: 'تم حذف الحركة بنجاح' });
  };

  // تعديل حركة
  const handleEditMovement = (id: string) => {
    const mov = movements.find(m => m.id === id);
    if (!mov) return;
    const newQuantity = prompt('أدخل الكمية الجديدة:', mov.quantity.toString());
    if (newQuantity) {
      setMovements(movements.map(m => m.id === id ? {...m, quantity: Number(newQuantity)} : m));
      toast({ title: 'تم التعديل', description: 'تم تعديل الحركة بنجاح' });
    }
  };

  // طباعة صنف مع كل حركاته
  const handlePrintItem = (item: ArmoryItem) => {
    const movementsOfItem = movements.filter(m => m.itemId === item.id);
    const printContent = `
      <h2>${item.name} (${item.type})</h2>
      <p>المخزن: ${item.warehouse}</p>
      <p>الحالة: ${item.status}</p>
      <h3>الحركات:</h3>
      <ul>
        ${movementsOfItem.map(m => `<li>${m.type}: ${m.quantity} بتاريخ ${m.date}</li>`).join('')}
      </ul>
    `;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10 animate-in fade-in duration-700" dir="rtl">
      {/* --- تبويبات العهدة والحركات والتقارير --- */}
      <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-8 bg-card/50 p-2 rounded-[1.5rem] border border-dashed">
          <TabsList className="bg-secondary/50 p-1.5 rounded-xl h-auto flex flex-wrap lg:flex-nowrap gap-1">
            <TabsTrigger value="inventory" className="flex-1 py-3 px-6 rounded-lg font-black text-xs gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Boxes size={16}/> العهدة الحالية
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex-1 py-3 px-6 rounded-lg font-black text-xs gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <History size={16}/> سجل الوارد والمنصرف
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 py-3 px-6 rounded-lg font-black text-xs gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <BarChart3 size={16}/> تقارير الجرد
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="ابحث برقم السلاح أو الاسم..." 
                className="pr-10 h-11 rounded-xl border-primary/10 bg-background shadow-inner text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary rounded-xl font-black h-11 px-6 flex-1 sm:flex-none shadow-elevated">
                <Plus className="ml-1 w-5 h-5" /> جديد
              </Button>
            </div>
          </div>
        </div>

        {/* --- تبويب العهدة --- */}
        <TabsContent value="inventory" className="mt-0 focus-visible:outline-none">
          <div className="bg-card border rounded-[2rem] shadow-card overflow-hidden">
            <div className="p-5 border-b bg-secondary/10 flex justify-between items-center">
               <h3 className="font-black text-sm flex items-center gap-2"><LayoutGrid size={16} className="text-primary"/> قائمة جرد العهدة العسكرية</h3>
               <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">إجمالي الأصناف: {filteredItems.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-secondary/30 text-muted-foreground">
                  <tr>
                    <th className="p-4 font-black">الصنف</th>
                    <th className="p-4 font-black">التصنيف</th>
                    <th className="p-4 font-black">الرقم (S/N or Lot)</th>
                    <th className="p-4 font-black text-center">الكمية</th>
                    <th className="p-4 font-black">المخزن</th>
                    <th className="p-4 font-black">الحالة</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          {item.type === 'ذخيرة' ? <Target size={16}/> : <ShieldCheck size={16}/>}
                        </div>
                        <span className="font-bold text-foreground">{item.name}</span>
                      </td>
                      <td className="p-4 text-xs font-medium text-muted-foreground">{item.type}</td>
                      <td className="p-4 text-xs font-mono font-bold text-primary">{item.serialNumber || item.batchNumber}</td>
                      <td className="p-4 text-center"><span className="text-lg font-black">{item.quantity}</span></td>
                      <td className="p-4 text-xs text-muted-foreground">{item.warehouse}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          item.status === 'جاهز' ? 'bg-success/10 text-success' : 
                          item.status === 'صيانة' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => handlePrintItem(item)} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><Printer size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Search size={48} className="mb-2" />
                          <p className="font-black text-lg">لا يوجد بيانات مطابقة للبحث</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* --- تبويب الحركات --- */}
        <TabsContent value="movements" className="mt-0 focus-visible:outline-none">
          <div className="bg-card border rounded-[2rem] shadow-card overflow-auto p-5">
            <h3 className="font-black text-sm mb-4"><History size={16} className="inline"/> سجل الوارد والمنصرف</h3>
            <table className="w-full text-sm text-right">
              <thead className="bg-secondary/30 text-muted-foreground">
                <tr>
                  <th className="p-3 font-black">الصنف</th>
                  <th className="p-3 font-black text-center">نوع الحركة</th>
                  <th className="p-3 font-black text-center">الكمية</th>
                  <th className="p-3 font-black">المخزن</th>
                  <th className="p-3 font-black text-center">التاريخ</th>
                  <th className="p-3 font-black text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {movements.map(m => {
                  const item = items.find(i => i.id === m.itemId);
                  return (
                    <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">{item?.name}</td>
                      <td className="p-3 text-center">{m.type}</td>
                      <td className="p-3 text-center">{m.quantity}</td>
                      <td className="p-3">{m.warehouse}</td>
                      <td className="p-3 text-center">{m.date}</td>
                      <td className="p-3 flex justify-center gap-2">
                        <button onClick={() => handleEditMovement(m.id)} className="p-2 hover:bg-primary/10 rounded-lg text-primary"><Pencil size={16}/></button>
                        <button onClick={() => handleDeleteMovement(m.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                })}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <Search size={48} className="mb-2" />
                        <p className="font-black text-lg">لا يوجد حركات مسجلة بعد</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- نافذة إضافة صنف --- */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl" className="max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
               <ShieldAlert size={32} /> تسجيل بيانات (سلاح / ذخيرة) في العهدة
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 mt-8">
            {/* الحقول الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-black text-sm mr-1">نوع التصنيف العسكري</Label>
                <select 
                  className="w-full h-12 border rounded-xl px-4 font-bold text-sm bg-secondary/30 focus:ring-2 ring-primary/20 outline-none"
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value as ArmoryCategory})}
                >
                  <option>سلاح خفيف</option>
                  <option>سلاح متوسط</option>
                  <option>ذخيرة</option>
                  <option>مهمات عسكرية</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-black text-sm mr-1">اسم الصنف (النوع)</Label>
                <Input 
                  className="h-12 rounded-xl border-primary/10" 
                  placeholder="مثلاً: قناصة دراغونوف"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-secondary/20 p-4 rounded-2xl border border-dashed">
              <div className="space-y-2">
                <Label className="font-black text-xs opacity-60">الرقم المتسلسل (S/N)</Label>
                <Input 
                className="h-12 rounded-xl border-primary/10"
                  placeholder="مثلاً: AK-47-1022"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-xs opacity-60">رقم الدفعة (Lot)</Label>
                <Input
                  className="h-12 rounded-xl border-primary/10"
                  placeholder="مثلاً: LOT-2024-A"
                  value={form.batchNumber}
                  onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-xs opacity-60">الكمية</Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl border-primary/10"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-black text-sm mr-1">المخزن</Label>
                <Input
                  className="h-12 rounded-xl border-primary/10"
                  placeholder="مثلاً: المخزن الرئيسي"
                  value={form.warehouse}
                  onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-sm mr-1">الحالة</Label>
                <select
                  className="w-full h-12 border rounded-xl px-4 font-bold text-sm bg-secondary/30 focus:ring-2 ring-primary/20 outline-none"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as WeaponStatus })}
                >
                  <option>جاهز</option>
                  <option>عهدة</option>
                  <option>صيانة</option>
                  <option>تالف</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleAddItem} className="bg-primary text-white hover:bg-primary/90">إضافة الصنف</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArmoryPage;
