import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, Mail, PlayCircle, UserRound } from "lucide-react";
import logo from "../assets/silkroad-logo.png";
import bg from "../assets/login-bg.png";
import frame from "../assets/login-frame.png";
import benefits from "../assets/login-benefits.png";

const schema = z.object({
  fullName: z.string().max(100, "Họ tên tối đa 100 ký tự").optional(),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
export type LoginInput = z.infer<typeof schema>;

export function LoginPage({
  onSubmit,
  onSignUp,
  onResetPassword,
  onDemo,
  error,
  notice,
  demoAvailable,
}: {
  onSubmit: (input: LoginInput) => Promise<void>;
  onSignUp: (input: LoginInput) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onDemo: () => void;
  error?: string;
  notice?: string;
  demoAvailable: boolean;
}) {
  const rememberedEmail = localStorage.getItem("silkroad-remember-email") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [registerMode, setRegisterMode] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: rememberedEmail, password: "" } });

  useEffect(() => {
    if (!remember) localStorage.removeItem("silkroad-remember-email");
  }, [remember]);

  async function submit(input: LoginInput) {
    if (registerMode) {
      if (!input.fullName?.trim() || input.fullName.trim().length < 2) {
        form.setError("fullName", { message: "Nhập họ tên tối thiểu 2 ký tự" });
        return;
      }
      await onSignUp(input);
      return;
    }
    if (remember) localStorage.setItem("silkroad-remember-email", input.email);
    await onSubmit(input);
  }

  return (
    <main className="heritage-login" style={{ backgroundImage: `url(${bg})` }}>
      <div className="heritage-login-overlay" />
      <img className="heritage-login-logo" src={logo} alt="SilkRoad" />

      <section className="heritage-login-frame">
        <img src={frame} alt="" aria-hidden="true" />
        <form className={`heritage-login-form ${registerMode ? "is-register" : ""}`} onSubmit={form.handleSubmit(submit)}>
          <h1>LOGIN</h1>
          <div className="heritage-divider"><span /><b>◇</b><span /></div>

          {registerMode && (
            <label>
              Họ tên
              <div className="heritage-input">
                <UserRound />
                <input {...form.register("fullName")} autoComplete="name" placeholder="Nguyễn Văn A" />
              </div>
              <small>{form.formState.errors.fullName?.message}</small>
            </label>
          )}

          <label>
            Email
            <div className="heritage-input">
              <Mail />
              <input {...form.register("email")} autoComplete="email" placeholder="name@silkroad.vn" />
            </div>
            <small>{form.formState.errors.email?.message}</small>
          </label>

          <label>
            Mật khẩu
            <div className="heritage-input">
              <LockKeyhole />
              <input type={showPassword ? "text" : "password"} {...form.register("password")} autoComplete="current-password" placeholder="Nhập mật khẩu" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <small>{form.formState.errors.password?.message}</small>
          </label>

          <div className="heritage-login-options">
            <label className="heritage-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Ghi nhớ đăng nhập</label>
            <button type="button" onClick={() => onResetPassword(form.getValues("email"))}>Quên mật khẩu?</button>
          </div>

          {error && <p className="heritage-login-message error">{error}</p>}
          {notice && <p className="heritage-login-message">{notice}</p>}

          <button className="heritage-login-submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "ĐANG XỬ LÝ..." : registerMode ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP"}
          </button>
          <button className="heritage-login-register" type="button" onClick={() => { setRegisterMode(!registerMode); form.clearErrors(); }}>
            {registerMode ? "Quay lại đăng nhập" : "Đăng ký tài khoản"}
          </button>
          {demoAvailable && <button className="heritage-login-demo" type="button" onClick={onDemo}><PlayCircle /> Vào hệ thống bằng dữ liệu demo</button>}
        </form>
      </section>

      <img className="heritage-login-benefits" src={benefits} alt="Các lợi ích của SilkRoad" />
    </main>
  );
}
