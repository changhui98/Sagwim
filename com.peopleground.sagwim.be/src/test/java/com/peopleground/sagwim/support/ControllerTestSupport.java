package com.peopleground.sagwim.support;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * WebMvcTest 계열 컨트롤러 테스트에서 공통으로 사용하는 헬퍼 유틸.
 *
 * @WebMvcTest 를 사용하면 실제 Security 필터 체인이 로드되므로,
 * 인증이 필요한 엔드포인트 테스트에서는 SecurityMockMvcRequestPostProcessors.user() 또는
 * @WithMockUser 를 사용하거나 이 클래스의 정적 팩토리로 CustomUser 를 생성해 사용한다.
 */
public class ControllerTestSupport {

    public static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final UUID TEST_ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    public static CustomUser mockUser() {
        return new CustomUser(TEST_USER_ID, "testuser", "Password1!", UserRole.USER, true);
    }

    public static CustomUser mockAdmin() {
        return new CustomUser(TEST_ADMIN_ID, "adminuser", "Password1!", UserRole.ADMIN, true);
    }

    public static CustomUser mockManager() {
        return new CustomUser(
            UUID.fromString("00000000-0000-0000-0000-000000000003"),
            "manageruser", "Password1!", UserRole.MANAGER, true
        );
    }

    /**
     * SecurityContextHolder 에 인증 정보를 직접 주입한다.
     * @WithMockUser 는 CustomUser 타입을 지원하지 않으므로 수동으로 설정한다.
     */
    public static void setSecurityContext(CustomUser customUser) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(customUser, null, customUser.getAuthorities());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    public static void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
}
