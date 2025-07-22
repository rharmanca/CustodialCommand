
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminInspectionsPageProps {
  onBack?: () => void;
}

export default function AdminInspectionsPage({ onBack }: AdminInspectionsPageProps) {
  const { isMobile } = useIsMobile();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // School options
  const schoolOptions = [
    { value: 'ASA', label: 'ASA' },
    { value: 'LCA', label: 'LCA' },
    { value: 'GWC', label: 'GWC' },
    { value: 'OA', label: 'OA' },
    { value: 'CBR', label: 'CBR' },
    { value: 'WLC', label: 'WLC' }
  ];

  const [editForm, setEditForm] = useState({
    inspectorName: '',
    school: '',
    date: '',
    inspectionType: '',
    locationDescription: '',
    roomNumber: '',
    locationCategory: '',
    floors: null as number | null,
    verticalHorizontalSurfaces: null as number | null,
    ceiling: null as number | null,
    restrooms: null as number | null,
    customerSatisfaction: null as number | null,
    trash: null as number | null,
    projectCleaning: null as number | null,
    activitySupport: null as number | null,
    safetyCompliance: null as number | null,
    equipment: null as number | null,
    monitoring: null as number | null,
    notes: '',
    isCompleted: false
  });

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('admin-authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadInspections();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (loginForm.username === 'Admin' && loginForm.password === 'cacustodial') {
      setIsAuthenticated(true);
      localStorage.setItem('admin-authenticated', 'true');
      loadInspections();
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin-authenticated');
    setLoginForm({ username: '', password: '' });
  };

  const loadInspections = async () => {
    try {
      const response = await fetch('/api/inspections');
      if (response.ok) {
        const data = await response.json();
        setInspections(data);
      } else {
        console.error('Failed to fetch inspections');
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setInspections(prev => prev.filter(inspection => inspection.id !== id));
        alert('Inspection deleted successfully');
      } else {
        alert('Failed to delete inspection');
      }
    } catch (error) {
      console.error('Error deleting inspection:', error);
      alert('Error deleting inspection');
    }
  };

  const handleEdit = (inspection: any) => {
    setEditingInspection(inspection);
    setEditForm({
      inspectorName: inspection.inspectorName || '',
      school: inspection.school,
      date: inspection.date,
      inspectionType: inspection.inspectionType,
      locationDescription: inspection.locationDescription,
      roomNumber: inspection.roomNumber || '',
      locationCategory: inspection.locationCategory || '',
      floors: inspection.floors,
      verticalHorizontalSurfaces: inspection.verticalHorizontalSurfaces,
      ceiling: inspection.ceiling,
      restrooms: inspection.restrooms,
      customerSatisfaction: inspection.customerSatisfaction,
      trash: inspection.trash,
      projectCleaning: inspection.projectCleaning,
      activitySupport: inspection.activitySupport,
      safetyCompliance: inspection.safetyCompliance,
      equipment: inspection.equipment,
      monitoring: inspection.monitoring,
      notes: inspection.notes || '',
      isCompleted: inspection.isCompleted || false
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingInspection) return;

    try {
      const response = await fetch(`/api/inspections/${editingInspection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedInspection = await response.json();
        setInspections(prev => 
          prev.map(inspection => 
            inspection.id === editingInspection.id ? updatedInspection : inspection
          )
        );
        setIsEditDialogOpen(false);
        setEditingInspection(null);
        alert('Inspection updated successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to update inspection: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating inspection:', error);
      alert('Error updating inspection');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null) return 'bg-gray-100 text-gray-800';
    if (rating <= 2) return 'bg-red-100 text-red-800';
    if (rating <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>
              {loginError && (
                <div className="text-red-600 text-sm text-center">
                  {loginError}
                </div>
              )}
              <div className="flex gap-2">
                {onBack && (
                  <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                    Back
                  </Button>
                )}
                <Button type="submit" className="flex-1">
                  Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">Loading inspections...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-shrink-0">
            ← Back
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Admin - Manage Inspections</h1>
          <p className="text-gray-600 mt-2">View, edit, and delete inspections</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <div className="grid gap-4">
        {inspections.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">No inspections found</div>
            </CardContent>
          </Card>
        ) : (
          inspections.map((inspection) => (
            <Card key={inspection.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {inspection.school} - {inspection.locationDescription}
                    </CardTitle>
                    <CardDescription>
                      <div className="space-y-1">
                        <div>Date: {formatDate(inspection.date)}</div>
                        {inspection.inspectorName && (
                          <div>Inspector: {inspection.inspectorName}</div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{inspection.inspectionType}</Badge>
                          {inspection.isCompleted && (
                            <Badge variant="default">Completed</Badge>
                          )}
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isEditDialogOpen && editingInspection?.id === inspection.id} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(inspection)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Inspection</DialogTitle>
                          <DialogDescription>
                            Make changes to the inspection details
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-inspector">Inspector Name</Label>
                              <Input
                                id="edit-inspector"
                                value={editForm.inspectorName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, inspectorName: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-school">School</Label>
                              <Select
                                value={editForm.school}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, school: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {schoolOptions.map((school) => (
                                    <SelectItem key={school.value} value={school.value}>
                                      {school.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="edit-date">Date</Label>
                              <Input
                                id="edit-date"
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-type">Inspection Type</Label>
                              <Select
                                value={editForm.inspectionType}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, inspectionType: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single_room">Single Room</SelectItem>
                                  <SelectItem value="whole_building">Whole Building</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="edit-location">Location Description</Label>
                              <Input
                                id="edit-location"
                                value={editForm.locationDescription}
                                onChange={(e) => setEditForm(prev => ({ ...prev, locationDescription: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-room">Room Number</Label>
                              <Input
                                id="edit-room"
                                value={editForm.roomNumber}
                                onChange={(e) => setEditForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                              />
                            </div>
                          </div>
                          
                          {editForm.inspectionType === 'single_room' && (
                            <div className="space-y-4">
                              <h4 className="font-medium">Rating Categories (1-5, or leave empty for no rating)</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                  { key: 'floors', label: 'Floors' },
                                  { key: 'verticalHorizontalSurfaces', label: 'Surfaces' },
                                  { key: 'ceiling', label: 'Ceiling' },
                                  { key: 'restrooms', label: 'Restrooms' },
                                  { key: 'customerSatisfaction', label: 'Customer Satisfaction' },
                                  { key: 'trash', label: 'Trash' },
                                  { key: 'projectCleaning', label: 'Project Cleaning' },
                                  { key: 'activitySupport', label: 'Activity Support' },
                                  { key: 'safetyCompliance', label: 'Safety Compliance' },
                                  { key: 'equipment', label: 'Equipment' },
                                  { key: 'monitoring', label: 'Monitoring' }
                                ].map(({ key, label }) => (
                                  <div key={key}>
                                    <Label htmlFor={`edit-${key}`}>{label}</Label>
                                    <Input
                                      id={`edit-${key}`}
                                      type="number"
                                      min="1"
                                      max="5"
                                      value={editForm[key as keyof typeof editForm] as number || ''}
                                      onChange={(e) => setEditForm(prev => ({ 
                                        ...prev, 
                                        [key]: e.target.value ? parseInt(e.target.value) : null 
                                      }))}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea
                              id="edit-notes"
                              value={editForm.notes}
                              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Inspection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this inspection? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(inspection.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {inspection.inspectionType === 'single_room' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Ratings:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { key: 'floors', label: 'Floors' },
                        { key: 'verticalHorizontalSurfaces', label: 'Surfaces' },
                        { key: 'ceiling', label: 'Ceiling' },
                        { key: 'restrooms', label: 'Restrooms' },
                        { key: 'customerSatisfaction', label: 'Customer Satisfaction' },
                        { key: 'trash', label: 'Trash' },
                        { key: 'projectCleaning', label: 'Project Cleaning' },
                        { key: 'activitySupport', label: 'Activity Support' },
                        { key: 'safetyCompliance', label: 'Safety Compliance' },
                        { key: 'equipment', label: 'Equipment' },
                        { key: 'monitoring', label: 'Monitoring' }
                      ].map(({ key, label }) => {
                        const rating = inspection[key];
                        return (
                          <div key={key} className="text-xs">
                            <div className="font-medium text-gray-600">{label}</div>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getRatingColor(rating)}`}
                            >
                              {rating || 'N/A'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {inspection.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="font-medium text-sm mb-1">Notes:</h4>
                    <p className="text-sm text-gray-600">{inspection.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
