// ============================================
// MarketShare - Shipping Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  DocumentSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ShippingZone, ShippingCarrier, ShippingTemplate } from '@/types';

// ---------- Helper ----------

function shippingZoneFromDoc(docSnap: DocumentSnapshot): ShippingZone {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
  } as ShippingZone;
}

function shippingCarrierFromDoc(docSnap: DocumentSnapshot): ShippingCarrier {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
  } as ShippingCarrier;
}

function shippingTemplateFromDoc(docSnap: DocumentSnapshot): ShippingTemplate {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as ShippingTemplate;
}

// ---------- Get Shipping Zones ----------

export async function getShippingZones(mallId: string): Promise<ShippingZone[]> {
  try {
    const q = query(
      collection(db, 'malls', mallId, 'shipping_zones'),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(shippingZoneFromDoc);
  } catch (error: any) {
    throw new Error('배송지역 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Shipping Zone ----------

export async function createShippingZone(
  mallId: string,
  data: Omit<ShippingZone, 'id'>
): Promise<string> {
  try {
    const zoneData = {
      ...data,
      mallId,
    };

    const docRef = await addDoc(
      collection(db, 'malls', mallId, 'shipping_zones'),
      zoneData
    );
    return docRef.id;
  } catch (error: any) {
    throw new Error('배송지역 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Shipping Zone ----------

export async function updateShippingZone(
  mallId: string,
  zoneId: string,
  data: Partial<ShippingZone>
): Promise<void> {
  try {
    const updateData: Record<string, any> = { ...data };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.mallId;

    const zoneRef = doc(db, 'malls', mallId, 'shipping_zones', zoneId);
    await updateDoc(zoneRef, updateData);
  } catch (error: any) {
    throw new Error('배송지역 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Delete Shipping Zone ----------

export async function deleteShippingZone(
  mallId: string,
  zoneId: string
): Promise<void> {
  try {
    const zoneRef = doc(db, 'malls', mallId, 'shipping_zones', zoneId);

    // Verify zone exists
    const docSnap = await getDoc(zoneRef);
    if (!docSnap.exists()) {
      throw new Error('배송지역을 찾을 수 없습니다.');
    }

    await deleteDoc(zoneRef);
  } catch (error: any) {
    if (error.message === '배송지역을 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('배송지역 삭제 중 오류가 발생했습니다.');
  }
}

// ---------- Get Shipping Carriers ----------

export async function getShippingCarriers(): Promise<ShippingCarrier[]> {
  try {
    const q = query(
      collection(db, 'shipping_carriers'),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(shippingCarrierFromDoc);
  } catch (error: any) {
    throw new Error('택배사 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Initialize Default Zones ----------

export async function initializeDefaultZones(mallId: string): Promise<void> {
  try {
    const defaultZones: Omit<ShippingZone, 'id' | 'mallId'>[] = [
      {
        name: '서울/경기',
        regions: ['0', '1', '2', '3', '4', '5', '6', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
        baseFee: 3000,
        freeShippingThreshold: 50000,
        order: 0,
        isActive: true,
      },
      {
        name: '지방',
        regions: ['7', '8', '9', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58'],
        baseFee: 3000,
        freeShippingThreshold: 50000,
        order: 1,
        isActive: true,
      },
      {
        name: '제주/도서산간',
        regions: ['63'],
        baseFee: 6000,
        freeShippingThreshold: 80000,
        order: 2,
        isActive: true,
      },
    ];

    const batch = writeBatch(db);

    for (const zone of defaultZones) {
      const zoneRef = doc(collection(db, 'malls', mallId, 'shipping_zones'));
      batch.set(zoneRef, { ...zone, mallId });
    }

    await batch.commit();
  } catch (error: any) {
    throw new Error('기본 배송지역 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Initialize Default Carriers ----------

export async function initializeDefaultCarriers(): Promise<void> {
  try {
    // Check if carriers already exist
    const snapshot = await getDocs(collection(db, 'shipping_carriers'));
    if (!snapshot.empty) {
      return; // Carriers already initialized
    }

    const defaultCarriers: Array<Omit<ShippingCarrier, 'id'>> = [
      {
        code: 'cj',
        name: 'CJ대한통운',
        trackingUrl: 'https://trace.cjlogistics.com/web/detail.jsp?slipno={invoice}',
        isActive: true,
        order: 0,
      },
      {
        code: 'hanjin',
        name: '한진택배',
        trackingUrl: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=1&wblnumText2={invoice}',
        isActive: true,
        order: 1,
      },
      {
        code: 'lotte',
        name: '롯데택배',
        trackingUrl: 'https://www.lotteglogis.com/home/reservation/tracking/invoke/{invoice}',
        isActive: true,
        order: 2,
      },
      {
        code: 'logen',
        name: '로젠택배',
        trackingUrl: 'https://www.ilogen.com/web/personal/trace/{invoice}',
        isActive: true,
        order: 3,
      },
      {
        code: 'post',
        name: '우체국택배',
        trackingUrl: 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1={invoice}',
        isActive: true,
        order: 4,
      },
    ];

    const batch = writeBatch(db);

    for (const carrier of defaultCarriers) {
      const carrierRef = doc(collection(db, 'shipping_carriers'));
      batch.set(carrierRef, carrier);
    }

    await batch.commit();
  } catch (error: any) {
    throw new Error('기본 택배사 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Detect Shipping Zone ----------

export async function detectShippingZone(
  zipcode: string,
  mallId: string
): Promise<ShippingZone | null> {
  try {
    // Extract first 2 digits from zipcode
    const prefix = zipcode.substring(0, 2);

    // Get all zones for the mall
    const zones = await getShippingZones(mallId);

    // Find matching zone
    for (const zone of zones) {
      if (zone.isActive && zone.regions.includes(prefix)) {
        return zone;
      }
    }

    return null;
  } catch (error: any) {
    throw new Error('배송지역 조회 중 오류가 발생했습니다.');
  }
}

// ---------- Calculate Shipping Fee ----------

export async function calculateShippingFee(
  zipcode: string,
  mallId: string,
  cartAmount: number
): Promise<number> {
  try {
    const zone = await detectShippingZone(zipcode, mallId);

    if (!zone) {
      // If no zone found, return default fee
      return 3000;
    }

    // Check if cart amount meets free shipping threshold
    if (cartAmount >= zone.freeShippingThreshold) {
      return 0;
    }

    return zone.baseFee;
  } catch (error: any) {
    throw new Error('배송비 계산 중 오류가 발생했습니다.');
  }
}

// ---------- Get Tracking URL ----------

export function getTrackingUrl(
  carrierCode: string,
  trackingNumber: string
): string {
  const carriers: Record<string, string> = {
    cj: 'https://trace.cjlogistics.com/web/detail.jsp?slipno={invoice}',
    hanjin: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=1&wblnumText2={invoice}',
    lotte: 'https://www.lotteglogis.com/home/reservation/tracking/invoke/{invoice}',
    logen: 'https://www.ilogen.com/web/personal/trace/{invoice}',
    post: 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1={invoice}',
  };

  const template = carriers[carrierCode];
  if (!template) {
    return '';
  }

  return template.replace('{invoice}', trackingNumber);
}

// ---------- Get Shipping Templates ----------

export async function getShippingTemplates(
  mallId: string
): Promise<ShippingTemplate[]> {
  try {
    const q = query(collection(db, 'malls', mallId, 'shipping_templates'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(shippingTemplateFromDoc);
  } catch (error: any) {
    throw new Error('배송 템플릿 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Shipping Template ----------

export async function createShippingTemplate(
  mallId: string,
  data: Omit<ShippingTemplate, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const templateData = {
      ...data,
      mallId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'malls', mallId, 'shipping_templates'),
      templateData
    );
    return docRef.id;
  } catch (error: any) {
    throw new Error('배송 템플릿 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Shipping Template ----------

export async function updateShippingTemplate(
  mallId: string,
  templateId: string,
  data: Partial<ShippingTemplate>
): Promise<void> {
  try {
    const updateData: Record<string, any> = { ...data };
    delete updateData.id;
    delete updateData.mallId;
    delete updateData.createdAt;

    const templateRef = doc(db, 'malls', mallId, 'shipping_templates', templateId);
    await updateDoc(templateRef, updateData);
  } catch (error: any) {
    throw new Error('배송 템플릿 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Delete Shipping Template ----------

export async function deleteShippingTemplate(
  mallId: string,
  templateId: string
): Promise<void> {
  try {
    const templateRef = doc(db, 'malls', mallId, 'shipping_templates', templateId);
    await deleteDoc(templateRef);
  } catch (error: any) {
    throw new Error('배송 템플릿 삭제 중 오류가 발생했습니다.');
  }
}
