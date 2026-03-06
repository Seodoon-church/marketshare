# MarketShare - 분양몰 특화 전자상거래 플랫폼

## 개요
기존 PHP 기반 "마켓인사이드" 플랫폼을 **Next.js + Firebase** 기반으로 재구축.
쇼핑몰을 분양하고, 분양몰 상품이 메인 사이트에도 통합 게시되는 마켓플레이스 플랫폼.

## 기술 스택
- **Frontend**: Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Storage, Hosting)
- **결제**: PortOne (이니시스, 카카오페이, 네이버페이, KCP, LG 전체 연동)
- **상태관리**: Zustand
- **에디터**: Tiptap (SmartEditor2 대체)
- **프로젝트 위치**: `C:\Users\samsung\Documents\project\marketshare`

---

## Phase 1: 프로젝트 초기화 및 인증 시스템

### 1-1. Next.js 프로젝트 생성 및 설정
- `npx create-next-app@latest . --typescript --tailwind --app --src-dir`
- Firebase 프로젝트 설정 (firebase.json, .env.local)
- ESLint, Prettier 설정
- 핵심 패키지 설치 (firebase, zustand, react-hook-form, zod 등)

### 1-2. 프로젝트 구조 생성
```
marketshare/
├── src/
│   ├── app/
│   │   ├── (main)/          # 메인 플랫폼 라우트
│   │   ├── (admin)/         # 관리자 대시보드
│   │   ├── _mall/[mallSlug]/ # 분양몰 라우트 (미들웨어 리라이트)
│   │   └── api/             # API 라우트
│   ├── components/
│   │   ├── ui/              # 기본 UI 컴포넌트
│   │   ├── layout/          # 레이아웃
│   │   ├── product/         # 상품 관련
│   │   ├── cart/            # 장바구니
│   │   ├── checkout/        # 결제
│   │   ├── auth/            # 인증
│   │   ├── admin/           # 관리자
│   │   ├── mall/            # 분양몰
│   │   ├── board/           # 게시판
│   │   └── common/          # 공통
│   ├── lib/
│   │   ├── firebase/        # Firebase 설정 (config, admin, auth, firestore, storage)
│   │   ├── services/        # 비즈니스 로직 서비스 레이어
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── utils/           # 유틸리티
│   │   ├── payment/         # PortOne 결제 모듈
│   │   └── themes/          # 테마 정의 파일
│   ├── types/               # TypeScript 타입 정의
│   ├── store/               # Zustand 스토어
│   └── providers/           # Context Provider
├── functions/               # Firebase Cloud Functions
│   └── src/
│       ├── payments/        # 결제 웹훅/검증
│       ├── products/        # 상품 동기화 트리거
│       ├── orders/          # 주문 라이프사이클
│       ├── users/           # 유저 생성/삭제
│       ├── malls/           # 분양몰 프로비저닝
│       ├── notifications/   # 이메일/SMS
│       └── scheduled/       # 정산/통계 스케줄
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── storage.rules
```

### 1-3. Firebase 인증 시스템
- 이메일/비밀번호 회원가입/로그인
- 카카오/네이버 소셜 로그인 (Cloud Function Custom Token 방식)
- Google 로그인 (Firebase 네이티브)
- AuthProvider, useAuth 훅 구현
- 역할: customer | mall_owner | platform_admin

### 1-4. 기본 UI 컴포넌트 라이브러리
- Button, Input, Select, Modal, Toast, Table, Pagination, Card, Skeleton 등

---

## Phase 2: Firestore DB 스키마 및 상품 시스템

### 핵심 컬렉션 구조
```
malls/{mallId}/                    # 분양몰 (하위 서브컬렉션으로 격리)
  └── products/{productId}         # 몰별 상품
  └── orders/{orderId}             # 몰별 주문
  └── categories/{categoryId}      # 몰별 카테고리
  └── banners/{bannerId}           # 몰별 배너
  └── boards/{boardId}             # 몰별 게시판
  └── boardPosts/{postId}          # 몰별 게시글

products_aggregate/{productId}     # 메인사이트 통합 상품 (Cloud Function 자동 동기화)
users/{userId}                     # 전체 유저
  └── wishlist/{itemId}
  └── orders/{orderId}             # 경량 주문 참조
categories_global/{categoryId}     # 플랫폼 글로벌 카테고리
brands/{brandId}                   # 브랜드
themes/{themeId}                   # 테마 설정
orders_global/{orderId}            # 관리자용 전체 주문 인덱스
franchise_applications/{id}        # 분양 신청
platform_config/                   # 플랫폼 설정
settlements/{id}                   # 정산
```

### 상품 시스템
- 상품 CRUD (mall-admin에서 생성/수정/삭제)
- Cloud Function `onWrite` 트리거로 `products_aggregate`에 자동 동기화
- 상품 목록 페이지 (필터, 정렬, 무한스크롤)
- 상품 상세 페이지 (SSR, SEO)
- Tiptap 리치텍스트 에디터, Firebase Storage 이미지 업로드

