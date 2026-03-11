// ============================================
// 알림 발송 헬퍼 함수 (placeholder)
// ============================================

import * as logger from "firebase-functions/logger";

/**
 * 이메일 알림 발송 (placeholder)
 *
 * TODO: 실제 이메일 서비스(SendGrid, AWS SES 등) 연동 필요
 *
 * @param to - 수신자 이메일 주소
 * @param subject - 이메일 제목
 * @param body - 이메일 본문
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  // TODO: 실제 이메일 발송 서비스 연동
  // 예시: SendGrid, AWS SES, Nodemailer 등

  logger.info(
    `[이메일 알림 발송] to: ${to}, subject: ${subject}`
  );
  logger.info(`[이메일 본문] ${body}`);

  // placeholder: 실제 이메일 발송 로직은 추후 구현
  // 아래는 SendGrid 연동 예시 코드 (주석 처리)
  //
  // import * as sgMail from "@sendgrid/mail";
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
  // await sgMail.send({
  //   to: to,
  //   from: "noreply@marketshare.kr",
  //   subject: subject,
  //   text: body,
  // });
}

/**
 * SMS 알림 발송 (placeholder)
 *
 * TODO: 실제 SMS 서비스(Aligo, CoolSMS, NHN Toast 등) 연동 필요
 *
 * @param phone - 수신자 전화번호
 * @param message - SMS 메시지 내용
 */
export async function sendSMSNotification(
  phone: string,
  message: string
): Promise<void> {
  // TODO: 실제 SMS 발송 서비스 연동
  // 예시: Aligo, CoolSMS, NHN Toast SMS 등

  logger.info(
    `[SMS 알림 발송] phone: ${phone}, message: ${message}`
  );

  // placeholder: 실제 SMS 발송 로직은 추후 구현
  // 아래는 CoolSMS 연동 예시 코드 (주석 처리)
  //
  // import CoolSMS from "coolsms-node-sdk";
  // const sms = new CoolSMS("API_KEY", "API_SECRET");
  // await sms.sendOne({
  //   to: phone,
  //   from: "02-1234-5678",
  //   text: message,
  // });
}
