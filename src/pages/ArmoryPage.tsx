import { useState } from 'react';
import { Search, ShieldCheck, Target, Warehouse, Users, History, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// استيراد الـ Provider (تأكد من المسار الصحيح)
import { ArmoryProvider } from '@/contexts/ArmoryContext'; 

import WeaponsTab from '@/components/armory/WeaponsTab';
import AmmoTab from '@/components/armory/AmmoTab';
import WarehousesTab from '@/components/armory/ArmoryWarehousesTab';
import RecipientsTab from '@/components/armory/RecipientsTab';
import MovementsTab from '@/components/armory/MovementsTab';
import ReportsTab from '@/components/armory/ReportsTab';

const ArmoryPage = () => {
  const [search, setSearch] = useState('');

  return (
    // نضع الـ Provider هنا لضمان وصول البيانات لكل التبويبات بالأسفل
    <ArmoryProvider> 
      <div className="space-y-6 pb-20 md:pb-10 animate-in fade-in duration-700" dir="rtl">
        <Tabs defaultValue="weapons" className="w-full">
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6 bg-card/50 p-2 rounded-2xl border border-dashed">
            <TabsList className="bg-secondary/50 p-1 rounded-xl h-auto flex flex-wrap gap-1">
              <TabsTrigger value="weapons" className="py-2.5 px-3 rounded-lg font-black text-[11px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <ShieldCheck size={14} /> الأسلحة
              </TabsTrigger>
              <TabsTrigger value="ammo" className="py-2.5 px-3 rounded-lg font-black text-[11px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Target size={14} /> الذخائر
              </TabsTrigger>
              <TabsTrigger value="warehouses" className="py-2.5 px-3 rounded-lg font-black text-[11px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Warehouse size={14} /> المخازن
              </TabsTrigger>
              <TabsTrigger value="recipients" className="py-2.5 px-3 rounded-lg font-black text-[11px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Users size={14} /> المستلمون
              </TabsTrigger>
              <TabsTrigger value="movements" className="py-2.5 px-3 rounded-lg font-black text-[11px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <History size={14} /> الحركات
              </TabsTrigger>
              <TabsTrigger value="reports" className="py-2.5 px-3 rounded-lg font-black text-[11px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <BarChart3 size={14} /> التقارير
              </TabsTrigger>
            </TabsList>

            <div className="relative sm:w-72">
              <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." className="pr-10 h-10 rounded-xl border-primary/10 bg-background text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <TabsContent value="weapons" className="mt-0 focus-visible:outline-none"><WeaponsTab search={search} /></TabsContent>
          <TabsContent value="ammo" className="mt-0 focus-visible:outline-none"><AmmoTab search={search} /></TabsContent>
          <TabsContent value="warehouses" className="mt-0 focus-visible:outline-none"><WarehousesTab /></TabsContent>
          <TabsContent value="recipients" className="mt-0 focus-visible:outline-none"><RecipientsTab search={search} /></TabsContent>
          <TabsContent value="movements" className="mt-0 focus-visible:outline-none"><MovementsTab search={search} /></TabsContent>
          <TabsContent value="reports" className="mt-0 focus-visible:outline-none"><ReportsTab /></TabsContent>
        </Tabs>
      </div>
    </ArmoryProvider>
  );
};

export default ArmoryPage;
