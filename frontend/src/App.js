import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Avatar
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ResearchConfig from './components/ResearchConfig';
import InfluencerLeaderboard from './components/InfluencerLeaderboard';
import InfluencerProfile from './components/InfluencerProfile';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00DC82',
    },
    secondary: {
      main: '#1E293B',
    },
    background: {
      default: '#0B1121',
      paper: '#1E293B',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          backgroundColor: '#00DC82',
          '&:hover': {
            backgroundColor: '#00B368',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

function App() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartResearch = async (config) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      setInfluencers(data.influencers);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Toolbar>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Avatar src="/logo.png" sx={{ width: 32, height: 32, mr: 1 }} />
                  <Typography variant="h6" component={Link} to="/" sx={{ color: 'text.primary', textDecoration: 'none' }}>
                    VerifyInfluencers
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button component={Link} to="/leaderboard" color="inherit">Leaderboard</Button>
                  <Button component={Link} to="/products" color="inherit">Products</Button>
                  <Button component={Link} to="/monetization" color="inherit">Monetization</Button>
                  <Button component={Link} to="/about" color="inherit">About</Button>
                  <Button component={Link} to="/contact" color="inherit">Contact</Button>
                  <Button component={Link} to="/admin" color="inherit">Admin</Button>
                </Box>
              </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ResearchConfig 
                      onStartResearch={handleStartResearch} 
                    />
                  } 
                />
                <Route 
                  path="/leaderboard" 
                  element={
                    <InfluencerLeaderboard 
                      influencers={influencers}
                      loading={loading}
                      error={error}
                    />
                  } 
                />
                <Route 
                  path="/profile/:id" 
                  element={
                    <InfluencerProfile 
                      loading={loading}
                      error={error}
                    />
                  } 
                />
              </Routes>
            </Container>
          </Box>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App; 