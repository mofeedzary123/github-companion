import { useState } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Package, Building2, Truck, ArrowLeftRight, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(174, 62%, 38%)', 'hsl(37, 95%, 55%)', 'hsl(220, 30%, 40%)', 'hsl(152, 60%, 40%)', 'hsl(0, 72%, 51%)'];

const Dashboard = () => {
  const { products, warehouses, suppliers, movements, categories, refreshAll } = useWarehouse();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
    toast({ title: 'تم التحديث', description: 'تم تحديث البيانات بنجاح' });
  };

  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10);
  const outOfStock = products.filter(p => p.quantity === 0);
  const inMovements = movements.filter(m => m.type === 'in');
  const outMovements = movements.filter(m => m.type === 'out');

  const stats = [
    { label: 'المنتجات', value: products.length, icon: Package, color: 'primary' },
    { label: 'المخازن', value: warehouses.length, icon: Building2, color: 'accent' },
    { label: 'الموردين', value: suppliers.length, icon: Truck, color: 'success' },
    { label: 'الحركات', value: movements.length, icon: ArrowLeftRight, color: 'warning' },
    { label: 'إجمالي المخزون', value: totalStock, icon: TrendingUp, color: 'primary' },
    { label: 'منخفض الكمية', value: lowStock.length, icon: AlertTriangle, color: 'destructive' },
  ];

  const categoryData = categories.map(cat => ({
    name: cat.name,
    count: products.filter(p => p.category_id === cat.id).length,
  }));

  const movementData = [
    { name: 'وارد', value: inMovements.reduce((s, m) => s + m.quantity, 0) },
    { name: 'صادر', value: outMovements.reduce((s, m) => s + m.quantity, 0) },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-foreground">لوحة التحكم</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2 text-sm" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border hover:shadow-elevated transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'primary' ? 'gradient-primary' :
                stat.color === 'accent' ? 'gradient-accent' :
                stat.color === 'success' ? 'bg-success' :
                stat.color === 'warning' ? 'bg-warning' : 'bg-destructive'
              }`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">المنتجات حسب الصنف</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(174, 62%, 38%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">حركة المخزون</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={movementData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {movementData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i]} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />منتجات منخفضة الكمية
          </h3>
          {lowStock.length === 0 ? <p className="text-xs sm:text-sm text-muted-foreground">لا توجد منتجات منخفضة</p> : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs sm:text-sm text-foreground">{p.name}</span>
                  <span className="text-xs sm:text-sm font-bold text-warning">{p.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />منتجات غير متوفرة
          </h3>
          {outOfStock.length === 0 ? <p className="text-xs sm:text-sm text-muted-foreground">جميع المنتجات متوفرة</p> : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {outOfStock.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs sm:text-sm text-foreground">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">نفذ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
