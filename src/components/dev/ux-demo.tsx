import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OfflineStatus } from '@/components/ui/offline-status';
import { FormProgress } from '@/components/ui/form-progress';
import { FormTemplates } from './form-templates';
import { useEnhancedNotifications } from '@/components/ui/enhanced-notifications';
import { 
  Bell, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Upload,
  Download,
  Zap,
  Building,
  Home
} from 'lucide-react';

export default function UXDemoPage() {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showOffline, 
    showSync 
  } = useEnhancedNotifications();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [demoStep, setDemoStep] = useState(0);

  // Demo form steps
  const formSteps = [
    {
      id: 'school',
      title: 'School Information',
      description: 'Select the school for this inspection',
      completed: true,
      required: true
    },
    {
      id: 'date',
      title: 'Date and Time',
      description: 'When was this inspection performed?',
      completed: true,
      required: true
    },
    {
      id: 'location',
      title: 'Location Details',
      description: 'Specify the exact location',
      completed: false,
      required: true,
      error: 'Please fill in the location field'
    },
    {
      id: 'categories',
      title: 'Inspection Categories',
      description: 'Select categories to inspect',
      completed: true,
      required: false
    },
    {
      id: 'photos',
      title: 'Photos and Notes',
      description: 'Add photos and detailed notes',
      completed: false,
      required: true,
      error: 'At least one photo is required'
    }
  ];

  const demoActions = [
    {
      title: 'Success Notification',
      description: 'Shows when forms are submitted successfully',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      action: () => showSuccess(
        'Form Submitted Successfully!',
        'Your inspection has been saved to the database and is ready for review.',
        { duration: 5000 }
      )
    },
    {
      title: 'Error Notification',
      description: 'Shows validation errors and issues',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      action: () => showError(
        'Validation Error',
        'Please fill in all required fields before submitting the form.',
        { 
          actions: [
            {
              label: 'Fix Now',
              action: () => console.log('Navigate to form'),
              variant: 'default' as const
            }
          ]
        }
      )
    },
    {
      title: 'Warning Notification',
      description: 'Shows important warnings and notices',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      action: () => showWarning(
        'Low Storage Space',
        'You have less than 100MB of storage remaining. Consider cleaning up old files.',
        { 
          actions: [
            {
              label: 'Clean Up',
              action: () => console.log('Open cleanup'),
              variant: 'outline' as const
            }
          ]
        }
      )
    },
    {
      title: 'Info Notification',
      description: 'Shows helpful information and tips',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      action: () => showInfo(
        'New Feature Available',
        'You can now use voice input to fill out forms faster. Try saying "Classroom A" to auto-fill location.',
        { duration: 8000 }
      )
    },
    {
      title: 'Offline Notification',
      description: 'Shows when the app goes offline',
      icon: <WifiOff className="w-5 h-5 text-orange-600" />,
      action: () => showOffline(
        'You\'re Offline',
        'Your forms are being saved locally and will sync when you\'re back online.',
        { 
          actions: [
            {
              label: 'View Pending',
              action: () => console.log('Show pending forms'),
              variant: 'outline' as const
            }
          ]
        }
      )
    },
    {
      title: 'Sync Notification',
      description: 'Shows when forms are being synchronized',
      icon: <Upload className="w-5 h-5 text-blue-600" />,
      action: () => showSync(
        'Syncing Forms',
        'Your offline forms are being submitted to the server.',
        { duration: 3000 }
      )
    }
  ];

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    // Simulate network change
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: !isOnline
    });
    
    // Trigger online/offline events
    window.dispatchEvent(new Event(isOnline ? 'offline' : 'online'));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          🎨 UX Features Demonstration
        </h1>
        <p className="text-muted-foreground">
          Explore the enhanced user experience features of Custodial Command
        </p>
      </div>

      {/* Offline Status Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="w-5 h-5" />
            <span>Offline Status Component</span>
          </CardTitle>
          <CardDescription>
            Real-time connection status with pending form tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Current status: {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button variant="outline" onClick={toggleOnlineStatus}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Live Offline Status Component:</h4>
            <OfflineStatus />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Notifications Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Enhanced Notifications</span>
          </CardTitle>
          <CardDescription>
            Rich notifications with actions, auto-dismiss, and different types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoActions.map((action, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                {action.icon}
                <div className="flex-1">
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={action.action}>
                  Test
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Progress Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Form Progress Tracking</span>
          </CardTitle>
          <CardDescription>
            Visual progress indicators with step-by-step completion tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
              disabled={demoStep === 0}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDemoStep(Math.min(formSteps.length - 1, demoStep + 1))}
              disabled={demoStep === formSteps.length - 1}
            >
              Next
            </Button>
            <Badge variant="secondary">
              Step {demoStep + 1} of {formSteps.length}
            </Badge>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Live Form Progress Component:</h4>
            <FormProgress 
              steps={formSteps.map((step, index) => ({
                ...step,
                completed: index <= demoStep
              }))}
              currentStep={formSteps[demoStep]?.id}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Templates Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Form Templates System</span>
          </CardTitle>
          <CardDescription>
            Pre-configured templates for quick form starts with category filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Template Selection:</h4>
            <FormTemplates 
              onSelectTemplate={(template: any) => {
                showSuccess(
                  'Template Selected!',
                  `You've selected the "${template.name}" template. This will pre-fill your form with common settings.`,
                  { duration: 5000 }
                );
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* PWA Features Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>PWA Features</span>
          </CardTitle>
          <CardDescription>
            Progressive Web App capabilities including installation and offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-medium">Install App</h4>
              <p className="text-sm text-muted-foreground">
                Add to home screen for quick access
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-medium">App Shortcuts</h4>
              <p className="text-sm text-muted-foreground">
                Quick actions from home screen
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🌐</div>
              <h4 className="font-medium">Offline Sync</h4>
              <p className="text-sm text-muted-foreground">
                Work without internet connection
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => showInfo(
                'PWA Installation',
                'To install this app, look for the install button in your browser\'s address bar, or use the Share menu on mobile devices.',
                { duration: 8000 }
              )}
            >
              Learn How to Install
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>🎉 UX Enhancement Summary</CardTitle>
          <CardDescription>
            Your Custodial Command app now provides a professional, native app-like experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">✅ Enhanced Features:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Rich notification system with actions</li>
                <li>• Real-time offline status tracking</li>
                <li>• Visual form progress indicators</li>
                <li>• Pre-configured form templates</li>
                <li>• Professional PWA installation</li>
                <li>• Complete offline functionality</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🚀 User Benefits:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Work completely offline</li>
                <li>• Get instant feedback on actions</li>
                <li>• Start forms faster with templates</li>
                <li>• Track progress visually</li>
                <li>• Install as native app</li>
                <li>• Never lose data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
