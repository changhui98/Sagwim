package com.peopleground.sagwim.user.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Entity(name = "p_user")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column
    private String password;

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column
    private String address;

    @JdbcTypeCode(SqlTypes.GEOGRAPHY)
    @Column(columnDefinition = "geography(Point,4326)")
    private Point location;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OAuthProvider provider = OAuthProvider.LOCAL;

    @Column(name = "provider_id")
    private String providerId;

    @Column(nullable = true, length = 150)
    private String bio;

    @Column(name = "nickname_changed_count", nullable = false)
    private int nicknameChangedCount = 0;

    @Column(name = "nickname_changed_at")
    private LocalDateTime nicknameChangedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender = Gender.NONE;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "is_searchable", nullable = false)
    private boolean isSearchable = true;

    @Column(name = "exposure_range_km", nullable = false)
    private int exposureRangeKm = 1;

    public void updateProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public static User of(
        String username,
        String password,
        String nickname,
        String userEmail
    ) {
        User user = new User();
        user.username = username;
        user.password = password;
        user.nickname = nickname;
        user.userEmail = userEmail;
        user.role = UserRole.USER;
        user.address = null;
        user.location = null;
        user.provider = OAuthProvider.LOCAL;
        return user;
    }

    /**
     * 소셜 로그인 사용자 생성 팩토리 메서드
     * password, address, location 은 null 로 초기화한다 (프로필 수정에서 입력).
     */
    public static User ofSocial(
        OAuthProvider provider,
        String providerId,
        String nickname,
        String userEmail,
        String profileImageUrl
    ) {
        User user = new User();
        user.username = provider.name().toLowerCase() + "_" + providerId;
        user.password = null;
        user.nickname = nickname;
        user.userEmail = userEmail;
        user.role = UserRole.USER;
        user.address = null;
        user.location = null;
        user.provider = provider;
        user.providerId = providerId;
        user.profileImageUrl = profileImageUrl;
        user.emailVerified = true;
        return user;
    }

    public void verifyEmail() {
        this.emailVerified = true;
    }

    /**
     * 인증 코드 검증을 마친 새 이메일로 변경한다.
     * 변경 즉시 emailVerified = true 로 보장한다 (코드 발송 단계에서 소유 증명 완료).
     */
    public void changeVerifiedEmail(String newEmail) {
        this.userEmail = newEmail;
        this.emailVerified = true;
    }

    /**
     * 기존 계정에 소셜 provider 정보를 연동한다.
     * LOCAL 계정이 소셜 로그인을 처음 연동할 때 호출된다.
     */
    public void linkSocialProvider(OAuthProvider provider, String providerId) {
        this.provider = provider;
        this.providerId = providerId;
        this.emailVerified = true;
    }

    public void changeRole(UserRole newRole) {
        this.role = newRole;
    }

    public void changeNickname(String newNickname) {
        this.nickname = newNickname;
        this.nicknameChangedAt = LocalDateTime.now();
        this.nicknameChangedCount++;
    }

    public boolean canChangeNickname() {
        if (nicknameChangedAt == null) return true;
        LocalDateTime windowStart = LocalDateTime.now().minusDays(7);
        if (nicknameChangedAt.isBefore(windowStart)) {
            // 7일 창이 리셋됨 — 카운트 리셋은 서비스 레이어에서 처리
            return true;
        }
        return nicknameChangedCount < 2;
    }

    public void resetNicknameChangeCount() {
        this.nicknameChangedCount = 0;
    }

    public User updateUser(
        String nickname,
        String userEmail,
        String address,
        Point location,
        String newPassword,
        String bio,
        Gender gender,
        LocalDate birthDate,
        boolean isSearchable,
        int exposureRangeKm
    ) {
        this.nickname = nickname;
        this.password = newPassword;
        this.address = address;
        this.location = location;
        this.userEmail = userEmail;
        this.bio = bio;
        this.gender = gender;
        this.birthDate = birthDate;
        this.isSearchable = isSearchable;
        this.exposureRangeKm = exposureRangeKm;
        return this;
    }

}
