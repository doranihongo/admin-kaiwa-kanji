import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://keywwriietabgahtropc.supabase.co';
// anon key là key CÔNG KHAI theo thiết kế của Supabase (an toàn khi nằm trong JS
// trình duyệt, miễn là đã bật RLS). TUYỆT ĐỐI không đặt service_role key ở đây.
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleXd3cmlpZXRhYmdhaHRyb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDYzNjMsImV4cCI6MjA5ODEyMjM2M30.ZJY9kDoSNdfik40cehCFblXDE4cFb6uUOtj3Q9zv68I';

// Main client for normal operations (đăng nhập, đọc profile của chính mình...)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------------------
// supabaseAdmin: client quản trị. Nó KHÔNG giữ service_role key. Mỗi lệnh được
// gửi sang Edge Function `admin-api` (supabase/functions/admin-api), function
// kiểm tra người đang đăng nhập có role 'admin' rồi mới chạy lệnh bằng service key
// ở phía server.
//
// API giữ y hệt supabase-js để code dashboard không phải đổi:
//   await supabaseAdmin.from('profiles').select('*').eq('id', id).single()
//   await supabaseAdmin.auth.admin.createUser({ email, password })
// và luôn trả về { data, error } (không throw), giống supabase-js.
// ---------------------------------------------------------------------------

const ADMIN_API_URL = `${supabaseUrl}/functions/v1/admin-api`;

type AdminResult = { data: any; error: any };
type Step = { m: string; a: unknown[] };

async function callAdminApi(payload: Record<string, unknown>): Promise<AdminResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { data: null, error: { message: 'Chưa đăng nhập hoặc phiên đã hết hạn' } };

    const res = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);
    if (!body) return { data: null, error: { message: `Máy chủ trả về lỗi (HTTP ${res.status})` } };
    return { data: body.data ?? null, error: body.error ?? (res.ok ? null : { message: `HTTP ${res.status}` }) };
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Không kết nối được máy chủ quản trị' } };
  }
}

// Query builder giả lập: ghi lại chuỗi .select().eq().order()... rồi gửi đi khi
// được `await` (giống PostgrestBuilder của supabase-js, vốn cũng là thenable).
function adminTable(table: string) {
  const steps: Step[] = [];
  const builder: any = new Proxy({}, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (prop === 'then') {
        return (resolve: (v: AdminResult) => unknown, reject: (e: unknown) => unknown) =>
          callAdminApi({ type: 'db', table, steps }).then(resolve, reject);
      }
      return (...a: unknown[]) => {
        steps.push({ m: prop, a });
        return builder;
      };
    },
  });
  return builder;
}

const adminAuth = (method: string) => (...args: unknown[]): Promise<AdminResult> =>
  callAdminApi({ type: 'auth', method, args });

export const supabaseAdmin = {
  from: (table: string): any => adminTable(table),
  auth: {
    admin: {
      createUser: adminAuth('createUser'),
      deleteUser: adminAuth('deleteUser'),
      updateUserById: adminAuth('updateUserById'),
    },
  },
};

// Helper to format usernames as emails for Supabase Auth
export const formatEmail = (username: string) => {
  return username.includes('@') ? username : `${username}@student.local`;
};
