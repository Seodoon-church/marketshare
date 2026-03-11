// ============================================
// 쇼핑몰 AI 챗봇 - 옵션형 (API 키 없으면 FAQ, 있으면 AI)
// ============================================

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

const SYSTEM_PROMPT = `당신은 쇼핑몰의 친절한 고객 상담 챗봇입니다.

## 역할
- 고객의 쇼핑 관련 질문에 친절하고 정확하게 답변합니다.
- 한국어로 응답하며, 존댓말을 사용합니다.
- 간결하게 답변하되, 필요한 정보는 빠뜨리지 않습니다.
- 모르는 내용은 솔직히 말하고 고객센터 연결을 안내합니다.

## 쇼핑몰 정보

### 배송 안내
- 기본 배송비: 3,000원 (5만원 이상 무료배송)
- 제주/도서산간: 추가 3,000원
- 배송 기간: 결제 완료 후 2~3 영업일
- 택배사: CJ대한통운, 한진, 롯데, 로젠, 우체국
- 배송 추적: 마이페이지 > 주문내역에서 확인 가능

### 교환/반품
- 교환/반품 기간: 수령 후 7일 이내
- 단순 변심: 반품 배송비 고객 부담 (왕복 6,000원)
- 상품 하자: 반품 배송비 무료
- 교환/반품 불가: 착용 흔적, 택 제거, 세탁, 향수 오염, 주문제작 상품
- 신청 방법: 마이페이지 > 주문내역 > 교환/반품 신청

### 결제 수단
- 신용카드 (모든 카드사)
- 카카오페이, 네이버페이
- 계좌이체, 가상계좌 (무통장 입금)
- 휴대폰 소액결제

### 포인트/쿠폰
- 포인트: 구매 확정 시 자동 적립, 1포인트 = 1원
- 쿠폰: 마이페이지 > 쿠폰함에서 확인
- 포인트와 쿠폰은 결제 시 동시 사용 가능

### 회원 등급
- 구매 금액 기준 자동 등급 산정
- 등급별 추가 포인트 적립, 할인, 무료배송 혜택

### 영업 시간
- 고객센터: 평일 09:00~18:00 (주말/공휴일 휴무)
- 점심시간: 12:00~13:00

## 응답 규칙
- 2~3문장으로 간결하게 답변
- 구체적인 금액, 기간 등 숫자 정보를 정확히 제공
- 주문번호가 필요한 문의는 마이페이지 확인 또는 고객센터 연결 안내
- 쇼핑과 무관한 질문에는 정중히 쇼핑 관련 도움만 가능하다고 안내`;

// ---- 룰 기반 FAQ 응답 (API 키 없을 때 폴백) ----

interface FaqEntry {
  keywords: string[];
  answer: string;
}

