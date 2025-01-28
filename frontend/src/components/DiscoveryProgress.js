import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Search,
  Group,
  VerifiedUser,
  CheckCircle,
  Error
} from '@mui/icons-material';

const DISCOVERY_STAGES = [
  {
    key: 'searching',
    label: 'Finding Influencers',
    icon: <Search />,
    description: 'Searching for top health influencers in selected categories'
  },
  {
    key: 'analyzing',
    label: 'Analyzing Profiles',
    icon: <Group />,
    description: 'Gathering and analyzing influencer profiles and content'
  },
  {
    key: 'verifying',
    label: 'Verifying Claims',
    icon: <VerifiedUser />,
    description: 'Cross-referencing health claims with scientific journals'
  },
  {
    key: 'complete',
    label: 'Research Complete',
    icon: <CheckCircle />,
    description: 'Discovery research completed successfully'
  }
];

function DiscoveryProgress({ currentStage, error, logs = [] }) {
  const activeStep = DISCOVERY_STAGES.findIndex(stage => stage.key === currentStage);
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
          Discovering Health Influencers
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel>
          {DISCOVERY_STAGES.map(({ label, icon }) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {icon}
                    {currentStage === label && (
                      <CircularProgress
                        size={24}
                        sx={{
                          position: 'absolute',
                          color: 'primary.main'
                        }}
                      />
                    )}
                  </Box>
                )}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current Progress:
          </Typography>
          <Typography color="text.secondary" paragraph>
            {DISCOVERY_STAGES[activeStep]?.description || 'Initializing research...'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {logs.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Research Logs:
            </Typography>
            <List>
              {logs.map((log, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {log.stage === 'error' ? (
                      <Error color="error" />
                    ) : (
                      <CheckCircle color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={log.message}
                    secondary={new Date(log.timestamp).toLocaleTimeString()}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default DiscoveryProgress; 