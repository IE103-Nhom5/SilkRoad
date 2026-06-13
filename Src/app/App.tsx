import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { AppShell, type AppProfile } from "../components/AppShell";
import { DashboardPage } from "../features/DashboardPage";
import { HelpPage } from "../features/HelpPage";
import { LoginPage, type LoginInput } from "../features/LoginPage";
import { ModulePage } from "../features/ModulePage";
import { PosPage } from "../features/PosPage";
import { SystemPage } from "../features/SystemPage";
import { routes } from "../lib/navigation";
import { isSupabaseConfigured, supabase } from "../lib/client";

const demoProfile: AppProfile = { name: "Quản trị SilkRoad", email: "demo@silkroad.vn", role: "admin · demo" };

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile>(demoProfile);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [loginError, setLoginError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [demoSession, setDemoSession] = useState(sessionStorage.getItem("sr-demo-session") === "active");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user.email) return;
    supabase.from("users").select("fullname,email,role(rolename)").eq("email", session.user.email).maybeSingle().then(({ data }) => {
      if (!data) return;
      const roleData = data.role as unknown as { rolename?: string } | null;
      setProfile({ name: String(data.fullname || session.user.email), email: String(data.email || session.user.email), role: String(roleData?.rolename || "authenticated") });
    });
  }, [session]);

  if (!authReady) return <div className="boot-screen">Đang khởi tạo SilkRoad...</div>;
  async function signIn(input: LoginInput) {
    setLoginError("");
    setLoginNotice("");
    if (!supabase) return setLoginError("Supabase chưa được cấu hình. Hãy dùng chế độ demo để xem hệ thống.");
    const result = await supabase.auth.signInWithPassword(input);
    if (result.error) setLoginError(result.error.message);
  }

  async function signUp(input: LoginInput) {
    setLoginError("");
    setLoginNotice("");
    if (!supabase) return setLoginError("Cần cấu hình Supabase để đăng ký tài khoản thật.");
    const result = await supabase.auth.signUp(input);
    if (result.error) setLoginError(result.error.message);
    else setLoginNotice("Đã gửi yêu cầu đăng ký. Kiểm tra email nếu hệ thống yêu cầu xác nhận.");
  }

  async function resetPassword(email: string) {
    setLoginError("");
    setLoginNotice("");
    if (!email.trim()) return setLoginError("Nhập email trước khi yêu cầu đặt lại mật khẩu.");
    if (!supabase) return setLoginError("Cần cấu hình Supabase để gửi email đặt lại mật khẩu.");
    const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (result.error) setLoginError(result.error.message);
    else setLoginNotice("Đã gửi liên kết đặt lại mật khẩu tới email của bạn.");
  }

  if (!session && !demoSession) {
    return <LoginPage error={loginError} notice={loginNotice} onSubmit={signIn} onSignUp={signUp} onResetPassword={resetPassword} demoAvailable={!isSupabaseConfigured} onDemo={() => { sessionStorage.setItem("sr-demo-session", "active"); setDemoSession(true); }} />;
  }

  return (
    <AppShell profile={profile} demo={!isSupabaseConfigured} onSignOut={async () => { sessionStorage.removeItem("sr-demo-session"); setDemoSession(false); await supabase?.auth.signOut(); }}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sales/pos" element={<PosPage />} />
        <Route path="/admin/system" element={<SystemPage />} />
        <Route path="/help" element={<HelpPage />} />
        {routes.filter((route) => !["/dashboard", "/sales/pos", "/admin/system", "/help"].includes(route.path)).map((route) => <Route key={route.path} path={route.path} element={<ModulePage route={route} />} />)}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <footer className="app-footer"><span>SilkRoad Management · Production foundation</span><span>© 2026 SilkRoad</span></footer>
    </AppShell>
  );
}
