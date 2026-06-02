package com.peopleground.sagwim.user.infrastructure.repository;

import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserJpaRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    List<User> findByUsernameIn(Collection<String> usernames);

    boolean existsByUsername(String username);

    boolean existsByNickname(String nickname);

    Optional<User> findByUserEmail(String email);

    boolean existsByUserEmail(String email);

    Optional<User> findByProviderAndProviderId(OAuthProvider provider, String providerId);
}
