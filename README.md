# 사귐(SAGWIM)

## 🌈 Project Overview

사귐은 지역 기반으로 모임을 찾고, 게시판에서 일상을 공유하고, 실시간 채팅으로 소통할 수 있는 소셜 커뮤니티 서비스입니다.

해당 저장소는 사귐 서비스를 구성하는 **백엔드 API 서버**, **웹 프론트엔드**, **모바일 앱**을 한 곳에서 관리하는 모노레포입니다.

설계 단계에서 도메인이 빠르게 늘어날 것을 예상해 유지보수성과 확장성을 우선 순위로 잡았고, 백엔드에는 DDD 기반 4계층 아키텍처를 적용했습니다.

인증/인가는 Spring Security와 JWT 토큰 기반 인증 방식을 사용했으며, 조회 성능이 중요한 모임·게시판 도메인에는 JPA와 QueryDSL을 조합해 동적 쿼리를 구성했습니다.

위치 기반 검색이 필요한 영역에는 PostgreSQL의 PostGIS 확장을 도입했고, 조회수·캐시·인기 태그 등 트래픽이 몰리는 데이터는 Redis로 분리했습니다.

웹과 모바일은 동일한 백엔드 API를 공유하며, 디자인 토큰을 함께 관리해 플랫폼 간 일관성을 유지하도록 구성했습니다.

**주요 목표**

- Spring Boot 기반 REST API 설계
- Spring Security + JWT 인증/인가 구조 구현
- DDD 기반 4계층 아키텍처 적용
- JPA + QueryDSL 을 활용한 데이터 조회 구조 설계
- PostGIS 기반 위치 검색 및 거리 기반 정렬 구현
- WebSocket + STOMP 기반 실시간 채팅 구조 설계
- Redis를 활용한 조회수·캐시 분리 및 동기화 배치 설계
- 웹(React) · 모바일(React Native + Expo)이 단일 백엔드 API를 공유하는 멀티 플랫폼 클라이언트 구조

**바로 가기**

