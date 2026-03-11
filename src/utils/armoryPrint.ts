import { Weapon, Ammo, ArmoryMovement, ArmoryWarehouse, Recipient } from '@/types/armory';
import * as XLSX from 'xlsx';

const printStyles = `
  <style>
    body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px; color: #1a1a2e; }
    h1 { color: #2d8a7a; border-bottom: 3px solid #2d8a7a; padding-bottom: 10px; }
    h2 { color: #2d8a7a; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #2d8a7a; color: white; padding: 10px; text-align: right; font-weight: bold; }
    td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; text-align: right; }
    tr:nth-child(even) { background: #f8f9fa; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-in { background: #d4edda; color: #155724; }
    .badge-out { background: #f8d7da; color: #721c24; }
    .badge-transfer { background: #cce5ff; color: #004085; }
    .badge-return { background: #fff3cd; color: #856404; }
    .stats { display: flex; gap: 15px; margin: 15px 0; flex-wrap: wrap; }
    .stat-card { background: #f0faf8; border: 1px solid #2d8a7a33; border-radius: 10px; padding: 12px 20px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 900; color: #2d8a7a; }
    .stat-label { font-size: 11px; color: #666; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 10px; }
    @media print { body { padding: 10px; } }
  </style>
`;

const opBadge = (op: string) => {
  const cls = op === 'وارد' ? 'badge-in' : op === 'صادر' ? 'badge-out' : op === 'تحويل' ? 'badge-transfer' : 'badge-return';
  return `<span class="badge ${cls}">${op}</span>`;
};

