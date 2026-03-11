'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/auth-store';
import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  MapPinIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  FaceFrownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AddressItem {
  id: string;
  name: string;
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
}

interface AddressFormData {
  name: string;
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
}

const emptyForm: AddressFormData = {
  name: '',
  recipientName: '',
  phone: '',
  zipcode: '',
  address: '',
  addressDetail: '',
};

export default function AddressesPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);

  const getAddressesRef = useCallback(() => {
    if (!user) return null;
    return collection(db, 'users', user.id, 'addresses');
  }, [user]);

  // Load addresses from Firestore
  const loadAddresses = useCallback(async () => {
    const ref = getAddressesRef();
    if (!ref) return;

    try {
      setLoading(true);
      const q = query(ref, orderBy('isDefault', 'desc'));
      const snapshot = await getDocs(q);
      const items: AddressItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name ?? '',
        recipientName: d.data().recipientName ?? '',
        phone: d.data().phone ?? '',
        zipcode: d.data().zipcode ?? '',
        address: d.data().address ?? '',
        addressDetail: d.data().addressDetail ?? '',
        isDefault: d.data().isDefault ?? false,
      }));
      setAddresses(items);
    } catch (error) {
      console.error('배송지 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [getAddressesRef]);

  useEffect(() => {
    if (user) {
      loadAddresses();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, loadAddresses]);

  // Add or update address
  const handleSubmit = async () => {
    const ref = getAddressesRef();
    if (!ref || !user) return;

    // Basic validation
    if (!formData.name.trim() || !formData.recipientName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        // Update existing
        const docRef = doc(db, 'users', user.id, 'addresses', editingId);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add new -- if first address, set as default
        const isFirst = addresses.length === 0;
        await addDoc(ref, {
          ...formData,
          isDefault: isFirst,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      await loadAddresses();
    } catch (error) {
      console.error('배송지 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete address
  const removeAddress = async (id: string) => {
    if (!user) return;
    const target = addresses.find((a) => a.id === id);
    if (target?.isDefault) return; // Cannot delete default address

    try {
      const docRef = doc(db, 'users', user.id, 'addresses', id);
      await deleteDoc(docRef);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('배송지 삭제 실패:', error);
    }
  };

  // Set as default address
  const setAsDefault = async (id: string) => {
    if (!user) return;

    try {
      const batch = writeBatch(db);

      // Unset current default
      const currentDefault = addresses.find((a) => a.isDefault);
      if (currentDefault) {
        batch.update(doc(db, 'users', user.id, 'addresses', currentDefault.id), {
          isDefault: false,
        });
      }

      // Set new default
      batch.update(doc(db, 'users', user.id, 'addresses', id), {
        isDefault: true,
      });

      await batch.commit();

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
    } catch (error) {
      console.error('기본배송지 설정 실패:', error);
    }
  };

  // Open edit form
  const startEdit = (addr: AddressItem) => {
    setFormData({
      name: addr.name,
      recipientName: addr.recipientName,
      phone: addr.phone,
      zipcode: addr.zipcode,
      address: addr.address,
      addressDetail: addr.addressDetail,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  // Open add form
  const startAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  // Cancel form
  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
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
          <h1 className="text-2xl font-bold text-gray-900">배송지 관리</h1>
          <p className="mt-1 text-sm text-gray-500">배송지를 등록하고 관리하세요.</p>
        </div>
        <Card className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
          <p className="mt-4 text-base font-medium text-gray-900">로그인이 필요합니다</p>
          <p className="mt-1 text-sm text-gray-500">배송지를 관리하려면 먼저 로그인해 주세요.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">배송지 관리</h1>
            <p className="mt-1 text-sm text-gray-500">배송지를 등록하고 관리하세요.</p>
          </div>
        </div>
        <div className="flex min-h-[300px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Empty state (no form open)
  if (addresses.length === 0 && !showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">배송지 관리</h1>
            <p className="mt-1 text-sm text-gray-500">배송지를 등록하고 관리하세요.</p>
          </div>
          <Button variant="default" size="sm" onClick={startAdd}>
            <PlusIcon className="h-4 w-4" />
            새 배송지 추가
          </Button>
        </div>

        <Card className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FaceFrownIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mt-4 text-base font-medium text-gray-900">등록된 배송지가 없습니다</p>
          <p className="mt-1 text-sm text-gray-500">자주 사용하는 배송지를 등록해 보세요.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">배송지 관리</h1>
          <p className="mt-1 text-sm text-gray-500">배송지를 등록하고 관리하세요.</p>
        </div>
        {!showForm && (
          <Button variant="default" size="sm" onClick={startAdd} disabled={addresses.length >= 10}>
            <PlusIcon className="h-4 w-4" />
            새 배송지 추가
          </Button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? '배송지 수정' : '새 배송지 추가'}
              </h2>
              <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="배송지명"
                placeholder="예: 집, 회사"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                label="수령인"
                placeholder="수령인 이름"
                value={formData.recipientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
              />
              <Input
                label="연락처"
                placeholder="010-0000-0000"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                label="우편번호"
                placeholder="우편번호"
                value={formData.zipcode}
                onChange={(e) => setFormData((prev) => ({ ...prev, zipcode: e.target.value }))}
              />
            </div>
            <Input
              label="주소"
              placeholder="기본 주소"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
            <Input
              label="상세주소"
              placeholder="상세 주소"
              value={formData.addressDetail}
              onChange={(e) => setFormData((prev) => ({ ...prev, addressDetail: e.target.value }))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={cancelForm}>
                취소
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmit}
                isLoading={saving}
                disabled={!formData.name.trim() || !formData.recipientName.trim() || !formData.phone.trim() || !formData.address.trim()}
              >
                {editingId ? '수정 완료' : '추가'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Address Cards */}
      <div className="space-y-4">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <div className="flex items-start justify-between gap-4">
              {/* Address Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-gray-900">{addr.name}</span>
                  {addr.isDefault && (
                    <Badge variant="default">기본배송지</Badge>
                  )}
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-medium">{addr.recipientName}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">{addr.phone}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="mr-1.5 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                        {addr.zipcode}
                      </span>
                      {addr.address} {addr.addressDetail}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(addr)}>
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    수정
                  </Button>
                  {!addr.isDefault && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsDefault(addr.id)}
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        기본배송지로 설정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeAddress(addr.id)}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Note */}
      <div className="rounded-xl bg-blue-50/50 p-4">
        <p className="text-xs leading-relaxed text-blue-600">
          기본배송지는 주문 시 자동으로 입력됩니다. 배송지는 최대 10개까지 등록할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
