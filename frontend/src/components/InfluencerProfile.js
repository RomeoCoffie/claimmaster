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
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme
} from '@mui/material';
import {
  FilterList,
  Search,
  CheckCircle,
  Cancel,
  Help,
  DateRange
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ResearchProgress from './ResearchProgress';

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
  const theme = useTheme();
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [researchStage, setResearchStage] = useState('Searching for influencer');
  const [claimFilter, setClaimFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [researchLogs, setResearchLogs] = useState([]);
  const [dateRangeDialog, setDateRangeDialog] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)); // 6 months ago
  const [endDate, setEndDate] = useState(new Date());
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);

  const validateDateRange = (start, end) => {
    if (!start || !end) return false;
    if (start > end) return false;
    if (end > new Date()) return false;
    const diffInMonths = (end - start) / (1000 * 60 * 60 * 24 * 30);
    if (diffInMonths > 24) return false; // Limit to 2 years
    return true;
  };

  const handleDateRangeChange = (newStart, newEnd) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setIsDateRangeValid(validateDateRange(newStart, newEnd));
  };

  const handleDateRangeSubmit = () => {
    if (isDateRangeValid) {
      setDateRangeDialog(false);
      loadInfluencerData(); // This will trigger a new research with the updated date range
    }
  };

  const loadInfluencerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start polling for data
      let attempts = 0;
      const maxAttempts = 30;
      
      const logStage = (stage, message) => {
        console.log(`[${id}] ${stage}: ${message}`);
        setResearchStage(stage);
      };

      // First, initiate the research with custom date range
      const researchRequest = {
        influencer_name: id,
        date_range: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        include_revenue: true,
        verify_with_journals: true,
        selected_journals: ["PubMed Central", "Nature", "Science"],
        claims_to_analyze: 50
      };

      // Start the research process
      const startResearch = await fetch('http://localhost:8000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(researchRequest)
      });

      if (!startResearch.ok) {
        const errorData = await startResearch.json();
        throw new Error(errorData.detail || 'Failed to start research');
      }

      logStage('Searching for influencer', 'Starting research process');
      
      while (attempts < maxAttempts) {
        const response = await fetch(`http://localhost:8000/api/influencers/${encodeURIComponent(id)}`);
        
        if (!response.ok) {
          console.error(`[${id}] API Error:`, response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to fetch influencer data');
        }

        const data = await response.json();
        
        // Log any error messages from the backend
        if (data.error) {
          console.error(`[${id}] Backend Error:`, data.error);
          throw new Error(data.error);
        }

        // Log progress from backend
        if (data.logs) {
          setResearchLogs(data.logs);
          data.logs.forEach(log => {
            console.log(`[${id}] ${log.stage}: ${log.message} (${log.timestamp})`);
          });
        }
        
        // Check if research is complete and we have data
        if (data.status === 'complete' && data.id) {
          logStage('Ready', 'Research completed successfully');
          setInfluencer(data);
          setLoading(false);
          return;
        }
        
        // Update research stage based on status
        if (data.status === 'gathering_claims') {
          logStage('gathering_claims', 'Collecting recent claims and content');
        } else if (data.status === 'verifying_claims') {
          logStage('verifying_claims', 'Cross-referencing with scientific journals');
        } else if (data.status === 'error') {
          throw new Error(data.message || 'Research failed');
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
        // Log polling attempts
        if (attempts % 5 === 0) {
          console.log(`[${id}] Still waiting for research to complete. Attempt ${attempts}/${maxAttempts}`);
        }
      }
      
      throw new Error('Research timed out. Please try again.');
    } catch (err) {
      console.error(`[${id}] Research Error:`, err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
      setResearchStage('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfluencerData();
  }, [id]);

  if (loading || researchStage !== 'Ready') {
    return <ResearchProgress 
      currentStage={researchStage} 
      error={error}
      logs={researchLogs}
    />;
  }

  // Filter claims based on current filters
  const filteredClaims = influencer?.claims?.filter(claim => {
    const matchesSearch = claim.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = claimFilter === 'all' || claim.status === claimFilter;
    const matchesCategory = selectedCategory === 'all' || claim.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  const chartData = {
    labels: influencer?.trustScoreHistory?.map(h => new Date(h.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Trust Score',
        data: influencer?.trustScoreHistory?.map(h => h.score) || [],
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
              src={influencer?.avatar || undefined}
              alt={influencer?.name}
              sx={{
                width: 120,
                height: 120,
                border: '3px solid',
                borderColor: 'primary.main',
                boxShadow: 3,
                backgroundColor: theme => {
                  const color = theme.palette.primary.light;
                  // Generate a unique color based on the name
                  if (influencer?.name) {
                    const hash = influencer.name.split('').reduce((acc, char) => {
                      return char.charCodeAt(0) + ((acc << 5) - acc);
                    }, 0);
                    return `hsl(${hash % 360}, 70%, 50%)`;
                  }
                  return color;
                },
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                '& img': {
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%'
                }
              }}
              imgProps={{
                onError: (e) => {
                  console.warn('Failed to load avatar image, using fallback');
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = ''; // Clear the src to show the fallback
                  e.target.style.display = 'none'; // Hide the broken image
                },
                loading: 'lazy',
                referrerPolicy: 'no-referrer',
                crossOrigin: 'anonymous'
              }}
            >
              {influencer?.name?.charAt(0).toUpperCase() || '?'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>{influencer?.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {influencer?.category}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {influencer?.topics?.map((topic) => (
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
                <Typography variant="h3" sx={{ color: getTrustScoreColor(influencer?.trustScore || 0) }}>
                  {(influencer?.trustScore || 0).toFixed(1)}%
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Trust Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item>
            <IconButton 
              color="primary" 
              onClick={() => setDateRangeDialog(true)}
              title="Change Date Range"
            >
              <DateRange />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Date Range Dialog */}
      <Dialog open={dateRangeDialog} onClose={() => setDateRangeDialog(false)}>
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <DatePicker
                label="From"
                value={startDate}
                onChange={(newValue) => handleDateRangeChange(newValue, endDate)}
                maxDate={endDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !isDateRangeValid
                  }
                }}
              />
              <DatePicker
                label="To"
                value={endDate}
                onChange={(newValue) => handleDateRangeChange(startDate, newValue)}
                minDate={startDate}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !isDateRangeValid
                  }
                }}
              />
              {!isDateRangeValid && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Please select a valid date range (up to 2 years, not in the future)
                </Alert>
              )}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateRangeDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDateRangeSubmit} 
            disabled={!isDateRangeValid}
            variant="contained"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Yearly Revenue
              </Typography>
              <Typography variant="h4">
                ${((influencer?.yearlyRevenue || 0) / 1000000).toFixed(1)}M
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
                {influencer?.productsCount || 0}
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
                {((influencer?.followers || 0) / 1000000).toFixed(1)}M
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
                {influencer?.topics?.map((topic) => (
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