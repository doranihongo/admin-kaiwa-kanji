// Supabase Edge Function: admin-api
//
// Chạy các thao tác quản trị cần quyền service_role (tạo/xoá user, sửa bảng
// profiles/courses/...) Ở PHÍA SERVER, để service_role key không bao giờ nằm
// trong JS của trình duyệt (GitHub Pages là public).
//
// Luồng: frontend gửi access token của người đang đăng nhập -> function xác
// thực token, kiểm tra profiles.role = 'admin' -> mới chạy lệnh bằng service key.
//
// SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY do Supabase tự cấp cho Edge Function,
// không cần tự đặt secret.
//
// Deploy: xem README mục "Deploy admin-api". verify_jwt tắt trong config.toml vì
// function tự xác thực bằng auth.getUser() (chạy được cả khi project dùng JWT
// signing key mới).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

// Xác thực bằng Bearer token chứ không dùng cookie, nên '*' là an toàn.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Chỉ cho phép đúng các bảng và phương thức dashboard đang dùng.
const TABLES = new Set([
  'profiles',
  'courses',
  'course_details',
  'user_devices',
  'kaiwa_courses',
  'kaiwa_lessons',
]);
const ENTRY_METHODS = new Set(['select', 'insert', 'upsert', 'update', 'delete']);
const CHAIN_METHODS = new Set([
  'select', 'eq', 'neq', 'in', 'is', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
  'not', 'or', 'match', 'order', 'limit', 'range', 'single', 'maybeSingle',
]);
const AUTH_ADMIN_METHODS = new Set(['createUser', 'deleteUser', 'updateUserById']);
const MAX_STEPS = 20;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// PostgrestError / AuthError là class Error: message không enumerable nên
// JSON.stringify trực tiếp sẽ ra {} -> phải chép từng trường.
function serializeError(e: any) {
  if (!e) return null;
  return {
    message: e.message ?? String(e),
    details: e.details ?? null,
    hint: e.hint ?? null,
    code: e.code ?? null,
    status: e.status ?? null,
  };
}

async function requireAdmin(req: Request): Promise<void> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new HttpError(401, 'Thiếu token đăng nhập');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Token không hợp lệ hoặc đã hết hạn');

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (profileErr || profile?.role !== 'admin') throw new HttpError(403, 'Chỉ admin mới được thực hiện thao tác này');
}

type Step = { m: string; a: unknown[] };

function assertStep(s: any): asserts s is Step {
  if (!s || typeof s.m !== 'string' || !Array.isArray(s.a)) throw new HttpError(400, 'Bước truy vấn không hợp lệ');
}

async function runDb(body: { table?: unknown; steps?: unknown }) {
  const { table, steps } = body;
  if (typeof table !== 'string' || !TABLES.has(table)) throw new HttpError(400, `Bảng không được phép: ${String(table)}`);
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > MAX_STEPS) {
    throw new HttpError(400, 'Danh sách bước truy vấn không hợp lệ');
  }

  const [first, ...rest] = steps;
  assertStep(first);
  if (!ENTRY_METHODS.has(first.m)) throw new HttpError(400, `Phương thức không được phép: ${first.m}`);

  for (const s of rest) {
    assertStep(s);
    if (!CHAIN_METHODS.has(s.m)) throw new HttpError(400, `Phương thức không được phép: ${s.m}`);
  }

  // Lỗi do thư viện ném ra (tham số sai kiểu...) trả về dạng { error } như
  // supabase-js, để người dùng thấy thông báo thật thay vì "Lỗi máy chủ".
  try {
    // deno-lint-ignore no-explicit-any
    let q: any = (admin.from(table) as any)[first.m](...first.a);
    for (const s of rest) q = q[s.m](...s.a);
    const { data, error } = await q;
    return { data: data ?? null, error: serializeError(error) };
  } catch (e) {
    return { data: null, error: serializeError(e) };
  }
}

async function runAuth(body: { method?: unknown; args?: unknown }) {
  const { method, args } = body;
  if (typeof method !== 'string' || !AUTH_ADMIN_METHODS.has(method)) {
    throw new HttpError(400, `Phương thức auth không được phép: ${String(method)}`);
  }
  if (!Array.isArray(args)) throw new HttpError(400, 'Tham số không hợp lệ');

  try {
    // deno-lint-ignore no-explicit-any
    const { data, error } = await (admin.auth.admin as any)[method](...args);
    return { data: data ?? null, error: serializeError(error) };
  } catch (e) {
    // vd. auth-js ném lỗi khi id không phải UUID
    return { data: null, error: serializeError(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Chỉ hỗ trợ POST');
    await requireAdmin(req);

    let body: any;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'Body không phải JSON hợp lệ');
    }

    if (body?.type === 'db') return json(await runDb(body));
    if (body?.type === 'auth') return json(await runAuth(body));
    throw new HttpError(400, 'Loại yêu cầu không hợp lệ');
  } catch (e) {
    if (e instanceof HttpError) return json({ data: null, error: { message: e.message } }, e.status);
    console.error('admin-api error:', e);
    return json({ data: null, error: { message: 'Lỗi máy chủ' } }, 500);
  }
});
