package com.peopleground.sagwim.notification.application.service;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class NotificationSseEmitterService {

    private static final long EMITTER_TIMEOUT_MS = 300_000L;
    private static final long HEARTBEAT_INTERVAL_SEC = 30L;

    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final Map<UUID, ScheduledFuture<?>> heartbeats = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public SseEmitter connect(UUID userId, long initialCount) {
        removeEmitter(userId);

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> removeEmitter(userId));
        emitter.onTimeout(() -> removeEmitter(userId));
        emitter.onError(e -> removeEmitter(userId));

        scheduleHeartbeat(userId, emitter);
        sendCount(emitter, initialCount);

        return emitter;
    }

    public void sendToUser(UUID userId, long count) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) return;
        sendCount(emitter, count);
    }

    private void sendCount(SseEmitter emitter, long count) {
        try {
            emitter.send(
                SseEmitter.event()
                    .name("unread-count")
                    .data("{\"count\":" + count + "}")
            );
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
    }

    private void scheduleHeartbeat(UUID userId, SseEmitter emitter) {
        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(
            () -> {
                if (!emitters.containsKey(userId)) return;
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            },
            HEARTBEAT_INTERVAL_SEC,
            HEARTBEAT_INTERVAL_SEC,
            TimeUnit.SECONDS
        );
        heartbeats.put(userId, future);
    }

    private void removeEmitter(UUID userId) {
        emitters.remove(userId);
        ScheduledFuture<?> future = heartbeats.remove(userId);
        if (future != null) future.cancel(false);
    }
}
