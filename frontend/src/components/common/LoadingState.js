import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingState = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: 2
    }}
  >
    <CircularProgress color="primary" />
    <Typography color="textSecondary">{message}</Typography>
  </Box>
);

export default LoadingState; 