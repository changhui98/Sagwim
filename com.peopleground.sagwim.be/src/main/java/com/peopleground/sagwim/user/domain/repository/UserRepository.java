package com.peopleground.sagwim.user.domain.repository;

import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepository {

    Optional<User> findById(UUID id);

    Optional<User> findByUsername(String username);

    List<User> findByUsernameIn(Collection<String> usernames);

    boolean existsByUsername(String username);

    boolean existsByNickname(String nickname);

    User save(User user);

    Page<User> findAllUsers(Pageable pageable);

    Page<User> findAllUserForAdmin(Pageable pageable);

    User updateProfile(User updateUser);

    Optional<User> findByUserEmail(String email);

    boolean existsByUserEmail(String email);

    Map<String, Long> countMonthlySignups(LocalDateTime windowStart);

    Map<String, String> findNicknamesByUsernames(Collection<String> usernames);

    Optional<User> findByProviderAndProviderId(OAuthProvider provider, String providerId);

    Page<User> searchByKeyword(String keyword, Pageable pageable);
}
