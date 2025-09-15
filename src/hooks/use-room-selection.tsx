import { useState, useCallback } from 'react';

export interface RoomSelectionState {
  selectedCategory: string | null;
  selectedRoom: string | null;
  availableRooms: string[];
}

export const useRoomSelection = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);

  // Generate room options based on category
  const generateRoomOptions = useCallback((category: string, count: number): string[] => {
    const roomOptions: string[] = [];
    
    switch (category) {
      case 'exterior':
        roomOptions.push('Main Entrance', 'Parking Lot', 'Sidewalk', 'Landscaping');
        break;
      case 'gym_bleachers':
        roomOptions.push('Main Gym Floor', 'Bleachers', 'Equipment Storage');
        break;
      case 'classroom':
        roomOptions.push('Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202', 'Room 203', 'Room 301', 'Room 302', 'Room 303');
        break;
      case 'cafeteria':
        roomOptions.push('Main Dining Area', 'Kitchen', 'Storage Room');
        break;
      case 'utility_storage':
        roomOptions.push('Utility Room A', 'Storage Closet B', 'Maintenance Room');
        break;
      case 'admin_office':
        roomOptions.push('Main Office', 'Principal Office', 'Reception Area', 'Conference Room');
        break;
      case 'hallway':
        roomOptions.push('Main Hallway 1st Floor', 'Main Hallway 2nd Floor', 'Main Hallway 3rd Floor', 'Side Hallway A', 'Side Hallway B');
        break;
      case 'stairwell':
        roomOptions.push('Main Stairwell A', 'Main Stairwell B', 'Emergency Stairwell');
        break;
      case 'restroom':
        roomOptions.push('Restroom 1A', 'Restroom 1B', 'Restroom 2A', 'Restroom 2B', 'Restroom 3A');
        break;
      case 'staff_single_restroom':
        roomOptions.push('Staff Restroom', 'Single Occupancy Restroom');
        break;
      default:
        roomOptions.push('Room 1', 'Room 2', 'Room 3');
    }

    // Return only the number of rooms needed
    return roomOptions.slice(0, count);
  }, []);

  // Select a category and generate room options
  const selectCategory = useCallback((category: string, requiredCount: number) => {
    setSelectedCategory(category);
    const rooms = generateRoomOptions(category, requiredCount);
    setAvailableRooms(rooms);
    setSelectedRoom(null); // Reset room selection
  }, [generateRoomOptions]);

  // Select a specific room
  const selectRoom = useCallback((room: string) => {
    setSelectedRoom(room);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCategory(null);
    setSelectedRoom(null);
    setAvailableRooms([]);
  }, []);

  // Check if a room is available for selection
  const isRoomAvailable = useCallback((room: string) => {
    return availableRooms.includes(room);
  }, [availableRooms]);

  // Get next available room
  const getNextAvailableRoom = useCallback(() => {
    const unselectedRooms = availableRooms.filter(room => room !== selectedRoom);
    return unselectedRooms.length > 0 ? unselectedRooms[0] : null;
  }, [availableRooms, selectedRoom]);

  return {
    // State
    selectedCategory,
    selectedRoom,
    availableRooms,
    
    // Actions
    selectCategory,
    selectRoom,
    clearSelection,
    
    // Utilities
    isRoomAvailable,
    getNextAvailableRoom,
    generateRoomOptions,
  };
};
