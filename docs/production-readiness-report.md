# MarketShare 프로덕션 준비 상태 종합 보고서

> **점검일**: 2026.03.10
> **점검 범위**: 프론트엔드, 백엔드 서비스, 보안/인증, 결제/정산 플로우
> **현재 상태**: 80개 라우트, 14개 Cloud Functions, 37개 Firestore 인덱스

---

## 종합 평가

| 영역 | 등급 | 점수 | 프로덕션 가능 여부 |
|------|------|------|-------------------|
| 프론트엔드 | B+ | 85% | 소규모 수정 후 가능 |
| 백엔드 서비스 | C | 60% | 핵심 수정 필요 |
| 보안/인증 | C+ | 65% | 핵심 수정 필요 |
| 결제/정산 | D | 40% | **대폭 수정 필요** |
| **종합** | **C** | **62%** | **프로덕션 불가 (수정 필요)** |

### 결론
> **현재 상태로는 실무 투입 불가.**
> 결제/정산 플로우에 치명적인 보안 취약점과 설계 결함이 있으며,
> Firestore 보안 규칙에도 누구나 포인트/쿠폰을 생성할 수 있는 심각한 허점이 있음.
> **약 3~5일의 집중 수정 작업** 후 프로덕션 투입 가능.

---

## 심각도별 이슈 요약

| 심각도 | 개수 | 설명 |
|--------|------|------|
| CRITICAL | 17개 | 프로덕션 전 반드시 수정 |
| WARNING | 15개 | 가급적 수정 권장 |
| MINOR | 10개 | 차후 개선 |

---

## CRITICAL 이슈 (17개)

### 결제 플로우 (9개)

| # | 이슈 | 파일 | 영향 |
|---|------|------|------|
| P-1 | **주문이 결제 전에 생성됨** | checkout/page.tsx:323 | 미결제 주문 누적, 무료 상품 요구 가능 |
| P-2 | **중복 결제 방지 없음** | checkout/page.tsx + payment-service | 동일 주문 이중 결제 |
| P-3 | **결제 금액 클라이언트 계산** | checkout/page.tsx:113 | JS 조작으로 가격 변조 가능 |
| P-4 | **음수/0원 결제 미차단** | checkout/page.tsx:295 | 포인트+쿠폰 과다적용 시 무료 주문 |
| P-5 | **결제 실패 시 주문 미삭제** | checkout/page.tsx:455 | DB에 미결제 주문 잔류 |
| P-6 | **merchant_uid ≠ orderId 불일치** | webhook/route.ts:92 | 웹훅이 주문을 찾지 못함 |
| P-7 | **재고 관리 없음** | checkout + product-service | 품절 상품 계속 판매 (과잉판매) |
| P-8 | **주문 상태 전이 미검증** | order-service.ts:236 | 취소→배송 등 잘못된 전이 가능 |
| P-9 | **결제 후 후속처리 실패 시 롤백 없음** | checkout/page.tsx:455 | 결제됐지만 포인트/쿠폰 미처리 |

### 보안 (5개)

| # | 이슈 | 파일 | 영향 |
|---|------|------|------|
| S-1 | **누구나 포인트 생성 가능** | firestore.rules:199 | 무제한 포인트 자가 발급 |
| S-2 | **누구나 쿠폰 생성 가능** | firestore.rules:209 | 무제한 쿠폰 자가 발급 |
| S-3 | **업로드 API 역할 미검증** | api/upload/route.ts | 일반 유저가 배너/몰 이미지 업로드 가능 |
| S-4 | **API 키 정적 빌드 노출** | api/payment/verify:7 | `force-static` → PG 키 JS 번들에 포함 |
| S-5 | **쿠폰 서버측 재검증 없음** | checkout/page.tsx:466 | 만료 쿠폰 결제 시점에 적용 가능 |

### 백엔드 (3개)

| # | 이슈 | 파일 | 영향 |
|---|------|------|------|
| B-1 | **쿠폰 적용 레이스컨디션** | coupon-service.ts:345 | 동시 사용 시 한도 초과 |
| B-2 | **정산 중복 실행 가능** | dailySettlement.ts:116 | 같은 날 2회 정산 → 이중 지급 |
| B-3 | **환불 주문 정산 포함** | dailySettlement.ts:72 | 환불된 주문도 정산에 포함 |

