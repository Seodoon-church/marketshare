# MarketShare — 분양몰 특화 전자상거래 플랫폼

> 이 문서는 프로젝트 특화 규칙을 담습니다. 공통 규칙은 `~/.claude/CLAUDE.md`에 있습니다.

## 1. 프로젝트 개요

**MarketShare**는 기존 PHP 기반 "마켓인사이드" 플랫폼을 **Next.js + Firebase** 로 재구축한 **분양몰(franchise mall) 특화 마켓플레이스**입니다. 사용자가 쇼핑몰을 "분양받아" 운영하고, 분양몰 상품이 메인 플랫폼(`products_aggregate`)에도 자동 게시되는 **양방향 통합형 커머스**가 핵심입니다.

- **상태**: 개발 중 (MVP 배포 완료, 기능 확장 진행 중)
- **Firebase 프로젝트**: `marketshare-2e00c` (`.firebaserc`)
- **GitHub 원격**: ⚠️ **미연결** (`git remote` 없음). `Seodoon-church/marketshare` 로 등록 필요
- **배포 URL**: https://marketshare-2e00c.web.app (Firebase Hosting 기본)
- **프로덕션 도메인(예정)**: `marketshare.co.kr` / `marketshare.kr`
- **package.json name**: `marketshare-temp` (런타임 식별자)

### 특징
- **멀티테넌트** — 분양몰 단위 서브도메인 또는 `/m/{slug}/` 경로 라우팅
- **양방향 수수료** — 본사↔분양몰 상호 정산 (`commissionRate` / `referralCommissionRate` / `salesCommissionRate`)
- **MCN 라이브커머스** — 셀럽 허브 + 방송상품 관리 + 실시간 채팅
- **5개 PG 통합** — PortOne 기반 이니시스/카카오페이/네이버페이/KCP/LG. 몰별 PG 권한(`pgPaymentAuth`)
- **테마 5종** — basic/shop/company/restaurant/service. ThemeProvider 런타임 CSS 변수 주입

## 2. 기술 스택

| 레이어 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | **Next.js 16.1.6** (App Router) | `src/app/` |
| 언어 | TypeScript | `strict: true`, `paths: @/* → ./src/*` |
| React | 19.2.3 | |
| 스타일 | **Tailwind CSS 4** + CSS 변수 테마 | ⚠️ shadcn/ui 미사용, 자체 UI 라이브러리 |
| 상태 관리 | **Zustand 5** | `store/auth-store.ts`, `store/cart-store.ts` |
| 폼/검증 | react-hook-form + **zod 4** + @hookform/resolvers | |
| 에디터 | **Tiptap 3** (StarterKit + Image/Link/Underline/TextAlign/Placeholder) | SmartEditor2 대체 |
| 차트 | **recharts 3** + 자체 Charts.tsx (순수 SVG) | |
| 유틸 | date-fns, lodash-es, clsx, tailwind-merge, class-variance-authority, swiper, xlsx, dompurify, react-dropzone | |
| 백엔드 | Firebase 12 (Auth/Firestore/Functions/Storage) + firebase-admin 13 | |
| 인증 | Firebase Auth (Email + Kakao/Naver via Custom Token) | 역할: customer / mall_owner / platform_admin / supplier |
| 결제 | **PortOne (아임포트)** | 서버 검증 + 웹훅 이중 확인 |
| 테스트 | **없음** | ⚠️ 팀 표준(Vitest) 미도입 |
| 국제화 | **없음** | 한국어 단일 |
| 폰트 | Pretendard Variable (jsdelivr CDN) | |
| 배포 | Firebase Hosting + Cloud Functions | ⚠️ **Static Export 모드** (`output: "export"`) |

### 팀 표준과의 차이
- ⚠️ **Static Export** — Server Actions/SSR 불가, middleware 빌드 시 무시
- ⚠️ **Vitest 미도입** — 테스트 코드 0건
- ⚠️ **shadcn/ui 미사용** — `src/components/ui/` 자체 구현 20여 개
- ⚠️ **Cloud Functions 리전** — `processCheckout` 만 `asia-northeast3`, 나머지는 기본(us-central1). §9 참고

