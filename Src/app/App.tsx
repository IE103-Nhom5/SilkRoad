import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { AppShell, type AppProfile } from "../components/AppShell";
import { DashboardPage } from "../features/DashboardPage";
import { HelpPage } from "../features/HelpPage";
import { LoginPage } from "../features/LoginPage";
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
  if (isSupabaseConfigured && !session) {
    return <LoginPage error={loginError} onSubmit={async (input) => { setLoginError(""); const result = await supabase!.auth.signInWithPassword(input); if (result.error) setLoginError(result.error.message); }} />;
  }

  return (
    <AppShell profile={profile} demo={!isSupabaseConfigured} onSignOut={async () => { await supabase?.auth.signOut(); }}>
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
