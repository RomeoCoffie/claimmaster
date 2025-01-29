import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  InputAdornment,
  Link,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  Search
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const SCIENTIFIC_JOURNALS = [
  'PubMed Central',
  'Nature',
  'Science',
  'Cell',
  'The Lancet',
  'New England Journal of Medicine',
  'JAMA Network'
];

const HEALTH_CATEGORIES = [
  'Nutrition',
  'Fitness',
  'Mental Health',
  'Alternative Medicine',
  'Weight Loss',
  'Supplements',
  'Holistic Health',
  'Medical Information',
  'Women\'s Health',
  'Men\'s Health',
  'Pediatric Health',
  'Senior Health',
  'Sports Medicine',
  'Chronic Disease Management'
];

function ResearchConfig({ onStartResearch }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    mode: 'specific',
    influencerName: '',
    timeRange: 'Last Month',
    productsCount: 10,
    includeRevenue: true,
    verifyWithJournals: true,
    selectedJournals: ['PubMed Central', 'Nature'],
    claimsToAnalyze: 50,
    notes: '',
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    endDate: new Date(),
    isDateRangeValid: true,
    selectedCategories: [],
    influencersCount: 10
  });

  // Add state for loading, error, and snackbar
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Add snackbar close handler
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleStartResearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (config.mode === 'specific' && config.influencerName) {
        // Ensure dates are timezone aware
        const startDate = new Date(config.startDate);
        const endDate = new Date(config.endDate);
        
        // First create/update the influencer profile through research
        const researchResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/research`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            influencer_name: config.influencerName,
            date_range: {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString()
            },
            include_revenue: config.includeRevenue,
            verify_with_journals: config.verifyWithJournals,
            selected_journals: config.selectedJournals,
            claims_to_analyze: config.claimsToAnalyze,
            notes: config.notes
          }),
        });

        if (!researchResponse.ok) {
          const errorData = await researchResponse.json();
          throw new Error(errorData.detail || 'Failed to start research');
        }
        
        // Call the parent's onStartResearch callback
        await onStartResearch(config);
        
        // Navigate to the profile using the influencer name
        navigate(`/profile/${encodeURIComponent(config.influencerName)}`);
      } else if (config.mode === 'discover') {
        if (config.selectedCategories.length === 0) {
          throw new Error('Please select at least one health category');
        }

        // Call onStartResearch and navigate immediately
        await onStartResearch(config);
        navigate('/leaderboard', { 
          state: { 
            config,
            isResearchInProgress: true
          }
        });

        // Start the research process in the background
        const researchResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/research/discover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categories: config.selectedCategories,
            influencers_count: config.influencersCount,
            include_revenue: config.includeRevenue,
            verify_with_journals: config.verifyWithJournals,
            selected_journals: config.selectedJournals
          }),
        });

        if (!researchResponse.ok) {
          const errorData = await researchResponse.json();
          throw new Error(errorData.detail || 'Failed to start research');
        }
      }
    } catch (err) {
      console.error('Research error:', err);
      setError(err.message || 'Failed to start research. Please try again.');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to start research. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductsCountChange = (event) => {
    const value = parseInt(event.target.value) || 0;
    // Clamp value between 0 and 10
    const clampedValue = Math.min(Math.max(value, 0), 10);
    setConfig({ ...config, productsCount: clampedValue });
  };

  const validateDateRange = (start, end) => {
    if (!start || !end) return false;
    
    // Create new Date objects to ensure proper comparison
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    
    if (startDate > endDate) return false;
    if (endDate > now) return false;
    const diffInMonths = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);
    if (diffInMonths > 24) return false; // Limit to 2 years
    return true;
  };

  const handleDateRangeChange = (newStart, newEnd) => {
    const start = newStart || config.startDate;
    const end = newEnd || config.endDate;
    setConfig({ ...config, startDate: start, endDate: end, isDateRangeValid: validateDateRange(start, end) });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Add Snackbar component */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          component={Link}
          to="/"
          sx={{ color: 'text.secondary', mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" gutterBottom>
          Research Tasks
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Research Configuration
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: config.mode === 'specific' ? 'primary.dark' : 'transparent',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  onClick={() => setConfig({ ...config, mode: 'specific' })}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Specific Influencer
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Research a known health influencer by name
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: config.mode === 'discover' ? 'primary.dark' : 'transparent',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  onClick={() => setConfig({ ...config, mode: 'discover' })}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Discover New
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Find and analyze new health influencers
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {config.mode === 'specific' && (
              <>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Time Range
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="From"
                          value={config.startDate}
                          onChange={(newValue) => handleDateRangeChange(newValue, null)}
                          maxDate={config.endDate}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !config.isDateRangeValid
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="To"
                          value={config.endDate}
                          onChange={(newValue) => handleDateRangeChange(null, newValue)}
                          minDate={config.startDate}
                          maxDate={new Date()}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !config.isDateRangeValid
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                    {!config.isDateRangeValid && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        Please select a valid date range (up to 2 years, not in the future)
                      </Alert>
                    )}
                  </LocalizationProvider>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Influencer Name
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Enter influencer name"
                    value={config.influencerName}
                    onChange={(e) => setConfig({ ...config, influencerName: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Products to Find Per Influencer
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={config.productsCount}
                    onChange={handleProductsCountChange}
                    inputProps={{
                      min: 0,
                      max: 10,
                      step: 1
                    }}
                    helperText="Set to 0 to skip product research (max: 10)"
                    FormHelperTextProps={{
                      sx: { color: 'text.secondary' }
                    }}
                    sx={{
                      '& input': {
                        color: 'white'
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.23)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.4)'
                        }
                      }
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Claims to Analyze
                  </Typography>
                  <TextField
                    type="number"
                    value={config.claimsToAnalyze}
                    onChange={(e) => setConfig({ ...config, claimsToAnalyze: parseInt(e.target.value) || 50 })}
                    helperText="Recommended: 50-100 claims for comprehensive analysis"
                    fullWidth
                  />
                </Box>
              </>
            )}

            {config.mode === 'discover' && (
              <>
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Health Categories
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select the health fields you want to explore
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {HEALTH_CATEGORIES.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        onClick={() => {
                          const categories = config.selectedCategories.includes(category)
                            ? config.selectedCategories.filter(c => c !== category)
                            : [...config.selectedCategories, category];
                          setConfig({ ...config, selectedCategories: categories });
                        }}
                        color={config.selectedCategories.includes(category) ? 'primary' : 'default'}
                        variant={config.selectedCategories.includes(category) ? 'filled' : 'outlined'}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Number of Influencers
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={config.influencersCount}
                    onChange={(e) => setConfig({ ...config, influencersCount: Math.max(1, Math.min(50, parseInt(e.target.value) || 10)) })}
                    inputProps={{
                      min: 1,
                      max: 50,
                      step: 1
                    }}
                    helperText="How many influencers to discover (max: 50)"
                  />
                </Box>
              </>
            )}

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.includeRevenue}
                    onChange={(e) => setConfig({ ...config, includeRevenue: e.target.checked })}
                    color="primary"
                  />
                }
                label="Include Revenue Analysis"
              />
              <Typography variant="body2" color="text.secondary">
                Analyze monetization methods and estimate earnings
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.verifyWithJournals}
                    onChange={(e) => setConfig({ ...config, verifyWithJournals: e.target.checked })}
                    color="primary"
                  />
                }
                label="Verify with Scientific Journals"
              />
              <Typography variant="body2" color="text.secondary">
                Cross-reference claims with scientific literature
              </Typography>
            </Box>

            {config.verifyWithJournals && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Scientific Journals
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {SCIENTIFIC_JOURNALS.map((journal) => (
                    <Chip
                      key={journal}
                      label={journal}
                      onClick={() => {
                        const journals = config.selectedJournals.includes(journal)
                          ? config.selectedJournals.filter(j => j !== journal)
                          : [...config.selectedJournals, journal];
                        setConfig({ ...config, selectedJournals: journals });
                      }}
                      color={config.selectedJournals.includes(journal) ? 'primary' : 'default'}
                      variant={config.selectedJournals.includes(journal) ? 'filled' : 'outlined'}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartResearch}
                disabled={
                  (config.mode === 'specific' && (!config.influencerName || !config.isDateRangeValid)) ||
                  (config.mode === 'discover' && config.selectedCategories.length === 0)
                }
                startIcon={<Search />}
              >
                Start Research
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ResearchConfig; 