import React, { useState } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function InfluencerLeaderboard({ influencers, loading, error }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = Array.from(
    new Set(influencers.map((inf) => inf.category))
  );

  const filteredInfluencers = selectedCategory
    ? influencers.filter((inf) => inf.category === selectedCategory)
    : influencers;

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
        Influencer Trust Leaderboard
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Filter by Category
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            onClick={() => setSelectedCategory(null)}
            color={selectedCategory === null ? 'primary' : 'default'}
          />
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>

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
                key={influencer.id}
                hover
                onClick={() => navigate(`/profile/${influencer.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{influencer.name}</TableCell>
                <TableCell>{influencer.category}</TableCell>
                <TableCell align="right">{influencer.trustScore.toFixed(1)}</TableCell>
                <TableCell align="right">
                  {influencer.trend === 'up' ? (
                    <TrendingUp color="success" />
                  ) : influencer.trend === 'down' ? (
                    <TrendingDown color="error" />
                  ) : null}
                </TableCell>
                <TableCell align="right">
                  {new Intl.NumberFormat().format(influencer.followers)}
                </TableCell>
                <TableCell align="right">{influencer.verifiedClaims}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default InfluencerLeaderboard; 