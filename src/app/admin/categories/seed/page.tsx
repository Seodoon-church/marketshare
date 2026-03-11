'use client';

import { useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DEFAULT_CATEGORIES } from '@/lib/data/categories';
import type { CategoryNode } from '@/lib/data/categories';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CircleStackIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

type LogEntry = {
  message: string;
  type: 'info' | 'success' | 'error' | 'warn';
};

/**
 * 카테고리 트리를 flat한 배열로 전개하면서 총 개수를 세는 유틸
 */
function countCategories(nodes: CategoryNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countCategories(node.children);
    }
  }
  return count;
}

export default function AdminCategorySeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingMall, setIsSeedingMall] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mallId, setMallId] = useState('');

  const totalCount = countCategories(DEFAULT_CATEGORIES);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [...prev, { message, type }]);
  };

  const clearLogs = () => setLogs([]);

  // ============ 글로벌 카테고리 시드 ============

  const seedGlobalCategories = async () => {
    setIsSeeding(true);
    clearLogs();

    try {
      // 1. 기존 카테고리 확인
      addLog('기존 글로벌 카테고리 확인 중...');
      const existingSnap = await getDocs(
        query(collection(db, 'categories_global'), orderBy('order', 'asc'))
      );

      if (existingSnap.size > 0) {
        addLog(
          `기존 카테고리 ${existingSnap.size}개가 이미 존재합니다. 기존 데이터를 먼저 삭제합니다.`,
          'warn'
        );

        // 기존 데이터 삭제 (batch 500개 제한 대비)
        const deleteBatches: ReturnType<typeof writeBatch>[] = [];
        let currentBatch = writeBatch(db);
        let batchCount = 0;

        for (const docSnap of existingSnap.docs) {
          currentBatch.delete(docSnap.ref);
          batchCount++;
          if (batchCount >= 490) {
            deleteBatches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchCount = 0;
          }
        }
        if (batchCount > 0) {
          deleteBatches.push(currentBatch);
        }

        for (let i = 0; i < deleteBatches.length; i++) {
          await deleteBatches[i].commit();
          addLog(`삭제 배치 ${i + 1}/${deleteBatches.length} 완료`);
        }
        addLog(`기존 ${existingSnap.size}개 카테고리 삭제 완료`, 'success');
      }

      // 2. 새 카테고리 시드
      addLog(`${totalCount}개의 기본 카테고리를 시드합니다...`);

      const catCol = collection(db, 'categories_global');
      const batches: ReturnType<typeof writeBatch>[] = [];
      let batch = writeBatch(db);
      let order = 0;
      let batchOpCount = 0;

      const addCategoryTree = (
        nodes: CategoryNode[],
        parentId: string | null,
        depth: number,
        path: string[]
      ) => {
        for (const node of nodes) {
          const ref = doc(catCol);
          const catPath = parentId ? [...path, ref.id] : [ref.id];

          batch.set(ref, {
            name: node.name,
            slug: node.slug,
            parentId,
            depth,
            path: catPath,
            order: order++,
            imageUrl: null,
            iconUrl: null,
            productCount: 0,
            isActive: true,
            createdAt: serverTimestamp(),
          });

          batchOpCount++;
          // Firestore batch 제한: 500 ops
          if (batchOpCount >= 490) {
            batches.push(batch);
            batch = writeBatch(db);
            batchOpCount = 0;
          }

          if (node.children) {
            addCategoryTree(node.children, ref.id, depth + 1, catPath);
          }
        }
      };

      addCategoryTree(DEFAULT_CATEGORIES, null, 0, []);

      // 마지막 batch
      if (batchOpCount > 0) {
        batches.push(batch);
      }

      // 커밋
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        addLog(`쓰기 배치 ${i + 1}/${batches.length} 커밋 완료`);
      }

      addLog(
        `글로벌 카테고리 시드 완료! 총 ${order}개 카테고리가 categories_global에 저장되었습니다.`,
        'success'
      );
    } catch (err: any) {
      addLog(`오류 발생: ${err.message}`, 'error');
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  // ============ 몰 카테고리 시드 ============

  const seedMallCategories = async () => {
    if (!mallId.trim()) {
      addLog('몰 ID를 입력해주세요.', 'error');
      return;
    }

    setIsSeedingMall(true);
    clearLogs();

    try {
      addLog(`몰 [${mallId}]의 기존 카테고리 확인 중...`);
      const existingSnap = await getDocs(
        query(
          collection(db, 'malls', mallId.trim(), 'categories'),
          orderBy('order', 'asc')
        )
      );

      if (existingSnap.size > 0) {
        addLog(
          `기존 카테고리 ${existingSnap.size}개가 이미 존재합니다. 기존 데이터를 먼저 삭제합니다.`,
          'warn'
        );

        const deleteBatches: ReturnType<typeof writeBatch>[] = [];
        let currentBatch = writeBatch(db);
        let batchCount = 0;

        for (const docSnap of existingSnap.docs) {
          currentBatch.delete(docSnap.ref);
          batchCount++;
          if (batchCount >= 490) {
            deleteBatches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchCount = 0;
          }
        }
        if (batchCount > 0) {
          deleteBatches.push(currentBatch);
        }

        for (let i = 0; i < deleteBatches.length; i++) {
          await deleteBatches[i].commit();
          addLog(`삭제 배치 ${i + 1}/${deleteBatches.length} 완료`);
        }
        addLog(`기존 ${existingSnap.size}개 카테고리 삭제 완료`, 'success');
      }

      addLog(`${totalCount}개의 기본 카테고리를 몰에 시드합니다...`);

      const catCol = collection(db, 'malls', mallId.trim(), 'categories');
      const batches: ReturnType<typeof writeBatch>[] = [];
      let batch = writeBatch(db);
      let order = 0;
      let batchOpCount = 0;

      const addCategoryTree = (
        nodes: CategoryNode[],
        parentId: string | null,
        depth: number,
        path: string[]
      ) => {
        for (const node of nodes) {
          const ref = doc(catCol);
          const catPath = parentId ? [...path, ref.id] : [ref.id];

          batch.set(ref, {
            name: node.name,
            slug: node.slug,
            parentId,
            depth,
            path: catPath,
            order: order++,
            imageUrl: null,
            iconUrl: null,
            productCount: 0,
            isActive: true,
            createdAt: serverTimestamp(),
          });

          batchOpCount++;
          if (batchOpCount >= 490) {
            batches.push(batch);
            batch = writeBatch(db);
            batchOpCount = 0;
          }

          if (node.children) {
            addCategoryTree(node.children, ref.id, depth + 1, catPath);
          }
        }
      };

      addCategoryTree(DEFAULT_CATEGORIES, null, 0, []);

      if (batchOpCount > 0) {
        batches.push(batch);
      }

      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        addLog(`쓰기 배치 ${i + 1}/${batches.length} 커밋 완료`);
      }

      addLog(
        `몰 카테고리 시드 완료! 총 ${order}개 카테고리가 malls/${mallId}/categories에 저장되었습니다.`,
        'success'
      );
    } catch (err: any) {
      addLog(`오류 발생: ${err.message}`, 'error');
      console.error(err);
    } finally {
      setIsSeedingMall(false);
    }
  };

  // ============ 로그 아이콘 ============

  const logIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case 'warn':
        return <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      default:
        return <ArrowPathIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const logColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-emerald-700';
      case 'error':
        return 'text-red-700';
      case 'warn':
        return 'text-amber-700';
      default:
        return 'text-gray-700';
    }
  };

  // ============ UI ============

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">카테고리 시드</h1>
        <p className="mt-1 text-sm text-gray-500">
          기본 카테고리 데이터({totalCount}개)를 Firestore에 시드합니다.
        </p>
      </div>

      {/* 글로벌 카테고리 시드 */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
            <CircleStackIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle>글로벌 카테고리 시드</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
                categories_global
              </code>{' '}
              컬렉션에 기본 카테고리를 시드합니다. 기존 데이터가 있으면 삭제 후 새로 생성합니다.
            </p>
            <div className="mt-4">
              <Button
                onClick={seedGlobalCategories}
                isLoading={isSeeding}
                disabled={isSeeding || isSeedingMall}
              >
                <CircleStackIcon className="h-4 w-4" />
                {isSeeding ? '시드 중...' : '기본 카테고리 시드'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 몰 카테고리 시드 */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 flex-shrink-0">
            <BuildingStorefrontIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle>몰 카테고리 시드</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              특정 몰의{' '}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
                malls/{'{{mallId}}'}/categories
              </code>{' '}
              하위 컬렉션에 기본 카테고리를 시드합니다.
            </p>
            <div className="mt-4 flex items-end gap-3">
              <div className="flex-1 max-w-sm">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  몰 ID
                </label>
                <input
                  type="text"
                  value={mallId}
                  onChange={(e) => setMallId(e.target.value)}
                  placeholder="Firestore 몰 문서 ID 입력"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isSeedingMall}
                />
              </div>
              <Button
                onClick={seedMallCategories}
                isLoading={isSeedingMall}
                disabled={isSeeding || isSeedingMall || !mallId.trim()}
                variant="outline"
              >
                <BuildingStorefrontIcon className="h-4 w-4" />
                {isSeedingMall ? '시드 중...' : '몰 카테고리 시드'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 진행 로그 */}
      {logs.length > 0 && (
        <Card padding="none">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <CardTitle>진행 로그</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              로그 지우기
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto p-4 space-y-2">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                {logIcon(log.type)}
                <span className={`text-sm ${logColor(log.type)}`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 카테고리 미리보기 */}
      <Card>
        <CardTitle className="mb-4">시드 데이터 미리보기</CardTitle>
        <p className="text-sm text-gray-500 mb-4">
          대분류 {DEFAULT_CATEGORIES.length}개 / 총 {totalCount}개 카테고리
        </p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {DEFAULT_CATEGORIES.map((cat) => (
            <div key={cat.slug} className="rounded-lg border border-gray-100 p-3">
              <div className="font-medium text-gray-900 text-sm">{cat.name}</div>
              {cat.children && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cat.children.map((mid) => (
                    <span
                      key={mid.slug}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                    >
                      {mid.name}
                      {mid.children && (
                        <span className="ml-1 text-gray-400">
                          ({mid.children.length})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 안내 */}
      <Card className="bg-amber-50/50 border-amber-100">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 flex-shrink-0">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">주의사항</p>
            <ul className="mt-1 text-xs text-amber-700 leading-relaxed space-y-0.5">
              <li>- 시드를 실행하면 기존 카테고리 데이터가 모두 삭제 후 재생성됩니다.</li>
              <li>- 상품이 이미 카테고리에 연결되어 있는 경우, 카테고리 ID가 변경되므로 주의하세요.</li>
              <li>- 카테고리 관리는 <a href="/admin/categories" className="underline font-medium">카테고리 관리 페이지</a>에서 할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
