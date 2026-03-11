// ============================================
// 체크아웃 처리 - 서버사이드 주문 생성 (가격 조작 방지)
// ============================================

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

// ---- Types ----

interface CheckoutItem {
  productId: string;
  quantity: number;
  options?: Record<string, string>;
}

interface ShippingAddress {
  name: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  couponCode?: string;
  pointsToUse?: number;
  mallId: string;
}

interface CheckoutResponse {
  orderId: string;
  merchantUid: string;
  totalAmount: number;
  breakdown: {
    subtotal: number;
    shippingFee: number;
    couponDiscount: number;
    pointsUsed: number;
  };
}

// 요금제별 수수료율
const PLAN_COMMISSION_RATES: Record<string, number> = {
  free: 5,
  starter: 3,
  business: 1.5,
  enterprise: 0.5,
};

/**
 * Callable Function: processCheckout
 *
 * 클라이언트 사이드 가격 조작을 방지하기 위해
 * 모든 체크아웃 로직을 서버에서 처리합니다.
 *
 * - 상품 존재/재고 확인 및 차감
 * - 쿠폰 유효성 검증 및 할인 계산
 * - 포인트 잔액 확인 및 사용 처리
 * - 배송비 서버 계산 (배송 존 기반)
 * - 총액 계산 및 주문 문서 생성
 * - 수수료 계산 (몰 요금제 기반)
 */
