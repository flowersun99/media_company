/**
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================
*/

import { useState, useEffect } from "react";
import { Container, Grid, Card, CardContent, Link, CircularProgress, Alert } from "@mui/material";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
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

  if (loading) {
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
        <MKTypography variant="h2" fontWeight="bold" mb={4} textAlign="center">
          청년 관련 기사
        </MKTypography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {articles.length === 0 && !error && (
          <Alert severity="info" sx={{ mb: 4 }}>
            아직 크롤링된 기사가 없습니다. 백엔드 서버에서 수동으로 크롤링을 실행해주세요.
          </Alert>
        )}

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
      </Container>
    </MKBox>
  );
}

export default NewsPage;

