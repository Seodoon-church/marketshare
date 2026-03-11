// ============================================
// MarketShare - Order Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Order, OrderStatus } from '@/types';

// ---------- Helper ----------

function orderFromDoc(docSnap: DocumentSnapshot): Order {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    paidAt: data.paidAt?.toDate() ?? null,
    shippedAt: data.shippedAt?.toDate() ?? null,
    deliveredAt: data.deliveredAt?.toDate() ?? null,
  } as Order;
}

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

// ---------- Filters ----------

export interface OrderFilters {
  status?: OrderStatus;
  limit?: number;
  startAfterDoc?: DocumentSnapshot;
}

export interface OrderListResult {
  orders: Order[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// ---------- Valid Status Transitions ----------

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['awaiting_payment', 'paid', 'cancelled'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// ---------- Create Order ----------

export async function createOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const batch = writeBatch(db);
    const orderNumber = orderData.orderNumber || generateOrderNumber();
    const orderId = doc(collection(db, 'orders_global')).id;

    const fullOrderData: Record<string, any> = {
      ...orderData,
      orderNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Include merchantUid if provided
    if ('merchantUid' in orderData && (orderData as any).merchantUid) {
      fullOrderData.merchantUid = (orderData as any).merchantUid;
    }

    // 1. Write to orders_global
    const globalRef = doc(db, 'orders_global', orderId);
    batch.set(globalRef, fullOrderData);

    // 2. Write to malls/{mallId}/orders
    const mallOrderRef = doc(db, 'malls', orderData.mallId, 'orders', orderId);
    batch.set(mallOrderRef, fullOrderData);

    // 3. Write to users/{userId}/orders
    const userOrderRef = doc(db, 'users', orderData.userId, 'orders', orderId);
    batch.set(userOrderRef, fullOrderData);

    await batch.commit();

    return orderId;
  } catch (error: any) {
    throw new Error('주문 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
  }
}

// ---------- Get All Orders (Admin) ----------

export async function getAllOrders(
  filters: OrderFilters = {}
): Promise<OrderListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(collection(db, 'orders_global'), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      orders: resultDocs.map(orderFromDoc),
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  } catch (error: any) {
    throw new Error('전체 주문 내역을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Order By ID ----------

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, 'orders_global', orderId));
    if (!docSnap.exists()) return null;
    return orderFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('주문 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get User Orders ----------

export async function getUserOrders(
  userId: string,
  filters: OrderFilters = {}
): Promise<OrderListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(
      collection(db, 'users', userId, 'orders'),
      ...constraints
    );
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      orders: resultDocs.map(orderFromDoc),
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  } catch (error: any) {
    throw new Error('주문 내역을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Orders ----------

export async function getMallOrders(
  mallId: string,
  filters: OrderFilters = {}
): Promise<OrderListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(
      collection(db, 'malls', mallId, 'orders'),
      ...constraints
    );
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      orders: resultDocs.map(orderFromDoc),
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  } catch (error: any) {
    throw new Error('몰 주문 내역을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Update Order Status ----------

export async function updateOrderStatus(
  orderId: string,
  mallId: string,
  status: OrderStatus,
  trackingInfo?: { trackingNumber: string; trackingCompany: string }
): Promise<void> {
  try {
    // First retrieve the order to get the userId and current status
    const orderSnap = await getDoc(doc(db, 'orders_global', orderId));
    if (!orderSnap.exists()) {
      throw new Error('주문을 찾을 수 없습니다.');
    }
    const order = orderFromDoc(orderSnap);

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowedTransitions.includes(status)) {
      throw new Error(
        `주문 상태를 '${order.status}'에서 '${status}'(으)로 변경할 수 없습니다.`
      );
    }

    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };

    // Add status-specific timestamps
    if (status === 'paid') {
      updateData.paidAt = serverTimestamp();
    } else if (status === 'shipped') {
      updateData.shippedAt = serverTimestamp();
      if (trackingInfo) {
        updateData.trackingNumber = trackingInfo.trackingNumber;
        updateData.trackingCompany = trackingInfo.trackingCompany;
      }
    } else if (status === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
    }

    const batch = writeBatch(db);

    // Update all three locations
    batch.update(doc(db, 'orders_global', orderId), updateData);
    batch.update(doc(db, 'malls', mallId, 'orders', orderId), updateData);
    batch.update(doc(db, 'users', order.userId, 'orders', orderId), updateData);

    await batch.commit();
  } catch (error: any) {
    if (
      error.message === '주문을 찾을 수 없습니다.' ||
      error.message.startsWith('주문 상태를')
    ) {
      throw error;
    }
    throw new Error('주문 상태 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Cancel Order ----------

export async function cancelOrder(
  orderId: string,
  mallId: string,
  reason: string
): Promise<void> {
  try {
    const orderSnap = await getDoc(doc(db, 'orders_global', orderId));
    if (!orderSnap.exists()) {
      throw new Error('주문을 찾을 수 없습니다.');
    }
    const order = orderFromDoc(orderSnap);

    // Validate cancellable status
    const cancellableStatuses: OrderStatus[] = ['pending', 'paid'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error('현재 상태에서는 주문을 취소할 수 없습니다.');
    }

    const updateData = {
      status: 'cancelled' as OrderStatus,
      cancelReason: reason,
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    // Update order status in all 3 locations
    batch.update(doc(db, 'orders_global', orderId), updateData);
    batch.update(doc(db, 'malls', mallId, 'orders', orderId), updateData);
    batch.update(doc(db, 'users', order.userId, 'orders', orderId), updateData);

    // Restore points if any were used
    if (order.pointsUsed > 0) {
      // Add restoration record to points_ledger
      const pointLedgerRef = doc(collection(db, 'points_ledger'));
      batch.set(pointLedgerRef, {
        userId: order.userId,
        mallId: order.mallId,
        orderId: orderId,
        type: 'admin_granted',
        amount: order.pointsUsed,
        description: `주문 취소 포인트 복원 (주문번호: ${order.orderNumber})`,
        expiresAt: null,
        createdBy: 'system',
        createdAt: serverTimestamp(),
      });

      // Increment user's pointBalance
      const userRef = doc(db, 'users', order.userId);
      batch.update(userRef, {
        pointBalance: increment(order.pointsUsed),
        [`pointsByMall.${order.mallId}`]: increment(order.pointsUsed),
      });
    }

    // Restore coupon if one was used
    if (order.couponCode) {
      // Decrement the coupon's usageCount
      // Look up coupon by code - we need to query, but batch doesn't support queries
      // So we use the couponCode as the document ID path in coupons collection
      // Since we can't query inside a batch, we update the coupon doc by code
      const couponQuery = query(
        collection(db, 'coupons'),
        where('code', '==', order.couponCode),
        firestoreLimit(1)
      );
      const couponSnap = await getDocs(couponQuery);
      if (!couponSnap.empty) {
        const couponDoc = couponSnap.docs[0];
        batch.update(doc(db, 'coupons', couponDoc.id), {
          usageCount: increment(-1),
        });

        // Update the user's coupon record to mark as unused
        const userCouponQuery = query(
          collection(db, 'users', order.userId, 'coupons'),
          where('couponCode', '==', order.couponCode),
          where('usedOrderId', '==', orderId),
          firestoreLimit(1)
        );
        const userCouponSnap = await getDocs(userCouponQuery);
        if (!userCouponSnap.empty) {
          const userCouponDoc = userCouponSnap.docs[0];
          batch.update(
            doc(db, 'users', order.userId, 'coupons', userCouponDoc.id),
            {
              usedAt: null,
              usedOrderId: null,
            }
          );
        }
      }
    }

    // Restore stock for each item in the order
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        // Increment product stock in the global products collection
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, {
          stock: increment(item.quantity),
        });

        // Also increment in mall-specific products subcollection
        const mallProductRef = doc(
          db,
          'malls',
          order.mallId,
          'products',
          item.productId
        );
        batch.update(mallProductRef, {
          stock: increment(item.quantity),
        });
      }
    }

    await batch.commit();
  } catch (error: any) {
    if (
      error.message === '주문을 찾을 수 없습니다.' ||
      error.message === '현재 상태에서는 주문을 취소할 수 없습니다.'
    ) {
      throw error;
    }
    throw new Error('주문 취소 중 오류가 발생했습니다.');
  }
}

// ---------- Request Refund ----------

export async function requestRefund(
  orderId: string,
  mallId: string,
  reason: string
): Promise<void> {
  try {
    const orderSnap = await getDoc(doc(db, 'orders_global', orderId));
    if (!orderSnap.exists()) {
      throw new Error('주문을 찾을 수 없습니다.');
    }
    const order = orderFromDoc(orderSnap);

    // Validate refundable status
    const refundableStatuses: OrderStatus[] = ['paid', 'preparing', 'shipped', 'delivered'];
    if (!refundableStatuses.includes(order.status)) {
      throw new Error('현재 상태에서는 환불을 요청할 수 없습니다.');
    }

    const updateData = {
      status: 'refunded' as OrderStatus,
      cancelReason: reason,
      refundAmount: order.totalAmount,
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    batch.update(doc(db, 'orders_global', orderId), updateData);
    batch.update(doc(db, 'malls', mallId, 'orders', orderId), updateData);
    batch.update(doc(db, 'users', order.userId, 'orders', orderId), updateData);

    await batch.commit();
  } catch (error: any) {
    if (
      error.message === '주문을 찾을 수 없습니다.' ||
      error.message === '현재 상태에서는 환불을 요청할 수 없습니다.'
    ) {
      throw error;
    }
    throw new Error('환불 요청 중 오류가 발생했습니다.');
  }
}
