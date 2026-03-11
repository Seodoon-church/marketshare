// ============================================
// 몰 생성 트리거 - 기본 카테고리 및 게시판 설정
// ============================================

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * Firestore 트리거: malls/{mallId}
 *
 * - 기본 카테고리 초기화
 * - 기본 게시판 설정 생성 (공지사항, FAQ, 상품문의, 이용후기)
 * - 몰 생성 로그
 */
export const onMallCreate = onDocumentCreated(
  "malls/{mallId}",
  async (event) => {
    const mallId = event.params.mallId;

    try {
      const mallData = event.data?.data();

      if (!mallData) {
        logger.error(`[몰 생성 오류] 몰 데이터가 없습니다: ${mallId}`);
        return;
      }

      const mallName = mallData.name as string;
      logger.info(
        `[몰 생성] mallId: ${mallId}, mallName: ${mallName}`
      );

      const batch = db.batch();

      // 1. 기본 카테고리 초기화
      const defaultCategories = [
        {
          name: "전체상품",
          nameEn: "All Products",
          slug: "all",
          parentId: null,
          depth: 0,
          path: [],
          order: 0,
          imageUrl: null,
          iconUrl: null,
          productCount: 0,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "신상품",
          nameEn: "New Arrivals",
          slug: "new",
          parentId: null,
          depth: 0,
          path: [],
          order: 1,
          imageUrl: null,
          iconUrl: null,
          productCount: 0,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "베스트",
          nameEn: "Best Sellers",
          slug: "best",
          parentId: null,
          depth: 0,
          path: [],
          order: 2,
          imageUrl: null,
          iconUrl: null,
          productCount: 0,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "추천상품",
          nameEn: "Featured",
          slug: "featured",
          parentId: null,
          depth: 0,
          path: [],
          order: 3,
          imageUrl: null,
          iconUrl: null,
          productCount: 0,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "할인상품",
          nameEn: "Sale",
          slug: "sale",
          parentId: null,
          depth: 0,
          path: [],
          order: 4,
          imageUrl: null,
          iconUrl: null,
          productCount: 0,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      ];

      for (const category of defaultCategories) {
        const categoryRef = db.collection(`malls/${mallId}/categories`).doc();
        batch.set(categoryRef, {
          id: categoryRef.id,
          ...category,
        });
      }

      // 2. 기본 게시판 설정 생성
      const defaultBoards = [
        {
          name: "공지사항",
          slug: "notice",
          type: "notice" as const,
          isActive: true,
          allowComments: false,
          requireLogin: false,
          postsPerPage: 15,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "FAQ",
          slug: "faq",
          type: "faq" as const,
          isActive: true,
          allowComments: false,
          requireLogin: false,
          postsPerPage: 20,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "상품문의",
          slug: "qna",
          type: "qna" as const,
          isActive: true,
          allowComments: true,
          requireLogin: true,
          postsPerPage: 15,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "이용후기",
          slug: "review",
          type: "review" as const,
          isActive: true,
          allowComments: true,
          requireLogin: true,
          postsPerPage: 15,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      ];

      for (const board of defaultBoards) {
        const boardRef = db.collection(`malls/${mallId}/boards`).doc();
        batch.set(boardRef, {
          id: boardRef.id,
          ...board,
        });
      }

      await batch.commit();

      logger.info(
        `[몰 초기화 완료] mallId: ${mallId}, ` +
          `카테고리 ${defaultCategories.length}개, 게시판 ${defaultBoards.length}개 생성됨`
      );
    } catch (error) {
      logger.error(
        `[몰 생성 처리 오류] mallId: ${mallId}`,
        error
      );
      throw error;
    }
  }
);
