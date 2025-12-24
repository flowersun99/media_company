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
    // 네이버 뉴스 검색 URL (청년 키워드, 최신순 정렬) - URL 인코딩
    const query = encodeURIComponent('청년');
    const searchUrl = `https://search.naver.com/search.naver?where=news&sm=tab_jum&query=${query}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.naver.com/'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // 네이버 뉴스 검색 결과의 다양한 선택자 시도
    const selectors = [
      // 최신 네이버 뉴스 구조
      '.news_area .news_tit',
      '.news_wrap .news_tit',
      '.api_subject_bx .news_tit',
      'a.news_tit',
      // 추가 선택자
      '.bx .news_tit',
      '.news_info .news_tit',
      '.news_item .news_tit',
      // 일반 링크에서 뉴스 찾기
      'div.news_wrap a[href*="news.naver.com"]',
      'div.news_area a[href*="news.naver.com"]'
    ];
    
    const foundLinks = new Set();
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (articles.length >= 30) return false;
        
        const $element = $(element);
        let title = $element.text().trim();
        let link = $element.attr('href');
        
        // href가 없으면 부모 요소에서 찾기
        if (!link) {
          link = $element.closest('a').attr('href');
        }
        
        // title이 없으면 다른 방법으로 찾기
        if (!title || title.length < 5) {
          title = $element.attr('title') || $element.find('a').attr('title') || '';
        }
        
        if (title && link && title.length > 5 && !foundLinks.has(link)) {
          // 네이버 뉴스 링크 처리
          if (link.includes('news.naver.com')) {
            // 원본 링크 추출
            if (link.includes('url=')) {
              const urlMatch = link.match(/url=([^&]+)/);
              if (urlMatch) {
                link = decodeURIComponent(urlMatch[1]);
              }
            }
            
            foundLinks.add(link);
            articles.push({
              title: title,
              link: link,
              crawledAt: new Date().toISOString()
            });
          } else if (link.startsWith('http')) {
            // 다른 뉴스 사이트도 포함
            foundLinks.add(link);
            articles.push({
              title: title,
              link: link,
              crawledAt: new Date().toISOString()
            });
          }
        }
      });
      
      if (articles.length > 0) break;
    }
    
    // 추가로 뉴스 아이템 전체에서 찾기
    if (articles.length === 0) {
      $('.news_wrap, .news_area, .bx, .api_ani_send').each((index, element) => {
        if (articles.length >= 30) return false;
        
        const $wrap = $(element);
        
        // 제목 찾기 - 다양한 방법 시도
        let title = $wrap.find('.news_tit, .api_txt_lines, a').first().text().trim();
        if (!title || title.length < 5) {
          title = $wrap.find('a').first().text().trim();
        }
        if (!title || title.length < 5) {
          title = $wrap.attr('title') || '';
        }
        
        // 링크 찾기
        let link = $wrap.find('a').first().attr('href');
        if (!link) {
          link = $wrap.attr('href');
        }
        
        if (title && link && title.length > 5 && !foundLinks.has(link)) {
          // 네이버 뉴스 링크 처리
          if (link.includes('news.naver.com') || link.includes('n.news.naver.com')) {
            // 원본 링크 추출
            if (link.includes('url=')) {
              const urlMatch = link.match(/url=([^&]+)/);
              if (urlMatch) {
                try {
                  link = decodeURIComponent(urlMatch[1]);
                } catch (e) {
                  // 디코딩 실패 시 원본 사용
                }
              }
            }
            
            // 상대 경로 처리
            if (link.startsWith('/')) {
              link = 'https://n.news.naver.com' + link;
            }
            
            foundLinks.add(link);
            articles.push({
              title: title,
              link: link,
              crawledAt: new Date().toISOString()
            });
          } else if (link.startsWith('http') && !link.includes('search.naver.com')) {
            // 다른 뉴스 사이트
            foundLinks.add(link);
            articles.push({
              title: title,
              link: link,
              crawledAt: new Date().toISOString()
            });
          }
        }
      });
    }
    
    // 최후의 수단: 모든 링크에서 뉴스 찾기
    if (articles.length === 0) {
      $('a[href*="news.naver.com"], a[href*="n.news.naver.com"]').each((index, element) => {
        if (articles.length >= 30) return false;
        
        const $element = $(element);
        const title = $element.text().trim();
        let link = $element.attr('href');
        
        if (title && link && title.length > 5 && !foundLinks.has(link)) {
          if (link.includes('url=')) {
            const urlMatch = link.match(/url=([^&]+)/);
            if (urlMatch) {
              try {
                link = decodeURIComponent(urlMatch[1]);
              } catch (e) {
                // 디코딩 실패 시 원본 사용
              }
            }
          }
          
          if (link.startsWith('/')) {
            link = 'https://n.news.naver.com' + link;
          }
          
          foundLinks.add(link);
          articles.push({
            title: title,
            link: link,
            crawledAt: new Date().toISOString()
          });
        }
      });
    }
    
    console.log(`네이버 뉴스에서 ${articles.length}개 기사 발견`);
    
    // 디버깅: HTML 구조 확인
    if (articles.length === 0) {
      console.log('디버깅: HTML 구조 확인 중...');
      const newsWraps = $('.news_wrap, .news_area, .bx').length;
      const newsTits = $('.news_tit, a.news_tit').length;
      console.log(`발견된 요소: .news_wrap/.news_area/.bx: ${newsWraps}개, .news_tit: ${newsTits}개`);
    }
    
  } catch (error) {
    console.error('네이버 뉴스 크롤링 오류:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 헤더:', error.response.headers);
    }
  }
  
  return articles;
}

/**
 * 다음 뉴스에서 청년 관련 기사 크롤링
 */
async function crawlDaumNews() {
  const articles = [];
  
  try {
    const query = encodeURIComponent('청년');
    const searchUrl = `https://search.daum.net/search?w=news&q=${query}&DA=PGD`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.daum.net/'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    const foundLinks = new Set();
    
    // 다음 뉴스 검색 결과의 다양한 선택자 시도
    const selectors = [
      'a.f_link_b',
      '.wrap_cont a.f_link_b',
      '.coll_cont a.f_link_b',
      '.tit_main',
      'a[href*="v.daum.net"]',
      'a[href*="news.daum.net"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (articles.length >= 30) return false;
        
        const $element = $(element);
        let title = $element.text().trim();
        let link = $element.attr('href');
        
        // title이 없으면 다른 방법으로 찾기
        if (!title || title.length < 5) {
          title = $element.attr('title') || $element.find('a').attr('title') || '';
        }
        
        if (title && link && title.length > 5 && !foundLinks.has(link)) {
          // 다음 뉴스 링크 처리
          if (link.includes('v.daum.net') || link.includes('news.daum.net')) {
            if (!link.startsWith('http')) {
              link = link.startsWith('/') ? `https://search.daum.net${link}` : `https://search.daum.net/${link}`;
            }
            
            foundLinks.add(link);
            articles.push({
              title: title,
              link: link,
              crawledAt: new Date().toISOString()
            });
          } else if (link.startsWith('http')) {
            foundLinks.add(link);
            articles.push({
              title: title,
              link: link,
              crawledAt: new Date().toISOString()
            });
          }
        }
      });
      
      if (articles.length > 0) break;
    }
    
    console.log(`다음 뉴스에서 ${articles.length}개 기사 발견`);
    
  } catch (error) {
    console.error('다음 뉴스 크롤링 오류:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
    }
  }
  
  return articles;
}

