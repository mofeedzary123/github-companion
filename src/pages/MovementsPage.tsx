import { useState } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, FileText, RefreshCw, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MovementType, StockMovement } from '@/types/warehouse';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const UNITS = ['قطعة', 'كرتون', 'علبة', 'درزن', 'شدة', 'كيس', 'طرد', 'لفة', 'زجاجة', 'عبوة'];

let receiptCounter = 1000;
const getReceiptNumber = () => { receiptCounter++; return receiptCounter; };

const buildMovementHtml = (m: StockMovement, productName: string, warehouseName: string, entityName: string, userName: string, warehouseManager: string) => {
  const typeLabel = m.type === 'in' ? 'وارد' : 'صادر';
  const entityLabel = m.entity_type === 'supplier' ? 'المورد' : 'جهة الصرف';
  const accentColor = m.type === 'in' ? '#1a9e7a' : '#e74c3c';
  const receiptNo = getReceiptNumber();
  const dateParts = m.date.split('-');
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]} / ${dateParts[1]} / ${dateParts[0]}` : m.date;
  const unitLabel = m.unit || 'قطعة';

  return `
    <html dir="rtl"><head><meta charset="UTF-8"/><title>سند حركة مخزون (${typeLabel}) - ${receiptNo}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Cairo','Segoe UI',Tahoma,sans-serif;padding:40px;color:#1a1a2e;background:#fff}
      .doc{max-width:700px;margin:0 auto;border:2px solid ${accentColor};padding:30px;border-radius:8px}
      .header{text-align:center;margin-bottom:25px;padding-bottom:15px;border-bottom:2px solid ${accentColor}}
      .header h1{font-size:22px;color:${accentColor};margin-bottom:4px;font-weight:700}
      .header h2{font-size:17px;color:#333;font-weight:600;margin-bottom:2px}
      .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:14px}
      .meta-item .label{color:#666;font-size:12px}.meta-item .value{font-weight:700;color:#1a1a2e}
      .section-title{font-size:14px;font-weight:700;color:${accentColor};margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #eee}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{padding:10px 12px;border:1px solid #ddd;text-align:center;font-size:13px}
      th{background:${accentColor};color:#fff;font-weight:600}td{color:#333}
      tr:nth-child(even) td{background:#fafbfc}
      .notes{margin-top:15px;padding:12px;background:#f8f9fa;border-radius:6px;font-size:13px}
      .notes .label{font-weight:600;color:#333;margin-bottom:4px}
      .signatures{display:flex;justify-content:space-between;margin-top:35px;padding-top:20px;border-top:1px dashed #ccc}
      .sig-block{text-align:center;width:30%}.sig-block .title{font-size:13px;font-weight:600;color:#333;margin-bottom:30px}
      .sig-block .line{border-bottom:1px solid #333;width:100%}
      .footer{margin-top:25px;font-size:11px;text-align:center;color:#999;padding-top:10px;border-top:1px solid #eee}
    </style></head><body>
    <div class="doc">
      <div class="header"><h1>نظام إدارة المخازن</h1><h2>سند حركة مخزون (${typeLabel})</h2><p style="margin-top:8px;font-size:14px;color:#555">${m.type === 'in' ? 'تم توريد المنتجات الموضحة بالجدول' : 'تم صرف المنتجات الموضحة بالجدول'}</p></div>
      <div class="meta"><div class="meta-item"><div class="label">رقم السند:</div><div class="value">${receiptNo}</div></div><div class="meta-item"><div class="label">التاريخ:</div><div class="value">${formattedDate}</div></div></div>
      <div class="meta"><div class="meta-item"><div class="label">اسم المخزن:</div><div class="value">${warehouseName}</div></div><div class="meta-item"><div class="label">${entityLabel}:</div><div class="value">${entityName}</div></div></div>
      <div class="meta"><div class="meta-item"><div class="label">بواسطة:</div><div class="value">${userName}</div></div></div>
      <div class="section-title">تفاصيل الصنف</div>
      <table><thead><tr><th>م</th><th>اسم المنتج</th><th>الكمية</th><th>الوحدة</th></tr></thead>
      <tbody><tr><td>1</td><td>${productName}</td><td>${m.quantity}</td><td>${unitLabel}</td></tr></tbody></table>
      <div class="notes"><div class="label">ملاحظات:</div><div>${m.notes || 'لا يوجد'}</div></div>
      <div class="signatures"><div class="sig-block"><div class="title">المسؤول المخازن:</div><div style="margin-top:8px;font-size:13px;color:#1a1a2e;font-weight:700;min-height:20px">${warehouseManager || 'غير محدد'}</div></div><div class="sig-block"><div class="title">${entityLabel}:</div><div style="margin-top:8px;font-size:13px;color:#1a1a2e;font-weight:700;min-height:20px">${entityName || 'غير محدد'}</div></div></div>
      <div class="footer">تم الطباعة بتاريخ ${new Date().toLocaleDateString('ar-SA')} | نظام إدارة المخازن - برمجة مفيد الزري 778492884</div>
    </div></body></html>`;
};

const printMovementNative = async (html: string, title: string) => {
  const isCapacitor = (window as any).Capacitor !== undefined;

  if (isCapacitor) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '-10000px';
    tempDiv.style.width = '800px';
    tempDiv.style.direction = 'rtl';
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    const fileName = `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: pdfBase64,
      directory: Directory.Cache
    });

    await Share.share({
      title: title,
      url: savedFile.uri,
      dialogTitle: title
    });
  } else {
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.setTimeout(() => win.print(), 300); }
  }
};

const MovementsPage = () => {
  const {
    movements, products, warehouses, suppliers, clients,
    addMovement, updateMovement, deleteMovement,
    getProductName, getWarehouseName, getSupplierName, getClientName, getUserName,
    refreshAll
  } = useWarehouse();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StockMovement | null>(null);
  const [form, setForm] = useState({
    product_id: '', warehouse_id: '', type: 'in' as MovementType, quantity: 0,
    entity_id: '', entity_type: 'supplier' as 'supplier' | 'client',
    date: new Date().toISOString().split('T')[0], notes: '', unit: 'قطعة'
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState<StockMovement | null>(null);

  // --- ميزات التحديد الجديد ---
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  const filtered = movements
    .filter(m => filter === 'all' || m.type === filter)
    .filter(m => getProductName(m.product_id).includes(search))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
    toast({ title: 'تم التحديث', description: 'تم تحديث البيانات بنجاح' });
  };

  // --- دوال التحديد ---
  const allSelected = filtered.length > 0 && filtered.every(m => selectedItems.has(m.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filtered.map(m => m.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedItems);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedItems(next);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedItems);
    for (const id of idsToDelete) {
      await deleteMovement(id);
    }
    toast({ title: 'تم الحذف', description: `تم حذف ${idsToDelete.length} حركة بنجاح` });
    setSelectedItems(new Set());
    setBulkDeleteDialog(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      product_id: products[0]?.id || '', warehouse_id: warehouses[0]?.id || '',
      type: 'in', quantity: 0, entity_id: suppliers[0]?.id || '',
      entity_type: 'supplier', date: new Date().toISOString().split('T')[0], notes: '', unit: 'قطعة'
    });
    setDialogOpen(true);
  };

  const openEdit = (m: StockMovement) => {
    setEditing(m);
    setForm({
      product_id: m.product_id, warehouse_id: m.warehouse_id, type: m.type,
      quantity: m.quantity, entity_id: m.entity_id, entity_type: m.entity_type,
      date: m.date, notes: m.notes || '', unit: m.unit || 'قطعة'
    });
    setDialogOpen(true);
  };

  const handleTypeChange = (type: MovementType) => {
    const entity_type = type === 'in' ? 'supplier' : 'client';
    const entity_id = type === 'in' ? (suppliers[0]?.id || '') : (clients[0]?.id || '');
    setForm({ ...form, type, entity_type, entity_id });
  };

  const handleSave = async () => {
    // حل مشكلة "سحب الكمية من مخزن آخر" عبر فلترة الحركات للمخزن المختار فقط
    if (form.type === 'out') {
      const currentStockInSelectedWarehouse = movements
        .filter(m => m.product_id === form.product_id && m.warehouse_id === form.warehouse_id)
        .reduce((total, m) => total + (m.type === 'in' ? m.quantity : -m.quantity), 0);
      
      const requestedQty = form.quantity;

      if (currentStockInSelectedWarehouse <= 0 || requestedQty > currentStockInSelectedWarehouse) {
        toast({ 
          title: 'خطأ في الكمية', 
          description: `الرصيد المتوفر في مخزن (${getWarehouseName(form.warehouse_id)}) هو (${currentStockInSelectedWarehouse}) فقط. لا يمكن صرف كمية أكبر.`, 
          variant: 'destructive' 
        });
        return;
      }
    }

    if (editing) {
      await updateMovement({ ...editing, ...form });
      toast({ title: 'تم التعديل', description: 'تم تعديل الحركة بنجاح' });
    } else {
      await addMovement({ ...form });
      toast({ title: 'تم التسجيل', description: 'تم تسجيل الحركة بنجاح' });
    }
    setDialogOpen(false);
  };

  const confirmDelete = (m: StockMovement) => {
    setDeletingMovement(m);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingMovement) return;
    await deleteMovement(deletingMovement.id);
    toast({ title: 'تم الحذف', description: 'تم حذف الحركة وتحديث الرصيد تلقائيًا' });
    setDeleteDialog(false);
    setDeletingMovement(null);
  };

  const handlePrint = async (m: StockMovement) => {
    const productName = getProductName(m.product_id);
    const warehouseName = getWarehouseName(m.warehouse_id);
    const entityName = m.entity_type === 'supplier' ? getSupplierName(m.entity_id) : getClientName(m.entity_id);
    const userName = getUserName(m.created_by);
    const warehouseManager = warehouses.find(w => w.id === m.warehouse_id)?.manager || 'غير محدد';
    const html = buildMovementHtml(m, productName, warehouseName, entityName, userName, warehouseManager);
    const typeLabel = m.type === 'in' ? 'سند_وارد' : 'سند_صادر';
    await printMovementNative(html, typeLabel);
  };

  const MobileCard = ({ m }: { m: StockMovement }) => (
    <div className="bg-card rounded-xl p-3 border border-border shadow-card space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Checkbox 
              checked={selectedItems.has(m.id)} 
              onCheckedChange={() => toggleOne(m.id)} 
              className="ml-1"
            />
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            m.type === 'in' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>{m.type === 'in' ? 'وارد' : 'صادر'}</span>
          <span className="text-xs text-muted-foreground">{m.date}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => openEdit(m)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary"><Pencil className="w-3.5 h-3.5" /></button>
          {isAdmin && <button onClick={() => confirmDelete(m)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
          <button onClick={() => handlePrint(m)} className="p-1.5 rounded-md hover:bg-accent/20 text-accent"><FileText className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="text-sm font-medium text-foreground">{getProductName(m.product_id)}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>الكمية: <strong className="text-foreground">{m.quantity}</strong></span>
        <span>الوحدة: <strong className="text-foreground">{m.unit || 'قطعة'}</strong></span>
        <span>المخزن: {getWarehouseName(m.warehouse_id)}</span>
        <span>{m.entity_type === 'supplier' ? 'المورد' : 'جهة الصرف'}: {m.entity_type === 'supplier' ? getSupplierName(m.entity_id) : getClientName(m.entity_id)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالمنتج..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-sm" />
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'in', 'out'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 sm:px-3 py-2 text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary'}`}>
                {f === 'all' ? 'الكل' : f === 'in' ? 'وارد' : 'صادر'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2 text-sm" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </Button>
            {isAdmin && selectedItems.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2 text-sm"
                onClick={() => setBulkDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المحدد ({selectedItems.size})</span>
              </Button>
            )}
          </div>
          <Button onClick={openAdd} className="gradient-primary border-0 flex-1 sm:flex-none text-sm gap-2">
            <Plus className="w-4 h-4" />تسجيل حركة
          </Button>
        </div>
      </div>

      <div className="sm:hidden space-y-2">
        {isAdmin && filtered.length > 0 && (
          <div className="flex items-center gap-2 px-1 py-1 border-b">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            <span className="text-xs text-muted-foreground font-medium">تحديد الكل</span>
          </div>
        )}
        {filtered.map((m) => <MobileCard key={m.id} m={m} />)}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">لا توجد حركات</p>}
      </div>

      <div className="hidden sm:block bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {isAdmin && (
                  <th className="p-3 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                )}
                <th className="text-right p-3 font-semibold text-foreground">م</th>
                <th className="text-right p-3 font-semibold text-foreground">النوع</th>
                <th className="text-right p-3 font-semibold text-foreground">جهة الصرف/المورد</th>
                <th className="text-right p-3 font-semibold text-foreground">المنتج</th>
                <th className="text-right p-3 font-semibold text-foreground">الكمية</th>
                <th className="text-right p-3 font-semibold text-foreground">الوحدة</th>
                <th className="text-right p-3 font-semibold text-foreground">المخزن</th>
                <th className="text-right p-3 font-semibold text-foreground hidden md:table-cell">بواسطة</th>
                <th className="text-right p-3 font-semibold text-foreground hidden lg:table-cell">التاريخ</th>
                <th className="text-center p-3 font-semibold text-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${selectedItems.has(m.id) ? 'bg-primary/5' : ''}`}>
                  {isAdmin && (
                    <td className="p-3">
                      <Checkbox 
                        checked={selectedItems.has(m.id)} 
                        onCheckedChange={() => toggleOne(m.id)} 
                      />
                    </td>
                  )}
                  <td className="p-3 text-foreground font-medium">{i + 1}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      m.type === 'in' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>{m.type === 'in' ? 'وارد' : 'صادر'}</span>
                  </td>
                  <td className="p-3 text-foreground">{m.entity_type === 'supplier' ? getSupplierName(m.entity_id) : getClientName(m.entity_id)}</td>
                  <td className="p-3 text-foreground">{getProductName(m.product_id)}</td>
                  <td className="p-3 text-foreground font-semibold">{m.quantity}</td>
                  <td className="p-3 text-foreground">{m.unit || 'قطعة'}</td>
                  <td className="p-3 text-foreground">{getWarehouseName(m.warehouse_id)}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{getUserName(m.created_by)}</td>
                  <td className="p-3 text-muted-foreground hidden lg:table-cell">{m.date}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary"><Pencil className="w-4 h-4" /></button>
                      {isAdmin && <button onClick={() => confirmDelete(m)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>}
                      <button onClick={() => handlePrint(m)} className="p-1.5 rounded-md hover:bg-accent/20 text-accent"><FileText className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={isAdmin ? 11 : 10} className="p-8 text-center text-muted-foreground">لا توجد حركات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* حوار الحذف الجماعي */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف الجماعي</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              هل أنت متأكد من حذف <strong>{selectedItems.size}</strong> حركات مختارة؟ سيتم تحديث رصيد المنتجات تلقائياً.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleBulkDelete} className="flex-1">تأكيد الحذف</Button>
            <Button variant="outline" onClick={() => setBulkDeleteDialog(false)} className="flex-1">إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">{editing ? 'تعديل الحركة' : 'تسجيل حركة مخزون'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:gap-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">نوع الحركة</Label>
              <div className="flex gap-2">
                <button onClick={() => handleTypeChange('in')} className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${form.type === 'in' ? 'bg-success text-success-foreground' : 'bg-secondary text-secondary-foreground'}`}>وارد</button>
                <button onClick={() => handleTypeChange('out')} className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${form.type === 'out' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'}`}>صادر</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">المنتج</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">المخزن</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">الكمية</Label>
                <Input type="number" placeholder="أدخل الكمية" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">الوحدة</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">{form.entity_type === 'supplier' ? 'المورد' : 'جهة الصرف'}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.entity_id} onChange={e => setForm({ ...form, entity_id: e.target.value })}>
                {form.entity_type === 'supplier' ? suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">التاريخ</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">ملاحظات</Label>
              <Input placeholder="أدخل ملاحظات (اختياري)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={handleSave} className="gradient-primary border-0 text-sm">{editing ? 'تحديث الحركة' : 'تسجيل الحركة'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>تأكيد حذف الحركة</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            هل أنت متأكد من حذف هذه الحركة؟ سيتم تحديث رصيد المنتج تلقائيًا. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="destructive" onClick={handleDelete} className="flex-1"><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovementsPage;

