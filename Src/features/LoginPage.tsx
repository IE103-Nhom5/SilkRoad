import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import logo from "../assets/silkroad-logo.png";
import bg from "../assets/login-bg.png";
import { Button } from "../components/ui";

const schema = z.object({ email: z.string().email("Email không hợp lệ"), password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự") });
type LoginInput = z.infer<typeof schema>;

export function LoginPage({ onSubmit, error }: { onSubmit: (input: LoginInput) => Promise<void>; error?: string }) {
  const form = useForm<LoginInput>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  return (
    <main className="login-page" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,29,20,.9),rgba(0,29,20,.25)),url(${bg})` }}>
      <section className="login-brand"><img src={logo} alt="SilkRoad" /><span>Hệ thống quản trị bán lẻ đa chi nhánh</span><h1>Vận hành xuyên suốt, dữ liệu nhất quán.</h1><p>Quản lý hàng hóa, kho, bán hàng và nhân sự trên một nền tảng duy nhất.</p></section>
      <form className="login-card" onSubmit={form.handleSubmit(onSubmit)}>
        <span className="eyebrow">SilkRoad Management</span><h2>Đăng nhập hệ thống</h2><p>Sử dụng tài khoản đã được quản trị viên cấp quyền.</p>
        <label>Email<div><Mail /><input {...form.register("email")} placeholder="name@silkroad.vn" /></div><small>{form.formState.errors.email?.message}</small></label>
        <label>Mật khẩu<div><LockKeyhole /><input type="password" {...form.register("password")} placeholder="••••••••" /></div><small>{form.formState.errors.password?.message}</small></label>
        {error && <p className="form-error">{error}</p>}
        <Button variant="primary" icon={<ArrowRight size={18} />} disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
      </form>
    </main>
  );
}
