import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DeveloperFooter = () => (
  <div className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground space-y-2">
    <p className="font-medium text-foreground/70">تم تطوير وبرمجة: <span className="text-primary font-bold">مفيد الزري</span></p>
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <a href="https://www.facebook.com/share/1H6kiRKGXT/" target="_blank" rel="noopener noreferrer"
        className="text-primary hover:underline">فيسبوك</a>
      <a href="https://www.tiktok.com/@mufeed_saleh_ali_alzree?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer"
        className="text-primary hover:underline">تيك توك</a>
      <a href="https://wa.me/967778492884" target="_blank" rel="noopener noreferrer"
        className="text-primary hover:underline">واتساب</a>
    </div>
  </div>
);

const LoginPage = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isSignUp && !displayName.trim()) return;

    setLoading(true);
    let result;
    if (isSignUp) {
      result = await signUp(email, password, displayName);
    } else {
      result = await signIn(email, password);
    }
    setLoading(false);

    if (result.error) {
      toast({ title: 'خطأ', description: result.error, variant: 'destructive' });
    } else if (isSignUp) {
      toast({ title: 'تم إنشاء الحساب بنجاح', description: 'يمكنك الآن تسجيل الدخول' });
      setIsSignUp(false);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-elevated border border-border p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-elevated">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">نظام إدارة المخازن</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول إلى حسابك'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">الاسم الكامل</label>
                <Input
                  placeholder="أدخل اسمك"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">البريد الإلكتروني</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                dir="ltr"
                className="text-left"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  dir="ltr"
                  className="text-left pl-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary border-0 h-11" disabled={loading}>
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : isSignUp ? (
                <><UserPlus className="w-4 h-4 ml-2" />إنشاء حساب</>
              ) : (
                <><LogIn className="w-4 h-4 ml-2" />تسجيل الدخول</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setPassword(''); }}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isSignUp ? 'لديك حساب؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
            </button>
          </div>

          <DeveloperFooter />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
