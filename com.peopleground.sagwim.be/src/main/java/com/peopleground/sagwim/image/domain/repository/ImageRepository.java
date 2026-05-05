package com.peopleground.sagwim.image.domain.repository;

import com.peopleground.sagwim.image.domain.entity.Image;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ImageRepository {

    Image save(Image image);

    Optional<Image> findById(Long id);

    List<Image> findByTarget(ImageTargetType targetType, String targetId);

    Map<String, List<String>> findUrlsByTargetIds(ImageTargetType targetType, List<String> targetIds);

    int countByTargetTypeAndTargetId(ImageTargetType targetType, String targetId);

    void deleteById(Long id);

    Page<Image> findAllForAdmin(Pageable pageable);
}
