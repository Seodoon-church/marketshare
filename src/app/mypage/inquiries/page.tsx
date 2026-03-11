'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/auth-store';
import { db } from '@/lib/firebase/config';
import { formatDate } from '@/lib/utils/format';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  FaceFrownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type InquiryCategory = '상품' | '배송' | '교환반품' | '기타';
type InquiryStatus = '답변대기' | '답변완료';

interface InquiryItem {
  id: string;
  category: InquiryCategory;
  title: string;
  question: string;
  answer: string | null;
  status: InquiryStatus;
  date: string;
  answeredDate: string | null;
}

const categoryBadgeVariant: Record<InquiryCategory, 'default' | 'info' | 'warning' | 'secondary'> = {
  '상품': 'default',
  '배송': 'info',
  '교환반품': 'warning',
  '기타': 'secondary',
};

const categoryOptions = [
  { label: '상품', value: '상품' },
  { label: '배송', value: '배송' },
  { label: '교환/반품', value: '교환반품' },
  { label: '기타', value: '기타' },
];

function toDateString(val: unknown): string {
  if (!val) return '';
  if (val instanceof Timestamp) {
    return val.toDate().toISOString().slice(0, 10);
  }
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return '';
}

export default function InquiriesPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuthStore();
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState<string>('상품');
  const [formTitle, setFormTitle] = useState('');
  const [formQuestion, setFormQuestion] = useState('');

  const getInquiriesRef = useCallback(() => {
    if (!user) return null;
    return collection(db, 'users', user.id, 'inquiries');
  }, [user]);

  // Load inquiries from Firestore
  const loadInquiries = useCallback(async () => {
    const ref = getInquiriesRef();
    if (!ref) return;

    try {
      setLoading(true);
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: InquiryItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          category: (data.category as InquiryCategory) ?? '기타',
          title: data.title ?? '',
          question: data.question ?? '',
          answer: data.answer ?? null,
          status: (data.status as InquiryStatus) ?? '답변대기',
          date: toDateString(data.createdAt || data.date),
          answeredDate: toDateString(data.answeredDate),
        };
      });
      setInquiries(items);
    } catch (error) {
      console.error('문의 내역 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [getInquiriesRef]);

  useEffect(() => {
    if (user) {
      loadInquiries();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, loadInquiries]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Submit new inquiry
  const handleSubmit = async () => {
    const ref = getInquiriesRef();
    if (!ref || !user) return;

    if (!formTitle.trim() || !formQuestion.trim()) return;

    try {
      setSaving(true);
      await addDoc(ref, {
        category: formCategory,
        title: formTitle.trim(),
        question: formQuestion.trim(),
        answer: null,
        status: '답변대기',
        answeredDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setShowForm(false);
      setFormCategory('상품');
      setFormTitle('');
      setFormQuestion('');
      await loadInquiries();
    } catch (error) {
      console.error('문의 등록 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormCategory('상품');
    setFormTitle('');
    setFormQuestion('');
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">1:1 문의</h1>
          <p className="mt-1 text-sm text-gray-500">궁금한 점을 문의해 주세요.</p>
        </div>
        <Card className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
          <p className="mt-4 text-base font-medium text-gray-900">로그인이 필요합니다</p>
          <p className="mt-1 text-sm text-gray-500">문의하려면 먼저 로그인해 주세요.</p>
        </Card>
      </div>
    );
  }

  // Data loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">1:1 문의</h1>
            <p className="mt-1 text-sm text-gray-500">궁금한 점을 문의해 주세요.</p>
          </div>
        </div>
        <div className="flex min-h-[300px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Empty state (no form open)
  if (inquiries.length === 0 && !showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">1:1 문의</h1>
            <p className="mt-1 text-sm text-gray-500">궁금한 점을 문의해 주세요.</p>
          </div>
          <Button variant="default" size="sm" onClick={() => setShowForm(true)}>
            <PlusIcon className="h-4 w-4" />
            문의하기
          </Button>
        </div>

        <Card className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FaceFrownIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mt-4 text-base font-medium text-gray-900">문의 내역이 없습니다</p>
          <p className="mt-1 text-sm text-gray-500">궁금한 점이 있으시면 문의해 주세요.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">1:1 문의</h1>
          <p className="mt-1 text-sm text-gray-500">궁금한 점을 문의해 주세요.</p>
        </div>
        {!showForm && (
          <Button variant="default" size="sm" onClick={() => setShowForm(true)}>
            <PlusIcon className="h-4 w-4" />
            문의하기
          </Button>
        )}
      </div>

      {/* New Inquiry Form */}
      {showForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">새 문의 작성</h2>
              <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <Select
              label="문의 유형"
              options={categoryOptions}
              value={formCategory}
              onChange={(val) => setFormCategory(val)}
              placeholder="문의 유형을 선택하세요"
            />

            <Input
              label="제목"
              placeholder="문의 제목을 입력하세요"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />

            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                문의 내용
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="문의 내용을 입력하세요"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={cancelForm}>
                취소
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmit}
                isLoading={saving}
                disabled={!formTitle.trim() || !formQuestion.trim()}
              >
                문의 등록
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Inquiry List */}
      <div className="space-y-3">
        {inquiries.map((inquiry) => (
          <Card key={inquiry.id} padding="none">
            {/* Inquiry Header (clickable) */}
            <button
              onClick={() => toggleExpand(inquiry.id)}
              className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-gray-50/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={categoryBadgeVariant[inquiry.category]}>
                    {inquiry.category}
                  </Badge>
                  <Badge
                    variant={inquiry.status === '답변완료' ? 'success' : 'warning'}
                  >
                    {inquiry.status}
                  </Badge>
                </div>
                <p className="mt-2 truncate text-sm font-medium text-gray-900">
                  {inquiry.title}
                </p>
                {inquiry.date && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(inquiry.date)}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-gray-400">
                {expandedId === inquiry.id ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {expandedId === inquiry.id && (
              <div className="border-t border-gray-100 px-5 pb-5">
                {/* Question */}
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs font-semibold text-primary">문의 내용</span>
                  </div>
                  <p className="mt-2 rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                    {inquiry.question}
                  </p>
                </div>

                {/* Answer */}
                {inquiry.answer ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                          <span className="text-[8px] font-bold text-white">A</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">답변</span>
                      </div>
                      {inquiry.answeredDate && (
                        <span className="text-xs text-gray-400">
                          {formatDate(inquiry.answeredDate)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 rounded-xl bg-emerald-50/50 p-4 text-sm leading-relaxed text-gray-700">
                      {inquiry.answer}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-amber-50/50 p-4 text-center">
                    <p className="text-sm text-amber-600">
                      답변 대기 중입니다. 빠른 시일 내에 답변드리겠습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
