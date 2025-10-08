import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building } from 'lucide-react';

interface RoomData {
  number: string;
  rating: number;
  school: string;
  lastInspection: string;
}

interface RoomHeatmapProps {
  data: RoomData[];
  title?: string;
  description?: string;
  maxRoomsPerRow?: number;
}

const RoomHeatmap: React.FC<RoomHeatmapProps> = ({ 
  data, 
  title = "Room Performance Heatmap", 
  description = "Visual overview of room performance ratings",
  maxRoomsPerRow = 8
}) => {
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
                  <div
                    key={`${school}-${room.number}`}
                    className={`
                      p-3 text-center text-xs rounded-lg border-2 transition-all duration-200 hover:scale-105 cursor-pointer
                      ${getRatingColor(room.rating)}
                    `}
                    title={`Room ${room.number}: ${room.rating.toFixed(1)}/5 - ${getRatingLabel(room.rating)}`}
                  >
                    <div className="font-bold text-sm mb-1">
                      {room.number}
                    </div>
                    <div className="text-xs opacity-75">
                      {room.rating.toFixed(1)}
                    </div>
                  </div>
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