---

## Phase 3: 멀티테넌트 및 테마 시스템

### 서브도메인 라우팅
- `middleware.ts`에서 서브도메인 감지 → `_mall/[mallSlug]/`로 리라이트
- 로컬 개발: `/m/{mallSlug}/` 경로 기반 폴백
- 커스텀 도메인 매핑 지원

### 테마 시스템 (CSS Variables + Tailwind)
- 초기 구현 테마 **5개**: basic, shop, company, restaurant, service
- ThemeProvider가 런타임에 CSS 변수 주입
- 몰 관리자가 색상/로고/레이아웃 커스터마이징 가능
- 테마별 레이아웃 설정 (헤더 타입, 상품카드 스타일, 카테고리 내비 등)

---

## Phase 4: 결제 시스템

### PortOne(아임포트) 통합
- 5개 PG사 전체 연동: 이니시스, 카카오페이, 네이버페이, KCP, LG
- 결제 흐름: 장바구니 → 주문서 → PortOne SDK 결제창 → 서버 검증 → 완료
- Cloud Function 웹훅으로 결제 확인 (백업)
- 환불 처리 (PortOne API 통해)
- 정산 시스템 (일일 스케줄 Cloud Function)

---

## Phase 5: 관리자 대시보드

### 플랫폼 슈퍼 관리자 (`/admin/`)
- 대시보드 (매출, 주문, 사용자 KPI)
- 분양몰 관리 (생성/수정/일시중지)
- 전체 상품/주문 관리
- 사용자 관리, 카테고리/브랜드 관리
- 테마 관리, 배너 관리
- 분양 신청 관리, 정산 관리
- 통계/분석, Excel 내보내기

### 분양몰 관리자 (`/mall-admin/`)
- 몰 대시보드 (매출, 주문 현황)
- 상품 등록/수정/삭제
- 주문 관리 (상태변경, 송장입력)
- 카테고리/배너/게시판 관리
- 몰 설정 (테마 커스터마이징, 기본정보)
- 몰별 통계

---

## Phase 6: 콘텐츠 및 커뮤니티

- 게시판 시스템 (공지, FAQ, Q&A, 리뷰, 자유게시판)
- 상품 리뷰 (구매자만 작성 가능, 별점, 이미지)
- 1:1 문의
- 마이페이지 (주문내역, 위시리스트, 리뷰, 문의)
- 이메일/SMS 알림 (Cloud Functions)

---

## Phase 7: 한국 규정 준수 및 보안

- KCP/OKName 본인인증 연동
- 사업자번호 검증
- Firestore 보안 규칙 최종화
- API 레이트 리밋, CSRF 보호
- 개인정보보호법 대응

---

## Phase 8: 데이터 마이그레이션 및 최적화

- MySQL → Firestore 마이그레이션 스크립트 (상품 ~1,011개, 사용자, 주문, 카테고리 등)
- ISR (Incremental Static Regeneration) 적용
- Next.js Image 최적화, Bundle 분석
- SEO (사이트맵, OG 태그, JSON-LD 구조화 데이터)
- Lighthouse 90+ 목표

---

## 구현 순서 (우선순위)

| 순서 | 작업 | 비고 |
|------|------|------|
| 1 | 프로젝트 초기화, Firebase 설정, 타입 정의 | Phase 1-1, 1-2 |
| 2 | 인증 시스템 (이메일 + 소셜) | Phase 1-3 |
| 3 | UI 컴포넌트 라이브러리 + 레이아웃 | Phase 1-4 |
| 4 | Firestore 스키마 + 카테고리/브랜드 | Phase 2 |
| 5 | 상품 CRUD + 리스팅/상세 | Phase 2 |
| 6 | 멀티테넌트 라우팅 + 테마 시스템 | Phase 3 |
| 7 | 결제 통합 (PortOne + 5개 PG) | Phase 4 |
| 8 | 관리자 대시보드 (플랫폼 + 몰) | Phase 5 |
| 9 | 게시판/리뷰/마이페이지 | Phase 6 |
| 10 | 본인인증/보안 | Phase 7 |
| 11 | 마이그레이션/최적화/배포 | Phase 8 |

---

## 검증 방법
1. `npm run dev`로 로컬 실행 확인
2. Firebase Emulator Suite로 Firestore/Auth/Functions 로컬 테스트
3. 서브도메인 라우팅: hosts 파일 또는 `/m/{slug}/` 경로로 테스트
4. 결제: PortOne 테스트 모드로 전체 PG 결제 플로우 검증
5. Cloud Functions: Firebase Emulator에서 트리거 동작 확인
6. Lighthouse로 성능/SEO/접근성 점수 확인