---

## WARNING 이슈 (15개)

### 결제/정산

| # | 이슈 | 설명 |
|---|------|------|
| W-1 | 포인트/쿠폰 취소 시 미복구 | 주문 취소해도 포인트/쿠폰 반환 안됨 |
| W-2 | 정산에 PG 수수료 미반영 | 정산 금액 = 매출 - 수수료 (PG 수수료 누락) |
| W-3 | 수수료율 변경 시 기존 주문 영향 | 주문 시점 수수료 미저장 |
| W-4 | 배송비 서버 검증 없음 | 클라이언트가 배송비 0원으로 조작 가능 |
| W-5 | 결제 검증 API Rate Limiting 없음 | DoS 공격 취약 |

### 보안

| # | 이슈 | 설명 |
|---|------|------|
| W-6 | 공급사 정산 읽기 권한 과다 | 인증만 되면 타 공급사 정산 열람 가능 |
| W-7 | 일부 관리자 페이지 가드 누락 | admin/users, admin/malls 명시적 가드 없음 |
| W-8 | 공급사 페이지 리다이렉트 없음 | 비인가 접근 시 메시지만 표시 |
| W-9 | Anthropic API 키 Firestore 평문 저장 | Secret Manager 사용 권장 |
| W-10 | API 입력 Zod 검증 없음 | 모든 서비스에서 입력 검증 부재 |

### 프론트엔드/백엔드

| # | 이슈 | 설명 |
|---|------|------|
| W-11 | 요금제 데이터 이중화 | pricing/page.tsx에 하드코딩 + data 파일 중복 |
| W-12 | 소셜 로그인 버튼 미구현 | 카카오/네이버/구글 버튼 있지만 동작 안함 |
| W-13 | 리뷰 평점 레이스컨디션 | 동시 리뷰 시 평균 평점 오류 |
| W-14 | 상품 집계 레이스컨디션 | 동시 업데이트 시 데이터 불일치 |
| W-15 | 포인트 잔액 원장 무결성 | 복구 시 balance: 0 기록 |

---

## MINOR 이슈 (10개)

| # | 이슈 |
|---|------|
| M-1 | console.log/error 프로덕션 코드에 잔류 (37곳) |
| M-2 | 홈페이지 통계 하드코딩 (1,000+ 상품 등) |
| M-3 | "로그인 상태 유지" 체크박스 미구현 |
| M-4 | 주문내역 기간 필터 UI만 존재 (동작 안함) |
| M-5 | sitemap.ts에 동적 상품 페이지 미포함 |
| M-6 | 가상계좌 결제 시 주문 상태 업데이트 TODO |
| M-7 | 카카오/네이버 로그인 서비스 미구현 (에러 throw) |
| M-8 | SMS/이메일 알림 서비스 플레이스홀더 |
| M-9 | PG 취소/환불 API 연동 TODO |
| M-10 | Hook에서 JSON.stringify 의존성 배열 비효율 |

---

## 수정 우선순위 및 작업 계획

### Phase 1: 결제 보안 (필수, 2일)

#### 1-1. 결제 플로우 전면 재설계
**현재**: 주문 생성 → 결제 시도 → 결과 처리
**수정**: 결제 시도 → 서버 검증 → 주문 생성 + 재고 차감

```
[수정 후 플로우]
1. 클라이언트: 장바구니 + 배송정보 + 쿠폰/포인트 → Cloud Function 전송
2. Cloud Function (processCheckout):
   - 재고 확인 및 락
   - 쿠폰 서버측 재검증
   - 포인트 잔액 확인
   - 총액 서버 계산
   - merchantUid 생성 및 저장
   - 임시 주문 생성 (status: 'awaiting_payment')
   → { orderId, merchantUid, totalAmount } 반환
3. 클라이언트: PortOne 결제 창 호출 (서버가 계산한 금액으로)
4. 웹훅: 결제 확인 → 주문 상태 'paid' 업데이트
5. 실패 시: 15분 후 자동 만료 (재고 복구)
```

