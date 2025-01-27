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
  IconButton,
  Chip,
  Stack,
  InputAdornment,
  Link
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SCIENTIFIC_JOURNALS = [
  'PubMed Central',
  'Nature',
  'Science',
  'Cell',
  'The Lancet',
  'New England Journal of Medicine',
  'JAMA Network'
];

const TIME_RANGES = [
  'Last Week',
  'Last Month',
  'Last Year',
  'All Time'
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
    notes: ''
  });

  const handleStartResearch = () => {
    onStartResearch(config);
    if (config.mode === 'specific' && config.influencerName) {
      navigate(`/profile/${encodeURIComponent(config.influencerName)}`);
    } else {
      navigate('/leaderboard');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
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

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Time Range
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {TIME_RANGES.map((range) => (
                  <Chip
                    key={range}
                    label={range}
                    onClick={() => setConfig({ ...config, timeRange: range })}
                    color={config.timeRange === range ? 'primary' : 'default'}
                    variant={config.timeRange === range ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>

            {config.mode === 'specific' && (
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
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Products to Find Per Influencer
              </Typography>
              <TextField
                type="number"
                value={config.productsCount}
                onChange={(e) => setConfig({ ...config, productsCount: parseInt(e.target.value) || 10 })}
                helperText="Set to 0 to skip product research"
                fullWidth
              />
            </Box>

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
                  <IconButton color="primary" size="small">
                    <AddIcon />
                  </IconButton>
                </Stack>
              </Box>
            )}

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

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Notes for Research Assistant
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Add any specific instructions or focus areas..."
                value={config.notes}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartResearch}
                disabled={config.mode === 'specific' && !config.influencerName}
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