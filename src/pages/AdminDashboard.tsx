import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { supabase, supabaseAdmin, formatEmail } from '../lib/supabase';

export default function AdminDashboard({ title = "Trang Quản Trị Hệ Thống", mode = "xoa_mu_kanji" }: { title?: string, mode?: 'xoa_mu_kanji' | 'dora_kaiwa' }) {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();

  
  const [activeAdminTab, setActiveAdminTab] = useState<'accounts' | 'sync' | 'kaiwa_courses' | 'password'>('accounts');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [maxDevices, setMaxDevices] = useState<number | string>(2);
  const [expiresInDays, setExpiresInDays] = useState<number | string>('');
  const [createAllowedCourses, setCreateAllowedCourses] = useState<string[]>([]);
  const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('single');
  const [createRole, setCreateRole] = useState<'admin' | 'giaovien' | 'hocvien'>('hocvien');
  const [createDriveFolderId, setCreateDriveFolderId] = useState('');
  const [createStudentCode, setCreateStudentCode] = useState('');
  const [bulkUsersText, setBulkUsersText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeletePassword, setBulkDeletePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userList, setUserList] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [lessonsList, setLessonsList] = useState<any[]>([]);

  const [newPassword, setNewPassword] = useState('');
  
  // Course Form
  const [courseFormId, setCourseFormId] = useState('');
  const [courseFormTitle, setCourseFormTitle] = useState('');
  const [courseFormDesc, setCourseFormDesc] = useState('');
  const [courseFormImg, setCourseFormImg] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isAddingCoursePopupOpen, setIsAddingCoursePopupOpen] = useState(false);

  // Lesson Form
  const [lessonCourseId, setLessonCourseId] = useState('');
  const [lessonId, setLessonId] = useState('nm1');
  const [lessonTitle, setLessonTitle] = useState('BUỔI 1');
  const [lessonKanji, setLessonKanji] = useState('');
  const [lessonVocab, setLessonVocab] = useState('');
  const [lessonCustomVocab, setLessonCustomVocab] = useState('');
  const [lessonYoutube, setLessonYoutube] = useState('');
  const [lessonPdf, setLessonPdf] = useState('');
  const [lessonExercise, setLessonExercise] = useState('');
  const [exerciseMode, setExerciseMode] = useState<'builder' | 'raw'>('builder');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Pagination
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 20;

  // Edit User
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<{ password: '', maxDevices: number | string, expiresAt: string, allowedCourses: string[], studentCode: string, driveFolderId: string }>({ password: '', maxDevices: 2, expiresAt: '', allowedCourses: [], studentCode: '', driveFolderId: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToDeletePassword, setUserToDeletePassword] = useState('');
  const [userToResetDevices, setUserToResetDevices] = useState<string | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [courseToDeletePassword, setCourseToDeletePassword] = useState('');
  const [lessonToDelete, setLessonToDelete] = useState<{courseId: string, lessonId: string} | null>(null);
  const [lessonToDeletePassword, setLessonToDeletePassword] = useState('');

  // ------------------------------------------------------------------
  // Dữ liệu khóa học Kaiwa (mode = 'dora_kaiwa') - bảng kaiwa_courses /
  // kaiwa_lessons trên Supabase, HOÀN TOÀN KHÁC bảng courses/course_details
  // dùng cho mode xoa_mu_kanji ở trên (tên cột, cấu trúc dữ liệu buổi học
  // đều khác). Trước đây 2 bảng này chỉ sửa được tay qua Supabase Table
  // Editor (xem comment trong kaiwa/src/types.ts), giờ có form riêng ở đây.
  // Đọc lại đúng cột mà app kaiwa (kaiwa/src/utils/supabaseCourses.ts) đang
  // dùng để hiển thị, không tự bịa thêm cột mới.
  // ------------------------------------------------------------------
  const [kaiwaCoursesList, setKaiwaCoursesList] = useState<any[]>([]);
  const [kaiwaLessonsList, setKaiwaLessonsList] = useState<any[]>([]);

  // Kaiwa Course Form
  const [kwCourseFormId, setKwCourseFormId] = useState('');
  const [kwCourseFormTitle, setKwCourseFormTitle] = useState('');
  const [kwCourseFormDesc, setKwCourseFormDesc] = useState('');
  const [kwCourseFormImg, setKwCourseFormImg] = useState('');
  const [kwCourseFormSort, setKwCourseFormSort] = useState<number | string>(0);
  const [kwEditingCourseId, setKwEditingCourseId] = useState<string | null>(null);
  const [kwIsAddingCoursePopupOpen, setKwIsAddingCoursePopupOpen] = useState(false);

  // Kaiwa Lesson Form
  const [kwLessonCourseId, setKwLessonCourseId] = useState('');
  const [kwLessonId, setKwLessonId] = useState('');
  const [kwLessonTitle, setKwLessonTitle] = useState('');
  const [kwLessonSort, setKwLessonSort] = useState<number | string>(0);
  const [kwLessonFileUrl, setKwLessonFileUrl] = useState('');
  const [kwLessonSlideFolder, setKwLessonSlideFolder] = useState('');
  const [kwLessonSlideExt, setKwLessonSlideExt] = useState('svg');
  const [kwLessonSlideCount, setKwLessonSlideCount] = useState<number | string>('');
  const [kwLessonVocabJson, setKwLessonVocabJson] = useState('[]');
  const [kwLessonGrammarJson, setKwLessonGrammarJson] = useState('[]');
  const [kwVocabMode, setKwVocabMode] = useState<'builder' | 'raw'>('builder');
  const [kwGrammarMode, setKwGrammarMode] = useState<'builder' | 'raw'>('builder');
  const [kwEditingLessonId, setKwEditingLessonId] = useState<string | null>(null);

  const [kwCourseToDelete, setKwCourseToDelete] = useState<string | null>(null);
  const [kwCourseToDeletePassword, setKwCourseToDeletePassword] = useState('');
  const [kwLessonToDelete, setKwLessonToDelete] = useState<string | null>(null);
  const [kwLessonToDeletePassword, setKwLessonToDeletePassword] = useState('');

  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return 'Không thời hạn';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const fetchUsers = async () => {
    try {
      let profileQuery = supabaseAdmin.from('profiles').select('*');
      if (mode === 'dora_kaiwa') {
        profileQuery = profileQuery.in('role', ['giaovien', 'hocvien']);
      } else {
        profileQuery = profileQuery.neq('role', 'admin');
      }

      const { data: profiles, error: profileErr } = await profileQuery;
        
      if (profileErr) throw profileErr;
      
      const { data: coursesData, error: courseErr } = await supabaseAdmin
        .from('courses')
        .select('*');
        
      if (courseErr) throw courseErr;
      
      const { data: detailsData, error: detailErr } = await supabaseAdmin
        .from('course_details')
        .select('*');
        
      if (detailErr) throw detailErr;

      // Map to UI formats
      const mappedProfiles = (profiles || []).map(p => ({
        id: p.id,
        username: p.display_name || 'unknown',
        maxDevices: p.max_devices,
        expiresAt: p.expires_at,
        allowedCourses: p.allowed_courses || [],
        role: p.role,
        studentCode: p.student_code || '',
        driveFolderId: p.drive_folder_id || ''
      }));
      
      const mappedCourses = (coursesData || []).map(c => ({
        id: c.id,
        title: c.name,
        description: c.description,
        imageUrl: c.cover_image
      }));
      
      let allLessons: any[] = [];
      (detailsData || []).forEach(d => {
        if (d.data && Array.isArray(d.data.lessons)) {
          d.data.lessons.forEach((l: any) => {
            allLessons.push({ ...l, courseId: d.course_id });
          });
        }
      });

      setUserList(mappedProfiles);
      setCoursesList(mappedCourses);
      setLessonsList(allLessons);
    } catch (err: any) {
      console.warn("Could not fetch users/courses:", err.message || err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, mode]);

  // Mã học viên (chỉ dùng cho khóa học Kaiwa): tăng dần 001, 002, 003...
  // và không được trùng nhau giữa các học viên.
  const getNextStudentCode = (excludeId?: string) => {
    const usedNumbers = userList
      .filter(u => u.id !== excludeId)
      .map(u => parseInt((u.studentCode || '').trim(), 10))
      .filter(n => !isNaN(n));
    const next = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
    return next.toString().padStart(3, '0');
  };

  useEffect(() => {
    if (mode === 'dora_kaiwa' && creationMode === 'single') {
      setCreateStudentCode(prev => prev || getNextStudentCode());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userList, mode, creationMode]);

  const fetchKaiwaCourses = async () => {
    try {
      const { data: coursesData, error: courseErr } = await supabaseAdmin
        .from('kaiwa_courses')
        .select('*')
        .order('sort_order', { ascending: true });

      if (courseErr) throw courseErr;

      const { data: lessonsData, error: lessonErr } = await supabaseAdmin
        .from('kaiwa_lessons')
        .select('*')
        .order('sort_order', { ascending: true });

      if (lessonErr) throw lessonErr;

      setKaiwaCoursesList((coursesData || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description || '',
        imageUrl: c.cover_image_url || '',
        sortOrder: c.sort_order ?? 0
      })));

      setKaiwaLessonsList((lessonsData || []).map((l: any) => ({
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        sortOrder: l.sort_order ?? 0,
        lessonFileUrl: l.lesson_file_url || '',
        slideFolder: l.slide_folder || '',
        slideExt: l.slide_ext || 'svg',
        slideCount: l.slide_count ?? '',
        vocabulary: Array.isArray(l.vocabulary) ? l.vocabulary : [],
        grammar: Array.isArray(l.grammar) ? l.grammar : []
      })));
    } catch (err: any) {
      console.warn("Could not fetch kaiwa courses/lessons:", err.message || err);
    }
  };

  useEffect(() => {
    if (mode === 'dora_kaiwa') fetchKaiwaCourses();
  }, [token, mode]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const trimmedStudentCode = createStudentCode.trim();
    if (mode === 'dora_kaiwa' && createRole !== 'admin') {
      if (!trimmedStudentCode) {
        setMessage('❌ Vui lòng nhập mã học viên');
        return;
      }
      if (userList.some(u => u.studentCode && u.studentCode === trimmedStudentCode)) {
        setMessage(`❌ Mã học viên "${trimmedStudentCode}" đã tồn tại, vui lòng chọn mã khác`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const email = formatEmail(username);

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        setMessage(`❌ Lỗi tạo user: ${authError.message}`);
        return;
      }
      
      if (authData.user) {
        const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString() : null;
        // Đợi trigger bên database (nếu có) chạy xong
        await new Promise(r => setTimeout(r, 1000));
        
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
          id: authData.user.id,
          role: mode === 'dora_kaiwa' ? createRole : 'student',
          max_devices: maxDevices ? Number(maxDevices) : 1,
          expires_at: expiresAt,
          allowed_courses: (mode === 'dora_kaiwa' && createRole === 'admin') ? [] : (createAllowedCourses || []),
          display_name: username,
          drive_folder_id: mode === 'dora_kaiwa' ? (createDriveFolderId || null) : null,
          student_code: (mode === 'dora_kaiwa' && createRole !== 'admin') ? trimmedStudentCode : null
        });

        if (profileError) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          setMessage(`❌ Lỗi cập nhật profile: ${profileError.message}`);
          return;
        }
      }

      setMessage('✅ Tạo tài khoản thành công!');
      setUsername('');
      setPassword('');
      setCreateStudentCode('');
      setCreateDriveFolderId('');
      setCreateAllowedCourses([]);
      fetchUsers();
    } catch (err) {
      setMessage('❌ Đã xảy ra lỗi khi tạo tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUsersText.trim()) {
      setMessage('❌ Vui lòng nhập dữ liệu tài khoản');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    const lines = bulkUsersText.trim().split('\n');
    let successCount = 0;
    let failCount = 0;
    
    const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString() : null;

    // Mã học viên tự tăng dần 001, 002, 003... không trùng với mã đã có.
    const usedStudentCodes = new Set<string>(userList.map(u => u.studentCode).filter(Boolean));
    let maxStudentCodeNum = 0;
    usedStudentCodes.forEach(c => {
      const n = parseInt(c, 10);
      if (!isNaN(n) && n > maxStudentCodeNum) maxStudentCodeNum = n;
    });
    let nextStudentCodeNum = maxStudentCodeNum + 1;
    const takeNextStudentCode = () => {
      let code = nextStudentCodeNum.toString().padStart(3, '0');
      while (usedStudentCodes.has(code)) {
        nextStudentCodeNum++;
        code = nextStudentCodeNum.toString().padStart(3, '0');
      }
      usedStudentCodes.add(code);
      nextStudentCodeNum++;
      return code;
    };

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) {
        failCount++;
        continue;
      }
      
      const uName = parts[0].trim();
      const pwd = parts[1].trim();
      
      if (!uName || !pwd) {
        failCount++;
        continue;
      }
      
      try {
        const email = formatEmail(uName);
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: pwd,
          email_confirm: true
        });

        if (authError) {
          failCount++;
          continue;
        }

        if (authData.user) {
          // Đợi trigger bên database (nếu có) chạy xong
          await new Promise(r => setTimeout(r, 1000));
          const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: authData.user.id,
            role: mode === 'dora_kaiwa' ? 'hocvien' : 'student',
            max_devices: maxDevices ? Number(maxDevices) : 1,
            expires_at: expiresAt,
            allowed_courses: createAllowedCourses || [],
            display_name: uName,
            drive_folder_id: null,
            student_code: mode === 'dora_kaiwa' ? takeNextStudentCode() : null
          });

          if (profileError) {
             await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
             failCount++;
          } else {
             successCount++;
          }
        }
      } catch (err) {
        failCount++;
      }
    }
    
    setMessage(`✅ Hoàn tất! Thành công: ${successCount}. Thất bại: ${failCount}.`);
    if (successCount > 0) {
      setBulkUsersText('');
      setCreateAllowedCourses([]);
      fetchUsers();
    }
    setIsLoading(false);
  };

  const handleUpdateUser = async (id: string) => {
    const trimmedStudentCode = editUserForm.studentCode.trim();
    if (mode === 'dora_kaiwa' && trimmedStudentCode) {
      const isDuplicate = userList.some(u => u.id !== id && u.studentCode && u.studentCode === trimmedStudentCode);
      if (isDuplicate) {
        alert(`Mã học viên "${trimmedStudentCode}" đã tồn tại, vui lòng chọn mã khác`);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (editUserForm.password) {
        const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(id, { password: editUserForm.password });
        if (pwdErr) {
          alert(`Lỗi đổi mật khẩu: ${pwdErr.message}`);
          return;
        }
      }

      const { error: profileError } = await supabaseAdmin.from('profiles').update({
        max_devices: editUserForm.maxDevices ? Number(editUserForm.maxDevices) : 1,
        expires_at: editUserForm.expiresAt || null,
        allowed_courses: editUserForm.allowedCourses,
        ...(mode === 'dora_kaiwa' ? {
          student_code: trimmedStudentCode || null,
          drive_folder_id: editUserForm.driveFolderId.trim() || null
        } : {})
      }).eq('id', id);

      if (profileError) {
        alert(profileError.message);
      } else {
        setMessage('✅ Cập nhật tài khoản thành công!');
        setEditingUserId(null);
        fetchUsers();
      }
    } catch (err: any) {
      console.warn("Could not update user:", err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !userToDeletePassword) return;
    try {
      setIsLoading(true);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: userToDeletePassword
      });

      if (signInError) {
        alert('Mật khẩu Admin không chính xác!');
        setIsLoading(false);
        return;
      }

      const { error: dbError } = await supabaseAdmin.from('profiles').delete().eq('id', userToDelete);
      if (dbError) {
        alert(dbError.message);
        return;
      }
        
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete);
      if (authError) {
        alert(authError.message);
      } else {
        fetchUsers();
      }
    } catch (err: any) {
      console.warn("Could not delete user:", err.message || err);
    } finally {
      setUserToDelete(null);
      setUserToDeletePassword('');
      setIsLoading(false);
    }
  };

  const handleResetUserDevices = (id: string) => {
    setUserToResetDevices(id);
  };

  const confirmResetUserDevices = async () => {
    if (!userToResetDevices || !userToResetPassword) return;
    try {
      setIsLoading(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: userToResetPassword
      });

      if (signInError) {
        alert('Mật khẩu Admin không chính xác!');
        setIsLoading(false);
        return;
      }

      const { error } = await supabaseAdmin.from('user_devices').delete().eq('user_id', userToResetDevices);
      if (error) {
        alert(error.message);
      } else {
        alert('Đã reset thiết bị thành công!');
        fetchUsers();
      }
    } catch (err: any) {
      console.warn("Could not reset devices:", err.message || err);
    } finally {
      setUserToResetDevices(null);
      setUserToResetPassword('');
      setIsLoading(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const courseData = {
        id: editingCourseId || courseFormId,
        name: courseFormTitle,
        description: courseFormDesc,
        cover_image: courseFormImg
      };

      const { error } = await supabaseAdmin.from('courses').upsert(courseData);

      if (error) {
        setMessage(`❌ Lỗi: ${error.message}`);
      } else {
        setMessage('✅ Lưu khóa học thành công!');
        setEditingCourseId(null);
        setIsAddingCoursePopupOpen(false);
        setCourseFormId('');
        setCourseFormTitle('');
        setCourseFormDesc('');
        setCourseFormImg('');
        fetchUsers();
      }
    } catch (err) {
      setMessage('❌ Đã xảy ra lỗi khi lưu khóa học');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0 || !bulkDeletePassword) return;
    try {
      setIsLoading(true);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: bulkDeletePassword
      });

      if (signInError) {
        alert('Mật khẩu Admin không chính xác!');
        setIsLoading(false);
        return;
      }

      let successCount = 0;
      for (const uid of selectedUsers) {
        try {
          const { error: dbError } = await supabaseAdmin.from('profiles').delete().eq('id', uid);
          if (!dbError) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(uid);
            if (!authError) {
              successCount++;
            }
          }
        } catch (e) {}
      }
      
      alert(`Đã xóa ${successCount}/${selectedUsers.length} tài khoản.`);
      fetchUsers();
      setSelectedUsers([]);
      setShowBulkDeleteConfirm(false);
      setBulkDeletePassword('');
      
    } catch (err: any) {
      console.warn("Could not bulk delete users:", err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete || !courseToDeletePassword) return;
    
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: courseToDeletePassword
      });

      if (signInError) {
        alert('Mật khẩu Admin không chính xác!');
        setIsLoading(false);
        return;
      }

      const { error: err1 } = await supabaseAdmin.from('course_details').delete().eq('course_id', courseToDelete);
      const { error: err2 } = await supabaseAdmin.from('courses').delete().eq('id', courseToDelete);
      
      if (err2 || err1) {
        alert(err2?.message || err1?.message);
      } else {
        setMessage('✅ Đã xóa khóa học!');
        fetchUsers();
      }
    } catch (err: any) {
      console.warn("Could not delete course:", err.message || err);
    } finally {
      setCourseToDelete(null);
      setCourseToDeletePassword('');
      setIsLoading(false);
    }
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete || !lessonToDeletePassword) return;
    
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: lessonToDeletePassword
      });

      if (signInError) {
        alert('Mật khẩu Admin không chính xác!');
        setIsLoading(false);
        return;
      }

      // Find course details
      const { data: detail } = await supabaseAdmin.from('course_details').select('*').eq('course_id', lessonToDelete.courseId).single();
      
      if (detail && detail.data?.lessons) {
        const lessons = detail.data.lessons.filter((l: any) => l.id !== lessonToDelete.lessonId);
        
        const { error } = await supabaseAdmin.from('course_details').update({
          data: { ...detail.data, lessons }
        }).eq('id', detail.id);
        
        if (error) {
          alert(error.message);
        } else {
          setMessage('✅ Đã xóa buổi học!');
          fetchUsers();
        }
      }
    } catch (err: any) {
      console.warn("Could not delete lesson:", err.message || err);
    } finally {
      setLessonToDelete(null);
      setLessonToDeletePassword('');
      setIsLoading(false);
    }
  };

  const handleSaveKwCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const courseData = {
        id: kwEditingCourseId || kwCourseFormId,
        title: kwCourseFormTitle,
        description: kwCourseFormDesc,
        cover_image_url: kwCourseFormImg,
        sort_order: kwCourseFormSort === '' ? 0 : Number(kwCourseFormSort)
      };

      const { error } = await supabaseAdmin.from('kaiwa_courses').upsert(courseData);

      if (error) {
        setMessage(`❌ Lỗi: ${error.message}`);
      } else {
        setMessage('✅ Lưu khóa học Kaiwa thành công!');
        setKwEditingCourseId(null);
        setKwIsAddingCoursePopupOpen(false);
        setKwCourseFormId(''); setKwCourseFormTitle(''); setKwCourseFormDesc(''); setKwCourseFormImg(''); setKwCourseFormSort(0);
        fetchKaiwaCourses();
      }
    } catch (err) {
      setMessage('❌ Đã xảy ra lỗi khi lưu khóa học Kaiwa');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteKwCourse = async () => {
    if (!kwCourseToDelete || !kwCourseToDeletePassword) return;

    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: kwCourseToDeletePassword
      });

      if (signInError) {
        alert('Mật khẩu Admin không chính xác!');
        setIsLoading(false);
        return;
      }

      const { error: err1 } = await supabaseAdmin.from('kaiwa_lessons').delete().eq('course_id', kwCourseToDelete);
      const { error: err2 } = await supabaseAdmin.from('kaiwa_courses').delete().eq('id', kwCourseToDelete);

      if (err2 || err1) {
        alert(err2?.message || err1?.message);
      } else {
        setMessage('✅ Đã xóa khóa học Kaiwa!');
        fetchKaiwaCourses();
      }
    } catch (err: any) {
      console.warn("Could not delete kaiwa course:", err.message || err);
    } finally {
      setKwCourseToDelete(null);
      setKwCourseToDeletePassword('');
      setIsLoading(false);
    }
  };

  const resetKwLessonForm = () => {
    setKwEditingLessonId(null);
    setKwLessonId(''); setKwLessonTitle(''); setKwLessonSort(0);
    setKwLessonFileUrl(''); setKwLessonSlideFolder(''); setKwLessonSlideExt('svg'); setKwLessonSlideCount('');
    setKwLessonVocabJson('[]'); setKwLessonGrammarJson('[]');
    setKwVocabMode('builder'); setKwGrammarMode('builder');
  };

  const parseKwVocabList = (): any[] => {
    try {
      const v = kwLessonVocabJson.trim() ? JSON.parse(kwLessonVocabJson) : [];
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };

  const parseKwGrammarList = (): any[] => {
    try {
      const v = kwLessonGrammarJson.trim() ? JSON.parse(kwLessonGrammarJson) : [];
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };

  const handleSaveKwLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    let vocabulary: any[] = [];
    let grammar: any[] = [];
    try {
      vocabulary = kwLessonVocabJson.trim() ? JSON.parse(kwLessonVocabJson) : [];
      if (!Array.isArray(vocabulary)) throw new Error('Từ vựng phải là 1 mảng JSON []');
    } catch (err: any) {
      setMessage(`❌ Lỗi JSON từ vựng: ${err.message}`);
      return;
    }
    try {
      grammar = kwLessonGrammarJson.trim() ? JSON.parse(kwLessonGrammarJson) : [];
      if (!Array.isArray(grammar)) throw new Error('Ngữ pháp phải là 1 mảng JSON []');
    } catch (err: any) {
      setMessage(`❌ Lỗi JSON ngữ pháp: ${err.message}`);
      return;
    }

    setIsLoading(true);
    try {
      const lessonData = {
        id: kwLessonId,
        course_id: kwLessonCourseId,
        title: kwLessonTitle,
        sort_order: kwLessonSort === '' ? 0 : Number(kwLessonSort),
        lesson_file_url: kwLessonFileUrl || null,
        slide_folder: kwLessonSlideFolder || null,
        slide_ext: kwLessonSlideFolder ? (kwLessonSlideExt || 'svg') : null,
        slide_count: kwLessonSlideCount === '' ? null : Number(kwLessonSlideCount),
        vocabulary,
        grammar
      };

      const { error } = await supabaseAdmin.from('kaiwa_lessons').upsert(lessonData);

      if (error) {
        setMessage(`❌ Lỗi: ${error.message}`);
      } else {
        setMessage('✅ Lưu buổi học Kaiwa thành công!');
        resetKwLessonForm();
        fetchKaiwaCourses();
      }
    } catch (err) {
      setMessage('❌ Đã xảy ra lỗi khi lưu buổi học Kaiwa');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteKwLesson = async () => {
    if (!kwLessonToDelete || !kwLessonToDeletePassword) return;

    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: kwLessonToDeletePassword
      });

      if (signInError) {
        alert('Mật khẩu Admin không chính xác!');
        setIsLoading(false);
        return;
      }

      const { error } = await supabaseAdmin.from('kaiwa_lessons').delete().eq('id', kwLessonToDelete);
      if (error) {
        alert(error.message);
      } else {
        setMessage('✅ Đã xóa buổi học Kaiwa!');
        fetchKaiwaCourses();
      }
    } catch (err: any) {
      console.warn("Could not delete kaiwa lesson:", err.message || err);
    } finally {
      setKwLessonToDelete(null);
      setKwLessonToDeletePassword('');
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        setMessage(`❌ Lỗi: ${error.message}`);
      } else {
        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
        setNewPassword('');
        logout();
      }
    } catch (err) {
      setMessage('❌ Đã xảy ra lỗi khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    let parsedExerciseJson = null;
    if (lessonExercise.trim()) {
      try {
        parsedExerciseJson = JSON.parse(lessonExercise);
      } catch (e) {
        setMessage('❌ Lỗi: JSON bài tập không hợp lệ');
        setIsLoading(false);
        return;
      }
    }

    let parsedCustomVocab = null;
    if (lessonCustomVocab.trim()) {
      try {
        parsedCustomVocab = JSON.parse(lessonCustomVocab);
      } catch (e) {
        setMessage('❌ Lỗi: JSON từ vựng tự tạo không hợp lệ');
        setIsLoading(false);
        return;
      }
    }

    try {
      const kanjiCount = lessonKanji.replace(/\s+/g, '').length;
      const vocabCount = lessonVocab.split(/[\n;]/).filter(v => v.trim()).length;

      const newLesson = { 
        id: lessonId,
        title: lessonTitle,
        videoId: lessonYoutube,
        pdfUrl: lessonPdf,
        kanjiCount,
        vocabCount,
        kanjiList: lessonKanji,
        vocabList: lessonVocab.split(/[\n;]/).map(v => v.trim()).filter(Boolean).join(';'),
        customVocab: parsedCustomVocab,
        exerciseJson: parsedExerciseJson
      };

      const { data: detail } = await supabaseAdmin.from('course_details').select('*').eq('course_id', lessonCourseId).single();
      
      let lessons = detail?.data?.lessons || [];
      const index = lessons.findIndex((l: any) => l.id === lessonId);
      if (index >= 0) {
        lessons[index] = newLesson;
      } else {
        lessons.push(newLesson);
      }

      let error = null;
      if (detail?.id) {
        const { error: updateErr } = await supabaseAdmin.from('course_details').update({ data: { ...detail.data, lessons } }).eq('id', detail.id);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabaseAdmin.from('course_details').insert({ course_id: lessonCourseId, data: { lessons } });
        error = insertErr;
      }

      if (error) {
        throw error;
      }

      setMessage('✅ Đồng bộ bài học thành công!');
      setEditingLessonId(null);
      setLessonId(''); setLessonTitle(''); setLessonKanji(''); setLessonVocab(''); setLessonCustomVocab(''); setLessonYoutube(''); setLessonPdf(''); setLessonExercise('');
      fetchUsers();
    } catch (err) {
      setMessage('❌ Đã xảy ra lỗi khi lưu bài học');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLessonJson = () => {
    let parsedExerciseJson = null;
    if (lessonExercise.trim()) {
      try {
        parsedExerciseJson = JSON.parse(lessonExercise);
      } catch (e) {
        alert('Lỗi: JSON bài tập không hợp lệ');
        return;
      }
    }

    let parsedCustomVocab = null;
    if (lessonCustomVocab.trim()) {
      try {
        parsedCustomVocab = JSON.parse(lessonCustomVocab);
      } catch (e) {
        alert('Lỗi: JSON từ vựng tự tạo không hợp lệ');
        return;
      }
    }

    const kanjiCount = lessonKanji.replace(/\s+/g, '').length;
    const vocabCount = lessonVocab.split(/[\n;]/).filter(v => v.trim()).length;

    const obj = {
      id: lessonId,
      title: lessonTitle,
      videoId: lessonYoutube,
      pdfUrl: lessonPdf,
      kanjiCount,
      vocabCount,
      kanjiList: lessonKanji,
      vocabList: lessonVocab.split(/[\n;]/).map(v => v.trim()).filter(Boolean).join(';'),
      customVocab: parsedCustomVocab,
      exerciseJson: parsedExerciseJson
    };
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    alert('Đã sao chép JSON!');
  };

  const pasteLessonJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const obj = JSON.parse(text);
      if (obj.courseId) setLessonCourseId(obj.courseId);
      if (obj.id) setLessonId(obj.id);
      if (obj.title) setLessonTitle(obj.title);
      if (obj.kanjiList) setLessonKanji(obj.kanjiList);
      if (obj.vocabList) setLessonVocab(obj.vocabList.replace(/;/g, '\n'));
      if (obj.videoId || obj.youtubeLink) setLessonYoutube(obj.videoId || obj.youtubeLink);
      if (obj.pdfUrl || obj.pdfLink) setLessonPdf(obj.pdfUrl || obj.pdfLink);
      if (obj.exerciseJson) setLessonExercise(JSON.stringify(obj.exerciseJson, null, 2));
      if (obj.customVocab) setLessonCustomVocab(JSON.stringify(obj.customVocab, null, 2));
      else setLessonCustomVocab('');
      alert('Đã dán JSON!');
    } catch(err) {
      alert('Lỗi: JSON không hợp lệ');
    }
  };

  const filteredUsers = userList.filter(u => {
    if (userFilter === 'active') return u.expiresAt !== null;
    if (userFilter === 'inactive') return u.expiresAt === null;
    return true;
  });
  
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  const renderLessonForm = (isNew = false) => (
    <div className={`bg-white p-6 border-2 border-blue-200 rounded-xl shadow-sm ${!isNew && 'my-4'}`} id={isNew ? "lesson-form-anchor" : undefined}>
      <h3 className="font-bold text-lg mb-4 text-blue-900">{isNew ? `Thêm Buổi Học Mới (Khóa ${coursesList.find(c=>c.id===lessonCourseId)?.title})` : `Đang sửa: ${lessonTitle}`}</h3>
      <form onSubmit={handleSaveLesson} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã buổi học (ID duy nhất)</label>
            <input 
              required
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500" 
              placeholder="VD: nm1, n5-1" 
              value={lessonId} 
              onChange={e=>setLessonId(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên buổi học</label>
            <input 
              required
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500" 
              placeholder="VD: BUỔI 1" 
              value={lessonTitle} 
              onChange={e=>setLessonTitle(e.target.value)} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video ID (hoặc Link)</label>
          <input 
            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500" 
            placeholder="VD: 2F0pAxP-58M" 
            value={lessonYoutube} 
            onChange={e=>setLessonYoutube(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách Kanji</label>
          <textarea 
            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[80px]" 
            placeholder="VD: 一二三四五" 
            value={lessonKanji} 
            onChange={e=>setLessonKanji(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách Từ vựng (mỗi từ một dòng)</label>
          <textarea 
            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[120px]" 
            placeholder="VD:&#10;ひとつ&#10;ふたつ" 
            value={lessonVocab} 
            onChange={e=>setLessonVocab(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">JSON Từ vựng tự tạo (Tùy chọn)</label>
          <textarea 
            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[120px] font-mono text-xs" 
            placeholder='VD: { "食べる": { "reading": "たべる", "meaning": "Ăn", "hanviet": "THỰC" } }' 
            value={lessonCustomVocab} 
            onChange={e=>setLessonCustomVocab(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link Tài liệu PDF (Tùy chọn)</label>
          <input 
            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500" 
            placeholder="VD: https://drive.google.com/..." 
            value={lessonPdf} 
            onChange={e=>setLessonPdf(e.target.value)} 
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Bài tập (Tùy chọn)</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setExerciseMode('builder')} 
                className={`text-xs px-2 py-1 rounded ${exerciseMode === 'builder' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >Builder</button>
              <button 
                type="button" 
                onClick={() => setExerciseMode('raw')} 
                className={`text-xs px-2 py-1 rounded ${exerciseMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >JSON</button>
            </div>
          </div>
          
          {exerciseMode === 'raw' ? (
            <textarea 
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[80px]" 
              placeholder='VD: [{"question": "Hỏi?", "options": ["A", "B"], "answer": 0}]' 
              value={lessonExercise} 
              onChange={e=>setLessonExercise(e.target.value)} 
            />
          ) : (
            <div className="space-y-4 border rounded-xl p-4 bg-gray-50 max-h-[400px] overflow-y-auto">
              {(() => {
                let parsed = [];
                try {
                  if (lessonExercise.trim()) parsed = JSON.parse(lessonExercise);
                  if (!Array.isArray(parsed)) parsed = [];
                } catch (e) {
                  return <div className="text-red-500 text-sm">JSON hiện tại không hợp lệ. Vui lòng sửa lỗi trong tab JSON trước khi dùng Builder.</div>;
                }

                return (
                  <>
                    {parsed.map((ex, qIndex) => (
                      <div key={qIndex} className="p-4 border rounded-lg bg-white shadow-sm relative">
                        <button 
                          type="button" 
                          onClick={() => {
                            const newEx = [...parsed];
                            newEx.splice(qIndex, 1);
                            setLessonExercise(JSON.stringify(newEx, null, 2));
                          }}
                          className="absolute top-3 right-3 text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                          title="Xóa câu"
                        >×</button>
                        
                        <div className="mb-3">
                          <div className="flex justify-between items-end mb-1">
                            <label className="text-xs font-bold text-gray-700">Câu hỏi {qIndex + 1}</label>
                            <button 
                              type="button" 
                              onClick={() => {
                                const el = document.getElementById(`question-${qIndex}`) as HTMLTextAreaElement;
                                if (!el) return;
                                const start = el.selectionStart;
                                const end = el.selectionEnd;
                                if (start !== null && end !== null) {
                                  const newEx = [...parsed];
                                  const text = newEx[qIndex].question || '';
                                  if (start !== end) {
                                     newEx[qIndex].question = text.substring(0, start) + '~~' + text.substring(start, end) + '~~' + text.substring(end);
                                  } else {
                                     newEx[qIndex].question = text.substring(0, start) + '~~từ vựng~~' + text.substring(start);
                                  }
                                  setLessonExercise(JSON.stringify(newEx, null, 2));
                                  setTimeout(() => {
                                    const t = document.getElementById(`question-${qIndex}`) as HTMLTextAreaElement;
                                    if(t) {
                                      t.focus();
                                      t.setSelectionRange(start, start + (start!==end ? end-start+4 : 11));
                                    }
                                  }, 0);
                                }
                              }}
                              className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 font-bold"
                            >~~Gạch chân~~</button>
                          </div>
                          <textarea 
                            id={`question-${qIndex}`}
                            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y min-h-[60px]" 
                            placeholder="Nhập câu hỏi... (Nhấn Enter để xuống dòng)"
                            value={ex.question || ''} 
                            onChange={e => {
                              const newEx = [...parsed];
                              newEx[qIndex].question = e.target.value;
                              setLessonExercise(JSON.stringify(newEx, null, 2));
                            }}
                          />
                        </div>

                        <div className="flex gap-4 mb-3">
                          <div className="flex-1">
                            <label className="text-xs font-bold text-gray-700">Mục tiêu (Target) (Tùy chọn)</label>
                            <input 
                              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                              placeholder="VD: 食べる"
                              value={ex.target || ''} 
                              onChange={e => {
                                const newEx = [...parsed];
                                newEx[qIndex].target = e.target.value;
                                setLessonExercise(JSON.stringify(newEx, null, 2));
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-gray-700">Loại (Type) (Tùy chọn)</label>
                            <input 
                              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                              placeholder="VD: vocab_reading"
                              value={ex.type || ''} 
                              onChange={e => {
                                const newEx = [...parsed];
                                newEx[qIndex].type = e.target.value;
                                setLessonExercise(JSON.stringify(newEx, null, 2));
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-bold text-gray-700">Đáp án (Chọn nút tròn để làm đáp án đúng)</label>
                          <div className="space-y-2 mt-2">
                            {(ex.options || []).map((opt: string, optIndex: number) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  name={`answer-${qIndex}`} 
                                  className="w-4 h-4 text-blue-600 cursor-pointer"
                                  checked={ex.answer === optIndex}
                                  onChange={() => {
                                    const newEx = [...parsed];
                                    newEx[qIndex].answer = optIndex;
                                    setLessonExercise(JSON.stringify(newEx, null, 2));
                                  }}
                                />
                                <input 
                                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                                  placeholder={`Lựa chọn ${optIndex + 1}`}
                                  value={opt}
                                  onChange={e => {
                                    const newEx = [...parsed];
                                    newEx[qIndex].options[optIndex] = e.target.value;
                                    setLessonExercise(JSON.stringify(newEx, null, 2));
                                  }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newEx = [...parsed];
                                    newEx[qIndex].options.splice(optIndex, 1);
                                    if (newEx[qIndex].answer === optIndex) newEx[qIndex].answer = 0;
                                    else if (newEx[qIndex].answer > optIndex) newEx[qIndex].answer--;
                                    setLessonExercise(JSON.stringify(newEx, null, 2));
                                  }}
                                  className="text-red-500 hover:bg-red-50 w-7 h-7 rounded flex items-center justify-center font-bold text-lg"
                                >×</button>
                              </div>
                            ))}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => {
                              const newEx = [...parsed];
                              if (!newEx[qIndex].options) newEx[qIndex].options = [];
                              newEx[qIndex].options.push(`Lựa chọn ${newEx[qIndex].options.length + 1}`);
                              setLessonExercise(JSON.stringify(newEx, null, 2));
                            }}
                            className="text-blue-600 text-xs mt-2 underline font-medium hover:text-blue-800"
                          >+ Thêm lựa chọn</button>
                        </div>

                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <label className="text-xs font-bold text-gray-700">Giải thích (Tùy chọn)</label>
                            <div className="flex gap-1">
                              <button 
                                type="button" 
                                onClick={() => {
                                  const el = document.getElementById(`explain-${qIndex}`) as HTMLTextAreaElement;
                                  if (!el) return;
                                  const start = el.selectionStart;
                                  const end = el.selectionEnd;
                                  if (start !== null && end !== null) {
                                    const newEx = [...parsed];
                                    const text = newEx[qIndex].explain || '';
                                    if (start !== end) {
                                       newEx[qIndex].explain = text.substring(0, start) + '_' + text.substring(start, end) + '_' + text.substring(end);
                                    } else {
                                       newEx[qIndex].explain = text.substring(0, start) + '_từ vựng_' + text.substring(start);
                                    }
                                    setLessonExercise(JSON.stringify(newEx, null, 2));
                                    setTimeout(() => {
                                      const t = document.getElementById(`explain-${qIndex}`) as HTMLTextAreaElement;
                                      if(t) {
                                        t.focus();
                                        t.setSelectionRange(start, start + (start!==end ? end-start+2 : 10));
                                      }
                                    }, 0);
                                  }
                                }}
                                className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 font-bold"
                              >_Xanh_</button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const el = document.getElementById(`explain-${qIndex}`) as HTMLTextAreaElement;
                                  if (!el) return;
                                  const start = el.selectionStart;
                                  const end = el.selectionEnd;
                                  if (start !== null && end !== null) {
                                    const newEx = [...parsed];
                                    const text = newEx[qIndex].explain || '';
                                    if (start !== end) {
                                       newEx[qIndex].explain = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                                    } else {
                                       newEx[qIndex].explain = text.substring(0, start) + '**từ vựng**' + text.substring(start);
                                    }
                                    setLessonExercise(JSON.stringify(newEx, null, 2));
                                    setTimeout(() => {
                                      const t = document.getElementById(`explain-${qIndex}`) as HTMLTextAreaElement;
                                      if(t) {
                                        t.focus();
                                        t.setSelectionRange(start, start + (start!==end ? end-start+4 : 13));
                                      }
                                    }, 0);
                                  }
                                }}
                                className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-200 font-bold"
                              >**Đậm**</button>
                            </div>
                          </div>
                          <textarea 
                            id={`explain-${qIndex}`}
                            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y" 
                            placeholder="Giải thích vì sao lại chọn đáp án này... (Nhấn Enter để xuống dòng)"
                            value={ex.explain || ''} 
                            onChange={e => {
                              const newEx = [...parsed];
                              newEx[qIndex].explain = e.target.value;
                              setLessonExercise(JSON.stringify(newEx, null, 2));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => {
                        const newEx = [...parsed, { question: '', target: '', type: '', options: ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3', 'Lựa chọn 4'], answer: 0, explain: '' }];
                        setLessonExercise(JSON.stringify(newEx, null, 2));
                        // scroll to bottom of the builder
                      }}
                      className="px-4 py-3 bg-blue-100 text-blue-700 border border-blue-200 border-dashed rounded-xl text-sm font-bold w-full hover:bg-blue-200 transition-colors"
                    >
                      + THÊM CÂU HỎI MỚI
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50"
          >
            Lưu Buổi Học
          </button>
          <button 
            type="button" 
            onClick={() => {
              setEditingLessonId(null);
              setLessonId(''); setLessonTitle(''); setLessonKanji(''); setLessonVocab(''); setLessonCustomVocab(''); setLessonYoutube(''); setLessonPdf(''); setLessonExercise('');
            }}
            className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
          >
            Hủy
          </button>
          <button 
            type="button" 
            onClick={copyLessonJson}
            className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
          >
            Copy JSON
          </button>
          <button 
            type="button" 
            onClick={pasteLessonJson}
            className="px-4 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200"
          >
            Dán JSON
          </button>
        </div>
      </form>
    </div>
  );

  const renderKwLessonForm = (isNew = false) => (
    <div className={`bg-white p-6 border-2 border-blue-200 rounded-xl shadow-sm ${!isNew && 'my-4'}`} id={isNew ? "kw-lesson-form-anchor" : undefined}>
      <h3 className="font-bold text-lg mb-4 text-blue-900">{isNew ? `Thêm Buổi Học Mới (Khóa ${kaiwaCoursesList.find(c=>c.id===kwLessonCourseId)?.title})` : `Đang sửa: ${kwLessonTitle}`}</h3>
      <form onSubmit={handleSaveKwLesson} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã buổi học (ID duy nhất)</label>
            <input
              required
              disabled={!isNew}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="VD: socap-1, trungcap-1"
              value={kwLessonId}
              onChange={e=>setKwLessonId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên buổi học</label>
            <input
              required
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
              placeholder="VD: BUỔI 1"
              value={kwLessonTitle}
              onChange={e=>setKwLessonTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
            <input
              type="number"
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
              placeholder="0, 1, 2..."
              value={kwLessonSort}
              onChange={e=>setKwLessonSort(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link Tài liệu bài giảng (PDF/PPT, tùy chọn)</label>
          <input
            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
            placeholder="VD: https://... hoặc kaiwa-files/buoi-1.pdf"
            value={kwLessonFileUrl}
            onChange={e=>setKwLessonFileUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Thư mục ảnh Slide cho giáo viên (tùy chọn)</label>
            <input
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="VD: https://.../slides/buoi-1/"
              value={kwLessonSlideFolder}
              onChange={e=>setKwLessonSlideFolder(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đuôi ảnh</label>
            <input
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="svg"
              value={kwLessonSlideExt}
              onChange={e=>setKwLessonSlideExt(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng ảnh slide (điền tay để bỏ qua bước dò 404)</label>
            <input
              type="number"
              className="border border-gray-300 rounded-xl px-4 py-2 w-full md:w-48 focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="VD: 12"
              value={kwLessonSlideCount}
              onChange={e=>setKwLessonSlideCount(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        {/* Từ vựng */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Từ vựng (Vocabulary)</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setKwVocabMode('builder')} className={`text-xs px-2 py-1 rounded ${kwVocabMode === 'builder' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Builder</button>
              <button type="button" onClick={() => setKwVocabMode('raw')} className={`text-xs px-2 py-1 rounded ${kwVocabMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>JSON</button>
            </div>
          </div>

          {kwVocabMode === 'raw' ? (
            <textarea
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[120px] font-mono text-xs"
              placeholder='VD: [{"id":"v1","word":"食べる","sinoVietnamese":"THỰC","reading":"たべる","meaning":"Ăn"}]'
              value={kwLessonVocabJson}
              onChange={e=>setKwLessonVocabJson(e.target.value)}
            />
          ) : (
            <div className="space-y-3 border rounded-xl p-4 bg-gray-50 max-h-[420px] overflow-y-auto">
              {kwLessonVocabJson.trim() && parseKwVocabList().length === 0 && kwLessonVocabJson.trim() !== '[]' ? (
                <div className="text-red-500 text-sm">JSON hiện tại không hợp lệ. Vui lòng sửa lỗi trong tab JSON trước khi dùng Builder.</div>
              ) : (
                <>
                  {parseKwVocabList().map((v: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg bg-white shadow-sm relative grid grid-cols-2 md:grid-cols-6 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const list = parseKwVocabList();
                          list.splice(idx, 1);
                          setKwLessonVocabJson(JSON.stringify(list, null, 2));
                        }}
                        className="absolute top-1 right-1 text-red-500 hover:bg-red-50 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm"
                        title="Xóa từ"
                      >×</button>
                      {([
                        ['word', 'Từ (Kanji/Kana)'],
                        ['reading', 'Cách đọc'],
                        ['sinoVietnamese', 'Hán Việt'],
                        ['meaning', 'Nghĩa'],
                      ] as const).map(([field, label]) => (
                        <div key={field}>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
                          <input
                            className="w-full border rounded px-2 py-1 mt-0.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={v[field] || ''}
                            onChange={e => {
                              const list = parseKwVocabList();
                              list[idx] = { ...list[idx], id: list[idx].id || `v${idx + 1}`, [field]: e.target.value };
                              setKwLessonVocabJson(JSON.stringify(list, null, 2));
                            }}
                          />
                        </div>
                      ))}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Kanji để tra audio (tùy chọn)</label>
                        <input
                          className="w-full border rounded px-2 py-1 mt-0.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Chỉ dùng để tra file phát âm, không hiển thị"
                          value={v.targetKanji || ''}
                          onChange={e => {
                            const list = parseKwVocabList();
                            list[idx] = { ...list[idx], id: list[idx].id || `v${idx + 1}`, targetKanji: e.target.value };
                            setKwLessonVocabJson(JSON.stringify(list, null, 2));
                          }}
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">Điền khi "Từ" hiển thị là dạng rút gọn không tra đúng audio - web sẽ tra phát âm bằng cách viết kanji này thay vì "Từ", chữ hiển thị trên thẻ vẫn giữ nguyên.</p>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 col-span-2 md:col-span-6 mt-1">
                        <input
                          type="checkbox"
                          checked={!!v.noAudio}
                          onChange={e => {
                            const list = parseKwVocabList();
                            list[idx] = { ...list[idx], noAudio: e.target.checked };
                            setKwLessonVocabJson(JSON.stringify(list, null, 2));
                          }}
                        />
                        Không có audio phát âm cho từ này
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const list = parseKwVocabList();
                      list.push({ id: `v${list.length + 1}`, word: '', sinoVietnamese: '', reading: '', meaning: '' });
                      setKwLessonVocabJson(JSON.stringify(list, null, 2));
                    }}
                    className="px-4 py-2.5 bg-blue-100 text-blue-700 border border-blue-200 border-dashed rounded-xl text-sm font-bold w-full hover:bg-blue-200 transition-colors"
                  >
                    + THÊM TỪ VỰNG
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Ngữ pháp */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Ngữ pháp (Grammar)</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setKwGrammarMode('builder')} className={`text-xs px-2 py-1 rounded ${kwGrammarMode === 'builder' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Builder</button>
              <button type="button" onClick={() => setKwGrammarMode('raw')} className={`text-xs px-2 py-1 rounded ${kwGrammarMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>JSON</button>
            </div>
          </div>

          {kwGrammarMode === 'raw' ? (
            <textarea
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[100px] font-mono text-xs"
              placeholder='VD: [{"id":"g1","pattern":"〜てもいいです","meaning":"Xin phép làm gì đó"}]'
              value={kwLessonGrammarJson}
              onChange={e=>setKwLessonGrammarJson(e.target.value)}
            />
          ) : (
            <div className="space-y-3 border rounded-xl p-4 bg-gray-50 max-h-[360px] overflow-y-auto">
              {kwLessonGrammarJson.trim() && parseKwGrammarList().length === 0 && kwLessonGrammarJson.trim() !== '[]' ? (
                <div className="text-red-500 text-sm">JSON hiện tại không hợp lệ. Vui lòng sửa lỗi trong tab JSON trước khi dùng Builder.</div>
              ) : (
                <>
                  {parseKwGrammarList().map((g: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg bg-white shadow-sm relative grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const list = parseKwGrammarList();
                          list.splice(idx, 1);
                          setKwLessonGrammarJson(JSON.stringify(list, null, 2));
                        }}
                        className="absolute top-1 right-1 text-red-500 hover:bg-red-50 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm"
                        title="Xóa mẫu"
                      >×</button>
                      {([
                        ['pattern', 'Cấu trúc'],
                        ['meaning', 'Ý nghĩa/Cách dùng'],
                        ['exampleJapanese', 'VD tiếng Nhật'],
                        ['exampleVietnamese', 'VD tiếng Việt'],
                      ] as const).map(([field, label]) => (
                        <div key={field}>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
                          <input
                            className="w-full border rounded px-2 py-1 mt-0.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={g[field] || ''}
                            onChange={e => {
                              const list = parseKwGrammarList();
                              list[idx] = { ...list[idx], id: list[idx].id || `g${idx + 1}`, [field]: e.target.value };
                              setKwLessonGrammarJson(JSON.stringify(list, null, 2));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const list = parseKwGrammarList();
                      list.push({ id: `g${list.length + 1}`, pattern: '', meaning: '' });
                      setKwLessonGrammarJson(JSON.stringify(list, null, 2));
                    }}
                    className="px-4 py-2.5 bg-blue-100 text-blue-700 border border-blue-200 border-dashed rounded-xl text-sm font-bold w-full hover:bg-blue-200 transition-colors"
                  >
                    + THÊM MẪU NGỮ PHÁP
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50"
          >
            Lưu Buổi Học
          </button>
          <button
            type="button"
            onClick={resetKwLessonForm}
            className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm font-bold flex items-center gap-2"
            >
              ← Quay lại
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#23376D] tracking-tight">{title}</h1>
              <p className="text-gray-500 mt-2">Quản lý tài khoản học viên và dữ liệu bài học</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={logout} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-medium">
              Đăng xuất
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveAdminTab('accounts')}
            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeAdminTab === 'accounts' ? 'bg-[#23376D] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Quản lý tài khoản
          </button>
          {mode === 'xoa_mu_kanji' && (
            <button
              onClick={() => setActiveAdminTab('sync')}
              className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeAdminTab === 'sync' ? 'bg-[#23376D] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              Đồng bộ dữ liệu
            </button>
          )}
          {mode === 'dora_kaiwa' && (
            <button
              onClick={() => setActiveAdminTab('kaiwa_courses')}
              className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeAdminTab === 'kaiwa_courses' ? 'bg-[#23376D] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              Khóa học Kaiwa
            </button>
          )}
          <button
            onClick={() => setActiveAdminTab('password')}
            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeAdminTab === 'password' ? 'bg-[#23376D] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Đổi mật khẩu Admin
          </button>
        </div>

        {activeAdminTab === 'sync' && (
          <div className="flex flex-col gap-8">
            <details className="group bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 open:pb-8">
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg group-open:rotate-90 transition-transform">
                    ▶
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">KHÓA HỌC</h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý các khóa học trên trang chủ</p>
                  </div>
                </div>
              </summary>
              
              <div className="mt-8 flex justify-end mb-4">
                {!isAddingCoursePopupOpen && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsAddingCoursePopupOpen(true);
                      setCourseFormId(''); setCourseFormTitle(''); setCourseFormDesc(''); setCourseFormImg(''); setEditingCourseId(null);
                    }}
                    className="px-4 py-2 bg-[#23376D] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm"
                  >
                    + Thêm khóa học
                  </button>
                )}
              </div>

              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl w-1/4">Tên khóa</th>
                      <th className="px-4 py-3 w-1/3">Mô tả</th>
                      <th className="px-4 py-3">Ảnh</th>
                      <th className="px-4 py-3">Thống kê</th>
                      <th className="px-4 py-3 text-right rounded-tr-xl">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursesList.map(course => {
                      const courseLessons = lessonsList.filter(l => l.courseId === course.id);
                      return (
                      <React.Fragment key={course.id}>
                        <tr className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                          <td className="px-4 py-3">{course.description}</td>
                          <td className="px-4 py-3">
                            <img src={course.imageUrl} alt={course.title} className="w-12 h-12 object-cover rounded-lg" />
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div>{courseLessons.length} buổi</div>
                            <div className="text-gray-500">{courseLessons.filter(l=>l.videoId || l.youtubeLink).length} video</div>
                            <div className="text-gray-500">{courseLessons.reduce((acc, l) => acc + (l.kanjiCount || (l.kanjiList ? l.kanjiList.replace(/\s+/g, '').length : 0)), 0)} kanji</div>
                            <div className="text-gray-500">{courseLessons.reduce((acc, l) => acc + (l.vocabCount || (l.vocabList ? l.vocabList.split(/[\n;]/).filter((v: string) => v.trim()).length : 0)), 0)} từ vựng</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => {
                                if (editingCourseId === course.id) {
                                  setEditingCourseId(null);
                                } else {
                                  setEditingCourseId(course.id);
                                  setIsAddingCoursePopupOpen(false);
                                  setCourseFormId(course.id);
                                  setCourseFormTitle(course.title);
                                  setCourseFormDesc(course.description);
                                  setCourseFormImg(course.imageUrl);
                                }
                              }}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors font-medium mr-2"
                            >
                              Sửa
                            </button>
                            <button 
                              onClick={() => setCourseToDelete(course.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors font-medium"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                        {editingCourseId === course.id && (
                          <tr className="border-b bg-blue-50/50">
                            <td colSpan={5} className="p-4">
                              <form onSubmit={handleSaveCourse} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID (Mã khóa)</label>
                                    <input 
                                      required
                                      disabled
                                      className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed" 
                                      value={courseFormId} onChange={e=>setCourseFormId(e.target.value)} 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học</label>
                                    <input 
                                      required
                                      className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white" 
                                      value={courseFormTitle} onChange={e=>setCourseFormTitle(e.target.value)} 
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                  <textarea 
                                    required
                                    className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white" 
                                    value={courseFormDesc} onChange={e=>setCourseFormDesc(e.target.value)} 
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh Bìa</label>
                                  <input 
                                    required
                                    className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white" 
                                    value={courseFormImg} onChange={e=>setCourseFormImg(e.target.value)} 
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                                    Cập nhật
                                  </button>
                                  <button type="button" onClick={() => setEditingCourseId(null)} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50">
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {isAddingCoursePopupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold text-gray-800 mb-4 text-xl">Thêm Khóa Học Mới</h3>
                    <form onSubmit={handleSaveCourse} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID (Mã khóa)</label>
                          <input 
                            required
                            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500" 
                            value={courseFormId} onChange={e=>setCourseFormId(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học</label>
                          <input 
                            required
                            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500" 
                            value={courseFormTitle} onChange={e=>setCourseFormTitle(e.target.value)} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea 
                          required
                          className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[100px]" 
                          value={courseFormDesc} onChange={e=>setCourseFormDesc(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh Bìa</label>
                        <input 
                          required
                          className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500" 
                          value={courseFormImg} onChange={e=>setCourseFormImg(e.target.value)} 
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                          Thêm mới
                        </button>
                        <button type="button" onClick={() => setIsAddingCoursePopupOpen(false)} className="px-5 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">
                          Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </details>

            <details className="group bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 open:pb-8">
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg group-open:rotate-90 transition-transform">
                    ▶
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 uppercase">TẢI DỮ LIỆU BUỔI HỌC</h2>
                    <p className="text-sm text-gray-500 mt-1">Chọn khóa học để chỉnh sửa các buổi học</p>
                  </div>
                </div>
              </summary>
              
              <div className="mt-8 mb-8 flex flex-wrap gap-2">
                {coursesList.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setLessonCourseId(prev => prev === c.id ? '' : c.id)}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                      lessonCourseId === c.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              {lessonCourseId && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Danh sách buổi học</h3>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingLessonId('new');
                        setLessonId(''); setLessonTitle(''); setLessonKanji(''); setLessonVocab(''); setLessonCustomVocab(''); setLessonYoutube(''); setLessonPdf(''); setLessonExercise('');
                        setTimeout(() => window.scrollTo({ top: document.getElementById('lesson-form-anchor')?.offsetTop || 0, behavior: 'smooth' }), 100);
                      }}
                      className="px-4 py-2 bg-[#23376D] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm"
                    >
                      + Thêm buổi học
                    </button>
                  </div>
                  {editingLessonId === 'new' && renderLessonForm(true)}

                  {lessonsList.filter(l => l.courseId === lessonCourseId).sort((a,b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })).map((lesson) => {
                    if (editingLessonId === lesson.id) {
                      return <React.Fragment key={lesson.id}>{renderLessonForm()}</React.Fragment>;
                    }

                    return (
                    <details key={lesson.id} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <summary className="px-6 py-4 font-bold text-gray-800 cursor-pointer hover:bg-gray-100 list-none flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs group-open:rotate-90 transition-transform">
                            ▶
                          </span>
                          <span>{lesson.title} <span className="text-gray-400 font-normal ml-2">({lesson.id})</span></span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingLessonId(lesson.id);
                              setLessonId(lesson.id);
                              setLessonTitle(lesson.title);
                              setLessonKanji(lesson.kanjiList || '');
                              setLessonVocab(lesson.vocabList ? lesson.vocabList.replace(/;/g, '\n') : '');
                              
                              if (lesson.customVocab) {
                                setLessonCustomVocab(JSON.stringify(lesson.customVocab, null, 2));
                              } else { setLessonCustomVocab(''); }

                              setLessonYoutube(lesson.videoId || lesson.youtubeLink || '');
                              setLessonPdf(lesson.pdfUrl || lesson.pdfLink || '');
                              setLessonExercise(lesson.exerciseJson ? JSON.stringify(lesson.exerciseJson, null, 2) : '');
                            }}
                            className="px-3 py-1 bg-white text-blue-600 text-sm rounded border border-blue-200 hover:bg-blue-50"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setLessonToDelete({courseId: lessonCourseId, lessonId: lesson.id});
                            }}
                            className="px-3 py-1 bg-white text-red-600 text-sm rounded border border-red-200 hover:bg-red-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </summary>
                      <div className="px-6 py-4 bg-white border-t border-gray-200 text-sm text-gray-600">
                        {(lesson.videoId || lesson.youtubeLink) && (
                          <div className="mb-4 aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe 
                              src={(lesson.videoId || lesson.youtubeLink).includes('youtube.com') || (lesson.videoId || lesson.youtubeLink).includes('youtu.be') ? (lesson.videoId || lesson.youtubeLink) : `https://www.youtube.com/embed/${(lesson.videoId || lesson.youtubeLink)}`} 
                              title="YouTube video player" 
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                              allowFullScreen 
                              className="w-full h-full"
                            ></iframe>
                          </div>
                        )}
                        <p><strong>Kanji:</strong> {lesson.kanjiList}</p>
                        <p className="mt-2"><strong>Từ vựng:</strong> <span className="whitespace-pre-line">{lesson.vocabList}</span></p>
                        {(lesson.pdfUrl || lesson.pdfLink) && (
                          <p className="mt-2"><strong>Tài liệu PDF:</strong> <a href={lesson.pdfUrl || lesson.pdfLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">{lesson.pdfUrl || lesson.pdfLink}</a></p>
                        )}
                        {lesson.exerciseJson && (
                          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <strong>Bài tập:</strong>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {lesson.exerciseJson.map((ex: any, idx: number) => (
                                <li key={idx}>{ex.question}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                    );
                  })}
                </div>
              )}
            </details>
          </div>
        )}

        {activeAdminTab === 'kaiwa_courses' && (
          <div className="flex flex-col gap-8">
            <details className="group bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 open:pb-8" open>
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg group-open:rotate-90 transition-transform">
                    ▶
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">KHÓA HỌC KAIWA</h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý các khóa học hiển thị trên trang chủ Kaiwa (bảng kaiwa_courses)</p>
                  </div>
                </div>
              </summary>

              <div className="mt-8 flex justify-end mb-4">
                {!kwIsAddingCoursePopupOpen && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setKwIsAddingCoursePopupOpen(true);
                      setKwCourseFormId(''); setKwCourseFormTitle(''); setKwCourseFormDesc(''); setKwCourseFormImg(''); setKwCourseFormSort(kaiwaCoursesList.length);
                      setKwEditingCourseId(null);
                    }}
                    className="px-4 py-2 bg-[#23376D] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm"
                  >
                    + Thêm khóa học
                  </button>
                )}
              </div>

              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl w-1/5">Tên khóa</th>
                      <th className="px-4 py-3 w-1/3">Mô tả</th>
                      <th className="px-4 py-3">Ảnh</th>
                      <th className="px-4 py-3">Thứ tự</th>
                      <th className="px-4 py-3">Thống kê</th>
                      <th className="px-4 py-3 text-right rounded-tr-xl">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kaiwaCoursesList.map(course => {
                      const courseLessons = kaiwaLessonsList.filter(l => l.courseId === course.id);
                      return (
                      <React.Fragment key={course.id}>
                        <tr className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{course.title} <span className="text-gray-400 font-normal">({course.id})</span></td>
                          <td className="px-4 py-3">{course.description}</td>
                          <td className="px-4 py-3">
                            {course.imageUrl && <img src={course.imageUrl} alt={course.title} className="w-12 h-12 object-cover rounded-lg" />}
                          </td>
                          <td className="px-4 py-3">{course.sortOrder}</td>
                          <td className="px-4 py-3 text-xs">
                            <div>{courseLessons.length} buổi</div>
                            <div className="text-gray-500">{courseLessons.reduce((acc, l) => acc + (l.vocabulary?.length || 0), 0)} từ vựng</div>
                            <div className="text-gray-500">{courseLessons.reduce((acc, l) => acc + (l.grammar?.length || 0), 0)} ngữ pháp</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                if (kwEditingCourseId === course.id) {
                                  setKwEditingCourseId(null);
                                } else {
                                  setKwEditingCourseId(course.id);
                                  setKwIsAddingCoursePopupOpen(false);
                                  setKwCourseFormId(course.id);
                                  setKwCourseFormTitle(course.title);
                                  setKwCourseFormDesc(course.description);
                                  setKwCourseFormImg(course.imageUrl);
                                  setKwCourseFormSort(course.sortOrder);
                                }
                              }}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors font-medium mr-2"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => setKwCourseToDelete(course.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors font-medium"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                        {kwEditingCourseId === course.id && (
                          <tr className="border-b bg-blue-50/50">
                            <td colSpan={6} className="p-4">
                              <form onSubmit={handleSaveKwCourse} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID (Mã khóa)</label>
                                    <input
                                      required
                                      disabled
                                      className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                                      value={kwCourseFormId} onChange={e=>setKwCourseFormId(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học</label>
                                    <input
                                      required
                                      className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
                                      value={kwCourseFormTitle} onChange={e=>setKwCourseFormTitle(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                                    <input
                                      type="number"
                                      className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
                                      value={kwCourseFormSort} onChange={e=>setKwCourseFormSort(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                  <textarea
                                    required
                                    className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={kwCourseFormDesc} onChange={e=>setKwCourseFormDesc(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh Bìa</label>
                                  <input
                                    required
                                    className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={kwCourseFormImg} onChange={e=>setKwCourseFormImg(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                                    Cập nhật
                                  </button>
                                  <button type="button" onClick={() => setKwEditingCourseId(null)} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50">
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                    {kaiwaCoursesList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chưa có khóa học Kaiwa nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {kwIsAddingCoursePopupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold text-gray-800 mb-4 text-xl">Thêm Khóa Học Kaiwa Mới</h3>
                    <form onSubmit={handleSaveKwCourse} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID (Mã khóa, vd: kaiwa-socap)</label>
                          <input
                            required
                            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
                            value={kwCourseFormId} onChange={e=>setKwCourseFormId(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học</label>
                          <input
                            required
                            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
                            value={kwCourseFormTitle} onChange={e=>setKwCourseFormTitle(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                          required
                          className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                          value={kwCourseFormDesc} onChange={e=>setKwCourseFormDesc(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh Bìa</label>
                          <input
                            required
                            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
                            value={kwCourseFormImg} onChange={e=>setKwCourseFormImg(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                          <input
                            type="number"
                            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
                            value={kwCourseFormSort} onChange={e=>setKwCourseFormSort(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                          Thêm mới
                        </button>
                        <button type="button" onClick={() => setKwIsAddingCoursePopupOpen(false)} className="px-5 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">
                          Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </details>

            <details className="group bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 open:pb-8">
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg group-open:rotate-90 transition-transform">
                    ▶
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 uppercase">BUỔI HỌC KAIWA</h2>
                    <p className="text-sm text-gray-500 mt-1">Chọn khóa học để thêm/sửa từ vựng, ngữ pháp, tài liệu và slide của từng buổi (bảng kaiwa_lessons)</p>
                  </div>
                </div>
              </summary>

              <div className="mt-8 mb-8 flex flex-wrap gap-2">
                {kaiwaCoursesList.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setKwLessonCourseId(prev => prev === c.id ? '' : c.id)}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                      kwLessonCourseId === c.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
                {kaiwaCoursesList.length === 0 && <span className="text-sm text-gray-500 italic self-center">Chưa có khóa học nào - hãy thêm khóa học ở mục trên trước.</span>}
              </div>

              {kwLessonCourseId && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Danh sách buổi học</h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        resetKwLessonForm();
                        setKwLessonCourseId(kwLessonCourseId);
                        setKwLessonSort(kaiwaLessonsList.filter(l => l.courseId === kwLessonCourseId).length);
                        setKwEditingLessonId('new');
                        setTimeout(() => window.scrollTo({ top: document.getElementById('kw-lesson-form-anchor')?.offsetTop || 0, behavior: 'smooth' }), 100);
                      }}
                      className="px-4 py-2 bg-[#23376D] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm"
                    >
                      + Thêm buổi học
                    </button>
                  </div>
                  {kwEditingLessonId === 'new' && renderKwLessonForm(true)}

                  {kaiwaLessonsList.filter(l => l.courseId === kwLessonCourseId).sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((lesson) => {
                    if (kwEditingLessonId === lesson.id) {
                      return <React.Fragment key={lesson.id}>{renderKwLessonForm()}</React.Fragment>;
                    }

                    return (
                    <details key={lesson.id} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <summary className="px-6 py-4 font-bold text-gray-800 cursor-pointer hover:bg-gray-100 list-none flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs group-open:rotate-90 transition-transform">
                            ▶
                          </span>
                          <span>{lesson.title} <span className="text-gray-400 font-normal ml-2">({lesson.id})</span></span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setKwEditingLessonId(lesson.id);
                              setKwLessonCourseId(lesson.courseId);
                              setKwLessonId(lesson.id);
                              setKwLessonTitle(lesson.title);
                              setKwLessonSort(lesson.sortOrder ?? 0);
                              setKwLessonFileUrl(lesson.lessonFileUrl || '');
                              setKwLessonSlideFolder(lesson.slideFolder || '');
                              setKwLessonSlideExt(lesson.slideExt || 'svg');
                              setKwLessonSlideCount(lesson.slideCount ?? '');
                              setKwLessonVocabJson(JSON.stringify(lesson.vocabulary || [], null, 2));
                              setKwLessonGrammarJson(JSON.stringify(lesson.grammar || [], null, 2));
                              setKwVocabMode('builder');
                              setKwGrammarMode('builder');
                            }}
                            className="px-3 py-1 bg-white text-blue-600 text-sm rounded border border-blue-200 hover:bg-blue-50"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setKwLessonToDelete(lesson.id);
                            }}
                            className="px-3 py-1 bg-white text-red-600 text-sm rounded border border-red-200 hover:bg-red-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </summary>
                      <div className="px-6 py-4 bg-white border-t border-gray-200 text-sm text-gray-600 space-y-2">
                        <p><strong>Từ vựng:</strong> {(lesson.vocabulary || []).length} từ</p>
                        <p><strong>Ngữ pháp:</strong> {(lesson.grammar || []).length} mẫu</p>
                        {lesson.lessonFileUrl && (
                          <p><strong>Tài liệu:</strong> <a href={lesson.lessonFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">{lesson.lessonFileUrl}</a></p>
                        )}
                        {lesson.slideFolder && (
                          <p><strong>Slide:</strong> {lesson.slideFolder} ({lesson.slideCount || '?'} ảnh, .{lesson.slideExt || 'svg'})</p>
                        )}
                      </div>
                    </details>
                    );
                  })}
                  {kaiwaLessonsList.filter(l => l.courseId === kwLessonCourseId).length === 0 && kwEditingLessonId !== 'new' && (
                    <p className="text-sm text-gray-500 italic">Khóa học này chưa có buổi học nào.</p>
                  )}
                </div>
              )}
            </details>
          </div>
        )}

        {activeAdminTab === 'accounts' && (
          <div className="flex flex-col gap-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Danh sách học viên</h2>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button 
                  onClick={() => { setUserFilter('all'); setUserPage(1); }} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${userFilter === 'all' ? 'bg-[#23376D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  TẤT CẢ ({userList.length})
                </button>
                <button 
                  onClick={() => { setUserFilter('active'); setUserPage(1); }} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${userFilter === 'active' ? 'bg-[#23376D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  ĐÃ KÍCH HOẠT ({userList.filter(u => u.expiresAt !== null).length})
                </button>
                <button 
                  onClick={() => { setUserFilter('inactive'); setUserPage(1); }} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${userFilter === 'inactive' ? 'bg-[#23376D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  CHƯA KÍCH HOẠT ({userList.filter(u => u.expiresAt === null).length})
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              {selectedUsers.length > 0 && (
                <button 
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors mr-2"
                >
                  Xóa {selectedUsers.length} tài khoản
                </button>
              )}
              <button onClick={fetchUsers} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                Làm mới
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.includes(u.id))}
                      onChange={e => {
                        if (e.target.checked) {
                          const newSelected = [...selectedUsers];
                          paginatedUsers.forEach(u => {
                            if (!newSelected.includes(u.id)) newSelected.push(u.id);
                          });
                          setSelectedUsers(newSelected);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => !paginatedUsers.find(u => u.id === id)));
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3">Tên đăng nhập</th>
                  {mode === 'dora_kaiwa' && <th className="px-4 py-3">Vai trò</th>}
                  {mode === 'dora_kaiwa' && <th className="px-4 py-3">Mã học viên</th>}
                  <th className="px-4 py-3">Giới hạn thiết bị</th>
                  <th className="px-4 py-3">Ngày hết hạn</th>
                  <th className="px-4 py-3 text-right rounded-tr-xl">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <React.Fragment key={user.id}>
                    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedUsers.includes(user.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedUsers([...selectedUsers, user.id]);
                            else setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                      {mode === 'dora_kaiwa' && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'giaovien' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : user.role === 'giaovien' ? 'Giáo viên' : 'Học viên'}
                          </span>
                        </td>
                      )}
                      {mode === 'dora_kaiwa' && (
                        <td className="px-4 py-3 font-mono">{user.studentCode || '—'}</td>
                      )}
                      <td className="px-4 py-3">{user.maxDevices}</td>
                      <td className="px-4 py-3">
                        {formatDateStr(user.expiresAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => {
                            if (editingUserId === user.id) {
                              setEditingUserId(null);
                            } else {
                              setEditingUserId(user.id);
                              setEditUserForm({ 
                                password: '', 
                                maxDevices: user.maxDevices, 
                                expiresAt: user.expiresAt ? new Date(user.expiresAt).toISOString().split('T')[0] : '',
                                allowedCourses: user.allowedCourses || [],
                                studentCode: user.studentCode || '',
                                driveFolderId: user.driveFolderId || ''
                              });
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors font-medium mr-2"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => setUserToDelete(user.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors font-medium mr-2"
                        >
                          Xóa
                        </button>
                        <button 
                          onClick={() => handleResetUserDevices(user.id)}
                          className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 px-3 py-1 rounded-lg transition-colors font-medium"
                        >
                          Reset thiết bị
                        </button>
                      </td>
                    </tr>
                    {editingUserId === user.id && (
                      <tr className="bg-blue-50/50">
                        <td colSpan={mode === 'dora_kaiwa' ? 7 : 5} className="px-4 py-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-end gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu mới (bỏ trống nếu không đổi)</label>
                                <div className="relative">
                                  <input 
                                    type={showEditPassword ? "text" : "password"}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 w-48 text-sm pr-10" 
                                    value={editUserForm.password}
                                    onChange={e => setEditUserForm({...editUserForm, password: e.target.value})}
                                    placeholder="Nhập mật khẩu mới"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Số thiết bị</label>
                                <input 
                                  type="number" min="1"
                                  className="border border-gray-300 rounded-lg px-3 py-1.5 w-24 text-sm" 
                                  value={editUserForm.maxDevices}
                                  onChange={e => setEditUserForm({...editUserForm, maxDevices: e.target.value === '' ? '' : Number(e.target.value)})}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Ngày hết hạn (bỏ trống nếu vô hạn)</label>
                                <input
                                  type="date"
                                  className="border border-gray-300 rounded-lg px-3 py-1.5 w-full text-sm"
                                  value={editUserForm.expiresAt}
                                  onChange={e => setEditUserForm({...editUserForm, expiresAt: e.target.value})}
                                />
                              </div>
                              {mode === 'dora_kaiwa' && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Mã học viên</label>
                                    <input
                                      className="border border-gray-300 rounded-lg px-3 py-1.5 w-24 text-sm font-mono"
                                      placeholder="VD: 001"
                                      value={editUserForm.studentCode}
                                      onChange={e => setEditUserForm({...editUserForm, studentCode: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">ID Thư mục Drive</label>
                                    <input
                                      className="border border-gray-300 rounded-lg px-3 py-1.5 w-48 text-sm"
                                      placeholder="VD: 1BxiMVs0XRY..."
                                      value={editUserForm.driveFolderId}
                                      onChange={e => setEditUserForm({...editUserForm, driveFolderId: e.target.value})}
                                    />
                                  </div>
                                </>
                              )}
                              <div className="flex gap-2 items-end pb-0.5">
                                <button 
                                  onClick={() => handleUpdateUser(user.id)}
                                  disabled={isLoading}
                                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                                >
                                  Lưu
                                </button>
                                <button 
                                  onClick={() => setEditingUserId(null)}
                                  className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                            {(mode === 'xoa_mu_kanji' || (mode === 'dora_kaiwa' && user.role !== 'admin')) && (
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <label className="block text-xs font-medium text-gray-700">Quyền xem khóa học</label>
                                  <button
                                    type="button"
                                    onClick={() => setEditUserForm(prev => ({ ...prev, allowedCourses: (mode === 'dora_kaiwa' ? kaiwaCoursesList : coursesList).map(c => c.id) }))}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                                  >
                                    Chọn tất cả
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {(mode === 'dora_kaiwa' ? kaiwaCoursesList : coursesList).map(course => (
                                    <label key={course.id} className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
                                      <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        checked={editUserForm.allowedCourses.includes(course.id)}
                                        onChange={(e) => {
                                          const newCourses = e.target.checked
                                            ? [...editUserForm.allowedCourses, course.id]
                                            : editUserForm.allowedCourses.filter(id => id !== course.id);
                                          setEditUserForm({...editUserForm, allowedCourses: newCourses});
                                        }}
                                      />
                                      <span className="text-gray-700">{course.title}</span>
                                    </label>
                                  ))}
                                  {(mode === 'dora_kaiwa' ? kaiwaCoursesList : coursesList).length === 0 && <span className="text-xs text-gray-500 italic">Chưa có khóa học nào để chọn.</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {userList.length === 0 && (
                  <tr>
                    <td colSpan={mode === 'dora_kaiwa' ? 7 : 5} className="px-4 py-8 text-center text-gray-500">
                      Chưa có học viên nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button 
                onClick={() => setUserPage(p => Math.max(1, p - 1))}
                disabled={userPage === 1}
                className="px-3 py-1.5 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-1.5 text-sm font-medium text-gray-700">
                Trang {userPage} / {totalPages}
              </span>
              <button 
                onClick={() => setUserPage(p => Math.min(totalPages, p + 1))}
                disabled={userPage === totalPages}
                className="px-3 py-1.5 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Tạo tài khoản học viên mới</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setCreationMode('single')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${creationMode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tạo 1 tài khoản
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('bulk')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${creationMode === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tạo hàng loạt
              </button>
            </div>
          </div>
          
          <form onSubmit={creationMode === 'single' ? handleCreateUser : handleBulkCreateUser} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {creationMode === 'single' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                    <input 
                      required
                      className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                      placeholder="VD: hocvien01" 
                      value={username} 
                      onChange={e=>setUsername(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                      <input 
                        required
                        type={showCreatePassword ? "text" : "password"}
                        className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12" 
                        placeholder="Mật khẩu" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách tài khoản (Mỗi dòng 1 tài khoản, Tên đăng nhập [TAB] Mật khẩu)</label>
                  <textarea 
                    required
                    className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm min-h-[150px]" 
                    placeholder={`hocvien01\tmatkhau01\nhocvien02\tmatkhau02`} 
                    value={bulkUsersText} 
                    onChange={e=>setBulkUsersText(e.target.value)} 
                  />
                </div>
              )}
              
              {creationMode === 'single' && mode === 'dora_kaiwa' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <select 
                      className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={createRole}
                      onChange={e=>setCreateRole(e.target.value as any)}
                    >
                      <option value="hocvien">Học viên</option>
                      <option value="giaovien">Giáo viên</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Thư mục Drive (Tuỳ chọn)</label>
                    <input
                      className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="VD: 1BxiMVs0XRY..."
                      value={createDriveFolderId}
                      onChange={e=>setCreateDriveFolderId(e.target.value)}
                    />
                  </div>
                  {createRole !== 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mã học viên (tăng dần, không trùng)</label>
                      <input
                        required
                        className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                        placeholder="VD: 001"
                        value={createStudentCode}
                        onChange={e=>setCreateStudentCode(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số thiết bị cho phép</label>
                <input 
                  required
                  className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  type="number" 
                  min="1"
                  placeholder="Mặc định: 1" 
                  value={maxDevices} 
                  onChange={e=>setMaxDevices(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn sử dụng (Ngày, để trống = vô thời hạn)</label>
                <input 
                  className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  type="number" 
                  min="1"
                  placeholder="Mặc định: Không thời hạn" 
                  value={expiresInDays} 
                  onChange={e=>setExpiresInDays(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
            </div>

            {(mode === 'xoa_mu_kanji' || (mode === 'dora_kaiwa' && (creationMode === 'bulk' || createRole !== 'admin'))) && (
              <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="block text-sm font-medium text-gray-700">Quyền xem khóa học</label>
                <button
                  type="button"
                  onClick={() => setCreateAllowedCourses((mode === 'dora_kaiwa' ? kaiwaCoursesList : coursesList).map(c => c.id))}
                  className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Chọn tất cả
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {(mode === 'dora_kaiwa' ? kaiwaCoursesList : coursesList).map(course => (
                  <label key={course.id} className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={createAllowedCourses.includes(course.id)}
                      onChange={(e) => {
                        const newCourses = e.target.checked
                          ? [...createAllowedCourses, course.id]
                          : createAllowedCourses.filter(id => id !== course.id);
                        setCreateAllowedCourses(newCourses);
                      }}
                    />
                    <span className="text-gray-700 font-medium">{course.title}</span>
                  </label>
                ))}
                {(mode === 'dora_kaiwa' ? kaiwaCoursesList : coursesList).length === 0 && <span className="text-sm text-gray-500 italic">Chưa có khóa học nào để chọn.</span>}
              </div>
            </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#23376D] text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
            </button>
          </form>
        </div>
        </div>
        )}

        {activeAdminTab === 'password' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Đổi mật khẩu Admin</h2>
            <button
              onClick={() => user && handleResetUserDevices(user.id)}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-xl transition-colors font-medium border border-orange-200 text-sm"
            >
              Reset thiết bị của tôi
            </button>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input 
              required
              className="border border-gray-300 rounded-xl px-4 py-2.5 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              placeholder="Mật khẩu mới (từ 6 ký tự)" 
              value={newPassword} 
              onChange={e=>setNewPassword(e.target.value)} 
            />
            <button 
              type="submit" 
              disabled={isLoading || newPassword.length < 6}
              className="w-full md:w-auto bg-[#23376D] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 block mt-2"
            >
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
        )}

      </div>

      {/* Reset Devices Modal */}
      {userToResetDevices && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset thiết bị?</h3>
            <p className="text-gray-600 mb-4 text-sm">Bạn có chắc chắn muốn xóa tất cả thiết bị của học viên này?</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu Admin để xác nhận:</label>
              <input 
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm" 
                placeholder="Nhập mật khẩu của bạn..." 
                value={userToResetPassword} 
                onChange={e => setUserToResetPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setUserToResetDevices(null);
                  setUserToResetPassword('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmResetUserDevices}
                disabled={isLoading || !userToResetPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Reset'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa học viên?</h3>
            <p className="text-gray-600 mb-4 text-sm">Bạn có chắc chắn muốn xóa học viên này? Tài khoản sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu Admin để xác nhận:</label>
              <input 
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm" 
                placeholder="Nhập mật khẩu của bạn..." 
                value={userToDeletePassword} 
                onChange={e => setUserToDeletePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setUserToDelete(null);
                  setUserToDeletePassword('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={isLoading || !userToDeletePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xóa vĩnh viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Users Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa {selectedUsers.length} tài khoản?</h3>
            <p className="text-gray-600 mb-4 text-sm">Bạn có chắc chắn muốn xóa {selectedUsers.length} tài khoản đã chọn? Dữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu Admin để xác nhận:</label>
              <input 
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm" 
                placeholder="Nhập mật khẩu của bạn..." 
                value={bulkDeletePassword} 
                onChange={e => setBulkDeletePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBulkDeleteConfirm(false);
                  setBulkDeletePassword('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmBulkDeleteUsers}
                disabled={!bulkDeletePassword || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xóa vĩnh viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa khóa học?</h3>
            <p className="text-gray-600 mb-4 text-sm">Bạn có chắc chắn muốn xóa khóa học này? Mọi dữ liệu buổi học bên trong cũng sẽ bị xóa và không thể khôi phục.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu Admin để xác nhận:</label>
              <input 
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm" 
                placeholder="Nhập mật khẩu của bạn..." 
                value={courseToDeletePassword} 
                onChange={e => setCourseToDeletePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCourseToDelete(null);
                  setCourseToDeletePassword('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteCourse}
                disabled={isLoading || !courseToDeletePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xóa vĩnh viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Modal */}
      {lessonToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa buổi học?</h3>
            <p className="text-gray-600 mb-4 text-sm">Bạn có chắc chắn muốn xóa buổi học này? Dữ liệu không thể khôi phục.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu Admin để xác nhận:</label>
              <input 
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm" 
                placeholder="Nhập mật khẩu của bạn..." 
                value={lessonToDeletePassword} 
                onChange={e => setLessonToDeletePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setLessonToDelete(null);
                  setLessonToDeletePassword('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteLesson}
                disabled={isLoading || !lessonToDeletePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xóa vĩnh viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Kaiwa Course Modal */}
      {kwCourseToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa khóa học Kaiwa?</h3>
            <p className="text-gray-600 mb-4 text-sm">Bạn có chắc chắn muốn xóa khóa học này? Mọi buổi học bên trong cũng sẽ bị xóa và không thể khôi phục.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu Admin để xác nhận:</label>
              <input
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="Nhập mật khẩu của bạn..."
                value={kwCourseToDeletePassword}
                onChange={e => setKwCourseToDeletePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setKwCourseToDelete(null);
                  setKwCourseToDeletePassword('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteKwCourse}
                disabled={isLoading || !kwCourseToDeletePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xóa vĩnh viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Kaiwa Lesson Modal */}
      {kwLessonToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa buổi học Kaiwa?</h3>
            <p className="text-gray-600 mb-4 text-sm">Bạn có chắc chắn muốn xóa buổi học này? Dữ liệu không thể khôi phục.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu Admin để xác nhận:</label>
              <input
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="Nhập mật khẩu của bạn..."
                value={kwLessonToDeletePassword}
                onChange={e => setKwLessonToDeletePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setKwLessonToDelete(null);
                  setKwLessonToDeletePassword('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteKwLesson}
                disabled={isLoading || !kwLessonToDeletePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xóa vĩnh viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
