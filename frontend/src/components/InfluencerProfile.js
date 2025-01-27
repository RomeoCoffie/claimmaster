import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  FilterList,
  Search,
  CheckCircle,
  Cancel,
  Help
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const InfluencerProfile = () => {
  const { id } = useParams();
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimFilter, setClaimFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const loadInfluencerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:8000/api/influencers/${id}`);
      const data = await response.json();
      setInfluencer(data);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: 'Failed to load influencer data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfluencerData();
  }, [id, loadInfluencerData]);

  if (loading || !influencer) {
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

  // Filter claims based on current filters
  const filteredClaims = influencer.claims.filter(claim => {
    const matchesSearch = claim.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = claimFilter === 'all' || claim.status === claimFilter;
    const matchesCategory = selectedCategory === 'all' || claim.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const chartData = {
    labels: influencer.trustScoreHistory.map(h => new Date(h.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Trust Score',
        data: influencer.trustScoreHistory.map(h => h.score),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Trust Score Trend',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Trust Score (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle color="success" />;
      case 'questionable':
        return <Help color="warning" />;
      case 'debunked':
        return <Cancel color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={influencer.avatar}
              alt={influencer.name}
              sx={{ width: 120, height: 120 }}
            />
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>{influencer.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {influencer.category}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {influencer.topics.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item>
            <Card sx={{ minWidth: 200, textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: getTrustScoreColor(influencer.trustScore) }}>
                  {influencer.trustScore.toFixed(1)}%
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Trust Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Yearly Revenue
              </Typography>
              <Typography variant="h4">
                ${(influencer.yearlyRevenue / 1000000).toFixed(1)}M
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated annual earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Products
              </Typography>
              <Typography variant="h4">
                {influencer.productsCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active promoted products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Followers
              </Typography>
              <Typography variant="h4">
                {(influencer.followers / 1000000).toFixed(1)}M
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total social media reach
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trust Score Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Line data={chartData} options={chartOptions} />
      </Paper>

      {/* Claims Analysis */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Claims Analysis
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton color="primary">
              <FilterList />
            </IconButton>
            <IconButton color="primary">
              <Search />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Claims"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={claimFilter}
                onChange={(e) => setClaimFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="questionable">Questionable</MenuItem>
                <MenuItem value="debunked">Debunked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {influencer.topics.map((topic) => (
                  <MenuItem key={topic} value={topic}>{topic}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Claim</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Trust Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id} hover>
                  <TableCell>{new Date(claim.date).toLocaleDateString()}</TableCell>
                  <TableCell>{claim.text}</TableCell>
                  <TableCell>
                    <Chip label={claim.category} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(claim.status)}
                      <Chip
                        label={claim.status}
                        color={
                          claim.status === 'verified'
                            ? 'success'
                            : claim.status === 'questionable'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: getTrustScoreColor(claim.trustScore) }}>
                      {claim.trustScore.toFixed(1)}%
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InfluencerProfile; 