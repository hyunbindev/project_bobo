# BOBO CLAN

PUBG BOBO 클랜의 경기 기록과 클랜원들의 성장을 함께 확인하는 웹 서비스입니다.
PUBG API로 경기 데이터를 수집하고, Discord 봇을 통해 우승 소식과 전적 페이지를 연결합니다.

**홈페이지: [www.boboclan.win](https://www.boboclan.win)**

## 주요 기능

### 클랜 전적

- 클랜원들이 함께 출전한 경기 목록과 경기 상세 조회
- 로스터의 순위, 킬, 대미지, 기절, 소생 기록 확인
- 참여자별 상세 활동과 팀 대미지 비중 확인

### 클랜원 팀 구성 기록

- 함께한 경기 수, 치킨 횟수, 승률 집계
- 이번 경기의 킬·대미지·순위를 이전 경기 평균과 비교
- 같은 멤버들이 함께한 경기 목록을 페이지별로 조회
- 선택된 클랜원이 모두 같은 팀으로 참여한 경기를 집계하며, 다른 팀원이 추가된 경기도 포함

### 개인 전적

- 최근 경기의 대미지·킬·순위 추이
- 개인 최고 대미지, 최다 킬, 최장 거리 킬, 최다 소생 기록
- 클랜원과 함께한 최근 경기 조회

### 주간 랭킹

- 평균 킬·대미지·기절을 반영한 BOBOKING 종합 순위
- 대미지, 소생, 헤드샷 등 부문별 랭킹
- 한국 시간 기준 월요일부터 일요일까지의 주간 기록 집계

### Discord 봇

- 신규 우승 경기 자동 알림
- 함께한 경기,우승 횟수와 멤버별 기록을 메시지로 제공
- 이번 경기 기록과 함께한 전적으로 이동하는 링크 버튼
- 최근 치킨 조회, 주간 BOBOKING 조회, PUBG 아이디 등록, 팀 배분 명령

## 기술 구성

| 영역 | 기술 |
| --- | --- |
| 웹 | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Base UI, Recharts |
| 데이터베이스 | PostgreSQL 17, Drizzle ORM |
| 게임 데이터 | PUBG API |
| Discord | discord.js |
| 스케줄링·로그 | node-cron, Pino |
| 배포 | Docker Compose, GitHub Actions, Cloudflare Tunnel |


## 프로젝트 구조

```text
app/                 페이지와 API 라우트
components/          화면 컴포넌트와 공통 UI
lib/db/              데이터베이스 연결과 스키마
lib/clans/           클랜 조회·초기화
lib/members/         클랜원 조회·등록
lib/matches/         경기 기록·상세·이동 처리
lib/player-stats/    개인 전적·추이·최고 기록
lib/squad-history/   조합 전적·클라이언트 조회·페이지 계산
lib/rankings/        주간 랭킹과 부문별 집계
lib/team-split/      팀 배분·결과 공유
lib/discord-accounts/ Discord 계정과 PUBG 계정 연동
lib/api/             API 오류·공통 처리
lib/pubg/            PUBG API 연동
lib/discord/         봇 명령, 메시지 구성과 전송
lib/sync/            경기 자동 수집과 스케줄링
tests/               기능 검증
docs/                개발 문서
```

기능별 폴더에서 `service.ts`는 처리 흐름을, `repository.ts`는 DB 조회·저장을 담당합니다.
서비스와 화면에서 공유하는 타입은 해당 기능의 `types.ts`에서 관리하고, 한 파일에서만 쓰는 타입은 구현 옆에 둡니다.
랭킹은 부문이 많아 `services/`와 `repositories/` 하위 폴더로 나눕니다.

## 데이터 범위

전적과 통계는 서비스가 수집·저장한 경기 데이터를 기준으로 제공됩니다.
PUBG 계정의 전체 플레이 기록과 일치하지 않을 수 있습니다.

PUBG 데이터는 [공식 PUBG API](https://developer.pubg.com/)를 통해 제공받습니다.