/**
 * 구글 뉴스에서 청년 관련 기사 크롤링 (대안)
 */
async function crawlGoogleNews() {
  const articles = [];
  
  try {
    // 구글 뉴스 검색 (한국어)
    const query = encodeURIComponent('청년');
    const searchUrl = `https://news.google.com/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const foundLinks = new Set();
    
    // 구글 뉴스 구조
    $('article a').each((index, element) => {
      if (articles.length >= 20) return false;
      
      const $element = $(element);
      const title = $element.text().trim();
      let link = $element.attr('href');
      
      if (title && link && title.length > 5 && !foundLinks.has(link)) {
        // 구글 뉴스 링크는 상대 경로로 시작
        if (link.startsWith('./')) {
          link = 'https://news.google.com' + link.substring(1);
        }
        
        foundLinks.add(link);
        articles.push({
          title: title,
          link: link,
          crawledAt: new Date().toISOString()
        });
      }
    });
    
    console.log(`구글 뉴스에서 ${articles.length}개 기사 발견`);
    
  } catch (error) {
    console.error('구글 뉴스 크롤링 오류:', error.message);
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
  console.log('다음 뉴스 크롤링 중...');
  const daumArticles = await crawlDaumNews();
  console.log(`다음: ${daumArticles.length}개 기사 발견`);
  allArticles = [...allArticles, ...daumArticles];
  
  // 기사가 적으면 구글 뉴스도 시도
  if (allArticles.length < 10) {
    console.log('구글 뉴스 크롤링 중...');
    const googleArticles = await crawlGoogleNews();
    console.log(`구글: ${googleArticles.length}개 기사 발견`);
    allArticles = [...allArticles, ...googleArticles];
  }
  
  console.log(`총 ${allArticles.length}개 기사 수집됨`);
  
  // 중복 제거 (제목 기준)
  const uniqueArticles = [];
  const seenTitles = new Set();
  const seenLinks = new Set();
  
  for (const article of allArticles) {
    const normalizedTitle = article.title.trim().toLowerCase();
    const normalizedLink = article.link.trim();
    
    // 제목과 링크 모두 중복 체크
    if (!seenTitles.has(normalizedTitle) && 
        !seenLinks.has(normalizedLink) && 
        article.title.length > 5 &&
        article.link.length > 10) {
      seenTitles.add(normalizedTitle);
      seenLinks.add(normalizedLink);
      uniqueArticles.push(article);
    }
  }
  
  console.log(`중복 제거 후 ${uniqueArticles.length}개 기사 남음`);
  
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

