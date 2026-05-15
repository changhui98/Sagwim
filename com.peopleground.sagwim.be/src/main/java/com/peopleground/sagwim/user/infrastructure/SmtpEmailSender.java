package com.peopleground.sagwim.user.infrastructure;

import com.peopleground.sagwim.user.application.EmailSender;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class SmtpEmailSender implements EmailSender {

    private static final String SUBJECT = "[사귐] 이메일 인증 코드";
    private static final String LOGO_CID = "sagwimLogo";
    private static final String LOGO_RESOURCE_PATH = "email/logo.png";

    private final JavaMailSender javaMailSender;

    @Override
    public void sendVerificationEmail(String toEmail, String code) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage, MimeMessageHelper.MULTIPART_MODE_RELATED, StandardCharsets.UTF_8.name());

            helper.setTo(toEmail);
            helper.setSubject(SUBJECT);
            helper.setText(buildHtml(code), true);
            helper.addInline(LOGO_CID, new ClassPathResource(LOGO_RESOURCE_PATH));

            javaMailSender.send(mimeMessage);
        } catch (MessagingException | MailException e) {
            log.error("이메일 인증 메일 발송 실패 - to={}", toEmail, e);
            throw new IllegalStateException("이메일 발송에 실패했습니다.", e);
        }
    }

    private String buildHtml(String code) {
        return """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>사귐 이메일 인증</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard','Malgun Gothic',sans-serif;color:#1a1a1a;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;padding:40px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                          <tr>
                            <td style="height:6px;background:linear-gradient(90deg,#FF9580 0%%,#FF6B6B 55%%,#E63E5C 100%%);"></td>
                          </tr>
                          <tr>
                            <td style="padding:40px 40px 8px 40px;text-align:left;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="vertical-align:middle;padding-right:12px;">
                                    <img src="cid:%s" alt="사귐 로고" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;">
                                  </td>
                                  <td style="vertical-align:middle;font-size:24px;font-weight:700;color:#1a1a1a;letter-spacing:-0.02em;">
                                    사귐
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 40px 0 40px;">
                              <h1 style="margin:0;font-size:26px;line-height:1.35;font-weight:700;color:#1a1a1a;letter-spacing:-0.02em;">
                                이메일 인증 코드
                              </h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 40px 0 40px;">
                              <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4a4a;">
                                안녕하세요, 사귐입니다.<br>
                                아래 인증 코드를 입력해 이메일 인증을 완료해 주세요.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:28px 40px 0 40px;">
                              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7f9;border-radius:12px;">
                                <tr>
                                  <td align="center" style="padding:28px 16px;">
                                    <div style="font-size:34px;font-weight:700;letter-spacing:0.4em;color:#1a1a1a;font-family:'SF Mono','Menlo','Consolas',monospace;">
                                      %s
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 40px 0 40px;">
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8f98;">
                                보안을 위해 이 코드는 <strong style="color:#1a1a1a;font-weight:600;">5분간</strong>만 유효합니다.<br>
                                본인이 요청하지 않은 인증 메일이라면 이 메일을 무시해 주세요.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:32px 40px 40px 40px;">
                              <div style="border-top:1px solid #eceef1;padding-top:20px;">
                                <p style="margin:0;font-size:12px;line-height:1.6;color:#a0a4ac;">
                                  본 메일은 발신 전용이며, 회신이 처리되지 않습니다.<br>
                                  © 사귐(sagwim). All rights reserved.
                                </p>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(LOGO_CID, code);
    }
}
