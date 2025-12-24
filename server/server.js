const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { crawlAllSources, getArticles } = require('./crawler');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());

// API 라우트
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await getArticles();
    res.json({
      success: true,
      count: articles.length,
      articles: articles
    });
  } catch (error) {
    console.error('기사 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '기사를 불러오는 중 오류가 발생했습니다.'
    });
  }
});

// 수동 크롤링 트리거 (테스트용) - GET과 POST 모두 지원
app.get('/api/crawl', async (req, res) => {
  try {
    console.log('수동 크롤링 시작...');
    const articles = await crawlAllSources();
    res.json({
      success: true,
      message: '크롤링이 완료되었습니다.',
      count: articles.length
    });
  } catch (error) {
    console.error('크롤링 오류:', error);
    res.status(500).json({
      success: false,
      error: '크롤링 중 오류가 발생했습니다.'
    });
  }
});

app.post('/api/crawl', async (req, res) => {
  try {
    console.log('수동 크롤링 시작...');
    const articles = await crawlAllSources();
    res.json({
      success: true,
      message: '크롤링이 완료되었습니다.',
      count: articles.length
    });
  } catch (error) {
    console.error('크롤링 오류:', error);
    res.status(500).json({
      success: false,
      error: '크롤링 중 오류가 발생했습니다.'
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`API: http://localhost:${PORT}/api/articles`);
  
  // 스케줄러 설정: 매일 9시, 16시에 크롤링
  // cron 형식: 분 시 일 월 요일
  // '0 9,16 * * *' = 매일 9시 0분, 16시 0분
  cron.schedule('0 9,16 * * *', async () => {
    console.log('스케줄된 크롤링 시작...');
    try {
      await crawlAllSources();
      console.log('스케줄된 크롤링 완료');
    } catch (error) {
      console.error('스케줄된 크롤링 오류:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  console.log('크롤링 스케줄러가 설정되었습니다. (매일 9시, 16시)');
});

