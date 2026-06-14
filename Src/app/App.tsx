import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { AppShell, type AppProfile } from "../components/AppShell";
import { useToast } from "../components/ToastProvider";
import { databaseContract } from "../core/databaseContract";
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
  const { pushToast } = useToast();
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
    if (!supabase || !session?.user) return;
    let active = true;
    async function loadProfile() {
      const select = "fullname,email,role(rolename)";
      const byAuth = await supabase!.from(databaseContract.tables.users).select(select).eq("authuserid", session!.user.id).maybeSingle();
      const fallback = !byAuth.data && session!.user.email
        ? await supabase!.from(databaseContract.tables.users).select(select).eq("email", session!.user.email).maybeSingle()
        : null;
      const data = byAuth.data || fallback?.data;
      const error = byAuth.error && fallback?.error ? fallback.error : null;
      if (!active) return;
      if (!data) {
        if (error) pushToast(`Không tải được hồ sơ: ${error.message}`, "warning");
        else pushToast("Tài khoản đã đăng nhập nhưng chưa có hồ sơ ứng dụng. Hãy kiểm tra migration tạo profile.", "warning");
        return;
      }
      const relation = data.role as unknown as { rolename?: string } | { rolename?: string }[] | null;
      const roleName = Array.isArray(relation) ? relation[0]?.rolename : relation?.rolename;
      setProfile({
        name: String(data.fullname || session!.user.email || "Tài khoản SilkRoad"),
        email: String(data.email || session!.user.email || ""),
        role: String(roleName || "authenticated"),
      });
    }
    loadProfile();
    return () => { active = false; };
  }, [pushToast, session]);

  if (!authReady) return <div className="boot-screen">Đang khởi tạo SilkRoad...</div>;
  async function signIn(input: LoginInput) {
    setLoginError("");
    setLoginNotice("");
    if (!supabase) return setLoginError("Supabase chưa được cấu hình. Hãy dùng chế độ demo để xem hệ thống.");
    const result = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    if (result.error) {
      const message = authErrorMessage(result.error.message);
      setLoginError(message);
      pushToast(message, "error");
    } else {
      pushToast("Đăng nhập thành công.", "success");
    }
  }

  async function signUp(input: LoginInput) {
    setLoginError("");
    setLoginNotice("");
    if (!supabase) return setLoginError("Cần cấu hình Supabase để đăng ký tài khoản thật.");
    const fullName = input.fullName?.trim();
    if (!fullName) return setLoginError("Nhập họ tên trước khi đăng ký tài khoản.");
    const result = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: { data: { full_name: fullName } },
    });
    if (result.error) {
      const message = authErrorMessage(result.error.message);
      setLoginError(message);
      pushToast(message, "error");
      return;
    }
    const message = result.data.session
      ? "Đăng ký thành công. Hồ sơ sales_staff đã được tạo tự động."
      : "Đã đăng ký. Kiểm tra email để xác nhận tài khoản; hồ sơ sales_staff được tạo tự động.";
    setLoginNotice(message);
    pushToast(message, "success");
  }

  async function resetPassword(email: string) {
    setLoginError("");
    setLoginNotice("");
    if (!email.trim()) return setLoginError("Nhập email trước khi yêu cầu đặt lại mật khẩu.");
    if (!supabase) return setLoginError("Cần cấu hình Supabase để gửi email đặt lại mật khẩu.");
    const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (result.error) {
      const message = authErrorMessage(result.error.message);
      setLoginError(message);
      pushToast(message, "error");
    } else {
      const message = "Đã gửi liên kết đặt lại mật khẩu tới email của bạn.";
      setLoginNotice(message);
      pushToast(message, "info");
    }
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
      <footer className="app-footer"><span>SilkRoad · Quản lý hàng hóa đa kênh</span><span>© 2026 SilkRoad</span></footer>
    </AppShell>
  );
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("database error saving new user")) return "Không tạo được hồ sơ nhân viên. Kiểm tra role sales_staff và migration auth profile.";
  if (normalized.includes("user already registered")) return "Email này đã được đăng ký.";
  if (normalized.includes("invalid login credentials")) return "Email hoặc mật khẩu không đúng.";
  if (normalized.includes("email not confirmed")) return "Email chưa được xác nhận.";
  return message;
}
