# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 🚨 절대 원칙 — 추측 금지, 동작 검증 필수

**이 원칙은 다른 모든 가이드라인에 우선합니다.**

- "아마도 X 때문일 것이다", "Y가 원인일 것 같다" 같은 **추측 기반 수정 절대 금지**. 가설을 세웠다면 코드·로그·실제 동작으로 **반드시 검증한 뒤** 수정하세요.
- 빌드 통과 = "동작 검증 완료" 가 아닙니다. 빌드는 타입 정합성만 확인합니다. 실제 기능이 동작하는지는 별도로 확인해야 합니다.
- 회귀/실시간/네트워크 버그는 **에러 메시지·서버 로그·외부 의존성(Redis, DB, MQ, WebSocket 직렬화)을 가장 먼저 확인**하세요. 코드 변경 추적은 그 다음입니다.
- 한쪽(예: 프론트)만 보고 결론 내지 마세요. 백엔드/DB/Redis/직렬화 등 반대편도 항상 함께 의심하세요.
- 새로고침 후에도 보이는 데이터는 **DB/백엔드 쿼리에서 온 것**입니다. 실시간 핸들러를 의심하기 전에 백엔드 쿼리부터 확인하세요.
- 검증하지 못했다면 "검증되지 않은 가설"이라고 정직하게 보고하세요. "이 수정으로 고쳐질 것이다"라고 단언 금지.

## 명령어

```bash
# 빌드
./gradlew build

# 애플리케이션 실행 (포트 8080)
./gradlew bootRun

# 전체 테스트 실행
./gradlew test

# 단일 테스트 클래스 실행
./gradlew test --tests "com.peopleground.sagwim.전체경로.테스트클래스명"

# PostgreSQL 데이터베이스 시작 (앱 실행 전 필수)
cd database && docker-compose up
```

## 아키텍처

**Spring Boot 4.0.4 / Java 25** 기반의 "sagwim" 애플리케이션 REST API 백엔드입니다.

### 도메인 구조

각 도메인은 4개 레이어의 **클린 아키텍처**를 따릅니다:

```
domain/
  entity/        ← JPA 엔티티 + 도메인 인터페이스 (repository 포트)
  repository/    ← Repository 인터페이스 (포트)
application/
  service/       ← 비즈니스 로직, 도메인 인터페이스에만 의존
infrastructure/
  repository/    ← JPA 어댑터: XxxRepositoryImpl (도메인 포트) + XxxJpaRepository (Spring Data) + XxxQueryRepository (QueryDSL)
  client/        ← 외부 API 클라이언트 (예: GoogleGeocodingClient)
presentation/
  controller/    ← REST 컨트롤러
  dto/request/   ← 검증이 포함된 요청 레코드
  dto/response/  ← 응답 레코드
```

현재 도메인: `user`, `content`. 공통 관심사는 `global/` 하위에 위치합니다.

### Global 레이어

- `global/configure/` — Spring 빈 설정: CORS (`localhost:5173` 허용), QueryDSL `JPAQueryFactory`, JPA Auditing
- `global/security/` — Stateless JWT 인증; `AuthenticationFilter` (로그인 → 토큰 발급), `JwtAuthenticationFilter` (Bearer 토큰 검증)
- `global/entity/BaseEntity` — 모든 엔티티 공통 필드: `createdDate`, `lastModifiedDate`, `deletedDate` (소프트 삭제 패턴)
- `global/exception/` — `ErrorCode` 인터페이스, `AppException`, `GlobalExceptionHandler` (@RestControllerAdvice)
- `global/dto/PageResponse` — 표준 페이지네이션 래퍼

### 주요 기술 선택

- **QueryDSL 7.1**: 복잡한 쿼리는 Spring Data JPA와 함께 `XxxQueryRepository` 클래스에서 사용
- **PostGIS**: 사용자 위치를 `GEOGRAPHY(Point, 4326)` (WGS84)으로 저장; Hibernate Spatial을 통해 JTS `Point` 사용
- **Geocoding**: 주소 문자열 → Google Geocoding API → `Point` 좌표 변환, 회원가입 시 동기 호출
- **DDL**: `spring.jpa.hibernate.ddl-auto: none` — Flyway가 스키마를 완전히 관리 (Hibernate DDL 비활성화)
- **Flyway**: `classpath:db/migration` 위치, V1(스키마) + V2(개발용 시드 데이터). baseline-on-migrate 미사용 — 빈 DB에서 V1부터 순차 실행
- **P6Spy**: 개발 환경에서 SQL 쿼리 로깅 항상 활성화
- **JWT**: HS256, 만료 30일, 시크릿 키는 `.env`에서 로드

### API

기본 경로: `/api/v1`

- `/auth/sign-up`, `/auth/sign-in` — 공개 엔드포인트
- `/users/**` — 인증 필요; `/users/me` (GET/PATCH/DELETE), `/users` (페이지네이션 목록)
- `/contents/**` — 인증 필요; POST로 생성, GET으로 페이지네이션 목록 조회

### 데이터베이스 설정

Docker가 필요합니다. 저장소 루트에서:

```bash
cd database && docker-compose up
```

포트 `5432`에 PostgreSQL 16 + PostGIS 3.4를 생성합니다 (db: `userdb`, user: `user`, password: `password`).

### 환경 변수

프로젝트 루트에 `.env` 파일 생성 (gitignore 적용됨):

```
POSTGRES_DB=userdb
POSTGRES_USER=user
POSTGRES_PASSWORD=password
JWT_SECRET=<hs256-시크릿>
GOOGLE_MAPS_API_KEY=<키>
```
