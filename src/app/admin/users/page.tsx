'use client';

import { useState, useEffect } from 'react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatDateTime, formatPhone } from '@/lib/utils/format';
import {
  MagnifyingGlassIcon,
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { getUsers, createUserByAdmin, updateUser, updateUserGrade } from '@/lib/services/user-service';
import { getMalls } from '@/lib/services/mall-service';
import { getMallGrades } from '@/lib/services/grade-service';
import { useAuth } from '@/lib/hooks/useAuth';
import type { User, UserRole, Mall, MemberGrade } from '@/types';

type RoleFilter = 'all' | UserRole;

const roleBadgeMap: Record<UserRole, { label: string; variant: 'secondary' | 'default' | 'danger' | 'info' }> = {
  customer: { label: '일반회원', variant: 'secondary' },
  mall_owner: { label: '몰운영자', variant: 'default' },
  platform_admin: { label: '관리자', variant: 'danger' },
  supplier: { label: '공급업체', variant: 'info' },
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'customer', label: '일반회원' },
  { value: 'mall_owner', label: '몰운영자' },
  { value: 'supplier', label: '공급업체' },
  { value: 'platform_admin', label: '관리자' },
];

interface CreateUserForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

const initialForm: CreateUserForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
};

interface EditUserForm {
  name: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
}

