import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { TrendingUp, TrendingDown, Search } from '@mui/icons-material';
import DiscoveryProgress from './DiscoveryProgress';

function InfluencerLeaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trustScore');
  const [researchStage, setResearchStage] = useState('searching');
  const [researchLogs, setResearchLogs] = useState([]);

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        setLoading(true);
        setError(null);

        // If we have state from research, start polling
        if (location.state?.config?.mode === 'discover') {
          let attempts = 0;
          const maxAttempts = 30;
          
          const pollResearch = async () => {
            try {
              const response = await fetch(`${process.env.REACT_APP_API_URL}/api/research/status`);
              if (!response.ok) {
                throw new Error('Failed to fetch research status');
              }
              
              const data = await response.json();
              
              // Update logs if available
              if (data.logs) {
                setResearchLogs(data.logs);
              }
              
              // Update stage based on status
              if (data.stage) {
                setResearchStage(data.stage);
              }
              
              // If research is complete, set the influencers
              if (data.status === 'complete' && data.influencers) {
                setInfluencers(data.influencers);
                setLoading(false);
                return true;
              }
              
              // If still in progress, continue polling
              if (attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                return pollResearch();
              }
              
              throw new Error('Research timed out. Please try again.');
              
            } catch (err) {
              console.error('Polling error:', err);
              setError(err.message);
              setLoading(false);
              return false;
            }
          };
          
          await pollResearch();
          
        } else {
          // Otherwise fetch existing influencers
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/influencers`);
          if (!response.ok) {
            throw new Error('Failed to fetch influencers');
          }
          const data = await response.json();
          setInfluencers(data.influencers || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching influencers:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInfluencers();
  }, [location.state]);

  const categories = Array.from(
    new Set(influencers.flatMap(inf => inf.topics || [inf.category]).filter(Boolean))
  );

  // Filter and sort influencers
  const filteredInfluencers = influencers
    .filter(inf => {
      const matchesSearch = 
        inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inf.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = 
        !selectedCategory || 
        (inf.topics || [inf.category]).includes(selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'trustScore':
          return b.trustScore - a.trustScore;
        case 'followers':
          return b.followers - a.followers;
        case 'verifiedClaims':
          return (b.claims?.filter(c => c.status === 'verified')?.length || 0) - 
                 (a.claims?.filter(c => c.status === 'verified')?.length || 0);
        default:
          return 0;
      }
    });

  // Show progress component while loading in discover mode
  if (loading && location.state?.config?.mode === 'discover') {
    return (
      <DiscoveryProgress
        currentStage={researchStage}
        error={error}
        logs={researchLogs}
      />
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Health Influencer Leaderboard
      </Typography>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search influencers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="trustScore">Trust Score</MenuItem>
                <MenuItem value="followers">Followers</MenuItem>
                <MenuItem value="verifiedClaims">Verified Claims</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Trust Score</TableCell>
              <TableCell align="right">Trend</TableCell>
              <TableCell align="right">Followers</TableCell>
              <TableCell align="right">Verified Claims</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInfluencers.map((influencer, index) => (
              <TableRow
                key={influencer.name}
                hover
                onClick={() => navigate(`/profile/${encodeURIComponent(influencer.name)}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{influencer.name}</TableCell>
                <TableCell>{influencer.topics?.[0] || influencer.category}</TableCell>
                <TableCell align="right">{influencer.trustScore.toFixed(1)}%</TableCell>
                <TableCell align="right">
                  {influencer.trustScoreHistory?.length > 1 && (
                    influencer.trustScoreHistory[0].score > influencer.trustScoreHistory[1].score ? (
                      <TrendingUp color="success" />
                    ) : (
                      <TrendingDown color="error" />
                    )
                  )}
                </TableCell>
                <TableCell align="right">
                  {new Intl.NumberFormat().format(influencer.followers)}
                </TableCell>
                <TableCell align="right">
                  {influencer.claims?.filter(c => c.status === 'verified')?.length || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default InfluencerLeaderboard; 