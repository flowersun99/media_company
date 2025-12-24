# 언론사 웹사이트 - 청년 기사 크롤링 시스템

## 프로젝트 개요

청년을 주제로 한 언론 기사를 자동으로 크롤링하여 제목과 링크를 표시하는 웹사이트입니다.
매일 오전 9시와 오후 4시에 자동으로 크롤링이 실행됩니다.

## 프로젝트 구조

```
media_company/
├── server/              # 백엔드 서버
│   ├── server.js       # Express 서버 및 스케줄러
│   ├── crawler.js      # 크롤링 로직
│   ├── articles.json   # 크롤링된 기사 데이터 (자동 생성)
│   └── package.json
├── src/                # 프론트엔드 (React)
│   └── pages/
│       └── LandingPages/
│           └── News/   # 기사 목록 페이지
└── package.json
```

## 설치 및 실행 방법

### 1. 프론트엔드 의존성 설치 (이미 완료됨)
```bash
npm install
```

### 2. 백엔드 의존성 설치
```bash
cd server
npm install
cd ..
```

### 3. 서버 실행

#### 백엔드 서버 실행 (터미널 1)
```bash
cd server
npm start
```

서버가 `http://localhost:5000`에서 실행됩니다.

#### 프론트엔드 실행 (터미널 2)
```bash
npm start
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

### 4. 수동 크롤링 실행 (테스트용)

백엔드 서버가 실행 중일 때, 다음 URL로 POST 요청을 보내면 수동으로 크롤링을 실행할 수 있습니다:

```bash
# curl 사용
curl -X POST http://localhost:5000/api/crawl

# 또는 브라우저에서
http://localhost:5000/api/crawl
```

## API 엔드포인트

### GET /api/articles
크롤링된 기사 목록을 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "count": 10,
  "articles": [
    {
      "title": "기사 제목",
      "link": "https://example.com/article",
      "crawledAt": "2024-01-01T09:00:00.000Z"
    }
  ]
}
```

### POST /api/crawl
수동으로 크롤링을 실행합니다.

## 스케줄러

매일 다음 시간에 자동으로 크롤링이 실행됩니다:
- 오전 9시 (09:00)
- 오후 4시 (16:00)

시간대는 한국 시간(Asia/Seoul)으로 설정되어 있습니다.

## 크롤링 소스

현재 다음 소스에서 기사를 크롤링합니다:
- 네이버 뉴스 검색 (청년 키워드)
- 다음 뉴스 검색 (청년 키워드)
- 연합뉴스 청년 섹션

## 환경 변수

프론트엔드에서 백엔드 API URL을 변경하려면 `.env` 파일을 생성하세요:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 주의사항

1. 크롤링은 웹사이트의 robots.txt와 이용약관을 준수해야 합니다.
2. 실제 운영 환경에서는 적절한 딜레이와 에러 핸들링을 추가하는 것이 좋습니다.
3. 일부 웹사이트는 크롤링을 차단할 수 있으므로, 필요시 User-Agent나 다른 헤더를 조정해야 할 수 있습니다.

## 문제 해결

### 기사가 표시되지 않는 경우
1. 백엔드 서버가 실행 중인지 확인하세요.
2. 수동으로 크롤링을 실행해보세요: `POST http://localhost:5000/api/crawl`
3. 브라우저 콘솔에서 에러 메시지를 확인하세요.

### 크롤링이 작동하지 않는 경우
1. 네트워크 연결을 확인하세요.
2. 일부 웹사이트는 크롤링을 차단할 수 있습니다.
3. `server/articles.json` 파일이 생성되었는지 확인하세요.

