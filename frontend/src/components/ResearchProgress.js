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
  Assignment,
  VerifiedUser,
  CheckCircle,
  Error
} from '@mui/icons-material';

const RESEARCH_STAGES = [
  {
    key: 'Searching for influencer',
    label: 'Searching for influencer',
    icon: <Search />,
    description: 'Finding and analyzing the influencer profile'
  },
  {
    key: 'gathering_claims',
    label: 'Gathering influencer claims',
    icon: <Assignment />,
    description: 'Collecting recent health claims and content'
  },
  {
    key: 'verifying_claims',
    label: 'Verifying influencer claims',
    icon: <VerifiedUser />,
    description: 'Cross-referencing claims with scientific journals'
  },
  {
    key: 'Ready',
    label: 'Research Complete',
    icon: <CheckCircle />,
    description: 'Analysis completed successfully'
  }
];

const ResearchProgress = ({ currentStage, error, logs = [] }) => {
  const activeStep = RESEARCH_STAGES.findIndex(stage => stage.key === currentStage);
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
          Researching Influencer
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel>
          {RESEARCH_STAGES.map(({ label, icon }) => (
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
            {RESEARCH_STAGES[activeStep]?.description || 'Initializing research...'}
          </Typography>
        </Box>

        {logs.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Research Log:
            </Typography>
            <List>
              {logs.map((log, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {log.stage === 'error' ? <Error color="error" /> : <CheckCircle color="success" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={log.message}
                    secondary={new Date(log.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 4 }}
            action={
              <Typography variant="caption" sx={{ display: 'block' }}>
                {new Date().toLocaleString()}
              </Typography>
            }
          >
            {error}
          </Alert>
        )}

        {currentStage !== 'Ready' && !error && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={40} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ResearchProgress; 