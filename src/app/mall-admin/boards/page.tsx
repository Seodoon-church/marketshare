'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  getPosts,
  updatePost,
  deletePost,
} from '@/lib/services/board-service';
import type { Board, BoardPost, BoardType } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  EyeSlashIcon,
  EyeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  notice: '공지사항',
  faq: 'FAQ',
  qna: 'Q&A',
  review: '리뷰',
  free: '자유게시판',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[가-힣]/g, (ch) => {
      const code = ch.charCodeAt(0);
      return code.toString(36);
    })
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'board';
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function MallAdminBoards() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const mallId = user?.ownedMallIds?.[0];

  const [activeTab, setActiveTab] = useState('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Board CRUD modal
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [boardForm, setBoardForm] = useState({
    name: '',
    slug: '',
    type: 'notice' as BoardType,
    isActive: true,
    allowComments: true,
    requireLogin: false,
    postsPerPage: 20,
  });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; boardId: string | null; type: 'board' | 'post'; postId?: string }>({
    open: false,
    boardId: null,
    type: 'board',
  });

  // Posts tab
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load boards
  useEffect(() => {
    if (!mallId) return;
    loadBoards();
  }, [mallId]);

  // Load posts when board is selected
  useEffect(() => {
    if (!mallId || !selectedBoardId) return;
    loadPosts(selectedBoardId);
  }, [mallId, selectedBoardId]);

  async function loadBoards() {
    if (!mallId) return;
    setLoading(true);
    try {
      const data = await getBoards(mallId);
      setBoards(data);
      if (data.length > 0 && !selectedBoardId) {
        setSelectedBoardId(data[0].id);
      }
    } catch (error) {
      console.error('게시판 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPosts(boardId: string) {
    if (!mallId) return;
    setPostsLoading(true);
    try {
      const result = await getPosts(mallId, boardId);
      setPosts(result.posts);
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }

  // Board CRUD handlers
  const openAddBoard = () => {
    setEditingBoard(null);
    setBoardForm({
      name: '',
      slug: '',
      type: 'notice',
      isActive: true,
      allowComments: true,
      requireLogin: false,
      postsPerPage: 20,
    });
    setShowBoardModal(true);
  };

  const openEditBoard = (board: Board) => {
    setEditingBoard(board);
    setBoardForm({
      name: board.name,
      slug: board.slug,
      type: board.type,
      isActive: board.isActive,
      allowComments: board.allowComments,
      requireLogin: board.requireLogin,
      postsPerPage: board.postsPerPage,
    });
    setShowBoardModal(true);
  };

  const handleSaveBoard = async () => {
    if (!mallId) return;
    if (!boardForm.name.trim()) {
      alert('게시판 이름을 입력하세요.');
      return;
    }

    setSubmitting(true);
    try {
      const slug = boardForm.slug.trim() || generateSlug(boardForm.name);
      if (editingBoard) {
        await updateBoard(mallId, editingBoard.id, {
          name: boardForm.name,
          slug,
          type: boardForm.type,
          isActive: boardForm.isActive,
          allowComments: boardForm.allowComments,
          requireLogin: boardForm.requireLogin,
          postsPerPage: boardForm.postsPerPage,
        });
        alert('게시판이 수정되었습니다.');
      } else {
        await createBoard(mallId, {
          name: boardForm.name,
          slug,
          type: boardForm.type,
          isActive: boardForm.isActive,
          allowComments: boardForm.allowComments,
          requireLogin: boardForm.requireLogin,
          postsPerPage: boardForm.postsPerPage,
        });
        alert('게시판이 추가되었습니다.');
      }
      await loadBoards();
      setShowBoardModal(false);
    } catch (error: any) {
      alert(error.message || '게시판 저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!mallId || !deleteConfirm.boardId || deleteConfirm.type !== 'board') return;
    setSubmitting(true);
    try {
      await deleteBoard(mallId, deleteConfirm.boardId);
      await loadBoards();
      setDeleteConfirm({ open: false, boardId: null, type: 'board' });
      alert('게시판이 삭제되었습니다.');
    } catch (error: any) {
      alert(error.message || '게시판 삭제 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBoardActive = async (board: Board) => {
    if (!mallId) return;
    setSubmitting(true);
    try {
      await updateBoard(mallId, board.id, { isActive: !board.isActive });
      await loadBoards();
    } catch (error: any) {
      alert(error.message || '게시판 상태 변경 실패');
    } finally {
      setSubmitting(false);
    }
  };

  // Post management handlers
  const handleTogglePin = async (post: BoardPost) => {
    if (!mallId) return;
    setSubmitting(true);
    try {
      await updatePost(mallId, post.id, { isPinned: !post.isPinned });
      await loadPosts(selectedBoardId);
    } catch (error: any) {
      alert(error.message || '게시글 수정 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (post: BoardPost) => {
    if (!mallId) return;
    setSubmitting(true);
    try {
      const newStatus = post.status === 'hidden' ? 'published' : 'hidden';
      await updatePost(mallId, post.id, { status: newStatus });
      await loadPosts(selectedBoardId);
    } catch (error: any) {
      alert(error.message || '게시글 수정 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!mallId || deleteConfirm.type !== 'post' || !deleteConfirm.postId) return;
    setSubmitting(true);
    try {
      await deletePost(mallId, deleteConfirm.postId);
      await loadPosts(selectedBoardId);
      setDeleteConfirm({ open: false, boardId: null, type: 'board' });
      alert('게시글이 삭제되었습니다.');
    } catch (error: any) {
      alert(error.message || '게시글 삭제 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.type === 'board') {
      await handleDeleteBoard();
    } else {
      await handleDeletePost();
    }
  };

  // Get board name by ID
  const getBoardName = (boardId: string): string => {
    const board = boards.find(b => b.id === boardId);
    return board?.name || boardId;
  };

  if (authLoading || !isMallOwner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">게시판 관리</h1>
        <p className="mt-1 text-sm text-gray-500">게시판과 게시글을 관리합니다.</p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: '게시판 목록', value: 'boards', count: boards.length },
          { label: '게시글 관리', value: 'posts' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Boards Tab */}
      {activeTab === 'boards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={openAddBoard}>
              <PlusIcon className="h-4 w-4" />
              게시판 추가
            </Button>
          </div>

          {loading ? (
            <Card padding="none">
              <div className="space-y-4 p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
                    <div className="flex-1" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </Card>
          ) : boards.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
                title="게시판이 없습니다"
                description="새 게시판을 추가하여 커뮤니티를 만들어보세요."
                action={{ label: '게시판 추가', onClick: openAddBoard }}
              />
            </Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">게시판 이름</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">유형</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">슬러그</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">댓글</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">로그인 필요</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">상태</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boards.map((board) => (
                      <tr key={board.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{board.name}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="info">{BOARD_TYPE_LABELS[board.type]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-xs text-gray-500">{board.slug}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-600">{board.allowComments ? '허용' : '비허용'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-600">{board.requireLogin ? '필요' : '불필요'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleToggleBoardActive(board)} disabled={submitting}>
                            <Badge variant={board.isActive ? 'success' : 'secondary'}>
                              {board.isActive ? '활성' : '비활성'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditBoard(board)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                              disabled={submitting}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ open: true, boardId: board.id, type: 'board' })}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                              disabled={submitting}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Board Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">게시판 선택</label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
            >
              {boards.length === 0 && <option value="">게시판 없음</option>}
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name} ({BOARD_TYPE_LABELS[board.type]})
                </option>
              ))}
            </select>
          </div>

          {/* Posts List */}
          {postsLoading ? (
            <Card padding="none">
              <div className="space-y-4 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </Card>
          ) : !selectedBoardId ? (
            <Card>
              <EmptyState
                icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
                title="게시판을 선택하세요"
                description="위에서 게시판을 선택하면 게시글 목록이 표시됩니다."
              />
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
                title="게시글이 없습니다"
                description={`'${getBoardName(selectedBoardId)}' 게시판에 게시글이 없습니다.`}
              />
            </Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">제목</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">작성자</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">조회수</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">고정</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">상태</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">작성일</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {post.isPinned && (
                              <MapPinIcon className="h-4 w-4 shrink-0 text-primary" />
                            )}
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                              {post.title}
                            </span>
                            {post.isSecret && (
                              <Badge variant="secondary">비밀글</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{post.authorName}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-500">{post.viewCount}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleTogglePin(post)}
                            disabled={submitting}
                            title={post.isPinned ? '고정 해제' : '고정'}
                          >
                            <Badge variant={post.isPinned ? 'default' : 'secondary'}>
                              {post.isPinned ? '고정' : '-'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleVisibility(post)}
                            disabled={submitting}
                            title={post.status === 'hidden' ? '공개로 변경' : '숨김 처리'}
                          >
                            <Badge variant={post.status === 'published' ? 'success' : post.status === 'hidden' ? 'warning' : 'danger'}>
                              {post.status === 'published' ? '공개' : post.status === 'hidden' ? '숨김' : '삭제됨'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleTogglePin(post)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                              disabled={submitting}
                              title={post.isPinned ? '고정 해제' : '상단 고정'}
                            >
                              <MapPinIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleVisibility(post)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                              disabled={submitting}
                              title={post.status === 'hidden' ? '공개' : '숨김'}
                            >
                              {post.status === 'hidden' ? (
                                <EyeIcon className="h-4 w-4" />
                              ) : (
                                <EyeSlashIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ open: true, boardId: selectedBoardId, type: 'post', postId: post.id })}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                              disabled={submitting}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Board Add/Edit Modal */}
      {showBoardModal && (
        <Modal
          isOpen={showBoardModal}
          onClose={() => setShowBoardModal(false)}
          title={editingBoard ? '게시판 수정' : '게시판 추가'}
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="게시판 이름"
              placeholder="예: 공지사항"
              value={boardForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setBoardForm({
                  ...boardForm,
                  name,
                  slug: editingBoard ? boardForm.slug : generateSlug(name),
                });
              }}
            />

            <Input
              label="슬러그 (URL 경로)"
              placeholder="예: notice"
              value={boardForm.slug}
              onChange={(e) => setBoardForm({ ...boardForm, slug: e.target.value })}
              hint="영문 소문자, 숫자, 하이픈만 사용"
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">게시판 유형</label>
              <select
                value={boardForm.type}
                onChange={(e) => setBoardForm({ ...boardForm, type: e.target.value as BoardType })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="notice">공지사항</option>
                <option value="faq">FAQ</option>
                <option value="qna">Q&A</option>
                <option value="review">리뷰</option>
                <option value="free">자유게시판</option>
              </select>
            </div>

            <Input
              label="페이지당 게시글 수"
              type="number"
              value={boardForm.postsPerPage}
              onChange={(e) => setBoardForm({ ...boardForm, postsPerPage: Number(e.target.value) })}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={boardForm.allowComments}
                  onChange={(e) => setBoardForm({ ...boardForm, allowComments: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-gray-700">댓글 허용</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={boardForm.requireLogin}
                  onChange={(e) => setBoardForm({ ...boardForm, requireLogin: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-gray-700">로그인 필요</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={boardForm.isActive}
                  onChange={(e) => setBoardForm({ ...boardForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-gray-700">활성화</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowBoardModal(false)}>
                취소
              </Button>
              <Button onClick={handleSaveBoard} disabled={submitting} isLoading={submitting}>
                {editingBoard ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, boardId: null, type: 'board' })}
        title={deleteConfirm.type === 'board' ? '게시판 삭제' : '게시글 삭제'}
        message={
          deleteConfirm.type === 'board'
            ? '이 게시판을 삭제하시겠습니까? 게시판에 속한 게시글도 함께 삭제될 수 있습니다.'
            : '이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
        }
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={submitting}
      />
    </div>
  );
}
