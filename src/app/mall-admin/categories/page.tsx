'use client';

import { useState, useEffect, useCallback } from 'react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getMallCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/services/category-service';
import { DEFAULT_CATEGORIES } from '@/lib/data/categories';
import type { CategoryNode } from '@/lib/data/categories';
import { db } from '@/lib/firebase/config';
import { collection, doc, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';
import type { Category } from '@/types';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  TagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ---------- Tree Node ----------

interface TreeNode extends Category {
  children: TreeNode[];
}

function buildTree(flatList: Category[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create tree nodes
  for (const cat of flatList) {
    map.set(cat.id, { ...cat, children: [] });
  }

  // Build hierarchy
  for (const cat of flatList) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by order
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

const DEPTH_LABELS = ['대분류', '중분류', '소분류'];
const DEPTH_COLORS = [
  'text-gray-900 font-semibold',
  'text-gray-700 font-medium',
  'text-gray-600',
];
const DEPTH_INDENT = [0, 8, 16];

// ---------- Component ----------

export default function MallAdminCategories() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Add form state
  const [addingParentId, setAddingParentId] = useState<string | null | 'root'>(null);
  const [addingDepth, setAddingDepth] = useState(0);
  const [newName, setNewName] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reseedLoading, setReseedLoading] = useState(false);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Fetch
  const fetchCategories = useCallback(async () => {
    if (!mallId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMallCategories(mallId);
      setCategories(data);
      const t = buildTree(data);
      setTree(t);
      // Expand all top-level by default
      setExpandedIds(new Set(t.map((n) => n.id)));
    } catch (err: any) {
      setError(err.message || '카테고리를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [mallId]);

  useEffect(() => {
    if (mallId) fetchCategories();
  }, [mallId, fetchCategories]);

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle active
  const toggleActive = async (cat: Category) => {
    if (!mallId) return;
    setActionLoading(cat.id);
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive }, mallId);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
      setTree((prev) => {
        const update = (nodes: TreeNode[]): TreeNode[] =>
          nodes.map((n) => ({
            ...n,
            isActive: n.id === cat.id ? !n.isActive : n.isActive,
            children: update(n.children),
          }));
        return update(prev);
      });
    } catch {
      alert('상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete
  const handleDelete = async (cat: Category) => {
    if (!mallId) return;
    // Check children
    const hasChildren = categories.some((c) => c.parentId === cat.id);
    if (hasChildren) {
      alert('하위 카테고리가 있는 경우 먼저 하위 카테고리를 삭제해주세요.');
      return;
    }
    if (!window.confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) return;

    setActionLoading(cat.id);
    try {
      await deleteCategory(cat.id, mallId);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || '삭제 실패');
    } finally {
      setActionLoading(null);
    }
  };

  // Add
  const startAdd = (parentId: string | null, depth: number) => {
    setAddingParentId(parentId ?? 'root');
    setAddingDepth(depth);
    setNewName('');
    // Expand parent
    if (parentId) setExpandedIds((prev) => new Set([...prev, parentId]));
  };

  const handleCreate = async () => {
    if (!mallId || !newName.trim()) return;
    const parentId = addingParentId === 'root' ? null : addingParentId;
    setActionLoading('new');
    try {
      const siblings = categories.filter((c) =>
        parentId ? c.parentId === parentId : !c.parentId
      );
      await createCategory(
        {
          name: newName.trim(),
          slug: newName.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-'),
          parentId,
          depth: addingDepth,
          path: [],
          order: siblings.length,
          imageUrl: null,
          iconUrl: null,
          productCount: 0,
          isActive: true,
        },
        mallId
      );
      setAddingParentId(null);
      setNewName('');
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || '카테고리 생성에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reseed with default categories
  const handleReseed = async () => {
    if (!mallId) return;
    if (!window.confirm(
      '기존 카테고리를 모두 삭제하고 분양몰 기본 카테고리(건강기능식품, 뷰티/화장품 등 10개 대분류)로 초기화합니다.\n\n정말 초기화하시겠습니까?'
    )) return;

    setReseedLoading(true);
    try {
      const catCol = collection(db, 'malls', mallId, 'categories');

      // Delete existing categories
      const existing = await getDocs(catCol);
      if (existing.size > 0) {
        let delBatch = writeBatch(db);
        let delCount = 0;
        for (const d of existing.docs) {
          delBatch.delete(d.ref);
          delCount++;
          if (delCount >= 490) {
            await delBatch.commit();
            delBatch = writeBatch(db);
            delCount = 0;
          }
        }
        if (delCount > 0) await delBatch.commit();
      }

      // Seed new categories
      let batch = writeBatch(db);
      let opCount = 0;
      let order = 0;

      const addCategoryTree = async (nodes: CategoryNode[], parentId: string | null, depth: number, path: string[]) => {
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
          opCount++;
          if (opCount >= 490) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
          if (node.children) {
            await addCategoryTree(node.children, ref.id, depth + 1, catPath);
          }
        }
      };

      await addCategoryTree(DEFAULT_CATEGORIES, null, 0, []);
      if (opCount > 0) await batch.commit();

      await fetchCategories();
      alert('기본 카테고리로 초기화되었습니다.');
    } catch (err: any) {
      alert(err.message || '초기화 실패');
    } finally {
      setReseedLoading(false);
    }
  };

  // Edit
  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleEditSave = async () => {
    if (!mallId || !editingId || !editingName.trim()) return;
    setActionLoading(editingId);
    try {
      await updateCategory(editingId, { name: editingName.trim() }, mallId);
      setEditingId(null);
      await fetchCategories();
    } catch {
      alert('수정 실패');
    } finally {
      setActionLoading(null);
    }
  };

  // ---------- Render tree row ----------

  const renderNode = (node: TreeNode) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const canAddChild = node.depth < 2; // max 3 levels (0, 1, 2)
    const depthLabel = DEPTH_LABELS[node.depth] || '';

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50/80 transition-colors border-b border-gray-50"
          style={{ paddingLeft: `${16 + node.depth * 28}px` }}
        >
          {/* Expand toggle */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-6 flex-shrink-0" />
          )}

          {/* Icon */}
          {node.depth === 0 ? (
            isExpanded ? (
              <FolderOpenIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
            ) : (
              <FolderIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
            )
          ) : node.depth === 1 ? (
            <FolderIcon className="h-4.5 w-4.5 text-blue-400 flex-shrink-0" />
          ) : (
            <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            {editingId === node.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <Button variant="ghost" size="sm" onClick={handleEditSave} disabled={actionLoading === node.id}>
                  저장
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${DEPTH_COLORS[node.depth] || 'text-gray-600'}`}>
                  {node.name}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {depthLabel}
                </Badge>
              </div>
            )}
          </div>

          {/* Product count */}
          {node.productCount > 0 && (
            <span className="text-xs text-gray-400">상품 {node.productCount}개</span>
          )}

          {/* Active toggle */}
          <button
            onClick={() => toggleActive(node)}
            disabled={actionLoading === node.id}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              node.isActive ? 'bg-primary' : 'bg-gray-200'
            } ${actionLoading === node.id ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                node.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {canAddChild && (
              <button
                onClick={() => startAdd(node.id, node.depth + 1)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-primary/5 hover:text-primary transition-colors"
                title={`하위 ${DEPTH_LABELS[node.depth + 1]} 추가`}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleEdit(node)}
              disabled={actionLoading === node.id}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(node)}
              disabled={actionLoading === node.id}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Add child form inline */}
        {addingParentId === node.id && (
          <div
            className="flex items-center gap-2 px-4 py-3 bg-primary/[0.02] border-b border-primary/10"
            style={{ paddingLeft: `${16 + (node.depth + 1) * 28}px` }}
          >
            <TagIcon className="h-4 w-4 text-primary/40 flex-shrink-0" />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setAddingParentId(null);
              }}
              placeholder={`새 ${DEPTH_LABELS[addingDepth]} 이름`}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || actionLoading === 'new'}>
              {actionLoading === 'new' ? '추가 중...' : '추가'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingParentId(null)}>
              취소
            </Button>
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{node.children.map(renderNode)}</div>
        )}
      </div>
    );
  };

  // ---------- Loading ----------

  if (authLoading || (!isMallOwner && !user)) {
    return <FullPageLoader message="인증 확인 중..." />;
  }
  if (loading) {
    return <FullPageLoader message="카테고리를 불러오는 중..." />;
  }

  // ---------- Counts ----------

  const depthCounts = [0, 0, 0];
  categories.forEach((c) => {
    if (c.depth >= 0 && c.depth <= 2) depthCounts[c.depth]++;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            대분류 {depthCounts[0]}개 · 중분류 {depthCounts[1]}개 · 소분류 {depthCounts[2]}개
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReseed} isLoading={reseedLoading}>
            <ArrowPathIcon className="h-4 w-4" />
            기본 카테고리 초기화
          </Button>
          <Button onClick={() => startAdd(null, 0)}>
            <PlusIcon className="h-4 w-4" />
            대분류 추가
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchCategories}>
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {/* Add root form */}
      {addingParentId === 'root' && (
        <Card>
          <div className="flex items-center gap-3">
            <FolderIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setAddingParentId(null);
              }}
              placeholder="새 대분류 이름 (예: 패션의류, 식품, 디지털/가전)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || actionLoading === 'new'}>
              {actionLoading === 'new' ? '추가 중...' : '추가'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingParentId(null)}>
              취소
            </Button>
          </div>
        </Card>
      )}

      {/* Category Tree */}
      <Card padding="none">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderIcon className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">등록된 카테고리가 없습니다.</p>
            <p className="mt-1 text-xs text-gray-400">
              &quot;대분류 추가&quot; 버튼을 눌러 카테고리를 구성하세요.
            </p>
          </div>
        ) : (
          <div>{tree.map(renderNode)}</div>
        )}
      </Card>

      {/* Info */}
      <Card className="bg-blue-50/50 border-blue-100">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">카테고리 구조 안내</p>
            <p className="mt-0.5 text-xs text-blue-600 leading-relaxed">
              카테고리는 <strong>대분류 &gt; 중분류 &gt; 소분류</strong> 최대 3단계로 구성됩니다.
              각 대분류 오른쪽의 <strong>+</strong> 버튼으로 하위 카테고리를 추가할 수 있습니다.
              <br />
              예시: 패션의류(대) &gt; 여성의류(중) &gt; 원피스(소)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