## 3. 빠른 시작

```bash
npm install                  # 의존성 설치
npm run dev                  # 개발 서버 (http://localhost:3000)
npm run build                # next build → out/ 정적 파일
npm run emulators            # Firebase 에뮬레이터 (UI: http://localhost:4000)

npm run deploy               # next build && firebase deploy
npm run deploy:hosting       # Hosting만
npm run deploy:functions     # Functions만
npm run deploy:rules         # firestore + storage rules
npm run deploy:indexes       # firestore indexes
```

**사전 요구사항**: Node.js 20+, Firebase CLI, `.env.local` (§5), Firebase 프로젝트(`marketshare-2e00c`) 권한

## 4. 디렉토리 구조

```
marketshare/
├── src/
│   ├── app/
│   │   ├── (admin)/, (main)/       # ⚠️ 빈 라우트 그룹 (정리 필요)
│   │   ├── _mall/[mallSlug]/       # 멀티테넌트 내부 경로 (middleware 리라이트 타겟)
│   │   │   └── ClientPage/products/cart/checkout/customer/board
│   │   ├── admin/                  # ⭐ 플랫폼 슈퍼 관리자 (20개 페이지)
│   │   │                           #   analytics, banners, boards, categories, coupons,
│   │   │                           #   demo-seed, franchise, malls, notifications, orders,
│   │   │                           #   payments, products, settings, settlements, suppliers,
│   │   │                           #   tax-invoices, themes, users
│   │   ├── mall-admin/              # ⭐ 분양몰 관리자 (20+ 페이지)
│   │   │                           #   analytics, banners, boards, categories, coupons,
│   │   │                           #   grades, headquarters-products(본사 상품 가져오기),
│   │   │                           #   live/(create,[sessionId],replays),
│   │   │                           #   mcn/ + mcn/streams/(MCN 셀럽 라이브커머스),
│   │   │                           #   members, notifications, orders, points, products,
│   │   │                           #   settings, settlements, shipping
│   │   ├── malls/[mallSlug]/       # 공개 몰 랜딩
│   │   ├── products/[productId]/   # 플랫폼 통합 상품 상세
│   │   ├── api/                    # ⚠️ Static Export 에서 빌드 안 됨 (사용 여부 검증 필요)
│   │   ├── auth/, brands/, cart/, checkout/, create-mall/, franchise/
│   │   ├── mypage/, pricing/, search/, supplier/
│   │   ├── layout.tsx              # Metadata + Pretendard + AuthProvider + ToastProvider + ChatWidget
│   │   ├── page.tsx                # 랜딩 (Hero/Trust/후기/FAQ/카운트업)
│   │   ├── sitemap.ts, robots.ts, error.tsx, not-found.tsx
│   ├── components/
│   │   ├── ui/                     # 자체 UI (20+): Button, Input, Modal, Badge, Card, Toast,
│   │   │                           #   Table, Pagination, Skeleton, Select, Tabs, Accordion,
│   │   │                           #   Avatar, Breadcrumb, EmptyState, DataTable, LoadingSpinner,
│   │   │                           #   RichTextEditor(Tiptap), Charts(SVG), ConfirmDialog
│   │   ├── layout/, product/, cart/, checkout/, auth/, admin/, mall/
│   │   ├── board/, review/, chat/(ChatWidget 챗봇), live/
│   │   └── common/                 # AnimateOnScroll (IntersectionObserver)
│   ├── lib/
│   │   ├── firebase/               # config.ts (client) + admin.ts (Lazy Proxy, 서버 전용)
│   │   ├── services/               # ⭐ 23개 서비스 레이어 (auth, board, brand, category,
│   │   │                           #   coupon, excel, franchise, grade, live, mall,
│   │   │                           #   notification, order, point, product, report, settings,
│   │   │                           #   settlement, shared-product, shipping, supplier,
│   │   │                           #   upload, user)
│   │   ├── hooks/                  # useAuth, useMall, useMallSlug, useProducts, useOrders,
│   │   │                           #   useCategories, useWishlist, useSearch, useLiveSession(s),
│   │   │                           #   useLiveChat, useDebounce, useInfiniteScroll
│   │   ├── payment/                # portone.ts, payment-service.ts
│   │   ├── themes/theme-registry.ts  # 5개 테마 정의
│   │   ├── data/                   # categories, demo-data, pricing
│   │   ├── middleware/             # ⚠️ 빈 디렉토리 (정리 필요)
│   │   └── utils/cn.ts, format.ts
│   ├── middleware.ts               # ⭐ 서브도메인/경로 기반 멀티테넌트 리라이트
│   ├── providers/                  # AuthProvider, ThemeProvider
│   ├── store/                      # Zustand: auth-store, cart-store
│   └── types/
│       ├── index.ts (833 lines)    # User, Mall, Product, Order, Cart, Category, Brand,
│       │                           #   Banner, Theme, Board, Settlement, Supplier, PricingPlan,
│       │                           #   FranchiseCondition, PGProviderConfig, MallPGConfig
│       └── live.ts
├── functions/src/                  # Cloud Functions (TypeScript)
│   ├── index.ts                    # 전체 함수 등록
│   ├── auth/socialLogin.ts         # kakaoLogin, naverLogin (Custom Token)
│   ├── malls/onMallCreate.ts       # 몰 생성 프로비저닝
│   ├── products/onProductWrite.ts  # products_aggregate 동기화
│   ├── orders/                     # onOrderCreate, onOrderStatusChange
│   ├── users/onUserCreate.ts
│   ├── payments/                   # processCheckout(asia-northeast3), verifyPayment,
│   │                               #   paymentWebhook, expireUnpaidOrders
│   ├── scheduled/                  # dailySettlement, updateStats, expirePoints,
│   │                               #   evaluateGrades, expireCoupons, onSettlementComplete
│   ├── chat/chatbot.ts             # 챗봇 onCall
│   └── notifications/sendNotification.ts  # 내부 헬퍼
├── public/                         # manifest.json, logo/og/icon SVG
├── out/                            # next build 결과 (Firebase Hosting 대상)
├── docs/
│   ├── PLAN.md                     # Phase 1-8 전체 로드맵
│   ├── proposal.md, franchise-policy-report.md, production-readiness-report.md
│   ├── patent/                     # 특허 출원 서류 3건
│   └── devlog/                     # 2026-03-07, 03-09, 03-10
├── firebase.json                   # Hosting + Functions + Firestore + Storage + Emulators
├── firestore.rules                 # 382 lines, 역할 기반 보안 규칙
├── firestore.indexes.json          # 335 lines
├── storage.rules                   # 110 lines (크기/타입 제한)
├── next.config.ts                  # output: "export", images.unoptimized
└── nul                             # ⚠️ Windows 예약어 파일 (gitignored)
```

