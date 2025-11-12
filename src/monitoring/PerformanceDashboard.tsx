import React, { useEffect, useState } from 'react';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { PerformanceMetrics, checkPerformanceBudget, getPerformanceMetrics } from './performance';

interface MetricCardProps {
  title: string;
  value: number | null;
  unit: string;
  threshold: number;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, threshold, description }) => {
  const getStatus = () => {
    if (value === null) return 'loading';
    return value <= threshold ? 'good' : 'poor';
  };

  const getColor = ():
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning'
    | 'inherit' => {
    const status = getStatus();
    switch (status) {
      case 'good':
        return 'success';
      case 'poor':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getIcon = () => {
    const status = getStatus();
    switch (status) {
      case 'good':
        return <CheckCircleIcon color="success" />;
      case 'poor':
        return <WarningIcon color="error" />;
      default:
        return <SpeedIcon />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {getIcon()}
        </Box>

        <Typography variant="h4" component="div" color={getColor()}>
          {value !== null ? `${Math.round(value)}${unit}` : 'Loading...'}
        </Typography>

        <Box mt={1}>
          <Chip label={`Target: ≤${threshold}${unit}`} size="small" variant="outlined" />
        </Box>

        <Typography variant="body2" color="text.secondary" mt={1}>
          {description}
        </Typography>

        {value !== null && (
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={Math.min((value / threshold) * 100, 100)}
              color={getColor()}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: null,
    fcp: null,
    inp: null,
    lcp: null,
    ttfb: null,
    bundleSize: null,
    loadTime: null,
  });

  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      const currentMetrics = getPerformanceMetrics();
      setMetrics(currentMetrics);

      const currentViolations = checkPerformanceBudget();
      setViolations(currentViolations);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const coreWebVitals = [
    {
      title: 'Largest Contentful Paint',
      value: metrics.lcp,
      unit: 'ms',
      threshold: 2500,
      description: 'Time until the largest content element is rendered',
    },
    {
      title: 'Interaction to Next Paint',
      value: metrics.inp,
      unit: 'ms',
      threshold: 200,
      description: 'Time from user interaction to visual response',
    },
    {
      title: 'Cumulative Layout Shift',
      value: metrics.cls ? metrics.cls * 1000 : null, // Convert to more readable scale
      unit: '',
      threshold: 100, // 0.1 * 1000
      description: 'Visual stability - how much content shifts during load',
    },
  ];

  const additionalMetrics = [
    {
      title: 'First Contentful Paint',
      value: metrics.fcp,
      unit: 'ms',
      threshold: 1800,
      description: 'Time until first content is painted',
    },
    {
      title: 'Time to First Byte',
      value: metrics.ttfb,
      unit: 'ms',
      threshold: 800,
      description: 'Time until first byte is received from server',
    },
    {
      title: 'Bundle Size',
      value: metrics.bundleSize ? metrics.bundleSize / 1024 : null,
      unit: 'KB',
      threshold: 500,
      description: 'Total size of JavaScript and CSS bundles',
    },
  ];

  // Only show in development or when explicitly enabled
  if (import.meta.env.PROD && import.meta.env.VITE_SHOW_PERFORMANCE_DASHBOARD !== 'true') {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Performance Dashboard
      </Typography>

      {violations.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'error.light' }}>
          <CardContent>
            <Typography variant="h6" color="error">
              Performance Budget Violations
            </Typography>
            {violations.map((violation, index) => (
              <Typography key={index} variant="body2" color="error">
                • {violation}
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Core Web Vitals</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {coreWebVitals.map((metric, index) => (
              <Grid item xs={12} md={4} key={index}>
                <MetricCard {...metric} />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Additional Metrics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {additionalMetrics.map((metric, index) => (
              <Grid item xs={12} md={4} key={index}>
                <MetricCard {...metric} />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Performance Thresholds</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Good</TableCell>
                  <TableCell>Needs Improvement</TableCell>
                  <TableCell>Poor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>LCP</TableCell>
                  <TableCell>≤ 2.5s</TableCell>
                  <TableCell>2.5s - 4.0s</TableCell>
                  <TableCell>&gt; 4.0s</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>INP</TableCell>
                  <TableCell>≤ 200ms</TableCell>
                  <TableCell>200ms - 500ms</TableCell>
                  <TableCell>&gt; 500ms</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CLS</TableCell>
                  <TableCell>≤ 0.1</TableCell>
                  <TableCell>0.1 - 0.25</TableCell>
                  <TableCell>&gt; 0.25</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bundle Size</TableCell>
                  <TableCell>≤ 500KB</TableCell>
                  <TableCell>500KB - 1MB</TableCell>
                  <TableCell>&gt; 1MB</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default PerformanceDashboard;
