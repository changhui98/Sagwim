package com.peopleground.sagwim.global.log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class LogFileService {

    private static final Pattern STATUS_PATTERN = Pattern.compile("\"status\"\\s*:\\s*(\\d{3})");
    // timestamp 필드에서 날짜 부분(yyyy-MM-dd)을 캡처. Instant.toString() 포맷 기준.
    private static final Pattern TIMESTAMP_DATE_PATTERN = Pattern.compile("\"timestamp\"\\s*:\\s*\"(\\d{4}-\\d{2}-\\d{2})");

    private final Path logDir;
    private final Path errorLogPath;
    private final Path registrationLogPath;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public LogFileService(@Value("${app.log.dir:./logs}") String logDir) {
        this.logDir = Paths.get(logDir);
        this.errorLogPath = Paths.get(logDir, "error.log");
        this.registrationLogPath = Paths.get(logDir, "registration.log");
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    // ─── 기존 API (하위 호환) ───────────────────────────────────────────────

    public List<String> getErrorLogs(int page, int size) {
        return getErrorLogs(LocalDate.now(), LocalDate.now(), "all", page, size);
    }

    public List<String> getRegistrationLogs(int page, int size) {
        return getRegistrationLogs(LocalDate.now(), LocalDate.now(), page, size);
    }

    public long countErrorLogs() {
        return countErrorLogs(LocalDate.now(), LocalDate.now(), "all");
    }

    public long countRegistrationLogs() {
        return countRegistrationLogs(LocalDate.now(), LocalDate.now());
    }

    // ─── 날짜 범위 필터 (registration) ───────────────────────────────────────

    /**
     * from~to 범위의 회원가입 로그를 내림차순(최신 먼저)으로 읽어 페이징 반환.
     *
     * @param from 조회 시작 날짜 (inclusive)
     * @param to   조회 종료 날짜 (inclusive)
     * @param page 0-based 페이지 번호
     * @param size 페이지 크기
     */
    public List<String> getRegistrationLogs(LocalDate from, LocalDate to, int page, int size) {
        List<String> all = collectRegistrationLines(from, to);
        int fromIdx = page * size;
        if (fromIdx >= all.size()) return List.of();
        return all.subList(fromIdx, Math.min(fromIdx + size, all.size()));
    }

    /**
     * from~to 범위의 회원가입 로그 총 건수를 반환.
     */
    public long countRegistrationLogs(LocalDate from, LocalDate to) {
        return collectRegistrationLines(from, to).size();
    }

    // ─── 날짜 범위 + 상태코드 필터 ────────────────────────────────────────────

    /**
     * from~to 범위의 에러 로그를 내림차순(최신 먼저)으로 읽어 페이징 반환.
     *
     * @param from        조회 시작 날짜 (inclusive)
     * @param to          조회 종료 날짜 (inclusive)
     * @param statusGroup "4xx" | "5xx" | "all"
     * @param page        0-based 페이지 번호
     * @param size        페이지 크기
     */
    public List<String> getErrorLogs(LocalDate from, LocalDate to, String statusGroup, int page, int size) {
        List<String> all = collectErrorLines(from, to, statusGroup);
        int fromIdx = page * size;
        if (fromIdx >= all.size()) return List.of();
        return all.subList(fromIdx, Math.min(fromIdx + size, all.size()));
    }

    /**
     * from~to 범위의 에러 로그 총 건수를 반환 (statusGroup 필터 적용).
     */
    public long countErrorLogs(LocalDate from, LocalDate to, String statusGroup) {
        return collectErrorLines(from, to, statusGroup).size();
    }

    // ─── SSE 스트리밍 ─────────────────────────────────────────────────────────

    public SseEmitter stream() {
        SseEmitter emitter = new SseEmitter(0L);
        boolean[] done = {false};
        emitter.onCompletion(() -> done[0] = true);
        emitter.onTimeout(() -> done[0] = true);
        emitter.onError(e -> done[0] = true);

        executor.submit(() -> tailLogs(emitter, done));
        return emitter;
    }

    // ─── private: 날짜 범위 파일 수집 ─────────────────────────────────────────

    /**
     * from~to 범위의 회원가입 로그 라인 목록을 날짜 내림차순(최신 먼저)으로 반환.
     */
    private List<String> collectRegistrationLines(LocalDate from, LocalDate to) {
        List<String> result = new ArrayList<>();
        LocalDate cursor = to;
        while (!cursor.isBefore(from)) {
            List<String> lines = readRegistrationFileForDate(cursor);
            List<String> reversed = new ArrayList<>(lines);
            Collections.reverse(reversed);
            result.addAll(reversed);
            cursor = cursor.minusDays(1);
        }
        return result;
    }

    /**
     * 특정 날짜에 해당하는 회원가입 로그 파일을 읽어 라인 목록 반환.
     * - 오늘이면 registration.log (plain text)
     * - 과거이면 registration.YYYY-MM-DD.log.gz (gzip)
     */
    private List<String> readRegistrationFileForDate(LocalDate date) {
        List<String> lines;
        if (date.equals(LocalDate.now())) {
            lines = readPlainLines(registrationLogPath);
        } else {
            Path gzPath = logDir.resolve("registration." + date + ".log.gz");
            if (!Files.exists(gzPath)) return List.of();
            lines = readGzipLines(gzPath);
        }
        return filterByDate(lines, date);
    }

    /**
     * from~to 범위의 날짜별 파일에서 statusGroup 필터를 적용한 라인 목록을 반환.
     * 날짜 내림차순(최신 먼저)으로 합산.
     */
    private List<String> collectErrorLines(LocalDate from, LocalDate to, String statusGroup) {
        List<String> result = new ArrayList<>();

        // to → from 방향으로 날짜 내림차순 순회
        LocalDate cursor = to;
        while (!cursor.isBefore(from)) {
            List<String> lines = readErrorFileForDate(cursor);
            // 필터 적용 후 라인 단위로 역순(최신 라인 먼저) 추가
            List<String> filtered = applyStatusFilter(lines, statusGroup);
            Collections.reverse(filtered);
            result.addAll(filtered);
            cursor = cursor.minusDays(1);
        }

        return result;
    }

    /**
     * 특정 날짜에 해당하는 에러 로그 파일을 읽어 라인 목록 반환.
     * - 오늘이면 error.log (plain text)
     * - 과거이면 error.YYYY-MM-DD.log.gz (gzip)
     * - 파일이 없으면 빈 리스트 반환 (조용히 스킵)
     */
    private List<String> readErrorFileForDate(LocalDate date) {
        List<String> lines;
        if (date.equals(LocalDate.now())) {
            lines = readPlainLines(errorLogPath);
        } else {
            Path gzPath = logDir.resolve("error." + date + ".log.gz");
            if (!Files.exists(gzPath)) return List.of();
            lines = readGzipLines(gzPath);
        }
        return filterByDate(lines, date);
    }

    /**
     * plain text 파일을 라인 단위로 읽기 (메모리 스트리밍).
     */
    private List<String> readPlainLines(Path path) {
        if (!Files.exists(path)) return List.of();
        List<String> lines = new ArrayList<>();
        try (var stream = Files.lines(path, StandardCharsets.UTF_8)) {
            stream.filter(l -> !l.isBlank()).forEach(lines::add);
        } catch (IOException e) {
            // 파일 접근 실패 시 조용히 스킵
        }
        return lines;
    }

    /**
     * .log.gz 파일을 GZIPInputStream으로 라인 단위 스트리밍 읽기.
     * 파일 전체를 메모리에 올리지 않는다.
     */
    private List<String> readGzipLines(Path path) {
        List<String> lines = new ArrayList<>();
        try (var gzipStream = new GZIPInputStream(Files.newInputStream(path));
             var reader = new BufferedReader(new InputStreamReader(gzipStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) lines.add(line.trim());
            }
        } catch (IOException e) {
            // 파일 손상 또는 접근 실패 시 조용히 스킵
        }
        return lines;
    }

    /**
     * statusGroup 필터를 적용하여 해당 라인만 반환.
     * "4xx": 400~499, "5xx": 500~599, "all": 전체 통과
     */
    private List<String> applyStatusFilter(List<String> lines, String statusGroup) {
        if ("all".equalsIgnoreCase(statusGroup)) return new ArrayList<>(lines);
        return lines.stream()
            .filter(line -> matchesStatusGroup(line, statusGroup))
            .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    private List<String> filterByDate(List<String> lines, LocalDate date) {
        String dateStr = date.toString(); // "2026-05-25"
        return lines.stream()
            .filter(line -> {
                Matcher m = TIMESTAMP_DATE_PATTERN.matcher(line);
                return m.find() && m.group(1).equals(dateStr);
            })
            .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    private boolean matchesStatusGroup(String line, String statusGroup) {
        Matcher m = STATUS_PATTERN.matcher(line);
        if (!m.find()) return false;
        int status = Integer.parseInt(m.group(1));
        return switch (statusGroup.toLowerCase()) {
            case "4xx" -> status >= 400 && status <= 499;
            case "5xx" -> status >= 500 && status <= 599;
            default -> true;
        };
    }

    // ─── private: SSE tail ────────────────────────────────────────────────────

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

    // ─── private: 기존 유틸 (registration, 하위 호환) ─────────────────────────

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