const FAQ_RULES: FaqEntry[] = [
  {
    keywords: ["배송", "며칠", "얼마나", "언제 와", "언제 도착", "배달"],
    answer:
      "결제 완료 후 2~3 영업일 내에 배송됩니다. 기본 배송비는 3,000원이며, 5만원 이상 주문 시 무료배송입니다. 제주/도서산간은 추가 3,000원이 부과됩니다.",
  },
  {
    keywords: ["무료배송", "무료 배송", "배송비 무료", "공짜 배송"],
    answer:
      "5만원 이상 주문 시 무료배송입니다. 단, 제주/도서산간 지역은 추가 배송비 3,000원이 별도로 부과됩니다.",
  },
  {
    keywords: ["교환", "반품", "환불", "취소", "돌려", "바꿔"],
    answer:
      "수령 후 7일 이내 교환/반품 신청이 가능합니다. 단순 변심은 왕복 배송비 6,000원이 고객 부담이며, 상품 하자 시에는 무료입니다. 마이페이지 > 주문내역에서 신청하실 수 있습니다.",
  },
  {
    keywords: ["결제", "카드", "페이", "계좌", "입금", "결제 수단", "어떻게 결제"],
    answer:
      "신용카드(모든 카드사), 카카오페이, 네이버페이, 계좌이체, 가상계좌(무통장입금), 휴대폰 소액결제를 지원합니다.",
  },
  {
    keywords: ["포인트", "적립", "적립금"],
    answer:
      "구매 확정 시 포인트가 자동 적립됩니다. 1포인트 = 1원이며, 결제 시 포인트를 사용하실 수 있습니다. 마이페이지에서 잔액과 내역을 확인하실 수 있습니다.",
  },
  {
    keywords: ["쿠폰", "할인", "할인코드", "프로모션"],
    answer:
      "마이페이지 > 쿠폰함에서 보유 쿠폰을 확인하실 수 있습니다. 결제 시 쿠폰 코드를 입력하면 할인이 적용됩니다. 포인트와 쿠폰은 동시 사용 가능합니다.",
  },
  {
    keywords: ["등급", "회원", "멤버십", "혜택"],
    answer:
      "구매 금액 기준으로 회원 등급이 자동 산정됩니다. 등급이 높을수록 추가 포인트 적립, 할인, 무료배송 등 다양한 혜택이 제공됩니다. 마이페이지에서 현재 등급과 혜택을 확인하세요.",
  },
  {
    keywords: ["주문", "조회", "확인", "내역", "어디서 봐"],
    answer:
      "마이페이지 > 주문내역에서 주문 상태와 배송 추적을 확인하실 수 있습니다. 운송장 번호가 등록되면 택배사 배송 추적도 가능합니다.",
  },
  {
    keywords: ["운영시간", "고객센터", "전화", "상담", "문의", "연락"],
    answer:
      "고객센터 운영시간은 평일 09:00~18:00 (점심 12:00~13:00)이며, 주말 및 공휴일은 휴무입니다. 긴급한 문의는 1:1 문의게시판을 이용해주세요.",
  },
  {
    keywords: ["택배", "추적", "운송장", "배송 조회"],
    answer:
      "마이페이지 > 주문내역에서 운송장 번호를 확인하실 수 있습니다. CJ대한통운, 한진, 롯데, 로젠, 우체국 택배의 실시간 배송 추적이 가능합니다.",
  },
];

function findFaqAnswer(message: string): string | null {
  const lower = message.toLowerCase();
  for (const faq of FAQ_RULES) {
    if (faq.keywords.some((kw) => lower.includes(kw))) {
      return faq.answer;
    }
  }
  return null;
}

// ---- 메인 함수 ----

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatbot = onCall(
  {
    maxInstances: 10,
    timeoutSeconds: 30,
  },
  async (request) => {
    const { message, history } = request.data as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string") {
      throw new HttpsError("invalid-argument", "메시지를 입력해주세요.");
    }

    if (message.length > 500) {
      throw new HttpsError(
        "invalid-argument",
        "메시지는 500자 이내로 입력해주세요."
      );
    }

    // Firestore에서 챗봇 설정 조회
    let apiKey: string | null = null;
    try {
      const settingsDoc = await db.doc("settings/chatbot").get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        apiKey = data?.anthropicApiKey || null;
      }
    } catch (err) {
      logger.warn("[챗봇] 설정 조회 실패, FAQ 모드로 동작", err);
    }

    // API 키가 없으면 → 룰 기반 FAQ 응답
    if (!apiKey) {
      const faqAnswer = findFaqAnswer(message);
      const reply =
        faqAnswer ||
        "죄송합니다. 해당 질문에 대한 답변을 찾지 못했습니다. 고객센터(평일 09:00~18:00)로 문의해주시면 자세히 안내해드리겠습니다.";
      return { reply, mode: "faq" };
    }

    // API 키가 있으면 → Claude AI 응답
    const messages: ChatMessage[] = [
      ...(history || []).slice(-10),
      { role: "user", content: message },
    ];

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("[챗봇] API 에러:", response.status, errorText);
        // AI 실패 시 FAQ 폴백
        const faqAnswer = findFaqAnswer(message);
        return {
          reply:
            faqAnswer ||
            "일시적으로 AI 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.",
          mode: "faq",
        };
      }

      const data = await response.json();
      const reply =
        data.content?.[0]?.text ||
        "죄송합니다. 응답을 생성하지 못했습니다.";

      logger.info(`[챗봇] AI 응답 완료 - 입력: ${message.substring(0, 50)}`);
      return { reply, mode: "ai" };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("[챗봇] 처리 오류:", error);
      // 에러 시에도 FAQ 폴백
      const faqAnswer = findFaqAnswer(message);
      return {
        reply: faqAnswer || "챗봇 서비스에 일시적인 문제가 발생했습니다.",
        mode: "faq",
      };
    }
  }
);
