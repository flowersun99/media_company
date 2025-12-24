/**
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================
*/
/* eslint-disable prettier/prettier */
import { useState, useEffect } from "react";
import { Container, Grid, Card, CardContent, Link, CircularProgress, Alert, Box } from "@mui/material";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";

// eslint-disable-next-line no-undef
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [error, setError] = useState(null);
  const [crawlMessage, setCrawlMessage] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/articles`);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.articles || []);
      } else {
        setError("기사를 불러오는 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("기사 로드 오류:", err);
      setError("서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async () => {
    try {
      setCrawling(true);
      setCrawlMessage(null);
      setError(null);
      
      const response = await fetch(`${API_URL}/crawl`);
      const data = await response.json();
      
      if (data.success) {
        setCrawlMessage(`크롤링이 완료되었습니다! ${data.count}개의 기사를 찾았습니다.`);
        // 크롤링 완료 후 기사 목록 새로고침
        await fetchArticles();
      } else {
        setError(data.error || "크롤링 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("크롤링 오류:", err);
      setError("서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
    } finally {
      setCrawling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && articles.length === 0) {
    return (
      <MKBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </MKBox>
    );
  }

  return (
    <MKBox>
      <Container sx={{ mt: 6, mb: 6 }}>
        <MKBox display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <MKTypography variant="h2" fontWeight="bold">
            청년 관련 기사
          </MKTypography>
          <MKButton
            variant="gradient"
            color="info"
            onClick={handleCrawl}
            disabled={crawling}
            sx={{
              minWidth: "150px",
              position: "relative",
            }}
          >
            {crawling ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "white" }} />
                <span>크롤링 중...</span>
              </Box>
            ) : (
              "기사 가져오기"
            )}
          </MKButton>
        </MKBox>
        
        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {crawlMessage && (
          <Alert severity="success" sx={{ mb: 4 }} onClose={() => setCrawlMessage(null)}>
            {crawlMessage}
          </Alert>
        )}

        {articles.length === 0 && !error && !crawling && (
          <Alert severity="info" sx={{ mb: 4 }}>
            아직 크롤링된 기사가 없습니다. 위의 &quot;기사 가져오기&quot; 버튼을 클릭하여 기사를 가져오세요.
          </Alert>
        )}

        {crawling && (
          <MKBox display="flex" justifyContent="center" alignItems="center" py={4} mb={4}>
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress sx={{ mb: 2 }} />
              <MKTypography variant="body1" color="text.secondary">
                기사를 가져오는 중입니다...
              </MKTypography>
            </Box>
          </MKBox>
        )}

        {articles.length > 0 && (
          <Grid container spacing={3}>
            {articles.map((article, index) => (
            <Grid item xs={12} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <MKTypography
                    variant="h5"
                    fontWeight="bold"
                    mb={2}
                    sx={{
                      "& a": {
                        color: "inherit",
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      },
                    }}
                  >
                    <Link href={article.link} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </Link>
                  </MKTypography>
                  
                  {article.crawledAt && (
                    <MKTypography variant="caption" color="text.secondary">
                      크롤링 시간: {formatDate(article.crawledAt)}
                    </MKTypography>
                  )}
                  
                  <MKBox mt={2}>
                    <Link
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: "primary.main",
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      기사 보기 →
                    </Link>
                  </MKBox>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        )}
      </Container>
    </MKBox>
  );
}

export default NewsPage;

