import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://keywwriietabgahtropc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleXd3cmlpZXRhYmdhaHRyb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDYzNjMsImV4cCI6MjA5ODEyMjM2M30.ZJY9kDoSNdfik40cehCFblXDE4cFb6uUOtj3Q9zv68I';

if (!supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. You must set it to perform admin actions.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Middleware to verify Admin
const requireAdmin = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  // Check if user is admin in profiles
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Not admin' });

  req.user = user;
  next();
};

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { email, password, maxDevices, expiresInDays, allowedCourses, displayName } = req.body;
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) return res.status(400).json({ error: authError.message });

  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null;

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: authData.user.id,
    role: 'student',
    max_devices: maxDevices,
    expires_at: expiresAt,
    allowed_courses: allowedCourses || [],
    display_name: displayName
  });

  if (profileError) {
    // Rollback user creation
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return res.status(400).json({ error: profileError.message });
  }

  res.json({ success: true, user: authData.user });
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { maxDevices, expiresAt, allowedCourses, password } = req.body;

  if (password) {
    const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
    if (pwdErr) return res.status(400).json({ error: pwdErr.message });
  }

  const { error } = await supabaseAdmin.from('profiles').update({
    max_devices: maxDevices,
    expires_at: expiresAt || null,
    allowed_courses: allowedCourses
  }).eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  await supabaseAdmin.from('profiles').delete().eq('id', id);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/admin/courses', requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin.from('courses').upsert(req.body);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/admin/courses/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  await supabaseAdmin.from('course_details').delete().eq('course_id', id);
  const { error } = await supabaseAdmin.from('courses').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/admin/lesson', requireAdmin, async (req, res) => {
  const { courseId, lessonData } = req.body;
  const { data: detail } = await supabaseAdmin.from('course_details').select('*').eq('course_id', courseId).single();
  
  let lessons = detail?.data?.lessons || [];
  const index = lessons.findIndex((l: any) => l.id === lessonData.id);
  if (index >= 0) {
    lessons[index] = lessonData;
  } else {
    lessons.push(lessonData);
  }

  if (detail?.id) {
    const { error } = await supabaseAdmin.from('course_details').update({ data: { ...detail.data, lessons } }).eq('id', detail.id);
    if (error) return res.status(400).json({ error: error.message });
  } else {
    const { error } = await supabaseAdmin.from('course_details').insert({ course_id: courseId, data: { lessons } });
    if (error) return res.status(400).json({ error: error.message });
  }
  res.json({ success: true });
});

app.delete('/api/admin/lessons/:id', requireAdmin, async (req, res) => {
  const { id, courseId } = req.body;
  const { data: detail } = await supabaseAdmin.from('course_details').select('*').eq('course_id', courseId).single();
  if (detail && detail.data?.lessons) {
    const lessons = detail.data.lessons.filter((l: any) => l.id !== id);
    const { error } = await supabaseAdmin.from('course_details').update({ data: { ...detail.data, lessons } }).eq('id', detail.id);
    if (error) return res.status(400).json({ error: error.message });
  }
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
