import React, { useEffect, useState } from 'react';

import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabletIcon from '@mui/icons-material/Tablet';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';

import {
  type TouchGesture,
  getViewportSize,
  isLandscape,
  isMobile,
  isTouch,
  useTouch,
} from './touchEnhancements';

const MobileTestSuite: React.FC = () => {
  const [gestures, setGestures] = useState<TouchGesture[]>([]);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTouch: false,
    viewport: { width: 0, height: 0 },
    isLandscape: false,
    userAgent: '',
    pixelRatio: 1,
  });

  const handleTouch = (gesture: TouchGesture) => {
    setGestures((prev) => [gesture, ...prev.slice(0, 9)]); // Keep last 10 gestures
  };

  const touchRef = useTouch(handleTouch, {
    swipeThreshold: 30,
    longPressDelay: 500,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo({
        isMobile: isMobile(),
        isTouch: isTouch(),
        viewport: getViewportSize(),
        isLandscape: isLandscape(),
        userAgent: navigator.userAgent,
        pixelRatio: window.devicePixelRatio || 1,
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  const getDeviceIcon = () => {
    if (deviceInfo.isMobile) {
      return deviceInfo.viewport.width > 768 ? <TabletIcon /> : <PhoneAndroidIcon />;
    }
    return <DesktopWindowsIcon />;
  };

  const getDeviceType = () => {
    if (deviceInfo.isMobile) {
      return deviceInfo.viewport.width > 768 ? 'Tablet' : 'Mobile';
    }
    return 'Desktop';
  };

  const clearGestures = () => {
    setGestures([]);
  };

  // Only show in development
  if (import.meta.env.PROD && import.meta.env.VITE_SHOW_MOBILE_TEST !== 'true') {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Mobile Test Suite
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {getDeviceIcon()}
                <Typography variant="h6" ml={1}>
                  Device Information
                </Typography>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemText primary="Device Type" secondary={getDeviceType()} />
                  <Chip
                    label={deviceInfo.isMobile ? 'Mobile' : 'Desktop'}
                    color={deviceInfo.isMobile ? 'primary' : 'default'}
                    size="small"
                  />
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Touch Support"
                    secondary={deviceInfo.isTouch ? 'Supported' : 'Not supported'}
                  />
                  <Chip
                    label={deviceInfo.isTouch ? 'Touch' : 'No Touch'}
                    color={deviceInfo.isTouch ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Viewport"
                    secondary={`${deviceInfo.viewport.width} × ${deviceInfo.viewport.height}`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Orientation"
                    secondary={deviceInfo.isLandscape ? 'Landscape' : 'Portrait'}
                  />
                  <Chip label={deviceInfo.isLandscape ? 'Landscape' : 'Portrait'} size="small" />
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Pixel Ratio"
                    secondary={deviceInfo.pixelRatio.toString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TouchAppIcon />
                <Typography variant="h6" ml={1}>
                  Touch Test Area
                </Typography>
                <Button size="small" onClick={clearGestures} sx={{ ml: 'auto' }}>
                  Clear
                </Button>
              </Box>

              <Box
                ref={touchRef}
                sx={{
                  height: 200,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'action.hover',
                  cursor: 'pointer',
                  userSelect: 'none',
                  mb: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  {deviceInfo.isTouch
                    ? 'Try touch gestures: tap, swipe, long press, pinch'
                    : 'Click to test mouse interactions'}
                </Typography>
              </Box>

              {gestures.length === 0 ? (
                <Alert severity="info">
                  No gestures detected yet. Try interacting with the test area above.
                </Alert>
              ) : (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Gestures:
                  </Typography>
                  <List dense>
                    {gestures.map((gesture, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip label={gesture.type} size="small" color="primary" />
                                {gesture.direction && (
                                  <Chip label={gesture.direction} size="small" variant="outlined" />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                {gesture.distance && `Distance: ${Math.round(gesture.distance)}px`}
                                {gesture.duration && ` Duration: ${gesture.duration}ms`}
                                {gesture.scale && ` Scale: ${gesture.scale.toFixed(2)}`}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < gestures.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MobileTestSuite;
