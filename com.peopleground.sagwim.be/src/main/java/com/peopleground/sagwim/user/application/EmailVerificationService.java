package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.EmailVerificationTemp;
import com.peopleground.sagwim.user.domain.entity.EmailVerificationToken;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.EmailVerificationTempRepository;
import com.peopleground.sagwim.user.domain.repository.EmailVerificationTokenRepository;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailVerificationTempRepository emailVerificationTempRepository;
    private final UserRepository userRepository;
    private final EmailSender emailSender;

    @Transactional
    public void sendVerificationEmail(String userEmail) {

        User user = userRepository.findByUserEmail(userEmail).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );

        if (user.isEmailVerified()) {
            throw new AppException(UserErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        emailVerificationTokenRepository.findByUserEmail(userEmail)
            .ifPresent(token -> emailVerificationTokenRepository.deleteByUser(user));

        EmailVerificationToken token = EmailVerificationToken.of(user, code);
        emailVerificationTokenRepository.save(token);

        emailSender.sendVerificationEmail(userEmail, code);
    }

    @Transactional
    public void verifyCode(String userEmail, String code) {

        EmailVerificationToken token = emailVerificationTokenRepository.findByUserEmail(userEmail)
            .orElseThrow(() -> new AppException(UserErrorCode.INVALID_VERIFICATION_CODE));

        // User를 1회만 조회하여 만료/검증/처리에 재사용
        User user = userRepository.findByUserEmail(userEmail).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );

        if (token.isExpired()) {
            emailVerificationTokenRepository.deleteByUser(user);
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        if (!token.getCode().equals(code)) {
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        user.verifyEmail();
        emailVerificationTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void sendVerificationBeforeSignUp(String email) {

        if (userRepository.existsByUserEmail(email)) {
            throw new AppException(UserErrorCode.DUPLICATE_EMAIL);
        }

        Optional<EmailVerificationTemp> existing = emailVerificationTempRepository.findByEmail(email);

        if (existing.isPresent()) {
            LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
            if (existing.get().getCreatedAt().isAfter(oneMinuteAgo)) {
                throw new AppException(UserErrorCode.VERIFICATION_CODE_RESEND_TOO_SOON);
            }
            emailVerificationTempRepository.deleteByEmail(email);
        }

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        EmailVerificationTemp temp = EmailVerificationTemp.of(email, code);
        emailVerificationTempRepository.save(temp);

        emailSender.sendVerificationEmail(email, code);
    }

    @Transactional
    public void verifyCodeBeforeSignUp(String email, String code) {

        EmailVerificationTemp temp = emailVerificationTempRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(UserErrorCode.INVALID_VERIFICATION_CODE));

        if (temp.isExpired()) {
            emailVerificationTempRepository.deleteByEmail(email);
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        if (!temp.getCode().equals(code)) {
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        temp.markVerified();
        emailVerificationTempRepository.save(temp);
    }

    public void checkPreVerified(String email) {
        EmailVerificationTemp temp = emailVerificationTempRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(UserErrorCode.EMAIL_NOT_PRE_VERIFIED));

        if (!temp.isVerified()) {
            throw new AppException(UserErrorCode.EMAIL_NOT_PRE_VERIFIED);
        }
    }

    @Transactional
    public void deletePreVerification(String email) {
        emailVerificationTempRepository.deleteByEmail(email);
    }

    @Transactional
    public void resendCode(String email) {
        sendVerificationBeforeSignUp(email);
    }

    /**
     * 로그인 사용자의 이메일 변경 인증 코드 발송.
     * - 새 이메일이 다른 계정에 이미 사용 중이면 거부 (중복 체크)
     * - 새 이메일이 현재 이메일과 동일하면 거부 (불필요한 발송 방지)
     * - 1분 내 재발송은 거부 (스팸 방지)
     * - 기존 토큰은 삭제 후 새 토큰 발행 (5분 TTL)
     */
    @Transactional
    public void sendChangeEmailVerification(String currentUsername, String newEmail) {

        User user = userRepository.findByUsername(currentUsername).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );

        if (newEmail.equalsIgnoreCase(user.getUserEmail())) {
            throw new AppException(UserErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        if (userRepository.existsByUserEmail(newEmail)) {
            throw new AppException(UserErrorCode.DUPLICATE_EMAIL);
        }

        Optional<EmailVerificationToken> existing = emailVerificationTokenRepository.findByUser(user);
        if (existing.isPresent()) {
            LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
            if (existing.get().getCreatedAt().isAfter(oneMinuteAgo)) {
                throw new AppException(UserErrorCode.VERIFICATION_CODE_RESEND_TOO_SOON);
            }
            emailVerificationTokenRepository.deleteByUser(user);
        }

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        EmailVerificationToken token = EmailVerificationToken.ofChangeEmail(user, newEmail, code);
        emailVerificationTokenRepository.save(token);

        emailSender.sendVerificationEmail(newEmail, code);
    }

    /**
     * 이메일 변경 인증 코드 검증 + 즉시 이메일 변경.
     * - 코드 불일치/만료 시 INVALID_VERIFICATION_CODE
     * - 코드의 newEmail과 요청 newEmail이 다르면 거부 (스니핑/재사용 방지)
     * - 검증 사이에 다른 사용자가 동일 이메일로 가입했을 수 있어 한 번 더 중복 체크
     */
    @Transactional
    public void verifyChangeEmail(String currentUsername, String newEmail, String code) {

        User user = userRepository.findByUsername(currentUsername).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );

        EmailVerificationToken token = emailVerificationTokenRepository.findByUser(user)
            .orElseThrow(() -> new AppException(UserErrorCode.INVALID_VERIFICATION_CODE));

        if (token.isExpired()) {
            emailVerificationTokenRepository.deleteByUser(user);
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        if (!token.getCode().equals(code)) {
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        if (token.getNewEmail() == null || !token.getNewEmail().equalsIgnoreCase(newEmail)) {
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        // 동시성: 코드 발송 후 다른 사용자가 동일 이메일로 가입했을 가능성 차단
        if (userRepository.existsByUserEmail(newEmail)) {
            emailVerificationTokenRepository.deleteByUser(user);
            throw new AppException(UserErrorCode.DUPLICATE_EMAIL);
        }

        user.changeVerifiedEmail(newEmail);
        emailVerificationTokenRepository.deleteByUser(user);
    }
}
