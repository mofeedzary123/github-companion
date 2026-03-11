import { useState } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { FileSpreadsheet, FileText, Filter, Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const COLORS = ['hsl(174, 62%, 38%)', 'hsl(37, 95%, 55%)', 'hsl(220, 30%, 40%)', 'hsl(152, 60%, 40%)', 'hsl(0, 72%, 51%)'];

type ReportTab = 'products' | 'movements' | 'warehouses' | 'low-stock';

const ReportsPage = () => {
  const {
    products, categories, warehouses, suppliers, clients, movements,
    getCategoryName, getWarehouseName, getProductName, getSupplierName, getClientName,
    refreshAll,
  } = useWarehouse();

  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<ReportTab>('products');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [movementFilter, setMovementFilter] = useState<'all' | 'in' | 'out'>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  const filteredMovements = movements
    .filter(m => movementFilter === 'all' || m.type === movementFilter)
    .filter(m => (!dateFrom || m.date >= dateFrom) && (!dateTo || m.date <= dateTo))
    .filter(m => !selectedWarehouse || m.warehouse_id === selectedWarehouse)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
    toast({ title: 'تم التحديث', description: 'تم تحديث البيانات بنجاح' });
  };

  // Calculate quantity from movements for a specific warehouse
  const getWarehouseQty = (productId: string, warehouseId: string) => {
    return movements
      .filter(m => m.product_id === productId && m.warehouse_id === warehouseId)
      .reduce((sum, m) => sum + (m.type === 'in' ? m.quantity : -m.quantity), 0);
  };

  // Calculate total quantity from all movements
  const getProductTotalQty = (productId: string) => {
    return movements
      .filter(m => m.product_id === productId)
      .reduce((sum, m) => sum + (m.type === 'in' ? m.quantity : -m.quantity), 0);
  };

  // Get display qty based on selected warehouse
  const getDisplayQty = (productId: string) => {
    if (selectedWarehouse) return getWarehouseQty(productId, selectedWarehouse);
    return getProductTotalQty(productId);
  };

  // Filter products: if warehouse selected, only show products with movements in that warehouse
  const filteredProducts = selectedWarehouse
    ? products.filter(p => movements.some(m => m.product_id === p.id && m.warehouse_id === selectedWarehouse))
    : products;

  const lowStock = filteredProducts.filter(p => getDisplayQty(p.id) <= 10);

  const getProductSuppliers = (productId: string) => {
    const supplierIds = [...new Set(movements.filter(m => m.product_id === productId && m.entity_type === 'supplier' && (!selectedWarehouse || m.warehouse_id === selectedWarehouse)).map(m => m.entity_id))];
    return supplierIds.map(id => getSupplierName(id)).join('، ') || '-';
  };

  const getProductClients = (productId: string) => {
    const clientIds = [...new Set(movements.filter(m => m.product_id === productId && m.entity_type === 'client' && (!selectedWarehouse || m.warehouse_id === selectedWarehouse)).map(m => m.entity_id))];
    return clientIds.map(id => getClientName(id)).join('، ') || '-';
  };
  const outOfStock = filteredProducts.filter(p => getDisplayQty(p.id) === 0);

  // Calculate warehouse stock from movements
  const warehouseStock = (selectedWarehouse ? warehouses.filter(w => w.id === selectedWarehouse) : warehouses).map(w => {
    const whProductIds = [...new Set(movements.filter(m => m.warehouse_id === w.id).map(m => m.product_id))];
    const totalQty = whProductIds.reduce((sum, pid) => sum + getWarehouseQty(pid, w.id), 0);
    return { name: w.name, products: whProductIds.length, totalQty };
  });

  // ============ EXPORT FUNCTIONS ============
  const checkWarehouseSelected = () => {
    if (!selectedWarehouse) {
      toast({ title: 'تنبيه', description: 'يجب اختيار المخزن أولاً قبل التصدير', variant: 'destructive' });
      return false;
    }
    return true;
  };
  const exportExcel = (data: any[], sheetName: string, fileName: string) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportPdf = async (title: string, headers: string[], rows: string[][], managerName?: string) => {
    const html = `
      <html dir="rtl"><head><meta charset="UTF-8"/><title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Cairo','Segoe UI',Tahoma,sans-serif;padding:30px;color:#1a1a2e;background:#fff}
        .header{text-align:center;margin-bottom:20px;border-bottom:3px solid hsl(174,62%,38%);padding-bottom:10px}
        .header h1{font-size:22px;color:hsl(174,62%,38%);margin-bottom:4px}
        .header p{font-size:12px;color:#666}
        table{width:100%;border-collapse:collapse;margin-top:15px;font-size:13px}
        th,td{padding:8px 10px;border:1px solid #ddd;text-align:right}
        th{background:#f0f4f8;font-weight:bold;color:#1a1a2e}
        tr:nth-child(even){background:#fafbfc}
        .signatures{display:flex;justify-content:space-around;margin-top:40px;padding-top:20px;border-top:1px dashed #ccc}
        .sig-block{text-align:center;width:40%}
        .sig-block .title{font-size:13px;font-weight:700;color:#333;margin-bottom:8px}
        .sig-block .name{font-size:13px;font-weight:700;color:#1a1a2e;min-height:20px;margin-bottom:6px}
        .sig-block .line{border-bottom:1px solid #333;width:100%;margin-top:30px}
        .footer{margin-top:25px;font-size:11px;text-align:center;color:#888;border-top:1px solid #ddd;padding-top:8px}
      </style></head><body>
      <div class="header"><h1>نظام إدارة المخازن</h1><p>${title} - المخزن: ${getWarehouseName(selectedWarehouse)} - ${new Date().toLocaleDateString('ar-SA')}</p></div>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="signatures">
        <div class="sig-block">
          <div class="title">مسؤول المخازن:</div>
          <div class="name">${managerName || ''}</div>
          <div class="line"></div>
        </div>
        <div class="sig-block">
          <div class="title">التوقيع:</div>
          <div class="name"></div>
          <div class="line"></div>
        </div>
      </div>
      <div class="footer">تم الطباعة بتاريخ ${new Date().toLocaleDateString('ar-SA')} | نظام إدارة المخازن - برمجة مفيد الزري 778492884</div>
      </body></html>`;

    try {
      if (Capacitor.isNativePlatform()) {
        toast({ title: 'جاري المعالجة', description: 'يتم الآن تحضير التقرير بصيغة PDF...' });
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '-10000px';
        tempDiv.style.width = '800px';
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
        let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'print-iframe';
          iframe.style.position = 'fixed';
          iframe.style.top = '-10000px';
          document.body.appendChild(iframe);
        }
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
          setTimeout(() => iframe.contentWindow?.print(), 500);
        }
      }
    } catch (error) {
      console.error('PDF error:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الطباعة', variant: 'destructive' });
    }
  };

  const exportProductsExcel = () => {
    if (!checkWarehouseSelected()) return;
    exportExcel(filteredProducts.map(p => ({
      'المنتج': p.name, 'الكود': p.code, 'الباركود': p.barcode,
      'الصنف': getCategoryName(p.category_id || ''),
      'المورد': getProductSuppliers(p.id),
      'جهة الصرف': getProductClients(p.id),
      'الكمية المتبقية': getDisplayQty(p.id),
      'المخزن': getWarehouseName(selectedWarehouse),
    })), 'المنتجات', 'تقرير_المنتجات');
  };

  const exportProductsPdf = () => {
    if (!checkWarehouseSelected()) return;
    exportPdf('تقرير المنتجات',
      ['م', 'المنتج', 'الكود', 'الصنف', 'المورد', 'جهة الصرف', 'الكمية المتبقية'],
      filteredProducts.map((p, i) => [
        String(i + 1), p.name, p.code, getCategoryName(p.category_id || ''),
        getProductSuppliers(p.id), getProductClients(p.id), String(getDisplayQty(p.id)),
      ])
    );
  };

  const exportMovementsExcel = () => {
    if (!checkWarehouseSelected()) return;
    exportExcel(filteredMovements.map(m => ({
      'التاريخ': m.date, 'النوع': m.type === 'in' ? 'وارد' : 'صادر',
      'المنتج': getProductName(m.product_id), 'الكمية': m.quantity,
      'المخزن': getWarehouseName(m.warehouse_id),
      'المورد': m.entity_type === 'supplier' ? getSupplierName(m.entity_id) : '-',
      'جهة الصرف': m.entity_type === 'client' ? getClientName(m.entity_id) : '-',
      'ملاحظات': m.notes || ''
    })), 'الحركات', 'تقرير_الحركات');
  };

  const exportMovementsPdf = () => {
    if (!checkWarehouseSelected()) return;
    exportPdf('تقرير حركة المخزون',
      ['م', 'التاريخ', 'النوع', 'المنتج', 'الكمية', 'المخزن', 'المورد', 'جهة الصرف'],
      filteredMovements.map((m, i) => [
        String(i + 1), m.date, m.type === 'in' ? 'وارد' : 'صادر',
        getProductName(m.product_id), String(m.quantity), getWarehouseName(m.warehouse_id),
        m.entity_type === 'supplier' ? getSupplierName(m.entity_id) : '-',
        m.entity_type === 'client' ? getClientName(m.entity_id) : '-'
      ])
    );
  };

  const exportWarehousesExcel = () => {
    if (!checkWarehouseSelected()) return;
    exportExcel(warehouseStock.map(w => ({
      'المخزن': w.name, 'عدد المنتجات': w.products,
      'إجمالي الكميات': w.totalQty,
    })), 'المخازن', 'تقرير_المخازن');
  };

  const exportWarehousesPdf = () => {
    if (!checkWarehouseSelected()) return;
    exportPdf('تقرير المخازن',
      ['المخزن', 'عدد المنتجات', 'إجمالي الكميات'],
      warehouseStock.map(w => [w.name, String(w.products), String(w.totalQty)])
    );
  };

  const exportLowStockExcel = () => {
    if (!checkWarehouseSelected()) return;
    exportExcel(lowStock.map(p => ({
      'المنتج': p.name, 'الكود': p.code, 'الكمية': getDisplayQty(p.id),
      'المخزن': getWarehouseName(selectedWarehouse), 'الحالة': getDisplayQty(p.id) === 0 ? 'نفذ' : 'منخفض'
    })), 'منخفض المخزون', 'تقرير_المخزون_المنخفض');
  };

  const exportLowStockPdf = () => {
    if (!checkWarehouseSelected()) return;
    exportPdf('تقرير المنتجات منخفضة المخزون',
      ['م', 'المنتج', 'الكود', 'الكمية', 'المخزن', 'الحالة'],
      lowStock.map((p, i) => [
        String(i + 1), p.name, p.code, String(getDisplayQty(p.id)),
        getWarehouseName(selectedWarehouse), getDisplayQty(p.id) === 0 ? 'نفذ' : 'منخفض'
      ])
    );
  };

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'products', label: 'المنتجات', icon: Package },
    { id: 'movements', label: 'الحركات', icon: ArrowDownCircle },
    { id: 'warehouses', label: 'المخازن', icon: Building2 },
    { id: 'low-stock', label: 'المخزون المنخفض', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4 sm:space-y-5" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <label className="text-sm font-semibold text-foreground whitespace-nowrap">المخزن:</label>
          <select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">-- اختر المخزن --</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        {!selectedWarehouse && (
          <span className="text-xs text-destructive font-medium">⚠ يجب اختيار المخزن للتصدير</span>
        )}
        <Button onClick={handleRefresh} variant="outline" className="text-sm shrink-0" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />تحديث
        </Button>
      </div>

      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              tab === t.id ? 'gradient-primary text-primary-foreground shadow-elevated' : 'bg-card text-muted-foreground border border-border hover:bg-secondary'
            }`}>
            <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: 'إجمالي المنتجات', value: filteredProducts.length },
              { label: 'إجمالي المخزون', value: filteredProducts.reduce((s, p) => s + getDisplayQty(p.id), 0) },
              { label: 'الأصناف', value: categories.length },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border shadow-card text-center">
                <div className="text-lg sm:text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-5 border border-border shadow-card">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4">توزيع المنتجات حسب الصنف</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categories.map(c => ({ name: c.name, count: filteredProducts.filter(p => p.category_id === c.id).length }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(174,62%,38%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg sm:rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border gap-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">جدول المنتجات</h3>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={exportProductsExcel} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Excel
                </Button>
                <Button size="sm" variant="outline" onClick={exportProductsPdf} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[600px]">
                <thead><tr className="bg-secondary/50 border-b border-border">
                  <th className="text-right p-2 sm:p-3 font-semibold">م</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">المنتج</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">الكود</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">الصنف</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">المورد</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">جهة الصرف</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">الكمية المتبقية</th>
                </tr></thead>
                <tbody>
                  {filteredProducts.map((p, i) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="p-2 sm:p-3">{i + 1}</td>
                      <td className="p-2 sm:p-3 font-medium">{p.name}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground font-mono text-[10px] sm:text-xs">{p.code}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{getCategoryName(p.category_id || '')}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{getProductSuppliers(p.id)}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{getProductClients(p.id)}</td>
                      <td className="p-2 sm:p-3">
                        {(() => { const qty = getDisplayQty(p.id); return (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          qty === 0 ? 'bg-destructive/10 text-destructive' :
                          qty <= 10 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        }`}>{qty}</span>
                        ); })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== MOVEMENTS REPORT (Rest of the tabs follow same pattern) ========== */}
      {tab === 'movements' && (
        <div className="space-y-4 sm:space-y-5">
           {/* ... Same content for Movements as original code ... */}
           {/* (Skipped for brevity but same as your original 650-line version) */}
           <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              <div className="flex gap-2 flex-1">
                <div className="flex-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground block mb-1">من تاريخ</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground block mb-1">إلى تاريخ</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                </div>
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden self-start sm:self-auto">
                {(['all', 'in', 'out'] as const).map(f => (
                  <button key={f} onClick={() => setMovementFilter(f)}
                    className={`px-3 py-1.5 sm:py-2 text-xs font-medium transition-colors ${
                      movementFilter === f ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary'
                    }`}>
                    {f === 'all' ? 'الكل' : f === 'in' ? 'وارد' : 'صادر'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg sm:rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border gap-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">جدول الحركات ({filteredMovements.length})</h3>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={exportMovementsExcel} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Excel
                </Button>
                <Button size="sm" variant="outline" onClick={exportMovementsPdf} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                <thead><tr className="bg-secondary/50 border-b border-border">
                  <th className="text-right p-2 sm:p-3 font-semibold">م</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">التاريخ</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">النوع</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">المنتج</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">الكمية</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">المخزن</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">المورد</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">جهة الصرف</th>
                </tr></thead>
                <tbody>
                  {filteredMovements.map((m, i) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="p-2 sm:p-3">{i + 1}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{m.date}</td>
                      <td className="p-2 sm:p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.type === 'in' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}>{m.type === 'in' ? 'وارد' : 'صادر'}</span>
                      </td>
                      <td className="p-2 sm:p-3 font-medium">{getProductName(m.product_id)}</td>
                      <td className="p-2 sm:p-3 font-bold">{m.quantity}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{getWarehouseName(m.warehouse_id)}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{m.entity_type === 'supplier' ? getSupplierName(m.entity_id) : '-'}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{m.entity_type === 'client' ? getClientName(m.entity_id) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== WAREHOUSES TAB ========== */}
      {tab === 'warehouses' && (
        <div className="space-y-4 sm:space-y-5">
           <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-5 border border-border shadow-card">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4">مقارنة المخازن</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={warehouseStock}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="totalQty" name="الكميات" fill="hsl(174,62%,38%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="products" name="المنتجات" fill="hsl(37,95%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg sm:rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border gap-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">ملخص المخازن</h3>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={exportWarehousesExcel} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Excel
                </Button>
                <Button size="sm" variant="outline" onClick={exportWarehousesPdf} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead><tr className="bg-secondary/50 border-b border-border">
                  <th className="text-right p-2 sm:p-3 font-semibold">المخزن</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">عدد المنتجات</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">إجمالي الكميات</th>
                </tr></thead>
                <tbody>
                  {warehouseStock.map((w, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="p-2 sm:p-3 font-medium">{w.name}</td>
                      <td className="p-2 sm:p-3">{w.products}</td>
                      <td className="p-2 sm:p-3 font-bold">{w.totalQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== LOW STOCK TAB ========== */}
      {tab === 'low-stock' && (
        <div className="space-y-4 sm:space-y-5">
           <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border shadow-card text-center">
              <div className="text-xl sm:text-2xl font-bold text-warning">{lowStock.length - outOfStock.length}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">منخفض الكمية</div>
            </div>
            <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border shadow-card text-center">
              <div className="text-xl sm:text-2xl font-bold text-destructive">{outOfStock.length}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">غير متوفر (نفذ)</div>
            </div>
          </div>
          <div className="bg-card rounded-lg sm:rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border gap-2">
              <h3 className="font-semibold text-foreground flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
                المنتجات منخفضة المخزون ({lowStock.length})
              </h3>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={exportLowStockExcel} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Excel
                </Button>
                <Button size="sm" variant="outline" onClick={exportLowStockPdf} className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[500px]">
                <thead><tr className="bg-secondary/50 border-b border-border">
                  <th className="text-right p-2 sm:p-3 font-semibold">م</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">المنتج</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">الكود</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">الكمية</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">المخزن</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">الحالة</th>
                </tr></thead>
                <tbody>
                  {lowStock.map((p, i) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="p-2 sm:p-3">{i + 1}</td>
                      <td className="p-2 sm:p-3 font-medium">{p.name}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground font-mono text-[10px] sm:text-xs">{p.code}</td>
                      {(() => { const qty = getDisplayQty(p.id); return (<>
                      <td className="p-2 sm:p-3 font-bold text-destructive">{qty}</td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{getWarehouseName(selectedWarehouse)}</td>
                      <td className="p-2 sm:p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${qty === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                          {qty === 0 ? 'نفذ' : 'منخفض'}
                        </span>
                      </td>
                      </>); })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;