## 5. 환경 변수

`.env.local` 필요 (`.env.local.example` 복사):

```bash
# Firebase Client SDK (브라우저 노출)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=marketshare-2e00c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=marketshare-2e00c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin SDK (서버 전용 - NEXT_PUBLIC_ 절대 금지)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# PortOne (아임포트)
NEXT_PUBLIC_PORTONE_IMP_CODE=imp00000000
NEXT_PUBLIC_PORTONE_STORE_ID=
PORTONE_API_KEY=
PORTONE_API_SECRET=

# 플랫폼 (middleware 서브도메인 파싱에 사용)
NEXT_PUBLIC_PLATFORM_DOMAIN=marketshare.co.kr
NEXT_PUBLIC_SITE_NAME=MarketShare
NEXT_PUBLIC_SITE_URL=https://marketshare.kr

# 선택: SMS(알리고/NHN), 세금계산서(팝빌)
```

> ⚠️ Static Export 모드인데 API Route 가 다수 존재. Export 에서 API Route 는 빌드되지 않음. {{TODO: api/ 의 실제 동작 경로 검증}}

## 6. 핵심 아키텍처

### 6.1 멀티테넌트 라우팅 (`src/middleware.ts`)

```
https://myshop.marketshare.co.kr/products
  → middleware.ts: subdomain='myshop' 추출
  → rewrite: /products → /_mall/myshop/products
  → 응답 헤더: x-mall-slug: myshop
```

