const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'articles.json');

/**
 * 네이버 뉴스에서 청년 관련 기사 크롤링
 */
async function crawlNaverNews() {
  const articles = [];
  
  try {
    // 네이버 뉴스 검색 URL (청년 키워드)
    const searchUrl = 'https://search.naver.com/search.naver?where=news&query=청년';
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // 여러 선택자 시도
    const selectors = [
      '.news_wrap .news_tit',
      '.news_area .news_tit',
      '.api_subject_bx .news_tit',
      'a.news_tit'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (articles.length >= 20) return false;
        
        const $element = $(element);
        const title = $element.text().trim();
        let link = $element.attr('href');
        
        if (title && link) {
          // 상대 경로 처리
          if (link.startsWith('/')) {
            link = 'https://search.naver.com' + link;
          }
          
          articles.push({
            title: title,
            link: link,
            crawledAt: new Date().toISOString()
          });
        }
      });
      
      if (articles.length > 0) break;
    }
    
  } catch (error) {
    console.error('네이버 뉴스 크롤링 오류:', error.message);
  }
  
  return articles;
}

/**
 * 다음 뉴스에서 청년 관련 기사 크롤링
 */
async function crawlDaumNews() {
  const articles = [];
  
  try {
    const searchUrl = 'https://search.daum.net/search?w=news&q=청년';
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // 여러 선택자 시도
    const selectors = [
      '.wrap_cont .tit_main',
      '.f_nb a',
      '.coll_cont a.f_link_b'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (articles.length >= 20) return false;
        
        const $element = $(element);
        const title = $element.text().trim();
        let link = $element.attr('href');
        
        if (title && link && title.length > 5) {
          if (!link.startsWith('http')) {
            link = link.startsWith('/') ? `https://search.daum.net${link}` : `https://search.daum.net/${link}`;
          }
          
          articles.push({
            title: title,
            link: link,
            crawledAt: new Date().toISOString()
          });
        }
      });
      
      if (articles.length > 0) break;
    }
    
  } catch (error) {
    console.error('다음 뉴스 크롤링 오류:', error.message);
  }
  
  return articles;
}

/**
 * 주요 언론사 사이트에서 직접 크롤링 (예: 연합뉴스)
 */
async function crawlYonhapNews() {
  const articles = [];
  
  try {
    // 연합뉴스 청년 섹션
    const url = 'https://www.yna.co.kr/economy/youth';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    $('.list-type038 li').each((index, element) => {
      if (articles.length >= 20) return false;
      
      const $element = $(element);
      const title = $element.find('.tit-news').text().trim();
      const link = $element.find('a').attr('href');
      
      if (title && link) {
        articles.push({
          title: title,
          link: link.startsWith('http') ? link : `https://www.yna.co.kr${link}`,
          crawledAt: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('연합뉴스 크롤링 오류:', error.message);
  }
  
  return articles;
}

/**
 * 모든 소스에서 기사 크롤링
 */
async function crawlAllSources() {
  console.log('크롤링 시작...', new Date().toLocaleString('ko-KR'));
  
  let allArticles = [];
  
  // 여러 소스에서 크롤링 시도
  console.log('네이버 뉴스 크롤링 중...');
  const naverArticles = await crawlNaverNews();
  console.log(`네이버: ${naverArticles.length}개 기사 발견`);
  allArticles = [...allArticles, ...naverArticles];
  
  // 다음 뉴스도 시도
  if (allArticles.length < 10) {
    console.log('다음 뉴스 크롤링 중...');
    const daumArticles = await crawlDaumNews();
    console.log(`다음: ${daumArticles.length}개 기사 발견`);
    allArticles = [...allArticles, ...daumArticles];
  }
  
  // 중복 제거 (제목 기준)
  const uniqueArticles = [];
  const seenTitles = new Set();
  
  for (const article of allArticles) {
    const normalizedTitle = article.title.trim().toLowerCase();
    if (!seenTitles.has(normalizedTitle) && article.title.length > 5) {
      seenTitles.add(normalizedTitle);
      uniqueArticles.push(article);
    }
  }
  
  // 기존 데이터 로드
  let existingArticles = [];
  try {
    if (await fs.pathExists(DATA_FILE)) {
      existingArticles = await fs.readJson(DATA_FILE);
    }
  } catch (error) {
    console.error('기존 데이터 로드 오류:', error.message);
  }
  
  // 새 기사와 기존 기사 병합 (중복 제거)
  const mergedArticles = [...uniqueArticles];
  for (const existing of existingArticles) {
    const normalizedTitle = existing.title.trim().toLowerCase();
    if (!seenTitles.has(normalizedTitle)) {
      mergedArticles.push(existing);
    }
  }
  
  // 최신순으로 정렬 (최대 100개만 유지)
  mergedArticles.sort((a, b) => new Date(b.crawledAt) - new Date(a.crawledAt));
  const finalArticles = mergedArticles.slice(0, 100);
  
  // 파일에 저장
  await fs.writeJson(DATA_FILE, finalArticles, { spaces: 2 });
  
  console.log(`크롤링 완료: ${uniqueArticles.length}개의 새 기사, 총 ${finalArticles.length}개 저장됨`);
  
  return finalArticles;
}

/**
 * 저장된 기사 읽기
 */
async function getArticles() {
  try {
    if (await fs.pathExists(DATA_FILE)) {
      return await fs.readJson(DATA_FILE);
    }
    return [];
  } catch (error) {
    console.error('기사 읽기 오류:', error.message);
    return [];
  }
}

module.exports = {
  crawlAllSources,
  getArticles
};

