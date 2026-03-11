// ============================================
// MarketShare - Platform Settings Service
// ============================================

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ---------- Types ----------

export interface PlatformSettings {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  csPhone: string;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  pgProviders: string[];
  pgConfigs: Record<string, PlatformPGConfig>;
  defaultPGProvider: string;
  testMode: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  planPricing: {
    free: number;
    starter: number;
    business: number;
    enterprise: number;
  };
  commissionRates: {
    free: number;
    starter: number;
    business: number;
    enterprise: number;
  };
  settlementCycle: string;
  minSettlementAmount: number;
}

export interface PlatformPGConfig {
  enabled: boolean;
  label: string;
  mid: string;
  apiKey: string;
  apiSecret: string;
  impCode: string;
  pgId: string;
  testMode: boolean;
}

const SETTINGS_DOC = 'platform';
const SETTINGS_COLLECTION = 'settings';

// ---------- Get Settings ----------

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  try {
    const docSnap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC));
    if (!docSnap.exists()) return null;
    return docSnap.data() as PlatformSettings;
  } catch (error: any) {
    throw new Error('플랫폼 설정을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Update Settings ----------

export async function updatePlatformSettings(
  settings: Partial<PlatformSettings>
): Promise<void> {
  try {
    await setDoc(
      doc(db, SETTINGS_COLLECTION, SETTINGS_DOC),
      { ...settings, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error: any) {
    throw new Error('플랫폼 설정 저장 중 오류가 발생했습니다.');
  }
}
