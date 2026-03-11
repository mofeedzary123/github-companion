import { Weapon, Ammo, ArmoryMovement, ArmoryWarehouse, Recipient } from '@/types/armory';
import * as XLSX from 'xlsx';

const printStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; color: #1a1a2e; background: #fff; }
    .header { text-align: center; border-bottom: 3px double #2d8a7a; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #2d8a7a; font-size: 22px; margin-bottom: 5px; }
    .header .subtitle { color: #666; font-size: 12px; }
    .doc-number { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; color: #555; }
    h2 { color: #2d8a7a; margin-top: 20px; font-size: 16px; border-bottom: 1px solid #2d8a7a44; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #2d8a7a; color: white; padding: 10px; text-align: right; font-weight: bold; font-size: 12px; }
    td { padding: 8px 10px; border: 1px solid #ddd; text-align: right; font-size: 12px; }
    tr:nth-child(even) { background: #f8f9fa; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 15px 0; }
    .info-item { display: flex; gap: 8px; padding: 6px 10px; background: #f0faf8; border-radius: 6px; font-size: 12px; }
    .info-item strong { color: #2d8a7a; min-width: 100px; }
    .badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-in { background: #d4edda; color: #155724; }
    .badge-out { background: #f8d7da; color: #721c24; }
    .badge-transfer { background: #cce5ff; color: #004085; }
    .badge-return { background: #fff3cd; color: #856404; }
    .stats { display: flex; gap: 15px; margin: 15px 0; flex-wrap: wrap; }
    .stat-card { background: #f0faf8; border: 1px solid #2d8a7a33; border-radius: 10px; padding: 12px 20px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 900; color: #2d8a7a; }
    .stat-label { font-size: 11px; color: #666; }
    .signature-area { display: flex; justify-content: space-around; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc; }
    .signature-box { text-align: center; min-width: 150px; }
    .signature-box .line { border-bottom: 1px solid #333; margin-top: 40px; margin-bottom: 5px; }
    .signature-box .label { font-size: 11px; color: #666; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 10px; }
    @media print { body { padding: 15px; } }
  </style>
`;

const opBadge = (op: string) => {
  const cls = op === 'وارد' ? 'badge-in' : op === 'صادر' ? 'badge-out' : op === 'تحويل' ? 'badge-transfer' : 'badge-return';
  return `<span class="badge ${cls}">${op}</span>`;
};

const opLabel = (op: string) => {
  if (op === 'وارد') return 'سند وارد';
  if (op === 'صادر') return 'سند صرف';
  if (op === 'تحويل') return 'سند تحويل';
  return 'سند إرجاع';
};

function openPrint(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">${printStyles}</head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

export function printWeaponReport(w: Weapon, warehouseName: string, movements: ArmoryMovement[]) {
  const movRows = movements.map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${m.quantity}</td><td>${m.notes || '-'}</td></tr>`).join('');
  openPrint(`
    <div class="header">
      <h1>تقرير سلاح</h1>
      <div class="subtitle">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')}</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><strong>اسم السلاح:</strong> ${w.name}</div>
      <div class="info-item"><strong>نوع السلاح:</strong> ${w.type}</div>
      <div class="info-item"><strong>رقم السلاح:</strong> ${w.serialNumber}</div>
      <div class="info-item"><strong>الحالة:</strong> ${w.status}</div>
      <div class="info-item"><strong>المخزن:</strong> ${warehouseName}</div>
      <div class="info-item"><strong>الكمية:</strong> ${w.quantity}</div>
    </div>
    <h2>سجل الحركات (${movements.length})</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الكمية</th><th>ملاحظات</th></tr></thead><tbody>${movRows || '<tr><td colspan="4" style="text-align:center">لا توجد حركات</td></tr>'}</tbody></table>
    <div class="signature-area">
      <div class="signature-box"><div class="line"></div><div class="label">أمين المخزن</div></div>
      <div class="signature-box"><div class="line"></div><div class="label">المسؤول</div></div>
    </div>
    <div class="footer">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')} • تقرير آلي</div>
  `);
}

export function printAmmoReport(a: Ammo, warehouseName: string, movements: ArmoryMovement[]) {
  const movRows = movements.map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${m.quantity}</td><td>${m.notes || '-'}</td></tr>`).join('');
  openPrint(`
    <div class="header">
      <h1>تقرير ذخيرة: ${a.type}</h1>
      <div class="subtitle">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')}</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><strong>نوع الذخيرة:</strong> ${a.type}</div>
      <div class="info-item"><strong>العيار:</strong> ${a.caliber}</div>
      <div class="info-item"><strong>عدد الصناديق:</strong> ${a.boxCount}</div>
      <div class="info-item"><strong>طلقات/صندوق:</strong> ${a.roundsPerBox}</div>
      <div class="info-item"><strong>الإجمالي:</strong> ${a.totalRounds.toLocaleString()}</div>
      <div class="info-item"><strong>المخزن:</strong> ${warehouseName}</div>
    </div>
    <h2>سجل الحركات (${movements.length})</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الكمية</th><th>ملاحظات</th></tr></thead><tbody>${movRows || '<tr><td colspan="4" style="text-align:center">لا توجد حركات</td></tr>'}</tbody></table>
    <div class="signature-area">
      <div class="signature-box"><div class="line"></div><div class="label">أمين المخزن</div></div>
      <div class="signature-box"><div class="line"></div><div class="label">المسؤول</div></div>
    </div>
    <div class="footer">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')} • تقرير آلي</div>
  `);
}

export function printMovementReport(m: ArmoryMovement, itemName: string, warehouseName: string, recipientOrSupplier: string) {
  const docTitle = opLabel(m.operation);
  const isOut = m.operation === 'صادر';
  const isIn = m.operation === 'وارد';
  
  let weaponDetails = '';
  if (m.weaponName || m.weaponSerial || m.weaponType) {
    weaponDetails = `
      <div class="info-item"><strong>اسم السلاح:</strong> ${m.weaponName || '-'}</div>
      <div class="info-item"><strong>رقم السلاح:</strong> ${m.weaponSerial || '-'}</div>
      <div class="info-item"><strong>نوع السلاح:</strong> ${m.weaponType || '-'}</div>
    `;
  }

  openPrint(`
    <div class="header">
      <h1>${docTitle}</h1>
      <div class="subtitle">نظام مخازن التسليح • رقم المستند: ${m.documentNumber || 'بدون رقم'}</div>
    </div>
    <div class="doc-number">
      <span>التاريخ: ${m.date}</span>
      <span>رقم السند: ${m.documentNumber || '-'}</span>
    </div>
    <div class="info-grid">
      <div class="info-item"><strong>نوع العملية:</strong> ${opBadge(m.operation)}</div>
      <div class="info-item"><strong>نوع العهدة:</strong> ${m.itemType}</div>
      <div class="info-item"><strong>الصنف:</strong> ${itemName}</div>
      <div class="info-item"><strong>الكمية:</strong> ${m.quantity}</div>
      <div class="info-item"><strong>المخزن:</strong> ${warehouseName}</div>
      ${isIn ? `<div class="info-item"><strong>المورد / الجهة:</strong> ${recipientOrSupplier}</div>` : ''}
      ${isOut ? `<div class="info-item"><strong>المستلم:</strong> ${recipientOrSupplier}</div>` : ''}
      ${isOut && m.sourceName ? `<div class="info-item"><strong>جهة الصرف:</strong> ${m.sourceName}</div>` : ''}
      ${!isIn && !isOut ? `<div class="info-item"><strong>المستلم/المورد:</strong> ${recipientOrSupplier}</div>` : ''}
      ${weaponDetails}
      ${m.reason ? `<div class="info-item"><strong>السبب:</strong> ${m.reason}</div>` : ''}
      ${m.notes ? `<div class="info-item"><strong>ملاحظات:</strong> ${m.notes}</div>` : ''}
    </div>
    <div class="signature-area">
      <div class="signature-box"><div class="line"></div><div class="label">أمين المخزن</div></div>
      <div class="signature-box"><div class="line"></div><div class="label">${isOut ? 'المستلم' : 'المورد'}</div></div>
      <div class="signature-box"><div class="line"></div><div class="label">المسؤول</div></div>
    </div>
    <div class="footer">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')} • ${docTitle}</div>
  `);
}

export function printRecipientReport(r: Recipient, movements: ArmoryMovement[], getItemName: (t: 'سلاح' | 'ذخيرة', id: string) => string, getWarehouseName: (id: string) => string) {
  const movRows = movements.map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${getItemName(m.itemType, m.itemId)}</td><td>${m.quantity}</td><td>${getWarehouseName(m.warehouseId)}</td></tr>`).join('');
  openPrint(`
    <div class="header">
      <h1>تقرير عهدة: ${r.name}</h1>
      <div class="subtitle">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')}</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><strong>اسم الجندي:</strong> ${r.name}</div>
      <div class="info-item"><strong>الرقم العسكري:</strong> ${r.militaryId}</div>
      <div class="info-item"><strong>الرتبة:</strong> ${r.rank || '-'}</div>
      <div class="info-item"><strong>الوحدة:</strong> ${r.unit}</div>
      ${r.weaponName ? `<div class="info-item"><strong>اسم السلاح:</strong> ${r.weaponName}</div>` : ''}
      ${r.weaponSerial ? `<div class="info-item"><strong>رقم السلاح:</strong> ${r.weaponSerial}</div>` : ''}
      ${r.weaponType ? `<div class="info-item"><strong>نوع السلاح:</strong> ${r.weaponType}</div>` : ''}
      ${r.phone ? `<div class="info-item"><strong>الهاتف:</strong> ${r.phone}</div>` : ''}
    </div>
    <h2>سجل الحركات (${movements.length})</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الصنف</th><th>الكمية</th><th>المخزن</th></tr></thead><tbody>${movRows || '<tr><td colspan="5" style="text-align:center">لا توجد حركات</td></tr>'}</tbody></table>
    <div class="signature-area">
      <div class="signature-box"><div class="line"></div><div class="label">أمين المخزن</div></div>
      <div class="signature-box"><div class="line"></div><div class="label">المستلم</div></div>
    </div>
    <div class="footer">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')} • تقرير عهدة</div>
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
  const mRows = movements.slice(0, 50).map(m => `<tr><td>${m.date}</td><td>${opBadge(m.operation)}</td><td>${getItemName(m.itemType, m.itemId)}</td><td>${m.quantity}</td><td>${m.recipientId ? getRecipientName(m.recipientId) : m.sourceName || m.supplierId || '-'}</td></tr>`).join('');

  openPrint(`
    <div class="header">
      <h1>التقرير الشامل - مخازن التسليح</h1>
      <div class="subtitle">${new Date().toLocaleDateString('ar')}</div>
    </div>
    <div class="stats">
      <div class="stat-card"><div class="stat-value">${weapons.reduce((s,w) => s+w.quantity, 0)}</div><div class="stat-label">الأسلحة</div></div>
      <div class="stat-card"><div class="stat-value">${ammo.reduce((s,a) => s+a.totalRounds, 0).toLocaleString()}</div><div class="stat-label">الذخائر</div></div>
      <div class="stat-card"><div class="stat-value">${movements.length}</div><div class="stat-label">الحركات</div></div>
    </div>
    <h2>الأسلحة</h2>
    <table><thead><tr><th>الاسم</th><th>النوع</th><th>رقم السلاح</th><th>الكمية</th><th>الحالة</th><th>المخزن</th></tr></thead><tbody>${wRows || '<tr><td colspan="6" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
    <h2>الذخائر</h2>
    <table><thead><tr><th>النوع</th><th>العيار</th><th>الإجمالي</th><th>المخزن</th></tr></thead><tbody>${aRows || '<tr><td colspan="4" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
    <h2>آخر الحركات</h2>
    <table><thead><tr><th>التاريخ</th><th>العملية</th><th>الصنف</th><th>الكمية</th><th>المستلم/المورد</th></tr></thead><tbody>${mRows || '<tr><td colspan="5" style="text-align:center">لا يوجد</td></tr>'}</tbody></table>
    <div class="signature-area">
      <div class="signature-box"><div class="line"></div><div class="label">أمين المخزن</div></div>
      <div class="signature-box"><div class="line"></div><div class="label">المسؤول</div></div>
    </div>
    <div class="footer">نظام مخازن التسليح • ${new Date().toLocaleDateString('ar')} • تقرير شامل</div>
  `);
}

export function exportToExcel(ctx: FullCtx) {
  const { weapons, ammo, movements, getWarehouseName, getItemName, getRecipientName } = ctx;
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(weapons.map(w => ({
    'الاسم': w.name, 'النوع': w.type, 'رقم السلاح': w.serialNumber,
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
    'الكمية': m.quantity, 'المستلم': m.recipientId ? getRecipientName(m.recipientId) : m.sourceName || m.supplierId || '',
    'رقم المستند': m.documentNumber || '', 'المخزن': getWarehouseName(m.warehouseId)
  })));
  XLSX.utils.book_append_sheet(wb, ws3, 'الحركات');

  XLSX.writeFile(wb, `تقرير_التسليح_${new Date().toISOString().split('T')[0]}.xlsx`);
}
