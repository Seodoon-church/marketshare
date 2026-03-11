import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  LiveSession,
  LiveMessage,
  CreateLiveSessionInput,
  UpdateLiveSessionInput,
  LiveSessionStatus,
} from '@/types/live';

const LIVE_SESSIONS_COLLECTION = 'live_sessions';

/**
 * Convert Firestore document to LiveSession type
 */
function docToLiveSession(doc: DocumentSnapshot<DocumentData>): LiveSession | null {
  if (!doc.exists()) return null;

  const data = doc.data();
  return {
    id: doc.id,
    mallId: data.mallId,
    mallName: data.mallName,
    mallSlug: data.mallSlug,
    hostId: data.hostId,
    hostName: data.hostName,
    title: data.title,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl || null,
    status: data.status,
    scheduledAt: data.scheduledAt?.toDate() || new Date(),
    startedAt: data.startedAt?.toDate() || null,
    endedAt: data.endedAt?.toDate() || null,
    streamPlatform: data.streamPlatform,
    streamUrl: data.streamUrl || '',
    vodUrl: data.vodUrl || null,
    productIds: data.productIds || [],
    featuredProductId: data.featuredProductId || null,
    viewerCount: data.viewerCount || 0,
    peakViewerCount: data.peakViewerCount || 0,
    totalOrders: data.totalOrders || 0,
    totalRevenue: data.totalRevenue || 0,
    chatMessageCount: data.chatMessageCount || 0,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

/**
 * Convert Firestore document to LiveMessage type
 */
function docToLiveMessage(doc: DocumentSnapshot<DocumentData>): LiveMessage | null {
  if (!doc.exists()) return null;

  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    userName: data.userName,
    userProfileUrl: data.userProfileUrl || null,
    userRole: data.userRole,
    message: data.message,
    type: data.type,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

/**
 * Create a new live session
 */
export async function createLiveSession(input: CreateLiveSessionInput): Promise<LiveSession> {
  const sessionsRef = collection(db, LIVE_SESSIONS_COLLECTION);

  const docRef = await addDoc(sessionsRef, {
    mallId: input.mallId,
    mallName: input.mallName,
    mallSlug: input.mallSlug,
    hostId: input.hostId,
    hostName: input.hostName,
    title: input.title,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl || null,
    status: 'scheduled' as LiveSessionStatus,
    scheduledAt: Timestamp.fromDate(input.scheduledAt),
    startedAt: null,
    endedAt: null,
    streamPlatform: input.streamPlatform,
    streamUrl: input.streamUrl || '',
    vodUrl: null,
    productIds: input.productIds,
    featuredProductId: null,
    viewerCount: 0,
    peakViewerCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
    chatMessageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const snapshot = await getDoc(docRef);
  const session = docToLiveSession(snapshot);
  if (!session) {
    throw new Error('Failed to create live session');
  }

  return session;
}

/**
 * Get live session by ID
 */
export async function getLiveSession(sessionId: string): Promise<LiveSession | null> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
  const snapshot = await getDoc(docRef);
  return docToLiveSession(snapshot);
}

/**
 * Update live session
 */
export async function updateLiveSession(
  sessionId: string,
  input: UpdateLiveSessionInput
): Promise<void> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl;
  if (input.scheduledAt !== undefined) {
    updateData.scheduledAt = Timestamp.fromDate(input.scheduledAt);
  }
  if (input.streamPlatform !== undefined) updateData.streamPlatform = input.streamPlatform;
  if (input.streamUrl !== undefined) updateData.streamUrl = input.streamUrl;
  if (input.vodUrl !== undefined) updateData.vodUrl = input.vodUrl;
  if (input.productIds !== undefined) updateData.productIds = input.productIds;
  if (input.featuredProductId !== undefined) {
    updateData.featuredProductId = input.featuredProductId;
  }
  if (input.status !== undefined) updateData.status = input.status;

  await updateDoc(docRef, updateData);
}

/**
 * Delete live session
 */
export async function deleteLiveSession(sessionId: string): Promise<void> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
  await deleteDoc(docRef);
}

/**
 * Get live sessions for a mall
 */
export async function getLiveSessions(
  mallId: string,
  status?: LiveSessionStatus
): Promise<LiveSession[]> {
  const sessionsRef = collection(db, LIVE_SESSIONS_COLLECTION);

  let q = query(
    sessionsRef,
    where('mallId', '==', mallId),
    orderBy('scheduledAt', 'desc')
  );

  if (status) {
    q = query(
      sessionsRef,
      where('mallId', '==', mallId),
      where('status', '==', status),
      orderBy('scheduledAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  const sessions: LiveSession[] = [];

  snapshot.forEach((doc) => {
    const session = docToLiveSession(doc);
    if (session) sessions.push(session);
  });

  return sessions;
}

/**
 * Get active (currently live) session for a mall
 */
export async function getActiveLiveSession(mallId: string): Promise<LiveSession | null> {
  const sessionsRef = collection(db, LIVE_SESSIONS_COLLECTION);

  const q = query(
    sessionsRef,
    where('mallId', '==', mallId),
    where('status', '==', 'live'),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return docToLiveSession(snapshot.docs[0]);
}

/**
 * Start a live session
 */
export async function startLiveSession(sessionId: string, streamUrl: string): Promise<void> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);

  await updateDoc(docRef, {
    status: 'live',
    startedAt: serverTimestamp(),
    streamUrl,
    updatedAt: serverTimestamp(),
  });
}

/**
 * End a live session
 */
export async function endLiveSession(sessionId: string, vodUrl?: string): Promise<void> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);

  const updateData: Record<string, unknown> = {
    status: 'ended',
    endedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (vodUrl) {
    updateData.vodUrl = vodUrl;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
  sessionId: string,
  message: {
    userId: string;
    userName: string;
    userProfileUrl: string | null;
    userRole: 'customer' | 'mall_owner' | 'platform_admin';
    message: string;
    type: 'chat' | 'system' | 'purchase';
  }
): Promise<void> {
  const messagesRef = collection(db, LIVE_SESSIONS_COLLECTION, sessionId, 'messages');

  await addDoc(messagesRef, {
    userId: message.userId,
    userName: message.userName,
    userProfileUrl: message.userProfileUrl,
    userRole: message.userRole,
    message: message.message,
    type: message.type,
    createdAt: serverTimestamp(),
  });

  // Increment chat message count
  const sessionRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
  await updateDoc(sessionRef, {
    chatMessageCount: (await getDoc(sessionRef)).data()?.chatMessageCount || 0 + 1,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribe to chat messages (real-time)
 */
export function subscribeToChatMessages(
  sessionId: string,
  callback: (messages: LiveMessage[]) => void
): () => void {
  const messagesRef = collection(db, LIVE_SESSIONS_COLLECTION, sessionId, 'messages');

  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const messages: LiveMessage[] = [];

    snapshot.forEach((doc) => {
      const message = docToLiveMessage(doc);
      if (message) messages.push(message);
    });

    callback(messages);
  });
}

/**
 * Subscribe to live session updates (real-time)
 */
export function subscribeToLiveSession(
  sessionId: string,
  callback: (session: LiveSession | null) => void
): () => void {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);

  return onSnapshot(docRef, (snapshot: DocumentSnapshot<DocumentData>) => {
    callback(docToLiveSession(snapshot));
  });
}
