package com.peopleground.sagwim.global.log;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class LogFileService {

    private final Path errorLogPath;
    private final Path registrationLogPath;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public LogFileService(@Value("${app.log.dir:./logs}") String logDir) {
        this.errorLogPath = Paths.get(logDir, "error.log");
        this.registrationLogPath = Paths.get(logDir, "registration.log");
    }

    public List<String> getErrorLogs(int page, int size) {
        return readPagedReverse(errorLogPath, page, size);
    }

    public List<String> getRegistrationLogs(int page, int size) {
        return readPagedReverse(registrationLogPath, page, size);
    }

    public long countErrorLogs() {
        return countLines(errorLogPath);
    }

    public long countRegistrationLogs() {
        return countLines(registrationLogPath);
    }

    public SseEmitter stream() {
        SseEmitter emitter = new SseEmitter(0L);
        boolean[] done = {false};
        emitter.onCompletion(() -> done[0] = true);
        emitter.onTimeout(() -> done[0] = true);
        emitter.onError(e -> done[0] = true);

        executor.submit(() -> tailLogs(emitter, done));
        return emitter;
    }

    private void tailLogs(SseEmitter emitter, boolean[] done) {
        long errorPos = fileSize(errorLogPath);
        long regPos = fileSize(registrationLogPath);

        while (!done[0]) {
            try {
                List<String> errorLines = readNewLines(errorLogPath, errorPos);
                if (!errorLines.isEmpty()) {
                    errorPos = fileSize(errorLogPath);
                    for (String line : errorLines) {
                        emitter.send(SseEmitter.event().name("error").data(line));
                    }
                }

                List<String> regLines = readNewLines(registrationLogPath, regPos);
                if (!regLines.isEmpty()) {
                    regPos = fileSize(registrationLogPath);
                    for (String line : regLines) {
                        emitter.send(SseEmitter.event().name("registration").data(line));
                    }
                }

                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                emitter.completeWithError(e);
                return;
            }
        }
        emitter.complete();
    }

    private List<String> readNewLines(Path path, long fromPosition) {
        if (!Files.exists(path)) return List.of();
        List<String> lines = new ArrayList<>();
        try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "r")) {
            long currentSize = raf.length();
            if (currentSize <= fromPosition) return List.of();
            raf.seek(fromPosition);
            byte[] buffer = new byte[(int) (currentSize - fromPosition)];
            raf.readFully(buffer);
            String content = new String(buffer, StandardCharsets.UTF_8);
            for (String line : content.split("\n")) {
                if (!line.isBlank()) lines.add(line.trim());
            }
        } catch (IOException e) {
            // ignore
        }
        return lines;
    }

    private long fileSize(Path path) {
        try {
            return Files.exists(path) ? Files.size(path) : 0L;
        } catch (IOException e) {
            return 0L;
        }
    }

    private List<String> readPagedReverse(Path path, int page, int size) {
        if (!Files.exists(path)) return List.of();
        try {
            List<String> all = Files.readAllLines(path, StandardCharsets.UTF_8)
                .stream()
                .filter(l -> !l.isBlank())
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
            Collections.reverse(all);
            int from = page * size;
            if (from >= all.size()) return List.of();
            return all.subList(from, Math.min(from + size, all.size()));
        } catch (IOException e) {
            return List.of();
        }
    }

    private long countLines(Path path) {
        if (!Files.exists(path)) return 0L;
        try (var lines = Files.lines(path, StandardCharsets.UTF_8)) {
            return lines.filter(l -> !l.isBlank()).count();
        } catch (IOException e) {
            return 0L;
        }
    }
}