1. [🗂️ Repository Structure](#-repository-structure)
2. [⚙️ Tech Stack](#-tech-stack)
3. [🧩 프로젝트 실행 방법](#-프로젝트-실행-방법)
4. [🔧 Backend Package Structure](#-backend-package-structure)
5. [🔑 인증 / 인가](#-인증--인가)
6. [💬 실시간 채팅](#-실시간-채팅)
7. [📒 API & PRD Docs](#-api--prd-docs)
8. [👤 AI & Reference](#-ai--reference)

- - -

<br>

## 🗂️ Repository Structure

모노레포는 세 개의 워크스페이스로 구성됩니다.

```
com.peopleground.sagwim
├── com.peopleground.sagwim.be     # Spring Boot 백엔드 API 서버
├── com.peopleground.sagwim.fe     # React 웹 프론트엔드 (Vite)
├── com.peopleground.sagwim.app    # React Native 모바일 앱 (Expo)
├── database                       # PostgreSQL + PostGIS docker-compose
├── monitoring                     # Prometheus / Grafana 설정
├── scripts                        # 배포 · 운영 스크립트
├── docker-compose.yml             # 운영 환경 컴포즈
└── docker-compose.dev.yml         # 개발 환경 컴포즈
```

| 워크스페이스 | 역할 | 주요 기술 |
| --- | --- | --- |
| `com.peopleground.sagwim.be` | REST API · 인증 · 실시간 채팅 서버 | Spring Boot 4.0.4 / Java 25 / PostgreSQL + PostGIS / Redis |
| `com.peopleground.sagwim.fe` | 웹 클라이언트 (사용자 + 관리자 대시보드) | React 19 / Vite / TypeScript |
| `com.peopleground.sagwim.app` | iOS · Android 모바일 앱 | React Native / Expo / expo-router |

- - -

<br>

## ⚙️ Tech Stack

### Backend (`com.peopleground.sagwim.be`)
- Java 25
- Spring Boot 4.0.4
- Spring Security
- Spring Data JPA
- QueryDSL 7.1
- PostgreSQL 16 + PostGIS 3.4
- Redis
- WebSocket + STOMP
- Flyway
- JWT (jjwt 0.12.x)
- Swagger (springdoc-openapi)
- Prometheus + Grafana (운영 모니터링)

### Frontend (`com.peopleground.sagwim.fe`)
- React 19
- TypeScript
- Vite
- React Router 7
- @stomp/stompjs + sockjs-client (실시간 채팅)
- Recharts (관리자 통계)
- Nginx (배포)

### Mobile (`com.peopleground.sagwim.app`)
- React Native 0.81
- Expo SDK 54
- expo-router (파일 기반 라우팅)
- expo-secure-store (토큰 보관: iOS Keychain / Android Keystore)
- axios

### 인프라 / 배포
- Docker / Docker Compose
- Nginx (리버스 프록시 + 무중단 reload)
- GitHub Actions (CI/CD)
- Blue-Green 무중단 배포

- - -

<br>

## 🧩 프로젝트 실행 방법

### 사전 준비
프로젝트 루트에 `.env` 파일을 만들고 아래 값을 채워 넣습니다. (`.env.example` 참고)

```
POSTGRES_DB=userdb
POSTGRES_USER=user
POSTGRES_PASSWORD=password
JWT_SECRET=<HS256 시크릿 키>
GOOGLE_MAPS_API_KEY=<지오코딩 API 키>
```

### DB 실행
PostgreSQL + PostGIS는 Docker로 띄웁니다.
```
cd database && docker-compose up
```

### 백엔드 실행
```
cd com.peopleground.sagwim.be

./gradlew bootRun


./gradlew build
java -jar build/libs/*.jar
```

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 웹 프론트엔드 실행
```
cd com.peopleground.sagwim.fe

npm install
npm run dev      # 개발 서버 (Vite)
npm run build    # 프로덕션 빌드
```

기본 개발 서버 주소: `http://localhost:5173`

### 모바일 앱 실행
```
cd com.peopleground.sagwim.app

npm install
npm run ios       # iOS 시뮬레이터
npm run android   # Android 에뮬레이터
npm start         # Expo Dev Server
```

### 통합 실행 (Docker Compose)
운영 환경과 동일한 구성으로 한 번에 띄우려면 루트의 docker-compose를 사용합니다.
```
docker-compose -f docker-compose.dev.yml up    # 개발 환경
docker-compose up                              # 운영 환경
```

### 초기 데이터
Flyway 마이그레이션(V1: 스키마, V2: 시드)이 빈 DB에 자동 적용됩니다. 개발용 시드 계정은 V2 마이그레이션에 포함되어 있습니다.

- - -

<br>

## 🔧 Backend Package Structure
백엔드는 Domain Driven Design(DDD) 기반 4계층 아키텍처를 적용하여 설계하였습니다.

도메인 중심으로 패키지를 분리하고, 각 계층의 역할을 명확히 구분하여 비즈니스 로직의 응집도를 높이고 기술 의존성을 분리하는 것을 목표로 잡았습니다.

DDD 구조를 적용함으로써 다음과 같은 장점을 얻을 수 있습니다.
- **비즈니스 로직을 도메인 중심으로 관리** 가능
- **기술 구현(JPA, QueryDSL, Redis 등)과 도메인 로직 분리**
- 서비스 확장 시 **변경 영향 범위 최소화**

프로젝트는 Presentation → Application → Domain → Infrastructure 의 4계층 구조로 구성했습니다.

| Layer | 역할 |
| --- | --- |
| Presentation | Controller, Request/Response DTO |
| Application | Service, 트랜잭션 관리 |
| Domain | Entity, Repository Interface, ErrorCode |
| Infrastructure | JPA, QueryDSL, Repository 구현, 외부 API 클라이언트 |

### Repository 설계
Repository는 도메인 의존성을 낮추기 위해 역할별로 분리했습니다.

**<u>Domain Repository</u>**
```
# 도메인 계층에서 필요한 기능만 인터페이스로 정의
GroupRepository
```

<u>**Infrastructure Repository**</u>
```
GroupJpaRepository     # Spring Data JPA 기반 기본 CRUD 및 단순 조회
GroupQueryRepository   # 동적 조건 조회, 페이징, 위치 기반 검색 등 복잡한 조회
GroupRepositoryImpl    # 도메인 Repository 인터페이스를 구현하며 JPA, QueryDSL을 조합하여 실제 데이터 접근을 수행
```

#### 이렇게 분리한 이유
> - 도메인 계층이 Spring Data JPA에 직접 의존하지 않도록 하기 위해
> - 기술 구현(JPA/QueryDSL)을 인프라 계층으로 분리하기 위해
> - 단순 CRUD와 복잡 조회의 책임을 나누기 위해
> - 데이터 접근 기술이 변경되더라도 Domain 계층에 영향을 주지 않도록 하기 위해
> - 조회 로직(QueryDSL) 변경 시 Service나 Domain 로직 수정 없이 Repository 구현만 수정하도록 하기 위해
> - 복잡한 쿼리를 별도 Repository로 분리하여 코드 가독성과 유지보수성을 높이기 위해


### Package

```
com.peopleground.sagwim.be/src/main/java
└── com
    └── peopleground
        └── sagwim
            ├── Application.java
            ├── user           # 회원, 인증, 프로필
            ├── group          # 모임, 가입신청, 멤버
            ├── content        # 게시글, 조회수
            ├── comment        # 댓글, 대댓글
            ├── chat           # 실시간 채팅(WebSocket + STOMP)
            ├── notification   # 알림
            ├── like           # 좋아요
            ├── schedule       # 모임 일정
            ├── inquiry        # 문의
            ├── report         # 신고
            ├── tag            # 태그
            ├── place          # 장소(위치 기반)
            ├── image          # 이미지 업로드
            ├── deletelog      # 삭제 이력
            └── global         # 공통 설정 · 보안 · 예외 · Redis · 감사 로그
```

각 도메인은 동일한 4계층 구조를 가집니다. 예시로 `group` 도메인은 아래와 같이 구성됩니다.

```
group
├── application
│   └── service
│       ├── GroupService.java
│       └── AdminGroupService.java
├── domain
│   ├── GroupErrorCode.java
│   ├── entity
│   │   ├── Group.java
│   │   ├── GroupMember.java
│   │   ├── GroupJoinRequest.java
│   │   ├── GroupJoinQuestion.java
│   │   ├── GroupCategory.java
│   │   ├── GroupStatus.java
│   │   └── ...
│   └── repository
│       ├── GroupRepository.java
│       ├── GroupMemberRepository.java
│       ├── GroupJoinRequestRepository.java
│       └── GroupJoinQuestionRepository.java
├── infrastructure
│   └── repository
│       ├── GroupJpaRepository.java
│       ├── GroupQueryRepository.java
│       ├── GroupRepositoryImpl.java
│       ├── GroupMemberJpaRepository.java
│       ├── GroupMemberRepositoryImpl.java
│       └── ...
└── presentation
    ├── controller
    │   ├── GroupController.java
    │   └── AdminGroupController.java
    └── dto
        ├── request
        │   ├── GroupCreateRequest.java
        │   ├── GroupUpdateRequest.java
        │   └── GroupJoinRequest.java
        └── response
            ├── GroupResponse.java
            ├── GroupDetailResponse.java
            └── GroupMemberResponse.java
```

### Global 패키지
공통 관심사는 `global/` 하위에 분리했습니다.

| 디렉토리 | 역할 |
| --- | --- |
| `configure` | Spring 빈 설정 (CORS, QueryDSL, JPA Auditing 등) |
| `security` | Spring Security · JWT 필터 · 인증 필터 |
| `redis` | Redis 직렬화, 조회수 캐시, 토큰 블랙리스트 |
| `entity` | `BaseEntity`, `AuditingEntity` (소프트 삭제, 감사 컬럼) |
| `exception` | 전역 예외 처리, `ErrorCode`, `AppException` |
| `persistence` | PostgreSQL 전용 HQL 함수 등록 (`FunctionContributor`) |
| `log` | 가입 로그, 에러 로그 파일 기록 |

- - -

<br>

## 🔑 인증 / 인가
- JWT 기반 Stateless 인증 방식을 사용합니다.
- Spring Security의 인증 흐름을 활용하기 위해 로그인 요청을 Controller가 아닌 Filter에서 처리하도록 설계했습니다.
- 로그아웃 토큰은 Redis 블랙리스트로 관리하여 만료 전 토큰 무효화를 지원합니다.
- 웹은 메모리 + HttpOnly 쿠키, 모바일은 OS 보안 저장소(iOS Keychain / Android Keystore)에 토큰을 보관합니다.

### JWT를 선택한 이유

JWT는 서버에 세션을 저장하지 않는 Stateless 인증 방식이라 서버 확장에 유리하고, Authorization 헤더 기반으로 전달되기 때문에 REST API와 모바일 클라이언트(React Native) 환경에서 인증 정보를 일관되게 전달할 수 있어서 선택했습니다.

### 인증 API
| 기능 | Method | Endpoint |
| --- | --- | --- |
| 회원가입 | POST | /api/v1/auth/sign-up |
| 로그인 | POST | /api/v1/auth/sign-in |
| 로그아웃 | POST | /api/v1/auth/sign-out |

### 인증 처리 흐름

**회원가입**
```
Client (Web / Mobile)
 ↓
AuthController
 ↓
AuthService
 ↓
(주소 → Google Geocoding API → Point 좌표 변환)
 ↓
MemberRepository
 ↓
DB (PostGIS Point 저장)
```

**로그인 (Filter 기반 인증)**
```
Client
 ↓
Security Filter Chain
 ↓
Authentication Filter
 ↓
AuthenticationManager
 ↓
UserDetailsService
 ↓
DB
```

### JWT 인증 흐름
로그인 이후 요청은 JWT 토큰 기반으로 인증됩니다.
```
Client
 ↓
API Request + JWT
 ↓
JWT Filter
 ↓
토큰 검증 (블랙리스트 포함)
 ↓
SecurityContext 인증 저장
 ↓
Controller
```

**인증 과정**

1. 사용자가 로그인하면 서버가 JWT 토큰을 발급합니다.
2. 이후 API 요청 시 HTTP Header에 토큰을 포함합니다.

```
Authorization: Bearer {JWT}
```

3. JWT Filter에서 토큰을 검증합니다. (블랙리스트 검사 포함)
4. 검증이 성공하면 SecurityContext에 인증 정보를 저장합니다.
5. 인증된 사용자로 Controller 로직이 실행됩니다.

### 보안 적용 사항
- Spring Security 기반 인증 처리
- JWT 토큰 기반 Stateless 인증 방식
- 비밀번호 BCryptPasswordEncoder 암호화 저장
- Security Filter Chain을 통한 인증 처리
- Redis 토큰 블랙리스트로 로그아웃 토큰 즉시 무효화
- WebSocket 진입점에 동일한 JWT 인증 인터셉터 적용

- - -

<br>

## 💬 실시간 채팅

WebSocket + STOMP 기반 실시간 채팅을 제공합니다. 웹과 모바일을 모두 지원하기 위해 두 개의 엔드포인트로 분리했습니다.

| 엔드포인트 | 클라이언트 | 비고 |
| --- | --- | --- |
| `/ws-chat` | 웹 (`com.peopleground.sagwim.fe`) | SockJS 호환 |
| `/ws-chat-native` | 모바일 (`com.peopleground.sagwim.app`) | 순수 WebSocket |

두 엔드포인트는 동일한 STOMP 브로커를 공유하므로 비즈니스 로직은 단일 코드 경로로 유지됩니다.

채팅 메시지는 Redis Pub/Sub으로 인스턴스 간 broadcast 되며, `record` 타입 직렬화 이슈를 피하기 위해 채팅 전용 Redis 직렬화기를 분리해 두었습니다.

- - -

<br>

## 📒 API & PRD Docs

[[🍏 CLICK ] Application Programming Interface](./docs/api-docs.md)

[[🍎 CLICK ] Product Requirement Document](./docs/prd.md)

> Swagger UI (백엔드 실행 후): `http://localhost:8080/swagger-ui/index.html`

- - -

<br>

## 👤 AI & Reference
Claude Code (Opus 4.7) | 설계 방향성 확인, 리팩토링 보조, 회귀 진단 가이드

task.cms-api.backend https://github.com/changhui98/task.cms-api.backend | Reference (DDD 4계층 구조 참고)
