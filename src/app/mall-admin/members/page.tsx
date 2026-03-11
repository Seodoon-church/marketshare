'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { MiniStat } from '@/components/ui/Charts';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit as firestoreLimit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User } from '@/types';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserIcon,
  StarIcon,
  CurrencyDollarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// ---------- Helpers ----------

function userFromDoc(docSnap: any): User {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    birthDate: data.birthDate?.toDate() ?? null,
    lastLoginAt: data.lastLoginAt?.toDate() ?? new Date(),
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as User;
}

// ---------- Grade config ----------

const gradeConfig: Record<string, { label: string; color: string }> = {
  bronze: { label: '브론즈', color: 'bg-amber-700 text-white' },
  silver: { label: '실버', color: 'bg-gray-400 text-white' },
  gold: { label: '골드', color: 'bg-amber-500 text-white' },
  platinum: { label: '플래티넘', color: 'bg-cyan-600 text-white' },
  vip: { label: 'VIP', color: 'bg-purple-600 text-white' },
};

// ---------- Role labels ----------

const roleLabels: Record<string, string> = {
  customer: '일반회원',
  mall_owner: '몰 관리자',
  platform_admin: '플랫폼 관리자',
  supplier: '공급사',
};

type FilterRole = 'all' | 'customer' | 'mall_owner' | 'supplier';

// ---------- Component ----------

export default function MallAdminMembers() {
  const { user: authUser, isLoading: authLoading, isMallOwner } = useAuth();

  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const mallId = authUser?.ownedMallIds?.[0];
  const PAGE_SIZE = 20;

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Fetch all users (mall doesn't have a dedicated members subcollection,
  // so we query the global users collection - in production you'd filter by mall-specific orders)
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(200)
      );
      const snap = await getDocs(q);
      setMembers(snap.docs.map(userFromDoc));
    } catch (err) {
      console.error('회원 목록 로딩 실패:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mallId) fetchMembers();
  }, [mallId, fetchMembers]);

  // Filtering
  const filtered = members.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesSearch =
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search);
    return matchesRole && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedMembers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const totalMembers = members.length;
  const customerCount = members.filter((m) => m.role === 'customer').length;
  const todayCount = members.filter((m) => {
    const today = new Date();
    return (
      m.createdAt instanceof Date &&
      m.createdAt.toDateString() === today.toDateString()
    );
  }).length;

  // Detail modal
  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        setSelectedUser(userFromDoc(snap));
      }
    } catch {
      alert('회원 정보를 불러올 수 없습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle user verification
  const toggleVerification = async (userId: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: !current,
        updatedAt: serverTimestamp(),
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, isVerified: !current } : m))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, isVerified: !current });
      }
    } catch {
      alert('변경 실패');
    }
  };

  if (authLoading || loading) {
    return <FullPageLoader message="회원 목록을 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UsersIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MiniStat
          label="전체 회원"
          value={`${totalMembers}명`}
          icon={<UsersIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="일반 회원"
          value={`${customerCount}명`}
          icon={<UserIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="오늘 가입"
          value={`${todayCount}명`}
          icon={<StarIcon className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="이름, 이메일, 전화번호 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          {([
            { key: 'all', label: '전체' },
            { key: 'customer', label: '일반회원' },
            { key: 'mall_owner', label: '몰 관리자' },
            { key: 'supplier', label: '공급사' },
          ] as { key: FilterRole; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setRoleFilter(opt.key); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === opt.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Member table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">회원</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">연락처</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">역할</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">등급</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">포인트</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">인증</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">가입일</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-gray-400">
                    {members.length === 0 ? '등록된 회원이 없습니다.' : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : (
                pagedMembers.map((member) => {
                  const grade = mallId && member.gradeByMall?.[mallId]
                    ? gradeConfig[member.gradeByMall[mallId]] || null
                    : null;
                  const points = mallId ? (member.pointsByMall?.[mallId] || 0) : member.pointBalance;

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                            {member.profileImageUrl ? (
                              <img src={member.profileImageUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              (member.name || '?')[0]
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name || '(이름 없음)'}</p>
                            <p className="text-xs text-gray-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {member.phone || '-'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {grade ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${grade.color}`}>
                            {grade.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">
                        {points > 0 ? formatKRW(points) : '-'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => toggleVerification(member.id, member.isVerified || false)}
                          className="inline-flex"
                          title={member.isVerified ? '인증됨 (클릭하여 해제)' : '미인증 (클릭하여 인증)'}
                        >
                          <ShieldCheckIcon
                            className={`h-5 w-5 ${member.isVerified ? 'text-emerald-500' : 'text-gray-300'}`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {member.createdAt instanceof Date
                          ? member.createdAt.toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(member.id)}
                        >
                          상세
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">회원 상세 정보</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-500">
                  {selectedUser.profileImageUrl ? (
                    <img src={selectedUser.profileImageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    (selectedUser.name || '?')[0]
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{selectedUser.name || '(이름 없음)'}</h4>
                  <p className="text-sm text-gray-500">{roleLabels[selectedUser.role] || selectedUser.role}</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                <InfoRow icon={<EnvelopeIcon className="h-4 w-4" />} label="이메일" value={selectedUser.email} />
                <InfoRow icon={<PhoneIcon className="h-4 w-4" />} label="전화번호" value={selectedUser.phone || '-'} />
                <InfoRow icon={<UserIcon className="h-4 w-4" />} label="성별" value={selectedUser.gender === 'male' ? '남성' : selectedUser.gender === 'female' ? '여성' : '-'} />
                <InfoRow icon={<StarIcon className="h-4 w-4" />} label="생년월일" value={selectedUser.birthDate instanceof Date ? selectedUser.birthDate.toLocaleDateString('ko-KR') : '-'} />
                <InfoRow icon={<CurrencyDollarIcon className="h-4 w-4" />} label="포인트" value={formatKRW(mallId ? (selectedUser.pointsByMall?.[mallId] || 0) : selectedUser.pointBalance)} />
                <InfoRow icon={<ShieldCheckIcon className="h-4 w-4" />} label="본인인증" value={selectedUser.isVerified ? '인증됨' : '미인증'} />
                <InfoRow label="가입일" value={selectedUser.createdAt instanceof Date ? selectedUser.createdAt.toLocaleString('ko-KR') : '-'} />
                <InfoRow label="최근 로그인" value={selectedUser.lastLoginAt instanceof Date ? selectedUser.lastLoginAt.toLocaleString('ko-KR') : '-'} />
                <InfoRow label="마케팅 동의" value={selectedUser.marketingConsent ? '동의' : '미동의'} />
              </div>

              {/* Address */}
              {selectedUser.defaultAddress && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">기본 배송지</p>
                  <p className="text-sm text-gray-700">
                    [{selectedUser.defaultAddress.zipcode}] {selectedUser.defaultAddress.address} {selectedUser.defaultAddress.addressDetail}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedUser.defaultAddress.name} / {selectedUser.defaultAddress.phone}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- InfoRow ----------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="w-20 text-gray-500 flex-shrink-0">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
