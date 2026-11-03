import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ModeSelection() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
         <button onClick={logout} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-medium">
            Đăng xuất
         </button>
      </div>
      <h1 className="text-3xl font-bold text-[#23376D] mb-8 text-center">Chọn Chế Độ Quản Trị</h1>
      <div className="flex gap-6 flex-col md:flex-row">
        <button 
          onClick={() => navigate('/xoa-mu-kanji')}
          className="bg-white hover:bg-blue-50 border-2 border-[#23376D] text-[#23376D] p-8 rounded-2xl shadow-sm transition-all flex flex-col items-center gap-4 w-72"
        >
          <span className="text-xl font-bold">XÓA MÙ KANJI</span>
          <span className="text-sm text-center text-gray-500">Quản trị nội dung và tài khoản khóa học Xóa Mù Kanji</span>
        </button>

        <button 
          onClick={() => navigate('/dora-kaiwa')}
          className="bg-white hover:bg-blue-50 border-2 border-[#23376D] text-[#23376D] p-8 rounded-2xl shadow-sm transition-all flex flex-col items-center gap-4 w-72"
        >
          <span className="text-xl font-bold">DORA KAIWA</span>
          <span className="text-sm text-center text-gray-500">Quản trị nội dung và tài khoản khóa học Dora Kaiwa</span>
        </button>
      </div>
    </div>
  );
}
