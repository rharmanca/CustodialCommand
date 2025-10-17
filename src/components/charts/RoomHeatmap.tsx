import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Calendar, Star, Eye, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface RoomData {
  number: string;
  rating: number;
  school: string;
  lastInspection: string;
  inspectionHistory?: Array<{
    date: string;
    rating: number;
    inspector?: string;
    notes?: string;
  }>;
  photos?: string[];
  categories?: Record<string, number>;
}

interface RoomHeatmapProps {
  data: RoomData[];
  title?: string;
  description?: string;
  maxRoomsPerRow?: number;
  onRoomClick?: (room: RoomData) => void;
}

const RoomHeatmap: React.FC<RoomHeatmapProps> = ({ 
  data, 
  title = "Room Performance Heatmap", 
  description = "Visual overview of room performance ratings",
  maxRoomsPerRow = 8,
  onRoomClick
}) => {
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-800 border-green-200';
    if (rating >= 3.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rating >= 2.5) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Fair';
    return 'Needs Attention';
  };

  const getSeverityLevel = (rating: number) => {
    if (rating < 2.0) return { level: 'critical', color: '#EF4444', icon: AlertTriangle };
    if (rating < 3.0) return { level: 'needs-attention', color: '#F59E0B', icon: AlertCircle };
    return { level: 'acceptable', color: '#10B981', icon: CheckCircle };
  };

  const handleRoomClick = (room: RoomData) => {
    setSelectedRoom(room);
    onRoomClick?.(room);
  };

  // Group rooms by school
  const groupedData = data.reduce((acc, room) => {
    if (!acc[room.school]) {
      acc[room.school] = [];
    }
    acc[room.school].push(room);
    return acc;
  }, {} as Record<string, RoomData[]>);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedData).map(([school, rooms]) => (
            <div key={school} className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">{school}</h3>
                <span className="text-sm text-muted-foreground">
                  ({rooms.length} rooms)
                </span>
              </div>
              
              <div className="grid gap-2" style={{ 
                gridTemplateColumns: `repeat(${Math.min(maxRoomsPerRow, rooms.length)}, 1fr)` 
              }}>
                {rooms.map((room) => (
                  <Dialog key={`${school}-${room.number}`}>
                    <DialogTrigger asChild>
                      <div
                        className={`
                          p-3 text-center text-xs rounded-lg border-2 transition-all duration-200 hover:scale-105 cursor-pointer
                          ${getRatingColor(room.rating)}
                        `}
                        title={`Room ${room.number}: ${room.rating.toFixed(1)}/5 - ${getRatingLabel(room.rating)}`}
                        onClick={() => handleRoomClick(room)}
                      >
                        <div className="font-bold text-sm mb-1">
                          {room.number}
                        </div>
                        <div className="text-xs opacity-75">
                          {room.rating.toFixed(1)}
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Room {room.number} - {room.school}
                        </DialogTitle>
                        <DialogDescription>
                          Detailed performance analysis and inspection history
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Performance Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="w-4 h-4" />
                                <span className="text-sm font-medium">Current Rating</span>
                              </div>
                              <div className="text-2xl font-bold" style={{ color: getSeverityLevel(room.rating).color }}>
                                {room.rating.toFixed(1)}/5
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getRatingLabel(room.rating)}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Last Inspection</span>
                              </div>
                              <div className="text-lg font-semibold">
                                {new Date(room.lastInspection).toLocaleDateString()}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {React.createElement(getSeverityLevel(room.rating).icon, { className: "w-4 h-4" })}
                                <span className="text-sm font-medium">Status</span>
                              </div>
                              <Badge 
                                variant={getSeverityLevel(room.rating).level === 'critical' ? 'destructive' : 
                                        getSeverityLevel(room.rating).level === 'needs-attention' ? 'secondary' : 'default'}
                                className="text-xs"
                              >
                                {getSeverityLevel(room.rating).level.replace('-', ' ').toUpperCase()}
                              </Badge>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Category Breakdown */}
                        {room.categories && (
                          <div>
                            <h4 className="text-sm font-medium mb-3">Category Performance</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(room.categories).map(([category, rating]) => (
                                <div key={category} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                  <span className="text-sm">{category}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                                    {rating < 3.0 && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inspection History */}
                        {room.inspectionHistory && room.inspectionHistory.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-3">Inspection History</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {room.inspectionHistory.slice(0, 5).map((inspection, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                                  <div>
                                    <span className="font-medium">{new Date(inspection.date).toLocaleDateString()}</span>
                                    {inspection.inspector && (
                                      <span className="text-muted-foreground ml-2">by {inspection.inspector}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{inspection.rating.toFixed(1)}</span>
                                    {inspection.rating < 3.0 && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Photos */}
                        {room.photos && room.photos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-3">Inspection Photos</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {room.photos.slice(0, 4).map((photo, index) => (
                                <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                                  <img 
                                    src={photo} 
                                    alt={`Room ${room.number} photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          ))}
          
          {/* Legend */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Performance Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                <span className="text-muted-foreground">Excellent (4.5+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
                <span className="text-muted-foreground">Good (3.5-4.4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
                <span className="text-muted-foreground">Fair (2.5-3.4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                <span className="text-muted-foreground">Needs Attention (&lt;2.5)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomHeatmap;
