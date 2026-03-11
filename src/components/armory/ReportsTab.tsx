import { useArmory } from '@/contexts/ArmoryContext';
import { Button } from '@/components/ui/button';
import { BarChart3, Printer, Download, FileText } from 'lucide-react';
import { printFullReport, exportToExcel } from '@/utils/armoryPrint';

const ReportsTab = () => {
  const ctx = useArmory();
  const { weapons, ammo, movements, warehouses, recipients } = ctx;

  const totalWeapons = weapons.reduce((s, w) => s + w.quantity, 0);
  const totalAmmo = ammo.reduce((s, a) => s + a.totalRounds, 0);
  const totalIn = movements.filter(m => m.operation === 'وارد').length;
  const totalOut = movements.filter(m => m.operation === 'صادر').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الأسلحة', value: totalWeapons, color: 'text-primary' },
          { label: 'إجمالي الذخائر', value: totalAmmo.toLocaleString(), color: 'text-foreground' },
          { label: 'حركات الوارد', value: totalIn, color: 'text-success' },
          { label: 'حركات الصادر', value: totalOut, color: 'text-destructive' },
        ].map((s, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-bold">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-2xl shadow-card p-5 space-y-4">
        <h3 className="font-black text-sm flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> التقارير والتصدير</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => printFullReport(ctx)}>
            <Printer size={20} className="text-primary" />
            <span className="font-bold text-xs">طباعة تقرير شامل</span>
            <span className="text-[10px] text-muted-foreground">الأسلحة + الذخائر + الحركات</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => exportToExcel(ctx)}>
            <Download size={20} className="text-success" />
            <span className="font-bold text-xs">تصدير Excel</span>
            <span className="text-[10px] text-muted-foreground">تصدير كل البيانات</span>
          </Button>
        </div>

        {/* Custody per recipient */}
        {recipients.length > 0 && (
          <div className="mt-4">
            <h4 className="font-black text-xs text-muted-foreground mb-2">تقرير العهدة لكل مستلم:</h4>
            <div className="space-y-2">
              {recipients.map(r => {
                const rMov = movements.filter(m => m.recipientId === r.id);
                return (
                  <div key={r.id} className="flex justify-between items-center p-3 bg-secondary/10 rounded-xl border">
                    <div>
                      <span className="font-bold text-sm">{r.name}</span>
                      <span className="text-xs text-muted-foreground mr-2">({r.militaryId})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{rMov.length} حركة</span>
                      <button className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><FileText size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
