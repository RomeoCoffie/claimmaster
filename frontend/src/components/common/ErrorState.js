import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ErrorState = ({ 
  message = 'Something went wrong', 
  error = null,
  onRetry = null 
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: 2,
      p: 3,
      textAlign: 'center'
    }}
  >
    <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
    <Typography variant="h6" color="error">
      {message}
    </Typography>
    {error && (
      <Typography color="textSecondary" variant="body2">
        {error.toString()}
      </Typography>
    )}
    {onRetry && (
      <Button 
        variant="outlined" 
        color="primary" 
        onClick={onRetry}
        sx={{ mt: 2 }}
      >
        Try Again
      </Button>
    )}
  </Box>
);

export default ErrorState; 