# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 절대 원칙 — 추측 금지, 동작 검증 필수

**이 원칙은 다른 모든 가이드라인에 우선합니다.**

- "아마도 stale closure일 것이다", "React StrictMode 이중 호출 때문일 것이다", "이 race condition 때문일 것이다" 같은 **추측 기반 수정 절대 금지**. 가설을 세웠다면 코드·console.log·실제 동작으로 **반드시 검증한 뒤** 수정하세요.
- 빌드/타입체크 통과 = "동작 검증 완료" 가 아닙니다. 실제 브라우저에서 기능이 동작하는지는 별도로 확인해야 합니다.
- 실시간/WebSocket/STOMP 버그에서 프론트만 보고 결론 내지 마세요. **백엔드 broadcast·Redis 직렬화·서버 로그를 먼저 확인**하세요. 새로고침 후에도 보이는 데이터는 백엔드/DB에서 온 것입니다.
- 원인을 코드 정독만으로 100% 확정하지 못했다면 **console.log를 추가해서 실제 데이터 흐름을 검증**한 뒤 수정하세요. "일단 이렇게 고쳐보고 안 되면 다시"는 허용되지 않습니다.
- 검증하지 못했다면 "검증되지 않은 가설"이라고 정직하게 보고하세요. "이 수정으로 고쳐질 것이다"라고 단언 금지.

## Commands

```bash
# 개발 서버 실행 (백엔드 localhost:8080 프록시 포함)
npm run dev

# 타입 체크 + 프로덕션 빌드
npm run build

# ESLint 검사
npm run lint

# 빌드 결과물 미리보기
npm run preview
```

테스트 프레임워크는 현재 설정되어 있지 않습니다.

## Architecture

### 라우팅 구조

`src/App.tsx`에서 React Router v7로 라우트를 정의합니다:

| 경로       | 컴포넌트        | 접근 제어                            |
| ---------- | --------------- | ------------------------------------ |
| `/`        | `HomePage`      | 공개                                 |
| `/login`   | `LoginPage`     | 공개 (인증 시 `/app`으로 리다이렉트) |
| `/sign-up` | `SignUpPage`    | 공개                                 |
| `/app`     | `DashboardPage` | `ProtectedRoute` 필요                |

### 인증 흐름

- **토큰 저장**: `src/lib/authStorage.ts` — `localStorage`의 `sagwim_access_token` 키
- **전역 상태**: `src/context/AuthContext.tsx` — `AuthProvider`가 최상위에서 `token`, `isAuthenticated`, `login()`, `logout()`을 제공
- **보호된 라우트**: `src/components/ProtectedRoute.tsx` — 미인증 시 `/login`으로 리다이렉트하며 `state.from`에 원래 경로를 저장
- **로그인 응답**: 서버는 토큰을 응답 본문이 아닌 `Authorization` 헤더로 반환

### API 레이어

`src/api/` 아래에 두 모듈이 있습니다:

- `authApi.ts` — 인증 토큰 불필요 (`/auth/sign-in`, `/auth/sign-up`)
- `userApi.ts` — 모든 요청에 `Authorization` 헤더 필요 (`/users`, `/users/me`)

`VITE_API_BASE_URL` 환경변수가 없으면 `/api/v1`을 기본값으로 사용합니다. 개발 시 Vite가 `/api` 경로를 `http://localhost:8080`으로 프록시합니다.

### 스타일링

CSS는 `src/styles/`에 목적별로 분리되어 `main.tsx`에서 순서대로 임포트됩니다:

- `variables.css` — 디자인 토큰 (색상, 간격, 그림자, 반경, 전환)
- `base.css` — 리셋 및 전역 기본값
- `components.css` — 공유 컴포넌트 스타일
- `layout.css` — 레이아웃 유틸리티
- `animations.css` — 키프레임 애니메이션
- `theme.css` — 다크/라이트 테마 전환

페이지별 스타일은 CSS Modules (`*.module.css`)를 사용합니다. 테마는 `<html data-theme="dark|light">` 속성으로 전환되며, 선택은 `localStorage`의 `sagwim_theme_mode`에 저장됩니다.

### 타입 정의

- `src/types/auth.ts` — 로그인/회원가입 요청 타입
- `src/types/user.ts` — 사용자 응답, 페이지네이션(`PageResponse<T>`), 수정 요청 타입

### 비밀번호 유효성 검사

`src/utils/passwordRules.ts`에 규칙이 정의됩니다 (8자 이상, 소문자, 대문자, 특수문자). `PasswordChecklist` 컴포넌트가 이 규칙을 실시간으로 UI에 표시합니다.

## GIT

### GIT COMMIT

COMMIT 진행 시 한글로 커밋해야하며, "Co-Authored-By:~" 는 작성하지 말것.