export const processCheckout = onCall<CheckoutRequest>(
  { region: "asia-northeast3" },
  async (request): Promise<CheckoutResponse> => {
    // 1. 인증 확인
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "로그인이 필요합니다."
      );
    }

    const userId = request.auth.uid;
    const { items, shippingAddress, paymentMethod, couponCode, pointsToUse, mallId } =
      request.data;

    // 입력값 기본 검증
    if (!items || items.length === 0) {
      throw new HttpsError("invalid-argument", "주문 상품이 없습니다.");
    }
    if (!shippingAddress) {
      throw new HttpsError("invalid-argument", "배송지 정보가 필요합니다.");
    }
    if (!paymentMethod) {
      throw new HttpsError("invalid-argument", "결제 수단을 선택해주세요.");
    }
    if (!mallId) {
      throw new HttpsError("invalid-argument", "몰 정보가 필요합니다.");
    }

    logger.info(
      `[체크아웃] userId: ${userId}, mallId: ${mallId}, items: ${items.length}개`
    );

    try {
      // Firestore 트랜잭션으로 원자적 처리
      const result = await db.runTransaction(async (transaction) => {
        // ---- (a) 몰 정보 조회 ----
        const mallRef = db.doc(`malls/${mallId}`);
        const mallDoc = await transaction.get(mallRef);

        if (!mallDoc.exists) {
          throw new HttpsError("not-found", "존재하지 않는 몰입니다.");
        }

        const mallData = mallDoc.data()!;

        if (mallData.status !== "active") {
          throw new HttpsError(
            "failed-precondition",
            "현재 이용할 수 없는 몰입니다."
          );
        }

        // ---- (b) 사용자 정보 조회 ----
        const userRef = db.doc(`users/${userId}`);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new HttpsError("not-found", "사용자 정보를 찾을 수 없습니다.");
        }

        const userData = userDoc.data()!;

        // ---- (c) 상품 확인 및 재고 검증 ----
        const productRefs = items.map((item) =>
          db.doc(`malls/${mallId}/products/${item.productId}`)
        );
        const productDocs = await Promise.all(
          productRefs.map((ref) => transaction.get(ref))
        );

        let subtotal = 0;
        const orderItems: Array<{
          productId: string;
          name: string;
          price: number;
          quantity: number;
          options: Record<string, string>;
          imageUrl: string;
          supplierId: string | null;
        }> = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const productDoc = productDocs[i];

          if (!productDoc.exists) {
            throw new HttpsError(
              "not-found",
              `상품을 찾을 수 없습니다: ${item.productId}`
            );
          }

          const productData = productDoc.data()!;

          if (productData.status !== "active") {
            throw new HttpsError(
              "failed-precondition",
              `판매 중이 아닌 상품입니다: ${productData.name}`
            );
          }

          // 옵션이 있는 경우 variant에서 재고 및 가격 확인
          let unitPrice: number;
          let availableStock: number;

          if (item.options && Object.keys(item.options).length > 0) {
            const variants = (productData.variants || []) as Array<{
              sku: string;
              options: Record<string, string>;
              price: number;
              stock: number;
            }>;

            const matchedVariant = variants.find((v) =>
              Object.entries(item.options!).every(
                ([key, val]) => v.options[key] === val
              )
            );

            if (!matchedVariant) {
              throw new HttpsError(
                "not-found",
                `선택한 옵션의 상품을 찾을 수 없습니다: ${productData.name}`
              );
            }

            unitPrice = matchedVariant.price;
            availableStock = matchedVariant.stock;
          } else {
            unitPrice =
              productData.salePrice != null
                ? productData.salePrice
                : productData.price;
            availableStock = productData.stock as number;
          }

          if (item.quantity <= 0) {
            throw new HttpsError(
              "invalid-argument",
              `유효하지 않은 수량입니다: ${productData.name}`
            );
          }

          if (availableStock < item.quantity) {
            throw new HttpsError(
              "failed-precondition",
              `재고가 부족합니다: ${productData.name} (남은 재고: ${availableStock}개)`
            );
          }

          subtotal += unitPrice * item.quantity;

          orderItems.push({
            productId: item.productId,
            name: productData.name as string,
            price: unitPrice,
            quantity: item.quantity,
            options: item.options || {},
            imageUrl: productData.thumbnailUrl || (productData.images?.[0]?.url as string) || "",
            supplierId: (productData.supplierId as string) || null,
          });

          // 재고 차감
          if (item.options && Object.keys(item.options).length > 0) {
            // variant 재고 차감: variants 배열 내 해당 variant의 stock 업데이트
            const variants = (productData.variants || []) as Array<{
              sku: string;
              options: Record<string, string>;
              price: number;
              stock: number;
            }>;
            const updatedVariants = variants.map((v) => {
              const isMatch = Object.entries(item.options!).every(
                ([key, val]) => v.options[key] === val
              );
              if (isMatch) {
                return { ...v, stock: v.stock - item.quantity };
              }
              return v;
            });
            transaction.update(productRefs[i], { variants: updatedVariants });
          } else {
            transaction.update(productRefs[i], {
              stock: admin.firestore.FieldValue.increment(-item.quantity),
            });
          }
        }

        // ---- (d) 쿠폰 검증 및 할인 계산 ----
        let couponDiscount = 0;
        let couponId: string | null = null;

        if (couponCode) {
          const couponQuery = await db
            .collection("coupons")
            .where("code", "==", couponCode)
            .where("isActive", "==", true)
            .limit(1)
            .get();

          if (couponQuery.empty) {
            throw new HttpsError(
              "not-found",
              "유효하지 않은 쿠폰 코드입니다."
            );
          }

          const couponDoc = couponQuery.docs[0];
          const couponData = couponDoc.data();
          couponId = couponDoc.id;

          // 유효기간 확인
          const now = admin.firestore.Timestamp.now();
          const startDate = couponData.startDate as admin.firestore.Timestamp;
          const endDate = couponData.endDate as admin.firestore.Timestamp;

          if (now.toMillis() < startDate.toMillis()) {
            throw new HttpsError(
              "failed-precondition",
              "쿠폰 사용 기간이 아닙니다."
            );
          }

          if (now.toMillis() > endDate.toMillis()) {
            throw new HttpsError(
              "failed-precondition",
              "만료된 쿠폰입니다."
            );
          }

          // 몰 범위 확인 (몰 전용 쿠폰인 경우)
          if (couponData.mallId && couponData.mallId !== mallId) {
            throw new HttpsError(
              "failed-precondition",
              "해당 몰에서 사용할 수 없는 쿠폰입니다."
            );
          }

          // 최소 구매금액 확인
          if (subtotal < (couponData.minPurchaseAmount || 0)) {
            throw new HttpsError(
              "failed-precondition",
              `최소 구매금액(${(couponData.minPurchaseAmount || 0).toLocaleString()}원)을 충족하지 않습니다.`
            );
          }

          // 총 사용 한도 확인
          if (
            couponData.totalUsageLimit != null &&
            (couponData.usageCount || 0) >= couponData.totalUsageLimit
          ) {
            throw new HttpsError(
              "failed-precondition",
              "쿠폰 사용 한도가 초과되었습니다."
            );
          }

          // 사용자별 사용 한도 확인
          if (couponData.usageLimitPerUser != null) {
            const userUsageQuery = await db
              .collection("coupon_usage")
              .where("couponId", "==", couponId)
              .where("userId", "==", userId)
              .get();

            if (userUsageQuery.size >= couponData.usageLimitPerUser) {
              throw new HttpsError(
                "failed-precondition",
                "이미 사용 한도에 도달한 쿠폰입니다."
              );
            }
          }

          // 할인 금액 계산
          if (couponData.type === "percentage") {
            couponDiscount = Math.floor(
              subtotal * ((couponData.discountValue as number) / 100)
            );
            // 최대 할인액 제한
            if (
              couponData.maxDiscountAmount != null &&
              couponDiscount > couponData.maxDiscountAmount
            ) {
              couponDiscount = couponData.maxDiscountAmount;
            }
          } else if (couponData.type === "fixed") {
            couponDiscount = couponData.discountValue as number;
          } else if (couponData.type === "free_shipping") {
            // 배송비 무료 쿠폰은 나중에 처리
            couponDiscount = 0;
          }

          // 할인이 소계를 초과하지 않도록
          if (couponDiscount > subtotal) {
            couponDiscount = subtotal;
          }
        }

        // ---- (e) 포인트 검증 ----
        let pointsUsed = 0;

        if (pointsToUse && pointsToUse > 0) {
          const mallPointBalance =
            ((userData.pointsByMall || {}) as Record<string, number>)[mallId] || 0;

          if (pointsToUse > mallPointBalance) {
            throw new HttpsError(
              "failed-precondition",
              `포인트 잔액이 부족합니다. (보유: ${mallPointBalance.toLocaleString()}P)`
            );
          }

          // 포인트 설정 확인
          const pointSettings = mallData.pointSettings;
          if (pointSettings) {
            if (pointsToUse < (pointSettings.minUsageAmount || 0)) {
              throw new HttpsError(
                "failed-precondition",
                `최소 포인트 사용 금액은 ${(pointSettings.minUsageAmount || 0).toLocaleString()}P입니다.`
              );
            }
          }

          pointsUsed = pointsToUse;
        }

        // ---- (f) 배송비 계산 ----
        let shippingFee = 0;
        const zipcode = shippingAddress.zipcode;

        // 몰의 배송 존 조회
        const shippingZonesSnapshot = await db
          .collection("malls")
          .doc(mallId)
          .collection("shipping_zones")
          .where("isActive", "==", true)
          .orderBy("order")
          .get();

        if (!shippingZonesSnapshot.empty) {
          // 우편번호 prefix 기반으로 배송 존 매칭
          let matchedZone: admin.firestore.DocumentData | null = null;

          for (const zoneDoc of shippingZonesSnapshot.docs) {
            const zoneData = zoneDoc.data();
            const regions = (zoneData.regions || []) as string[];

            const isMatch = regions.some((region: string) =>
              zipcode.startsWith(region)
            );

            if (isMatch) {
              matchedZone = zoneData;
              break;
            }
          }

          if (matchedZone) {
            shippingFee = (matchedZone.baseFee as number) || 0;
            const freeThreshold =
              (matchedZone.freeShippingThreshold as number) || 0;

            // 무료배송 기준금액 이상이면 배송비 무료
            if (freeThreshold > 0 && subtotal >= freeThreshold) {
              shippingFee = 0;
            }
          }
        } else {
          // 배송 존이 설정되지 않은 경우 상품의 기본 배송 정보 사용
          // 가장 높은 배송비를 적용
          for (const productDoc of productDocs) {
            const productData = productDoc.data();
            if (productData) {
              const shippingInfo = productData.shippingInfo as {
                fee?: number;
                freeShippingThreshold?: number;
              } | undefined;

              if (shippingInfo) {
                const productShippingFee = shippingInfo.fee || 0;
                if (productShippingFee > shippingFee) {
                  shippingFee = productShippingFee;
                }

                // 무료배송 기준금액 이상이면 배송비 무료
                const freeThreshold = shippingInfo.freeShippingThreshold || 0;
                if (freeThreshold > 0 && subtotal >= freeThreshold) {
                  shippingFee = 0;
                }
              }
            }
          }
        }

        // 무료배송 쿠폰 적용
        if (couponCode && couponId) {
          const couponQuery = await db
            .collection("coupons")
            .where("code", "==", couponCode)
            .limit(1)
            .get();

          if (!couponQuery.empty) {
            const couponData = couponQuery.docs[0].data();
            if (couponData.type === "free_shipping") {
              shippingFee = 0;
            }
          }
        }

        // ---- (g) 총액 계산 ----
        const totalAmount = subtotal + shippingFee - couponDiscount - pointsUsed;

        if (totalAmount < 0) {
          throw new HttpsError(
            "failed-precondition",
            "결제 금액이 유효하지 않습니다."
          );
        }

        // ---- (h) merchantUid 생성 ----
        const now = new Date();
        const dateStr =
          now.getFullYear().toString() +
          String(now.getMonth() + 1).padStart(2, "0") +
          String(now.getDate()).padStart(2, "0");
        const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
        const merchantUid = `MS-${dateStr}-${randomStr}`;

        // ---- (i) 주문 번호 생성 ----
        const timeStr =
          String(now.getHours()).padStart(2, "0") +
          String(now.getMinutes()).padStart(2, "0") +
          String(now.getSeconds()).padStart(2, "0");
        const orderNumber = `ORD-${dateStr}-${timeStr}-${randomStr.substring(0, 4)}`;

        // ---- (j) 수수료 계산 ----
        const plan = (mallData.plan as string) || "free";
        const commissionRate =
          (mallData.commissionRate as number) ??
          PLAN_COMMISSION_RATES[plan] ??
          PLAN_COMMISSION_RATES["free"];
        const commission = Math.round(subtotal * (commissionRate / 100));

        const referralCommissionRate =
          (mallData.referralCommissionRate as number) || 0;
        const referralCommission = Math.round(
          subtotal * (referralCommissionRate / 100)
        );
        const settlementAmount = subtotal - commission - referralCommission;

        // ---- (k) 주문 문서 생성 ----
        const orderId = db.collection("orders_global").doc().id;
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

        const orderDoc = {
          id: orderId,
          orderNumber,
          merchantUid,
          userId,
          userEmail: (userData.email as string) || "",
          userName: (userData.name as string) || "",
          mallId,
          mallName: (mallData.name as string) || "",
          items: orderItems,
          subtotal,
          shippingFee,
          discount: couponDiscount + pointsUsed,
          couponCode: couponCode || null,
          couponDiscount,
          pointsUsed,
          totalAmount,
          status: "awaiting_payment",
          paymentMethod,
          paymentInfo: null,
          shippingAddress,
          trackingNumber: null,
          trackingCompany: null,
          trackingCarrier: null,
          trackingUrl: null,
          memo: "",
          adminMemo: "",
          commission,
          commissionRate,
          referralCommission,
          referralCommissionRate,
          settlementAmount,
          isSettled: false,
          pointsEarned: 0,
          cancelReason: null,
          refundAmount: null,
          createdAt: serverTimestamp,
          updatedAt: serverTimestamp,
          paidAt: null,
          shippedAt: null,
          deliveredAt: null,
        };

        // malls/{mallId}/orders/{orderId} - 원본 주문
        const mallOrderRef = db.doc(`malls/${mallId}/orders/${orderId}`);
        transaction.set(mallOrderRef, orderDoc);

        // orders_global/{orderId} - 글로벌 참조
        const globalOrderRef = db.doc(`orders_global/${orderId}`);
        transaction.set(globalOrderRef, {
          orderId,
          orderNumber,
          merchantUid,
          mallId,
          mallName: (mallData.name as string) || "",
          userId,
          userName: (userData.name as string) || "",
          userEmail: (userData.email as string) || "",
          totalAmount,
          status: "awaiting_payment",
          paymentMethod,
          itemCount: orderItems.length,
          createdAt: serverTimestamp,
          updatedAt: serverTimestamp,
          originalPath: `malls/${mallId}/orders/${orderId}`,
        });

        // users/{userId}/orders/{orderId} - 사용자 참조
        const userOrderRef = db.doc(`users/${userId}/orders/${orderId}`);
        transaction.set(userOrderRef, {
          orderId,
          orderNumber,
          merchantUid,
          mallId,
          mallName: (mallData.name as string) || "",
          totalAmount,
          status: "awaiting_payment",
          itemCount: orderItems.length,
          firstItemName: orderItems[0]?.name || "",
          firstItemImageUrl: orderItems[0]?.imageUrl || "",
          createdAt: serverTimestamp,
          updatedAt: serverTimestamp,
          originalPath: `malls/${mallId}/orders/${orderId}`,
        });

        // ---- 포인트 차감 (사용한 경우) ----
        if (pointsUsed > 0) {
          transaction.update(userRef, {
            pointBalance: admin.firestore.FieldValue.increment(-pointsUsed),
            [`pointsByMall.${mallId}`]:
              admin.firestore.FieldValue.increment(-pointsUsed),
          });

          // 포인트 원장 기록
          const ledgerRef = db.collection("points_ledger").doc();
          transaction.set(ledgerRef, {
            userId,
            mallId,
            orderId,
            type: "used",
            amount: -pointsUsed,
            balance: 0, // 트랜잭션 내 정확한 잔액은 사후 계산
            description: `주문 결제 포인트 사용 (주문번호: ${orderNumber})`,
            expiresAt: null,
            createdBy: "system",
            createdAt: serverTimestamp,
          });
        }

        // ---- 쿠폰 사용 기록 ----
        if (couponCode && couponId && couponDiscount > 0) {
          // 쿠폰 사용 횟수 증가
          const couponRef = db.doc(`coupons/${couponId}`);
          transaction.update(couponRef, {
            usageCount: admin.firestore.FieldValue.increment(1),
          });

          // 사용 기록 생성
          const usageRef = db.collection("coupon_usage").doc();
          transaction.set(usageRef, {
            couponId,
            couponCode,
            userId,
            orderId,
            mallId,
            discountAmount: couponDiscount,
            usedAt: serverTimestamp,
          });

          // 사용자 쿠폰 상태 업데이트
          const userCouponRef = db.doc(`users/${userId}/coupons/${couponId}`);
          transaction.update(userCouponRef, {
            usedAt: serverTimestamp,
            usedOrderId: orderId,
          });
        }

        return {
          orderId,
          merchantUid,
          totalAmount,
          breakdown: {
            subtotal,
            shippingFee,
            couponDiscount,
            pointsUsed,
          },
        };
      });

      logger.info(
        `[체크아웃 완료] userId: ${userId}, orderId: ${result.orderId}, ` +
          `merchantUid: ${result.merchantUid}, totalAmount: ${result.totalAmount}원`
      );

      return result;
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("[체크아웃 오류]", error);
      throw new HttpsError(
        "internal",
        "주문 처리 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  }
);
