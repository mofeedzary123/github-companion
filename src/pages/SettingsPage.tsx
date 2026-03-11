import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Moon, Sun, Info, LogOut, Shield, Users, Pencil, Trash2, Save, UserCog, Download, Upload, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DeveloperFooter from '@/components/DeveloperFooter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  user_id: string;
  display_name: string;
  role: 'admin' | 'employee';
}

const SettingsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [language, setLanguage] = useState('ar');
  const { signOut, user, role, displayName, isAdmin } = useAuth();
  const { products, categories, warehouses, suppliers, clients, movements, refreshAll } = useWarehouse();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'employee'>('employee');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const [editSelf, setEditSelf] = useState(false);
  const [selfName, setSelfName] = useState(displayName);
  const [selfEmail, setSelfEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSelf, setSavingSelf] = useState(false);

  useEffect(() => { 
    setSelfName(displayName); 
    setSelfEmail(user?.email || ''); 
  }, [displayName, user?.email]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', lang);
  };

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name'),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    if (profilesRes.error || rolesRes.error) {
      toast({ title: 'خطأ', description: 'تعذر مزامنة بيانات المستخدمين', variant: 'destructive' });
      setLoadingUsers(false);
      return;
    }
    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const merged: UserProfile[] = profiles.map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      role: (roles.find((r) => r.user_id === p.user_id)?.role as 'admin' | 'employee') || 'employee',
    }));
    setUsers(merged);
    setLoadingUsers(false);
  }, [isAdmin, toast]);

  useEffect(() => {
    if (!isAdmin) return;
    void fetchUsers();
    const channel = supabase
      .channel('settings-users-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => void fetchUsers())
      .subscribe();
    const interval = window.setInterval(() => void fetchUsers(), 15000);
    return () => { supabase.removeChannel(channel); window.clearInterval(interval); };
  }, [isAdmin, fetchUsers]);

  const handleEditUser = (u: UserProfile) => {
    setEditingUser(u); setEditName(u.display_name); setEditRole(u.role); setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const { error: nameErr } = await supabase.from('profiles').update({ display_name: editName }).eq('user_id', editingUser.user_id);
    if (nameErr) { toast({ title: 'خطأ', description: 'فشل تعديل الاسم', variant: 'destructive' }); return; }
    const { error: roleErr } = await supabase.rpc('admin_update_role', { _user_id: editingUser.user_id, _role: editRole });
    if (roleErr) { toast({ title: 'خطأ', description: 'فشل تعديل الصلاحية', variant: 'destructive' }); return; }
    toast({ title: 'تم التعديل بنجاح' });
    setEditDialog(false);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    const { error } = await supabase.rpc('admin_delete_user', { _user_id: deletingUser.user_id });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'تم حذف المستخدم بنجاح' }); fetchUsers(); }
    setDeleteDialog(false);
  };

  const handleSaveSelf = async () => {
    if (!user) return;
    setSavingSelf(true);

    const { error: nameErr } = await supabase.from('profiles').update({ display_name: selfName }).eq('user_id', user.id);
    if (nameErr) { toast({ title: 'خطأ', description: 'فشل تعديل الاسم', variant: 'destructive' }); setSavingSelf(false); return; }

    if (selfEmail.trim() && selfEmail !== user.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email: selfEmail.trim() });
      if (emailErr) {
        toast({ title: 'خطأ في تحديث البريد', description: emailErr.message, variant: 'destructive' });
        setSavingSelf(false);
        return;
      }
      toast({ title: 'تم إرسال رابط التأكيد', description: 'تحقق من بريدك الإلكتروني الجديد لتأكيد التغيير' });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
        setSavingSelf(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: 'خطأ', description: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين', variant: 'destructive' });
        setSavingSelf(false);
        return;
      }
      if (!oldPassword) {
        toast({ title: 'خطأ', description: 'يجب إدخال كلمة المرور الحالية', variant: 'destructive' });
        setSavingSelf(false);
        return;
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: oldPassword });
      if (signInErr) {
        toast({ title: 'خطأ', description: 'كلمة المرور الحالية غير صحيحة', variant: 'destructive' });
        setSavingSelf(false);
        return;
      }
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) {
        toast({ title: 'خطأ', description: passErr.message, variant: 'destructive' });
        setSavingSelf(false);
        return;
      }
    }

    toast({ title: 'تم حفظ التغييرات بنجاح' });
    setEditSelf(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSavingSelf(false);
    window.location.reload();
  };

  const exportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0.2',
      products, categories, warehouses, suppliers, clients, movements,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setRestoreDialog(true);
    }
    e.target.value = '';
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);

      if (data.categories?.length) {
        for (const c of data.categories) {
          await supabase.from('categories').upsert({ id: c.id, name: c.name, description: c.description || '', created_by: c.created_by });
        }
      }
      if (data.warehouses?.length) {
        for (const w of data.warehouses) {
          await supabase.from('warehouses').upsert({ id: w.id, name: w.name, location: w.location || '', manager: w.manager || '', notes: w.notes || '', created_by: w.created_by });
        }
      }
      if (data.suppliers?.length) {
        for (const s of data.suppliers) {
          await supabase.from('suppliers').upsert({ id: s.id, name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '', created_by: s.created_by });
        }
      }
      if (data.clients?.length) {
        for (const c of data.clients) {
          await supabase.from('clients').upsert({ id: c.id, name: c.name, phone: c.phone || '', address: c.address || '', notes: c.notes || '', created_by: c.created_by });
        }
      }
      if (data.products?.length) {
        for (const p of data.products) {
          await supabase.from('products').upsert({ id: p.id, name: p.name, code: p.code, barcode: p.barcode || '', category_id: p.category_id, quantity: p.quantity || 0, warehouse_id: p.warehouse_id, description: p.description || '', created_by: p.created_by });
        }
      }
      if (data.movements?.length) {
        for (const m of data.movements) {
          await supabase.from('stock_movements').upsert({ id: m.id, product_id: m.product_id, warehouse_id: m.warehouse_id, type: m.type, quantity: m.quantity, entity_id: m.entity_id, entity_type: m.entity_type, date: m.date, notes: m.notes || '', created_by: m.created_by });
        }
      }

      await refreshAll();
      toast({ title: 'تمت الاستعادة بنجاح', description: 'تم استعادة جميع البيانات من النسخة الاحتياطية' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل قراءة ملف النسخة الاحتياطية', variant: 'destructive' });
    }
    setRestoreDialog(false);
    setRestoreFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in text-right px-4 pb-10" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">الإعدادات</h1>
        <Button onClick={signOut} variant="destructive" size="sm" className="flex items-center gap-1.5">
          <LogOut className="w-4 h-4" />تسجيل الخروج
        </Button>
      </div>

      <div className="grid gap-6">
        {/* معلومات الحساب - تم تعديل التوزيع هنا لإصلاح المشكلة */}
        <section className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">معلومات الحساب</h2>
            </div>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setEditSelf(true)}>
              <Pencil className="w-4 h-4 ml-1" />تعديل
            </Button>
          </div>
          
          <div className="space-y-4 bg-secondary/30 p-4 rounded-xl">
            {/* استخدام نظام الـ Grid لضمان عدم اختفاء البيانات */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-muted-foreground text-xs sm:text-sm">الاسم:</span>
              <span className="col-span-8 font-semibold text-foreground text-left truncate">{displayName}</span>
            </div>
            
            <div className="grid grid-cols-12 gap-2 items-center border-t border-border/40 pt-3">
              <span className="col-span-4 text-muted-foreground text-xs sm:text-sm">البريد:</span>
              <span className="col-span-8 font-medium text-foreground text-left truncate" dir="ltr">{user?.email}</span>
            </div>
            
            <div className="grid grid-cols-12 gap-2 items-center border-t border-border/40 pt-3">
              <span className="col-span-4 text-muted-foreground text-xs sm:text-sm">الصلاحية:</span>
              <div className="col-span-8 text-left">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {role === 'admin' ? 'مدير النظام' : 'موظف'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* النسخ الاحتياطي */}
        <section className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b pb-3">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">النسخ الاحتياطي</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">تصدير واستعادة بيانات التطبيق بالكامل بصيغة JSON.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={exportBackup} variant="outline" className="gap-2 h-10">
              <Download className="w-4 h-4" />تصدير نسخة احتياطية
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2 h-10">
              <Upload className="w-4 h-4" />استعادة نسخة احتياطية
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
          </div>
        </section>

        {/* إدارة المستخدمين - إصلاح الجدول للشاشات الصغيرة */}
        {isAdmin && (
          <section className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-4 border-b pb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">إدارة المستخدمين</h2>
            </div>
            {loadingUsers ? (
              <div className="text-center py-6 text-muted-foreground">جاري التحميل...</div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm min-w-[450px]">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 text-right">الاسم</th>
                      <th className="py-2 text-right">الصلاحية</th>
                      <th className="py-2 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.user_id} className="border-b last:border-0 hover:bg-secondary/20">
                        <td className="py-3">
                          <span className="font-medium">{u.display_name}</span>
                          {u.user_id === user?.id && <span className="text-[10px] text-primary mr-2">(أنت)</span>}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {u.role === 'admin' ? 'مدير' : 'موظف'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditUser(u)}><UserCog className="w-4 h-4" /></Button>
                            {u.user_id !== user?.id && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { setDeletingUser(u); setDeleteDialog(true); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* اللغة والمظهر */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-card p-5 rounded-2xl border border-border shadow-sm">
             <div className="flex items-center gap-3 mb-4 border-b pb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">اللغة</h2>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => changeLanguage('ar')} variant={language === 'ar' ? 'default' : 'secondary'} className="flex-1">العربية</Button>
              <Button onClick={() => changeLanguage('en')} variant={language === 'en' ? 'default' : 'secondary'} className="flex-1">English</Button>
            </div>
          </section>

          <section className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="text-primary" /> : <Sun className="text-warning" />}
              <span className="font-semibold">الوضع الليلي</span>
            </div>
            <button onClick={toggleDarkMode} className={`w-12 h-7 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`bg-white w-5 h-5 rounded-full transition-transform ${isDarkMode ? '-translate-x-5' : 'translate-x-0'}`} />
            </button>
          </section>
        </div>

        {/* حول التطبيق */}
        <section className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b pb-3">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">حول النظام</h2>
          </div>
          <div className="space-y-3 bg-secondary/30 p-4 rounded-xl text-xs sm:text-sm">
            <div className="flex justify-between"><span>اسم النظام:</span><span className="font-bold">Stock Buddy Pro 25</span></div>
            <div className="flex justify-between"><span>الإصدار الحالي:</span><span className="font-mono">1.0.2</span></div>
            <div className="flex justify-between border-t border-border/40 pt-2"><span>المطور:</span><span className="text-primary font-medium">Mofeed Alzari</span></div>
            <div className="pt-2"><DeveloperFooter /></div>
          </div>
        </section>
      </div>

      {/* Dialogs - بنفس المنطق البرمجي الكامل */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader><DialogTitle>تعديل صلاحيات المستخدم</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><label className="text-sm block mb-1">الاسم</label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div>
              <label className="text-sm block mb-1">الدور الوظيفي</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={editRole === 'employee' ? 'default' : 'outline'} onClick={() => setEditRole('employee')}>موظف</Button>
                <Button variant={editRole === 'admin' ? 'default' : 'outline'} onClick={() => setEditRole('admin')}>مدير</Button>
              </div>
            </div>
            <Button onClick={handleSaveEdit} className="w-full mt-2">حفظ التغييرات</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editSelf} onOpenChange={setEditSelf}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto text-right" dir="rtl">
          <DialogHeader><DialogTitle>تعديل حسابي</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><label className="text-sm block mb-1">الاسم</label><Input value={selfName} onChange={e => setSelfName(e.target.value)} /></div>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-primary" /><span className="text-sm font-bold">تغيير البريد</span></div>
              <Input type="email" dir="ltr" value={selfEmail} onChange={e => setSelfEmail(e.target.value)} />
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 mb-1"><Lock className="w-4 h-4 text-primary" /><span className="text-sm font-bold">تغيير كلمة المرور</span></div>
              <Input type="password" placeholder="كلمة المرور الحالية" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              <Input type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Input type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleSaveSelf} className="w-full" disabled={savingSelf}>{savingSelf ? 'جاري الحفظ...' : 'تحديث البيانات'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader><DialogTitle className="text-destructive">تأكيد حذف المستخدم</DialogTitle></DialogHeader>
          <p className="py-4">هل أنت متأكد من حذف <b>{deletingUser?.display_name}</b>؟ سيتم منعه من دخول النظام نهائياً.</p>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDeleteUser} className="flex-1">حذف نهائي</Button>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="flex-1">إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader><DialogTitle>استعادة النسخة الاحتياطية</DialogTitle></DialogHeader>
          <p className="py-4 text-sm">تحذير: هذه العملية ستقوم بتحديث البيانات الموجودة حالياً ببيانات الملف <b>{restoreFile?.name}</b>.</p>
          <div className="flex gap-2">
            <Button onClick={handleRestore} className="flex-1">بدء الاستعادة</Button>
            <Button variant="outline" onClick={() => setRestoreDialog(false)} className="flex-1">إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;