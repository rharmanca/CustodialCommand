import React, { useState } from 'react';
import { FileText, Clock, Star, Zap, Building, Home, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'quick' | 'standard' | 'comprehensive';
  estimatedTime: string;
  fields: {
    [key: string]: any;
  };
  categories: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

const formTemplates: FormTemplate[] = [
  {
    id: 'quick-room-check',
    name: 'Quick Room Check',
    description: 'Fast 2-minute inspection for common areas',
    icon: <Zap className="w-5 h-5" />,
    category: 'quick',
    estimatedTime: '2 minutes',
    fields: {
      school: '',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationCategory: 'classroom',
    },
    categories: ['customerSatisfaction', 'trash'],
    isPopular: true,
  },
  {
    id: 'monthly-building',
    name: 'Monthly Building Inspection',
    description: 'Comprehensive monthly review of entire building',
    icon: <Building className="w-5 h-5" />,
    category: 'comprehensive',
    estimatedTime: '15-20 minutes',
    fields: {
      school: '',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'whole_building',
      buildingName: '',
    },
    categories: ['floors', 'restrooms', 'equipment', 'safetyCompliance'],
    isPopular: true,
  },
  {
    id: 'restroom-focus',
    name: 'Restroom Focus',
    description: 'Detailed restroom and hygiene inspection',
    icon: <Home className="w-5 h-5" />,
    category: 'standard',
    estimatedTime: '5-8 minutes',
    fields: {
      school: '',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationCategory: 'restroom',
    },
    categories: ['restrooms', 'customerSatisfaction', 'safetyCompliance'],
  },
  {
    id: 'cafeteria-check',
    name: 'Cafeteria Check',
    description: 'Food service area cleanliness inspection',
    icon: <Users className="w-5 h-5" />,
    category: 'standard',
    estimatedTime: '5-7 minutes',
    fields: {
      school: '',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationCategory: 'cafeteria',
    },
    categories: ['floors', 'customerSatisfaction', 'trash', 'equipment'],
  },
  {
    id: 'safety-audit',
    name: 'Safety Audit',
    description: 'Comprehensive safety and compliance review',
    icon: <Star className="w-5 h-5" />,
    category: 'comprehensive',
    estimatedTime: '10-15 minutes',
    fields: {
      school: '',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
    },
    categories: ['safetyCompliance', 'equipment', 'monitoring', 'activitySupport'],
    isNew: true,
  },
  {
    id: 'custom',
    name: 'Custom Inspection',
    description: 'Start with a blank form and customize as needed',
    icon: <FileText className="w-5 h-5" />,
    category: 'standard',
    estimatedTime: 'Variable',
    fields: {
      school: '',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
    },
    categories: [],
  },
];

interface FormTemplatesProps {
  onSelectTemplate: (template: FormTemplate) => void;
  className?: string;
}

export function FormTemplates({ onSelectTemplate, className }: FormTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'All Templates', icon: <FileText className="w-4 h-4" /> },
    { id: 'quick', name: 'Quick', icon: <Zap className="w-4 h-4" /> },
    { id: 'standard', name: 'Standard', icon: <Clock className="w-4 h-4" /> },
    { id: 'comprehensive', name: 'Comprehensive', icon: <Star className="w-4 h-4" /> },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? formTemplates 
    : formTemplates.filter(template => template.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quick':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'standard':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'comprehensive':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Choose a Template</h2>
          <p className="text-muted-foreground mt-2">
            Start with a pre-configured template or create a custom inspection
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center space-x-2"
            >
              {category.icon}
              <span>{category.name}</span>
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {template.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.isPopular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        {template.isNew && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="mb-3">
                  {template.description}
                </CardDescription>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{template.estimatedTime}</span>
                  </div>
                  
                  {template.categories.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        Includes:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.categories.slice(0, 3).map((category) => (
                          <Badge key={category} variant="outline" className="text-xs">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                        {template.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.categories.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Preview Dialog */}
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {selectedTemplate?.icon}
                <span>{selectedTemplate?.name}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Estimated Time:</span>
                    <span className="ml-2 text-muted-foreground">{selectedTemplate.estimatedTime}</span>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <Badge variant="outline" className={`ml-2 ${getCategoryColor(selectedTemplate.category)}`}>
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                </div>
                
                {selectedTemplate.categories.length > 0 && (
                  <div>
                    <span className="font-medium text-sm">Inspection Categories:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTemplate.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    onSelectTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}>
                    Use This Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