- **서브도메인 모드** — 프로덕션에서 `*.marketshare.co.kr` 와일드카드 DNS/인증서 필요
- **경로 폴백** — 로컬/개발에서는 `/m/{slug}/...` 경로
- **제외** — `/api`, `/admin`, `/mall-admin`, `/auth`, `_next/*`, 정적 파일
- ⚠️ **Static Export 와 충돌** — `output: "export"` 에서 middleware 는 빌드 시 무시됨. 실제 프로덕션 라우팅은 `firebase.json` 의 `rewrites` (`/malls/*/products/* → /malls/demo/products/demo.html`) 가 담당. middleware.ts 는 **로컬 `npm run dev` 에서만 동작**

### 6.2 Static Export 모드 ⚠️ 팀 표준과 다름

```typescript
// next.config.ts
const nextConfig: NextConfig = { output: "export", images: { unoptimized: true } };
```

강제 제약:
- Server Components 데이터 페칭 금지 (클라이언트 훅으로만)
- `next/image` `unoptimized` 필수
- Middleware 빌드 시 무시 → Firebase Hosting rewrites 로 대체
- Server Actions 금지
- ⚠️ **`next/link` 클릭 버그** — Static Export 에서 `Link` 가 `preventDefault` 후 라우팅 실패 → 2026-03-10 에 **35개 파일에서 `<a>` 로 교체**. 신규 작성 시 `next/link` 사용 금지 (§10 히스토리 참고)

### 6.3 상품 동기화 (본사↔분양몰 양방향)

```
mall-admin 상품 생성
  → malls/{mallId}/products/{productId}
       ↓ onProductWrite 트리거
  → products_aggregate/{productId}   # 메인 플랫폼 통합 카탈로그 (mallId 역참조)
```

- `products_aggregate` 는 파생 데이터 — **직접 쓰지 말 것**, 재동기화 때 덮어쓰임
- 분양몰은 `/mall-admin/headquarters-products` 에서 본사 카탈로그 → 자기 몰로 `importProductFromPlatform`

### 6.4 결제 흐름 (PortOne + 5개 PG)

```
장바구니 → /checkout
  → processCheckout (onCall, asia-northeast3)   # 재고/쿠폰/포인트/배송비 검증
  → PortOne SDK 결제창 (클라이언트)
  → verifyPayment (onCall)                      # imp_uid 서버 검증
  → paymentWebhook (onRequest)                  # PortOne 웹훅 이중 확인
  → orders/{orderId}.status = 'paid'
  → expireUnpaidOrders (스케줄)                  # 미결제 자동 만료
```

- PG 설정: `malls/{mallId}.pgConfig` (몰별) + `settings/pg` (플랫폼 기본)
- `pgPaymentAuth`: `platform` / `individual` / `selective`

### 6.5 인증 및 역할

1. Email/비밀번호 가입 or 카카오/네이버 OAuth
2. 소셜 로그인은 `kakaoLogin`/`naverLogin` Cloud Function 이 Firebase Custom Token 발급
3. `onUserCreate` 트리거가 `users/{uid}` 초기화 (기본 role: `customer`)
4. 역할: `customer` / `mall_owner` / `platform_admin` / `supplier`
5. firestore.rules `isAdmin()` = `users/{uid}.role == 'platform_admin'`

