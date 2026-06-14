import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    const action = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { error } = await action;
    if (error) setMessage(error.message);
    else setMessage(mode === 'login' ? 'Đăng nhập thành công' : 'Đã đăng ký. Kiểm tra email nếu Supabase yêu cầu xác nhận.');
  }

  return <div className="login">
    <form className="card" onSubmit={submit}>
      <h1 className="title">SILKROAD</h1>
      <p className="muted">{mode === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản demo'}</p>
      <label>Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
      <br/><br/>
      <label>Mật khẩu</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <br/><br/>
      <button className="btn" style={{width:'100%'}}>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
      <p><button type="button" className="btn secondary" onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</button></p>
      {message && <p className="danger">{message}</p>}
    </form>
  </div>;
}
