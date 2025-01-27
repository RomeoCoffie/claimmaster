import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TopicAnalysis = ({ claims }) => {
  // Calculate topic distribution and trust scores
  const topicStats = claims.reduce((acc, claim) => {
    if (!acc[claim.category]) {
      acc[claim.category] = {
        count: 0,
        totalTrustScore: 0,
        verified: 0,
        questionable: 0,
        debunked: 0
      };
    }
    
    acc[claim.category].count += 1;
    acc[claim.category].totalTrustScore += claim.trustScore;
    acc[claim.category][claim.status] += 1;
    
    return acc;
  }, {});

  const topics = Object.keys(topicStats);
  const averageTrustScores = topics.map(topic => 
    topicStats[topic].totalTrustScore / topicStats[topic].count
  );
  const verifiedCounts = topics.map(topic => topicStats[topic].verified);
  const questionableCounts = topics.map(topic => topicStats[topic].questionable);
  const debunkedCounts = topics.map(topic => topicStats[topic].debunked);

  const data = {
    labels: topics,
    datasets: [
      {
        label: 'Average Trust Score',
        data: averageTrustScores,
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        yAxisID: 'y'
      },
      {
        label: 'Verified Claims',
        data: verifiedCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        yAxisID: 'y1'
      },
      {
        label: 'Questionable Claims',
        data: questionableCounts,
        backgroundColor: 'rgba(255, 206, 86, 0.8)',
        yAxisID: 'y1'
      },
      {
        label: 'Debunked Claims',
        data: debunkedCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Trust Score'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Number of Claims'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Topic Analysis'
      }
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Topic Analysis
      </Typography>
      <Box sx={{ height: 400 }}>
        <Bar data={data} options={options} />
      </Box>
    </Paper>
  );
};

export default TopicAnalysis; 