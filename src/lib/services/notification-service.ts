// ============================================
// MarketShare - Notification Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  NotificationSettings,
  NotificationHistory,
  NotificationTemplateData,
  NotificationType,
  NotificationStatus,
  NotificationTemplateKey,
} from '@/types';

// ---------- Helper ----------

function notificationHistoryFromDoc(docSnap: DocumentSnapshot): NotificationHistory {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    sentAt: data.sentAt?.toDate() ?? null,
  } as NotificationHistory;
}

function notificationTemplateFromDoc(docSnap: DocumentSnapshot): NotificationTemplateData {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as NotificationTemplateData;
}

function notificationSettingsFromDoc(docSnap: DocumentSnapshot): NotificationSettings {
  const data = docSnap.data()!;
  return {
    ...data,
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as NotificationSettings;
}

// ---------- Get Notification Settings ----------

export async function getNotificationSettings(
  mallId: string
): Promise<NotificationSettings | null> {
  try {
    const docSnap = await getDoc(doc(db, 'notification_settings', mallId));
    if (!docSnap.exists()) return null;
    return notificationSettingsFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('알림 설정을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Update Notification Settings ----------

export async function updateNotificationSettings(
  mallId: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  try {
    const docRef = doc(db, 'notification_settings', mallId);
    await setDoc(
      docRef,
      {
        ...settings,
        mallId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: any) {
    throw new Error('알림 설정 업데이트 중 오류가 발생했습니다.');
  }
}

// ---------- Get Notification Templates ----------

export async function getNotificationTemplates(
  mallId?: string
): Promise<NotificationTemplateData[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (mallId) {
      // Get mall-specific templates + platform defaults (mallId == null)
      const mallQuery = query(
        collection(db, 'notification_templates'),
        where('mallId', '==', mallId)
      );
      const platformQuery = query(
        collection(db, 'notification_templates'),
        where('mallId', '==', null)
      );

      const [mallSnapshot, platformSnapshot] = await Promise.all([
        getDocs(mallQuery),
        getDocs(platformQuery),
      ]);

      const templates = [
        ...mallSnapshot.docs.map(notificationTemplateFromDoc),
        ...platformSnapshot.docs.map(notificationTemplateFromDoc),
      ];

      return templates;
    } else {
      // Get all templates
      const q = query(collection(db, 'notification_templates'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(notificationTemplateFromDoc);
    }
  } catch (error: any) {
    throw new Error('알림 템플릿을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Notification Template ----------

export async function createNotificationTemplate(
  data: Omit<NotificationTemplateData, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'notification_templates'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error('알림 템플릿 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Notification Template ----------

export async function updateNotificationTemplate(
  templateId: string,
  data: Partial<NotificationTemplateData>
): Promise<void> {
  try {
    const docRef = doc(db, 'notification_templates', templateId);
    await setDoc(docRef, data, { merge: true });
  } catch (error: any) {
    throw new Error('알림 템플릿 업데이트 중 오류가 발생했습니다.');
  }
}

// ---------- Get Notification History ----------

export async function getNotificationHistory(filters: {
  mallId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  limit?: number;
  startAfter?: any;
}): Promise<{ history: NotificationHistory[]; hasMore: boolean }> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.mallId) {
      constraints.push(where('mallId', '==', filters.mallId));
    }

    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 50;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfter) {
      constraints.push(startAfter(filters.startAfter));
    }

    const q = query(collection(db, 'notification_history'), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      history: resultDocs.map(notificationHistoryFromDoc),
      hasMore,
    };
  } catch (error: any) {
    throw new Error('알림 내역을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Notification Record ----------

export async function createNotificationRecord(
  data: Omit<NotificationHistory, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'notification_history'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error('알림 기록 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Get Default Templates ----------

export function getDefaultTemplates(): NotificationTemplateData[] {
  const now = new Date();

  return [
    {
      id: 'default_order_confirm',
      key: 'order_confirm',
      name: '주문 확인',
      type: 'sms',
      subject: '주문 접수 완료',
      content: '[{{mallName}}] {{userName}}님, 주문번호 {{orderNumber}} 접수되었습니다.',
      variables: ['mallName', 'userName', 'orderNumber'],
      isActive: true,
      mallId: null,
      createdAt: now,
    },
    {
      id: 'default_payment_complete',
      key: 'payment_complete',
      name: '결제 완료',
      type: 'sms',
      subject: '결제 완료',
      content: '[{{mallName}}] {{orderNumber}} 결제 완료. 금액: {{amount}}원',
      variables: ['mallName', 'orderNumber', 'amount'],
      isActive: true,
      mallId: null,
      createdAt: now,
    },
    {
      id: 'default_shipping',
      key: 'shipping',
      name: '배송 시작',
      type: 'sms',
      subject: '배송 시작',
      content: '[{{mallName}}] 주문하신 상품이 발송되었습니다. 운송장: {{trackingNumber}} ({{carrierName}})',
      variables: ['mallName', 'trackingNumber', 'carrierName'],
      isActive: true,
      mallId: null,
      createdAt: now,
    },
    {
      id: 'default_delivery',
      key: 'delivery',
      name: '배송 완료',
      type: 'sms',
      subject: '배송 완료',
      content: '[{{mallName}}] 상품이 배송완료되었습니다. 리뷰를 작성해주세요!',
      variables: ['mallName'],
      isActive: true,
      mallId: null,
      createdAt: now,
    },
    {
      id: 'default_cancellation',
      key: 'cancellation',
      name: '주문 취소',
      type: 'sms',
      subject: '주문 취소',
      content: '[{{mallName}}] {{orderNumber}} 주문이 취소되었습니다.',
      variables: ['mallName', 'orderNumber'],
      isActive: true,
      mallId: null,
      createdAt: now,
    },
    {
      id: 'default_point_earned',
      key: 'point_earned',
      name: '포인트 적립',
      type: 'sms',
      subject: '포인트 적립',
      content: '[{{mallName}}] {{amount}}P 적립! 잔액: {{balance}}P',
      variables: ['mallName', 'amount', 'balance'],
      isActive: true,
      mallId: null,
      createdAt: now,
    },
    {
      id: 'default_grade_upgraded',
      key: 'grade_upgraded',
      name: '등급 승급',
      type: 'sms',
      subject: '등급 승급',
      content: '[{{mallName}}] 축하합니다! {{gradeName}} 등급으로 승급되었습니다.',
      variables: ['mallName', 'gradeName'],
      isActive: true,
      mallId: null,
      createdAt: now,
    },
  ];
}

// ---------- Get Default Notification Settings ----------

export function getDefaultNotificationSettings(mallId: string): NotificationSettings {
  return {
    mallId,
    smsEnabled: false,
    alimtalkEnabled: false,
    emailEnabled: false,
    templates: {
      order_confirm: { sms: false, alimtalk: false, email: false },
      payment_complete: { sms: false, alimtalk: false, email: false },
      shipping: { sms: false, alimtalk: false, email: false },
      delivery: { sms: false, alimtalk: false, email: false },
      cancellation: { sms: false, alimtalk: false, email: false },
      point_earned: { sms: false, alimtalk: false, email: false },
      grade_upgraded: { sms: false, alimtalk: false, email: false },
    },
    provider: 'nhncloud',
    apiKey: '',
    apiSecret: '',
    senderNumber: '',
    updatedAt: new Date(),
  };
}