### 6.6 정산 / 수수료 / 포인트 / 등급 (스케줄 함수)

- `dailySettlement` — 전일 매출 → 수수료 차감 → `settlements/{id}`
- `updateStats` — 대시보드 집계 캐시
- `expirePoints`, `evaluateGrades`, `expireCoupons` — 만료/재평가
- 수수료 3종: `commissionRate`(기본), `referralCommissionRate`(추천/본사), `salesCommissionRate`(MCN 셀럽 방송)

## 7. 도메인 모델 (Firestore)

```
users/{userId}                        # role, pointBalance, pointsByMall, gradeByMall,
  ├─ wishlist/{itemId}                #   ownedMallIds, supplierIds, addresses
  ├─ orders/{orderId}                 # (경량 참조; read only)
  └─ coupons/{couponId}               # 다운로드한 쿠폰

malls/{mallId}                        # ownerId, slug, status, level(1-5), plan,
  │                                   #   themeId/themeConfig, pgConfig, commissionRate*3,
  │                                   #   businessInfo, bankInfo, domain/subdomain
  ├─ products, orders, categories, banners, boards, boardPosts
  ├─ member_grades/{gradeId}          # VIP/Gold/...
  ├─ shipping_zones, shipping_templates
  └─ shared_products/{sharedId}       # 분양몰 공유 상품 참조

products_aggregate/{productId}        # ⭐ onProductWrite 자동 동기화 (mallId 역참조)
categories_global, brands             # 플랫폼 글로벌 (admin 관리)
orders_global/{orderId}               # admin 전체 주문 인덱스
franchise_applications/{id}           # pending/reviewing/approved/rejected
settlements, settlement_reports, tax_invoices
suppliers, supplier_applications, supplier_settlements
shipping_carriers                     # 택배사 마스터
reviews                               # 공개 read, 작성자만 update
points_ledger                         # 적립금 원장 (Cloud Function only)
coupons, coupon_usage
notification_settings, notification_templates, notification_history
live_sessions/{sessionId}/messages    # 라이브 커머스 + 실시간 채팅
bulk_operations                       # 대량 처리 작업 큐
platform_config                       # 공개 read, admin write
settings                              # 내부 설정 (admin only) - PG 설정 등
```

### 보안 규칙 헬퍼

```
isAuthenticated()    // request.auth != null
isOwner(userId)      // 본인
isAdmin()            // users/{uid}.role == 'platform_admin'
isMallOwner(mallId)  // malls/{mallId}.ownerId == request.auth.uid
```

`users/{uid}` update 규칙이 `request.resource.data.role != 'platform_admin'` 을 강제 → **본인 자가 승격 금지** (점검 완료).

### 도메인 용어
- **분양몰(分讓 mall)** — 본사가 쇼핑몰 인프라를 "분양"한 개별 스토어프론트. 프랜차이즈 + SaaS 혼합
- **본사 상품** — 플랫폼이 직접 공급하는 카탈로그. 분양몰이 가져가서 자기 몰에 재게시
- **MCN 스트림** — 셀럽이 여러 몰의 상품을 동시 라이브 방송, 양방향 수수료 정산

## 8. 자주 쓰는 명령

```bash
npm run dev                  # 개발 서버
npm run lint                 # ESLint
npm run build                # next build

npm run functions:build      # Functions TypeScript 빌드

npm run deploy               # 전체 배포
npm run deploy:hosting       # Hosting만
npm run deploy:functions     # Functions만
npm run deploy:rules         # firestore.rules + storage.rules
npm run deploy:indexes       # firestore.indexes.json

npm run emulators            # auth:9099 functions:5001 firestore:8080 storage:9199 UI:4000
```

## 9. 주의 사항

### ⚠️ 구조 / 팀 표준

