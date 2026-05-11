# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 절대 원칙 — 추측 금지, 동작 검증 필수

**이 원칙은 다른 모든 가이드라인에 우선합니다.**

- "아마도 라이프사이클 문제일 것이다", "이 race condition 때문일 것이다" 같은 **추측 기반 수정 절대 금지**. 가설을 세웠다면 로그·실제 동작으로 **반드시 검증한 뒤** 수정하세요.
- 빌드/타입체크 통과 = "동작 검증 완료"가 아닙니다. **iOS 시뮬레이터 또는 실기기에서 실제 화면이 동작하는지** 별도로 확인해야 합니다.
- 실시간/WebSocket/STOMP 버그에서 프론트만 보고 결론 내지 마세요. **백엔드 broadcast·Redis 직렬화·서버 로그를 먼저 확인**하세요.
- 원인을 코드 정독만으로 100% 확정하지 못했다면 **console.log를 추가해서 실제 데이터 흐름을 검증**한 뒤 수정하세요.
- 검증하지 못했다면 "검증되지 않은 가설"이라고 정직하게 보고하세요. "이 수정으로 고쳐질 것이다"라고 단언 금지.

## Commands

```bash
# Metro 번들러 시작 (Expo Dev Client)
npx expo start

# iOS 시뮬레이터 빌드 및 실행
npx expo run:ios

# 실기기 빌드 및 실행
npx expo run:ios --device

# iOS prebuild (네이티브 코드 재생성)
npx expo prebuild --platform ios

# ESLint 검사
npm run lint

# 부팅된 시뮬레이터 목록 확인
xcrun simctl list devices booted
```

테스트 프레임워크는 현재 설정되어 있지 않습니다.

## Architecture

스캐폴딩 직후 상태입니다. 본격적인 아키텍처 (내비게이션, 상태 관리, API 레이어, 인증 등)는 향후 채워질 예정입니다.

### 현재 스택

- **프레임워크**: React Native + Expo (prebuild + Dev Client)
- **언어**: TypeScript
- **라우팅**: expo-router (파일 기반, `app/` 디렉토리)
- **아키텍처 플래그**: New Architecture 활성화 (`newArchEnabled: true`)
- **스타일**: 미정 (향후 결정)

### 앱 식별자

- **iOS Bundle Identifier**: `com.peopleground.sagwim.app`
- **딥링크 Scheme**: `sagwim://`

### API 레이어

- **HTTP 클라이언트**: `axios` (`src/lib/apiClient.ts`)
- **토큰 저장**: `expo-secure-store` Keychain/Keystore (`src/lib/secureStore.ts`, 키: `sagwim_access_token`)
- **환경변수**: `EXPO_PUBLIC_API_BASE_URL` — `.env` 파일 설정 필요 (`.env.example` 참고)
- **Authorization 헤더**: Request 인터셉터가 SecureStore에서 토큰을 읽어 자동 부착
- **401 처리**: Response 인터셉터가 토큰 삭제만 수행, 화면 전환은 AuthContext가 담당 (미구현)

### 실기기 백엔드 접근

실기기에서는 `localhost`가 Mac을 가리키지 않으므로 아래 방법 중 하나를 사용합니다.

#### 옵션 1 — LAN IP (권장 개발 환경)

```bash
# Mac의 LAN IP 확인
ifconfig | grep "inet " | grep -v 127.0.0.1
```

확인한 IP를 `.env`에 적용:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8080/api/v1
```

**주의**: HTTP 평문 통신이므로 iOS ATS(App Transport Security)가 차단할 수 있습니다.
개발 중에는 `ios/SAGWIM/Info.plist`에 아래를 추가해 ATS를 임시 허용합니다.
운영 빌드에서는 반드시 제거하고 HTTPS를 사용하세요.

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

#### 옵션 2 — ngrok (HTTPS, ATS 무관)

```bash
# ngrok 설치 후 BE 포트 터널링
ngrok http 8080
```

발급된 `https://xxxx.ngrok-free.app` URL을 `.env`에 적용:

```
EXPO_PUBLIC_API_BASE_URL=https://xxxx.ngrok-free.app/api/v1
```

HTTPS이므로 Info.plist 수정 불필요. ngrok 재시작 시 URL이 바뀌므로 `.env` 재갱신 필요.

#### 옵션 3 — 운영 서버

```
EXPO_PUBLIC_API_BASE_URL=https://sagwim.com/api/v1
```

### 향후 추가 예정

- Navigation (expo-router 확장)
- AuthContext (토큰 소실 감지 → 로그인 화면 전환)
- STOMP/SockJS 채팅 연동
- 푸시 알림

## GIT

### GIT COMMIT

COMMIT 진행 시 한글로 커밋해야하며, "Co-Authored-By:~" 는 작성하지 말것.