function openPrint(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">${printStyles}</head><body>${html}<div class="footer">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')}</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

export function printWeaponReport(w: Weapon, warehouseName: string, movements: ArmoryMovement[]) {
  const movRows = movements.map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${m.quantity}</td><td>${m.notes || '-'}</td></tr>`).join('');
  openPrint(`
    <h1>تقرير سلاح: ${w.name}</h1>
    <table><tr><td><strong>النوع:</strong></td><td>${w.type}</td><td><strong>الرقم التسلسلي:</strong></td><td>${w.serialNumber}</td></tr>
    <tr><td><strong>الحالة:</strong></td><td>${w.status}</td><td><strong>المخزن:</strong></td><td>${warehouseName}</td></tr>
    <tr><td><strong>الكمية:</strong></td><td colspan="3"><strong>${w.quantity}</strong></td></tr></table>
    <h2>الحركات (${movements.length})</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الكمية</th><th>ملاحظات</th></tr></thead><tbody>${movRows || '<tr><td colspan="4" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
  `);
}

export function printAmmoReport(a: Ammo, warehouseName: string, movements: ArmoryMovement[]) {
  const movRows = movements.map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${m.quantity}</td><td>${m.notes || '-'}</td></tr>`).join('');
  openPrint(`
    <h1>تقرير ذخيرة: ${a.type} (${a.caliber})</h1>
    <table><tr><td><strong>العيار:</strong></td><td>${a.caliber}</td><td><strong>المخزن:</strong></td><td>${warehouseName}</td></tr>
    <tr><td><strong>عدد الصناديق:</strong></td><td>${a.boxCount}</td><td><strong>طلقات/صندوق:</strong></td><td>${a.roundsPerBox}</td></tr>
    <tr><td><strong>الإجمالي:</strong></td><td colspan="3"><strong>${a.totalRounds.toLocaleString()}</strong></td></tr></table>
    <h2>الحركات (${movements.length})</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الكمية</th><th>ملاحظات</th></tr></thead><tbody>${movRows || '<tr><td colspan="4" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
  `);
}

export function printMovementReport(m: ArmoryMovement, itemName: string, warehouseName: string, recipientOrSupplier: string) {
  openPrint(`
    <h1>تقرير حركة مخزنية</h1>
    <table>
    <tr><td><strong>العملية:</strong></td><td>${opBadge(m.operation)}</td></tr>
    <tr><td><strong>الصنف:</strong></td><td>${itemName}</td></tr>
    <tr><td><strong>الكمية:</strong></td><td><strong>${m.quantity}</strong></td></tr>
    <tr><td><strong>المخزن:</strong></td><td>${warehouseName}</td></tr>
    <tr><td><strong>المستلم/المورد:</strong></td><td>${recipientOrSupplier}</td></tr>
    <tr><td><strong>التاريخ:</strong></td><td>${m.date}</td></tr>
    <tr><td><strong>رقم المستند:</strong></td><td>${m.documentNumber || '-'}</td></tr>
    <tr><td><strong>السبب:</strong></td><td>${m.reason || '-'}</td></tr>
    <tr><td><strong>ملاحظات:</strong></td><td>${m.notes || '-'}</td></tr>
    </table>
  `);
}

export function printRecipientReport(r: Recipient, movements: ArmoryMovement[], getItemName: (t: 'سلاح' | 'ذخيرة', id: string) => string, getWarehouseName: (id: string) => string) {
  const movRows = movements.map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${getItemName(m.itemType, m.itemId)}</td><td>${m.quantity}</td><td>${getWarehouseName(m.warehouseId)}</td></tr>`).join('');
  openPrint(`
    <h1>تقرير عهدة: ${r.name}</h1>
    <table><tr><td><strong>الرقم العسكري:</strong></td><td>${r.militaryId}</td><td><strong>الرتبة:</strong></td><td>${r.rank || '-'}</td></tr>
    <tr><td><strong>الوحدة:</strong></td><td>${r.unit}</td><td><strong>الهاتف:</strong></td><td>${r.phone || '-'}</td></tr></table>
    <h2>الحركات (${movements.length})</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الصنف</th><th>الكمية</th><th>المخزن</th></tr></thead><tbody>${movRows || '<tr><td colspan="5" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
  `);
}

interface FullCtx {
  weapons: Weapon[]; ammo: Ammo[]; movements: ArmoryMovement[]; warehouses: ArmoryWarehouse[]; recipients: Recipient[];
  getWarehouseName: (id: string) => string; getItemName: (t: 'سلاح' | 'ذخيرة', id: string) => string; getRecipientName: (id: string) => string;
}

export function printFullReport(ctx: FullCtx) {
  const { weapons, ammo, movements, getWarehouseName, getItemName, getRecipientName } = ctx;
  const wRows = weapons.map(w => `<tr><td>${w.name}</td><td>${w.type}</td><td>${w.serialNumber}</td><td>${w.quantity}</td><td>${w.status}</td><td>${getWarehouseName(w.warehouseId)}</td></tr>`).join('');
  const aRows = ammo.map(a => `<tr><td>${a.type}</td><td>${a.caliber}</td><td>${a.totalRounds.toLocaleString()}</td><td>${getWarehouseName(a.warehouseId)}</td></tr>`).join('');
  const mRows = movements.slice(0, 50).map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${getItemName(m.itemType, m.itemId)}</td><td>${m.quantity}</td><td>${m.recipientId ? getRecipientName(m.recipientId) : m.supplierId || '-'}</td></tr>`).join('');

  openPrint(`
    <h1>التقرير الشامل - مخازن التسليح</h1>
    <div class="stats">
      <div class="stat-card"><div class="stat-value">${weapons.reduce((s,w) => s+w.quantity, 0)}</div><div class="stat-label">الأسلحة</div></div>
      <div class="stat-card"><div class="stat-value">${ammo.reduce((s,a) => s+a.totalRounds, 0).toLocaleString()}</div><div class="stat-label">الذخائر</div></div>
      <div class="stat-card"><div class="stat-value">${movements.length}</div><div class="stat-label">الحركات</div></div>
    </div>
    <h2>الأسلحة</h2>
    <table><thead><tr><th>الاسم</th><th>النوع</th><th>الرقم التسلسلي</th><th>الكمية</th><th>الحالة</th><th>المخزن</th></tr></thead><tbody>${wRows || '<tr><td colspan="6" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
    <h2>الذخائر</h2>
    <table><thead><tr><th>النوع</th><th>العيار</th><th>الإجمالي</th><th>المخزن</th></tr></thead><tbody>${aRows || '<tr><td colspan="4" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
    <h2>آخر الحركات</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الصنف</th><th>الكمية</th><th>المستلم/المورد</th></tr></thead><tbody>${mRows || '<tr><td colspan="5" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
  `);
}

export function exportToExcel(ctx: FullCtx) {
  const { weapons, ammo, movements, getWarehouseName, getItemName, getRecipientName } = ctx;
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(weapons.map(w => ({
    'الاسم': w.name, 'النوع': w.type, 'الرقم التسلسلي': w.serialNumber,
    'الكمية': w.quantity, 'الحالة': w.status, 'المخزن': getWarehouseName(w.warehouseId)
  })));
  XLSX.utils.book_append_sheet(wb, ws1, 'الأسلحة');

  const ws2 = XLSX.utils.json_to_sheet(ammo.map(a => ({
    'النوع': a.type, 'العيار': a.caliber, 'الصناديق': a.boxCount,
    'طلقات/صندوق': a.roundsPerBox, 'الإجمالي': a.totalRounds, 'المخزن': getWarehouseName(a.warehouseId)
  })));
  XLSX.utils.book_append_sheet(wb, ws2, 'الذخائر');

  const ws3 = XLSX.utils.json_to_sheet(movements.map(m => ({
    'التاريخ': m.date, 'العملية': m.operation, 'الصنف': getItemName(m.itemType, m.itemId),
    'الكمية': m.quantity, 'المستلم': m.recipientId ? getRecipientName(m.recipientId) : m.supplierId || '',
    'رقم المستند': m.documentNumber || '', 'المخزن': getWarehouseName(m.warehouseId)
  })));
  XLSX.utils.book_append_sheet(wb, ws3, 'الحركات');

  XLSX.writeFile(wb, `تقرير_التسليح_${new Date().toISOString().split('T')[0]}.xlsx`);
}
