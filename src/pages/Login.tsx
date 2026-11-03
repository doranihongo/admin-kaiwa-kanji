import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, formatEmail } from '../lib/supabase';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const email = formatEmail(username);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Fetch profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profile?.role !== 'admin') {
          await supabase.auth.signOut();
          setError('Tài khoản không có quyền Admin');
          return;
        }

        navigate('/');
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-[#23376D] mb-8">Đăng nhập Quản trị</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (hoặc Email)</label>
            <input 
              required
              className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500" 
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input 
              required
              type="password"
              className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#23376D] text-white font-bold py-3 rounded-xl hover:bg-blue-900 transition-colors mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