- **Static Export + Middleware 충돌** — `next.config.ts: output: "export"` 인데 `src/middleware.ts` 존재. Export 모드에서 middleware 는 빌드 시 무시 → 프로덕션 라우팅은 **Firebase Hosting `rewrites`** 가 담당 (`firebase.json` 의 `/malls/*/products/* → /malls/demo/products/demo.html`). **로컬과 배포의 동작이 다름**
- **API Routes 미빌드** — `src/app/api/` 다수 존재하나 Static Export 에서 제외됨. {{TODO: api/ 사용 여부 검증}}
- **Cloud Functions 리전 불일치** — `processCheckout` 만 `asia-northeast3` 명시, 나머지 ~20개는 기본(us-central1). `setGlobalOptions({ region: "asia-northeast3" })` 를 `functions/src/index.ts` 최상단 추가 권장 (팀 표준 정렬)
- **테스트 0건** — Vitest 미도입. 결제/정산/권한 등 critical path 에 테스트 없음
- **빈 라우트 그룹** — `(admin)/`, `(main)/` 선언만 하고 방치 → 실제 `/admin`, `/mall-admin` 은 그룹 밖. `src/lib/middleware/` 도 빈 디렉토리

### ⚠️ 보안 / 운영

- **Firebase Admin SDK** — `src/lib/firebase/admin.ts` 가 Lazy Proxy. Static Export 에서 **서버 코드가 실행될 경로 없음** — 실제 어디서 쓰이는지 확인 필요. 클라이언트 번들에 유입되면 치명적 ({{TODO: admin.ts 호출처 점검}})
- **PortOne 비밀키** — `PORTONE_API_SECRET` 는 서버 전용. `NEXT_PUBLIC_` 접두사 금지 (`.env.local.example` 정상 분리됨)
- **결제 웹훅 idempotency** — `paymentWebhook.ts` 중복 처리 방지 로직 확인 필요 ({{TODO: idempotency key 점검}})
- **Storage 파일 크기** — 이미지 5MB, 일반 파일 10MB 제한

### ⚠️ 데이터

- **products_aggregate 는 파생** — 직접 쓰지 말 것. 다음 동기화 때 덮어쓰임
- **회원등급·포인트 몰별 독립** — `pointsByMall`, `gradeByMall` 과 전역 `pointBalance` 혼동 주의

### ⚠️ 기타

- **`nul` 파일** — Windows 예약어. `.gitignore` 에 있음. 삭제하려면 우회 필요
- **`package.json name: marketshare-temp`** — 정리 권장
- **`next/link` 금지** — Static Export 버그로 `<a>` 태그로 교체됨 (§10). 신규 파일에서도 `next/link` 사용 금지

## 10. 개발 히스토리

세 번의 큰 세션이 있습니다. 각 세션은 여러 Phase 를 묶은 대형 커밋입니다.

| 세션 | Commit | 날짜 | 핵심 변경 |
|---|---|---|---|
| **Phase 1** | `1e7f326` | 2026-03-07 | **프로젝트 초기화**. Next.js 16 + Firebase + Zustand + Tiptap + Tailwind 4 셋업. 타입 정의, Firebase config/admin, AuthProvider/ThemeProvider, 테마 5개, 멀티테넌트 middleware, UI 라이브러리 18개, Header/Footer/AdminSidebar, 랜딩/auth/products/admin/mall-admin 페이지 스텁 |
| **Phase 2-8** | `ca6ca8e` | ~2026-03-10 | **전체 플랫폼 + 라이브커머스 MVP**. Firestore 382줄 rules + 335줄 indexes, Cloud Functions 20+개(auth socialLogin, onMallCreate, onProductWrite, onOrder\*, onUserCreate, processCheckout, verifyPayment, paymentWebhook, expireUnpaidOrders, dailySettlement, updateStats, expirePoints, evaluateGrades, expireCoupons, onSettlementComplete, chatbot). 멀티테넌트 `_mall/[mallSlug]/**`, 관리자/몰관리자 40+ 페이지, Charts/ConfirmDialog, VariantMatrixEditor, 본사 상품 가져오기, 배송/배너/게시판/알림/수수료 대시보드, 특허 문서 3건, 제안서, **`next/link` → `<a>` 35개 파일 교체**(Static Export 버그) |
| **MCN 라이브커머스** | `a09fe2b` | ~2026-03-11 | **MCN 셀럽 라이브커머스**. 양방향 수수료 모델, MCN 허브(`/mall-admin/mcn`), 방송상품 관리(`mcn/streams`), live-service.ts 확장, useLiveSessions 강화, franchise/products 개선, types/live.ts |

