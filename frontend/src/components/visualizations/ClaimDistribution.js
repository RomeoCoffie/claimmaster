import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const ClaimDistribution = ({ claims }) => {
  // Calculate distribution
  const distribution = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: ['Verified', 'Questionable', 'Debunked'],
    datasets: [
      {
        data: [
          distribution.verified || 0,
          distribution.questionable || 0,
          distribution.debunked || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Claims Distribution'
      }
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Claims Distribution
      </Typography>
      <Box sx={{ height: 300 }}>
        <Doughnut data={data} options={options} />
      </Box>
    </Paper>
  );
};

export default ClaimDistribution; 