**수정 파일**:
- `src/app/checkout/page.tsx` - 클라이언트 플로우 변경
- `functions/src/payments/processCheckout.ts` - 신규 Cloud Function
- `src/app/api/payment/webhook/route.ts` - merchantUid 조회 수정
- `src/app/api/payment/verify/route.ts` - `force-static` 제거

#### 1-2. Firestore 보안 규칙 수정
```javascript
// points_ledger: 클라이언트 생성 차단
match /points_ledger/{ledgerId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if false; // Cloud Functions에서만 생성
  allow update, delete: if isAdmin();
}

// coupons: 관리자만 생성
match /coupons/{couponId} {
  allow read: if isAuthenticated();
  allow create: if isAdmin() || isMallOwner(resource.data.mallId);
  allow update, delete: if isAdmin() || isMallOwner(resource.data.mallId);
}
```

#### 1-3. 재고 관리 추가
- `processCheckout` Cloud Function에서 트랜잭션으로 재고 차감
- 결제 실패/만료 시 재고 복구
- 상품 페이지에 실시간 재고 표시

### Phase 2: 데이터 무결성 (필수, 1일)

#### 2-1. 트랜잭션 적용
- 쿠폰 적용: `writeBatch` → `runTransaction`
- 리뷰 평점: read-then-write → `runTransaction`
- 상품 집계: 별도 쿼리+업데이트 → `runTransaction`
- 주문 취소 시 포인트/쿠폰/재고 복구를 단일 트랜잭션으로

#### 2-2. 주문 상태 전이 검증
```typescript
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};
```

#### 2-3. 정산 중복 방지 + 환불 주문 제외
- 정산 생성 전 기존 정산 존재 여부 확인
- `status == 'delivered' AND isRefunded != true` 조건 추가

### Phase 3: 보안 강화 (권장, 1일)

- 업로드 API 역할 검증 추가
- 공급사 정산 읽기 규칙 수정
- 관리자/공급사 페이지 가드 강화
- API 입력 Zod 검증 추가 (최소 결제 관련)

### Phase 4: 품질 개선 (선택, 1일)

- 소셜 로그인 버튼 제거 또는 구현
- console.log 정리
- 요금제 데이터 일원화
- 홈페이지 통계 동적화

---

## 긍정적 평가 항목

### 아키텍처
- 서비스 레이어 분리 잘 되어 있음
- TypeScript 타입 안전성 높음
- 컴포넌트 재사용성 우수 (Badge, Button, Card, Modal 등)
- Cloud Functions 구조 체계적

### UI/UX
- 모든 페이지 로딩/에러 상태 처리
- 반응형 디자인 모바일 대응
- EmptyState 컴포넌트로 빈 데이터 처리 일관적
- DOMPurify로 XSS 방어

### 인프라
- Firebase 보안 규칙 기본 구조 양호 (일부 수정 필요)
- 환경변수 분리 적절
- 배포 스크립트 완비
- 보안 헤더 설정 (HSTS, Permissions-Policy)

---

## 납품 기준 달성도

| 항목 | 현재 | 목표 | 상태 |
|------|------|------|------|
| 페이지 수 | 80개 | 80개 | 달성 |
| 빌드 성공 | O | O | 달성 |
| TypeScript 에러 | 0개 | 0개 | 달성 |
| 결제 보안 | 미달 | 서버 검증 | **미달** |
| 재고 관리 | 미구현 | 실시간 관리 | **미달** |
| 데이터 무결성 | 레이스컨디션 | 트랜잭션 | **미달** |
| Firestore 규칙 | 일부 취약 | 역할 기반 | **미달** |
| 외부 API (SMS 등) | 플레이스홀더 | 연동 완료 | 미달 (계정 필요) |

---

## 결론

**80개 페이지, 14개 Cloud Functions, 8개 서비스** 등 기능 구현 자체는 완료되었으나,
**결제 보안**과 **데이터 무결성** 측면에서 프로덕션 투입 전 반드시 수정이 필요합니다.

**핵심 수정 사항 3가지:**
1. 결제 플로우를 서버 중심으로 재설계 (가격 조작 방지)
2. Firestore 보안 규칙의 포인트/쿠폰 생성 권한 제한
3. 쿠폰/재고/정산의 트랜잭션 처리

이 3가지를 수정하면 **실무 투입 가능한 수준**이 됩니다.
