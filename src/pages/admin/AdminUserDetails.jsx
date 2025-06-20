import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user details
    const mockUser = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Customer',
      status: 'Active',
      joinDate: '2024-01-15',
      lastLogin: '2024-03-15',
      orders: {
        total: 5,
        totalSpent: 1499.95,
        lastOrder: '2024-03-10'
      },
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      }
    };

    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  }, [userId]);

  const handleStatusChange = (value) => {
    setUser(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleEdit = () => {
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleDelete = () => {
    // Implement delete functionality
    console.log('Delete user:', userId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/users')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <div className="flex items-center gap-4">
            <Select
              value={user.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="text-lg">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-lg">{user.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Join Date</p>
                  <p className="text-lg">{user.joinDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Login</p>
                  <p className="text-lg">{user.lastLogin}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-lg">{user.orders.total}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-lg">${user.orders.totalSpent}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Order</p>
                  <p className="text-lg">{user.orders.lastOrder}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Street</p>
                <p className="text-lg">{user.address.street}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">City</p>
                <p className="text-lg">{user.address.city}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">State</p>
                <p className="text-lg">{user.address.state}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ZIP Code</p>
                <p className="text-lg">{user.address.zip}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Country</p>
                <p className="text-lg">{user.address.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserDetails; 