### 진화의 큰 흐름
1. **Phase 1 (03-07)**: 스택 셋업 + 멀티테넌트 뼈대 + UI 라이브러리
2. **Phase 2-8 (03-10)**: 커머스 풀 스택 + Static Export 안정화
3. **MCN (03-11)**: 비즈니스 모델 확장 — 단순 분양 + 라이브커머스 허브 + 셀럽 양방향 수수료

### 현재 워킹 트리 상태
```
 M .claude/settings.local.json       # Claude 로컬 설정
?? .claude/projects/                 # 로컬 프로젝트 캐시
```
소스 파일 변경 없음.

## 11. TODO / 정리 필요 항목

### 가장 시급
- [ ] **GitHub 원격 연결** — `git remote` 없음. `Seodoon-church/marketshare` 등록 + 초기 push
- [ ] **Static Export 아키텍처 결정** — middleware + API Routes 가 모두 있는데 Export 모드라 무시됨. 셋 중 택일:
  1. SSR 모드 전환 (`output` 제거) → middleware/API 정상화
  2. Static Export 유지 → middleware.ts / api/ 제거 + Firebase rewrites 일원화
  3. Cloud Run SSR 이행
- [ ] **Cloud Functions 리전 통일** — `setGlobalOptions({ region: "asia-northeast3" })` 을 `functions/src/index.ts` 최상단에 추가

### 정리
- [ ] 빈 라우트 그룹 `(admin)/`, `(main)/`, 빈 디렉토리 `src/lib/middleware/` 삭제
- [ ] `nul` 파일 (Windows 예약어 우회 필요)
- [ ] `package.json name: marketshare-temp` → `marketshare`

### 검증
- [ ] `src/app/api/` 각 route 실제 사용 여부 ({{TODO}})
- [ ] `src/lib/firebase/admin.ts` 호출처 — 클라이언트 번들 누출 여부
- [ ] `paymentWebhook.ts` idempotency 키 처리
- [ ] 빌드 결과물(`out/`)의 Firebase Web API Key / PortOne IMP 코드 노출 확인
- [ ] 커스텀 도메인(`marketshare.co.kr` / `marketshare.kr`) 연결 상태
- [ ] `docs/patent/` 특허 출원 진행 상태

### 품질
- [ ] **Vitest 도입** — 최소 결제/정산/권한 체크 유닛 테스트
- [ ] Lighthouse 측정 + 최적화
- [ ] Bundle analyzer 로 admin SDK/Firestore 과다 import 점검
- [ ] `next/link` 금지 ESLint 규칙 또는 PR 체크리스트

## 12. 참고

- **공통 규칙**: `~/.claude/CLAUDE.md` (Seodoon-church 전역)
- **하네스 표준**: `C:\Users\samsung\Documents\project\harness-standards\`
- **프로젝트 로드맵**: `docs/PLAN.md` (Phase 1-8)
- **제안서**: `docs/proposal.md`
- **분양 정책 리포트**: `docs/franchise-policy-report.md`
- **프로덕션 준비도 리포트**: `docs/production-readiness-report.md`
- **특허 출원 문서**: `docs/patent/`
- **Firebase Console**: https://console.firebase.google.com/project/marketshare-2e00c
- **개발 배포 URL**: https://marketshare-2e00c.web.app
- **PortOne 관리자**: https://admin.portone.io/
