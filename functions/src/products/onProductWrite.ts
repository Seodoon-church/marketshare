// ============================================
// 상품 쓰기 트리거 - products_aggregate 동기화
// ============================================

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * Firestore 트리거: malls/{mallId}/products/{productId}
 *
 * - 생성/수정 시: products_aggregate/{productId}에 상품 데이터를 동기화
 * - 삭제 시: products_aggregate에서 제거
 * - 상품 상태가 'active'인 경우에만 동기화
 * - 상태가 비활성으로 변경되면 aggregate에서 제거
 */
export const onProductWrite = onDocumentWritten(
  "malls/{mallId}/products/{productId}",
  async (event) => {
    const mallId = event.params.mallId;
    const productId = event.params.productId;

    try {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();

      // 삭제된 경우: aggregate에서 제거
      if (!afterData) {
        logger.info(`[상품 삭제] mallId: ${mallId}, productId: ${productId}`);
        await db.doc(`products_aggregate/${productId}`).delete();
        logger.info(`[상품 Aggregate 삭제 완료] productId: ${productId}`);
        return;
      }

      const productStatus = afterData.status as string;

      // 상태가 active가 아닌 경우: aggregate에서 제거
      if (productStatus !== "active") {
        logger.info(
          `[상품 비활성] mallId: ${mallId}, productId: ${productId}, status: ${productStatus}`
        );

        // 기존에 aggregate에 있었다면 제거
        const aggregateRef = db.doc(`products_aggregate/${productId}`);
        const aggregateDoc = await aggregateRef.get();
        if (aggregateDoc.exists) {
          await aggregateRef.delete();
          logger.info(
            `[상품 Aggregate 제거] 비활성 상품 제거됨: ${productId}`
          );
        }
        return;
      }

      // active 상품: aggregate에 동기화
      // 몰 정보 가져오기
      const mallDoc = await db.doc(`malls/${mallId}`).get();
      const mallData = mallDoc.data();
      const mallName = mallData?.name || "";

      const aggregateData = {
        // 원본 상품 데이터
        name: afterData.name || "",
        slug: afterData.slug || "",
        description: afterData.description || "",
        shortDescription: afterData.shortDescription || "",
        price: afterData.price || 0,
        salePrice: afterData.salePrice || null,
        costPrice: afterData.costPrice || 0,
        currency: afterData.currency || "KRW",
        categoryId: afterData.categoryId || "",
        categoryName: afterData.categoryName || "",
        categoryPath: afterData.categoryPath || [],
        brandId: afterData.brandId || null,
        brandName: afterData.brandName || null,
        supplierId: afterData.supplierId || null,
        supplierName: afterData.supplierName || null,
        images: afterData.images || [],
        thumbnailUrl: afterData.thumbnailUrl || "",
        options: afterData.options || [],
        variants: afterData.variants || [],
        stock: afterData.stock || 0,
        sku: afterData.sku || "",
        weight: afterData.weight || 0,
        status: afterData.status,
        isFeatured: afterData.isFeatured || false,
        isNew: afterData.isNew || false,
        isFromPlatform: afterData.isFromPlatform || false,
        tags: afterData.tags || [],
        viewCount: afterData.viewCount || 0,
        salesCount: afterData.salesCount || 0,
        reviewCount: afterData.reviewCount || 0,
        averageRating: afterData.averageRating || 0,
        shippingInfo: afterData.shippingInfo || null,
        levelPrices: afterData.levelPrices || [],
        seoTitle: afterData.seoTitle || "",
        seoDescription: afterData.seoDescription || "",
        createdAt: afterData.createdAt,
        updatedAt: afterData.updatedAt,
        publishedAt: afterData.publishedAt || null,

        // 추가 필드: 몰 정보
        mallId: mallId,
        mallName: mallName,
        mallSlug: afterData.mallSlug || mallData?.slug || "",
      };

      await db.doc(`products_aggregate/${productId}`).set(aggregateData, {
        merge: true,
      });

      const isNew = !beforeData;
      logger.info(
        `[상품 Aggregate ${isNew ? "생성" : "업데이트"}] mallId: ${mallId}, productId: ${productId}, name: ${afterData.name}`
      );
    } catch (error) {
      logger.error(
        `[상품 Aggregate 동기화 오류] mallId: ${mallId}, productId: ${productId}`,
        error
      );
      throw error;
    }
  }
);