export default function AdminUsersPage() {
  const { user: authUser, isLoading: authLoading, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>(initialForm);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ name: '', phone: '', role: 'customer', isVerified: false });
  const [isSaving, setIsSaving] = useState(false);

  // Grade editing
  const [allMalls, setAllMalls] = useState<Mall[]>([]);
  const [gradesByMall, setGradesByMall] = useState<Record<string, MemberGrade[]>>({});
  const [editGradeByMall, setEditGradeByMall] = useState<Record<string, string>>({});
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState<string | null>(null);

  // Admin guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getUsers({ limit: 50 });
      setUsers(result.users);
    } catch (err: any) {
      setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    fetchUsers();
  }, [authLoading, isAdmin]);

  const handleCreateUser = async () => {
    if (!createForm.name.trim()) {
      toast({ type: 'error', message: '이름을 입력해주세요.' });
      return;
    }
    if (!createForm.email.trim()) {
      toast({ type: 'error', message: '이메일을 입력해주세요.' });
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      toast({ type: 'error', message: '비밀번호는 6자 이상 입력해주세요.' });
      return;
    }

    setIsCreating(true);
    try {
      await createUserByAdmin({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      toast({ type: 'success', message: '회원이 등록되었습니다.' });
      setShowCreateModal(false);
      setCreateForm(initialForm);
      setShowPassword(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ type: 'error', message: err.message || '회원 등록에 실패했습니다.' });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = async (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      isVerified: user.isVerified,
    });
    setEditGradeByMall({ ...(user.gradeByMall || {}) });

    // Load malls and their grades
    setIsLoadingGrades(true);
    try {
      const malls = await getMalls();
      setAllMalls(malls);

      // Load grades for each mall that this user belongs to (or all malls for admin flexibility)
      const gradeMap: Record<string, MemberGrade[]> = {};
      await Promise.all(
        malls.map(async (mall) => {
          try {
            const grades = await getMallGrades(mall.id);
            if (grades.length > 0) {
              gradeMap[mall.id] = grades;
            }
          } catch {
            // Skip malls without grades
          }
        })
      );
      setGradesByMall(gradeMap);
    } catch {
      // Non-critical: grades section won't show
    } finally {
      setIsLoadingGrades(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editForm.name.trim()) {
      toast({ type: 'error', message: '이름을 입력해주세요.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateUser(editingUser.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        isVerified: editForm.isVerified,
      });
      toast({ type: 'success', message: '회원 정보가 수정되었습니다.' });
      setEditingUser(null);
      // Update local state immediately
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: editForm.name.trim(), phone: editForm.phone.trim(), role: editForm.role, isVerified: editForm.isVerified }
            : u
        )
      );
    } catch (err: any) {
      toast({ type: 'error', message: err.message || '회원 정보 수정에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGradeChange = async (mallId: string, gradeId: string) => {
    if (!editingUser) return;
    setIsSavingGrade(mallId);
    try {
      await updateUserGrade(editingUser.id, mallId, gradeId);
      setEditGradeByMall((prev) => ({ ...prev, [mallId]: gradeId }));
      // Update local user state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, gradeByMall: { ...u.gradeByMall, [mallId]: gradeId } }
            : u
        )
      );
      const gradeName = gradesByMall[mallId]?.find((g) => g.id === gradeId)?.name || gradeId;
      const mallName = allMalls.find((m) => m.id === mallId)?.name || mallId;
      toast({ type: 'success', message: `${mallName} 등급이 "${gradeName}"(으)로 변경되었습니다.` });
    } catch (err: any) {
      toast({ type: 'error', message: err.message || '등급 변경에 실패했습니다.' });
    } finally {
      setIsSavingGrade(null);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const roleTabs: { key: RoleFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: users.length },
    { key: 'customer', label: '일반회원', count: users.filter(u => u.role === 'customer').length },
    { key: 'mall_owner', label: '몰운영자', count: users.filter(u => u.role === 'mall_owner').length },
    { key: 'platform_admin', label: '관리자', count: users.filter(u => u.role === 'platform_admin').length },
    { key: 'supplier', label: '공급업체', count: users.filter(u => u.role === 'supplier').length },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesRole = activeTab === 'all' || user.role === activeTab;
    const matchesSearch =
      search === '' ||
      user.name.includes(search) ||
      user.email.includes(search) ||
      (user.phone || '').includes(search);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <UsersIcon className="h-5 w-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4" />
          회원 등록
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {roleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              activeTab === tab.key
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <p className={`text-sm ${
              activeTab === tab.key ? 'text-primary' : 'text-gray-500'
            }`}>
              {tab.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${
              activeTab === tab.key ? 'text-primary' : 'text-gray-900'
            }`}>
              {tab.count.toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="이름, 이메일, 연락처 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <div className="py-8 text-center text-sm text-red-500">{error}</div>
        </Card>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px]">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">이름</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">이메일</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">연락처</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">유형</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">인증</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">가입일</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">최종로그인</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const badge = roleBadgeMap[user.role];
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {formatPhone(user.phone)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        {user.isVerified ? (
                          <Badge variant="success">인증</Badge>
                        ) : (
                          <Badge variant="secondary">미인증</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDateTime(user.lastLoginAt)}
                      </td>
                      <td className="px-5 py-3">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(user)}>
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          수정
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm(initialForm);
          setShowPassword(false);
        }}
        title="회원 수동 등록"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            관리자가 직접 회원 계정을 생성합니다. 생성된 계정으로 즉시 로그인할 수 있습니다.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              이름 <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="회원 이름"
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              이메일 <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              연락처
            </label>
            <Input
              placeholder="010-0000-0000"
              value={createForm.phone}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="6자 이상"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              회원 유형 <span className="text-red-500">*</span>
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {createForm.role === 'platform_admin' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-800">
                관리자 권한은 플랫폼 전체에 대한 접근 권한을 부여합니다. 신중하게 설정해주세요.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm(initialForm);
                setShowPassword(false);
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" />
                  등록 중...
                </>
              ) : (
                '회원 등록'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="회원 정보 수정"
        size="md"
      >
        {editingUser && (
          <div className="space-y-4">
            {/* Read-only info */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">이메일</span>
                  <p className="font-medium text-gray-700">{editingUser.email}</p>
                </div>
                <div>
                  <span className="text-gray-400">가입일</span>
                  <p className="font-medium text-gray-700">{formatDate(editingUser.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-400">최종 로그인</span>
                  <p className="font-medium text-gray-700">{formatDateTime(editingUser.lastLoginAt)}</p>
                </div>
                <div>
                  <span className="text-gray-400">UID</span>
                  <p className="font-mono text-xs text-gray-500 truncate" title={editingUser.id}>{editingUser.id}</p>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                연락처
              </label>
              <Input
                placeholder="010-0000-0000"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                회원 유형
              </label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {editForm.role === 'platform_admin' && editingUser.role !== 'platform_admin' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-medium text-amber-800">
                  관리자 권한을 부여하면 플랫폼 전체에 대한 접근 권한이 생깁니다.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={editForm.isVerified}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isVerified: e.target.checked }))}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-gray-700">본인 인증 완료</span>
            </div>

            {/* Grade by Mall */}
            {isLoadingGrades ? (
              <div className="flex items-center gap-2 py-2">
                <LoadingSpinner size="sm" />
                <span className="text-xs text-gray-500">등급 정보 로딩 중...</span>
              </div>
            ) : Object.keys(gradesByMall).length > 0 ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  몰별 회원등급
                </label>
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  {Object.entries(gradesByMall).map(([mallId, grades]) => {
                    const mall = allMalls.find((m) => m.id === mallId);
                    if (!mall) return null;
                    const currentGradeId = editGradeByMall[mallId] || '';
                    const currentGrade = grades.find((g) => g.id === currentGradeId);
                    return (
                      <div key={mallId} className="flex items-center gap-3">
                        <span className="min-w-[100px] text-sm font-medium text-gray-700 truncate" title={mall.name}>
                          {mall.name}
                        </span>
                        <select
                          value={currentGradeId}
                          onChange={(e) => handleGradeChange(mallId, e.target.value)}
                          disabled={isSavingGrade === mallId}
                          className={`h-8 flex-1 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                            isSavingGrade === mallId ? 'opacity-50' : ''
                          }`}
                        >
                          <option value="">미지정</option>
                          {grades.map((grade) => (
                            <option key={grade.id} value={grade.id}>
                              {grade.name} (Lv.{grade.level})
                            </option>
                          ))}
                        </select>
                        {currentGrade && (
                          <span
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: currentGrade.color }}
                            title={currentGrade.name}
                          />
                        )}
                        {isSavingGrade === mallId && <LoadingSpinner size="sm" />}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  등급 변경은 즉시 적용됩니다.
                </p>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                취소
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
