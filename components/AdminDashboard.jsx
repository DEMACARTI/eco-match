import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  BarChart3, 
  Recycle, 
  Settings, 
  LogOut, 
  Trash2, 
  Edit, 
  Plus, 
  X, 
  Search, 
  Download, 
  Eye,
  Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [settings, setSettings] = useState({ platformName: 'EcoMatch', adminEmail: 'admin@ecomatch.com' });
  const navigate = useNavigate();

  // Mock data fetching with more detailed data
  useEffect(() => {
    const fetchData = async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', wasteRecycled: 150, joinDate: '2023-01-15', lastActivity: '2025-03-20' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active', wasteRecycled: 200, joinDate: '2023-02-10', lastActivity: '2025-03-22' },
      ];
      const mockVendors = [
        { id: 1, name: 'Green Recycling Co', email: 'green@recycle.com', status: 'verified', pickups: 45, location: 'New York', rating: 4.8, joinDate: '2023-03-01' },
        { id: 2, name: 'Eco Solutions', email: 'eco@solutions.com', status: 'pending', pickups: 30, location: 'California', rating: 4.5, joinDate: '2023-04-15' },
      ];
      
      setUsers(mockUsers);
      setVendors(mockVendors);
    };
    
    fetchData();
  }, []);

  // Stats calculation with additional metrics
  const stats = {
    totalUsers: users.length,
    totalVendors: vendors.length,
    totalWaste: users.reduce((sum, user) => sum + (user.wasteRecycled || 0), 0),
    totalPickups: vendors.reduce((sum, vendor) => sum + (vendor.pickups || 0), 0),
    activeUsers: users.filter(u => u.status === 'active').length,
    avgRating: vendors.length ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1) : 0,
  };

  // CRUD Operations
  const handleDelete = (type, id) => {
    if (type === 'user') {
      setUsers(users.filter(user => user.id !== id));
    } else {
      setVendors(vendors.filter(vendor => vendor.id !== id));
    }
    alert(`${type} deleted successfully!`);
  };

  const handleEdit = (type, item) => {
    setSelectedItem({ type, ...item });
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleAdd = (type) => {
    setSelectedItem({ type });
    setFormData({ name: '', email: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleViewDetails = (type, item) => {
    setSelectedItem({ type, ...item });
    setIsDetailsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = { ...formData, id: selectedItem.id || Date.now() };
    if (selectedItem.type === 'user') {
      if (selectedItem.id) {
        setUsers(users.map(user => user.id === selectedItem.id ? newItem : user));
      } else {
        setUsers([...users, { ...newItem, wasteRecycled: 0, joinDate: new Date().toISOString().split('T')[0], lastActivity: new Date().toISOString().split('T')[0] }]);
      }
    } else {
      if (selectedItem.id) {
        setVendors(vendors.map(vendor => vendor.id === selectedItem.id ? newItem : vendor));
      } else {
        setVendors([...vendors, { ...newItem, pickups: 0, rating: 0, joinDate: new Date().toISOString().split('T')[0] }]);
      }
    }
    setIsModalOpen(false);
    alert(`${selectedItem.type} ${selectedItem.id ? 'updated' : 'added'} successfully!`);
  };

  const handleLogout = () => {
    navigate('/');
  };

  // Search and Filter
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = (data, type) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    const csv = [Object.keys(data[0]).join(',')];
    data.forEach(item => csv.push(Object.values(item).join(',')));
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const form = e.target;
    setSettings({
      platformName: form.platformName.value,
      adminEmail: form.adminEmail.value,
    });
    alert('Settings saved successfully!');
  };

  const SidebarItem = ({ icon, title, section }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center w-full p-3 rounded-lg transition-colors ${
        activeSection === section 
          ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="ml-3">{title}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <div className="flex items-center mb-8">
          <Recycle className="h-8 w-8 text-green-600" />
          <span className="ml-2 text-xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">{settings.platformName}</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<BarChart3 className="h-5 w-5" />} title="Overview" section="overview" />
          <SidebarItem icon={<Users className="h-5 w-5" />} title="Users" section="users" />
          <SidebarItem icon={<Building className="h-5 w-5" />} title="Vendors" section="vendors" />
          <SidebarItem icon={<Settings className="h-5 w-5" />} title="Settings" section="settings" />
        </nav>
        
        <button onClick={handleLogout} className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>

        {activeSection === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-6 w-6" />} />
            <StatCard title="Active Users" value={stats.activeUsers} icon={<Users className="h-6 w-6" />} />
            <StatCard title="Total Vendors" value={stats.totalVendors} icon={<Building className="h-6 w-6" />} />
            <StatCard title="Avg Vendor Rating" value={stats.avgRating} icon={<Building className="h-6 w-6" />} />
            <StatCard title="Waste Recycled" value={`${stats.totalWaste}T`} icon={<Recycle className="h-6 w-6" />} />
            <StatCard title="Total Pickups" value={stats.totalPickups} icon={<Truck className="h-6 w-6" />} />
          </div>
        )}

        {(activeSection === 'users' || activeSection === 'vendors') && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeSection}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 p-2 border rounded-md"
                />
              </div>
              <button
                onClick={() => exportToCSV(activeSection === 'users' ? filteredUsers : filteredVendors, `${activeSection}.csv`)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md"
              >
                <Download className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <TableSection 
            title="User Management" 
            data={sortedData(filteredUsers, 'user')} 
            columns={['name', 'email', 'status', 'wasteRecycled', 'joinDate']} 
            onDelete={handleDelete} 
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onAdd={() => handleAdd('user')}
            type="user"
            onSort={handleSort}
            sortConfig={sortConfig}
          />
        )}

        {activeSection === 'vendors' && (
          <TableSection 
            title="Vendor Management" 
            data={sortedData(filteredVendors, 'vendor')} 
            columns={['name', 'email', 'status', 'pickups', 'rating']} 
            onDelete={handleDelete} 
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onAdd={() => handleAdd('vendor')}
            type="vendor"
            onSort={handleSort}
            sortConfig={sortConfig}
          />
        )}

        {activeSection === 'settings' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Settings</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-gray-700">Platform Name</label>
                <input name="platformName" className="w-full p-2 border rounded" defaultValue={settings.platformName} />
              </div>
              <div>
                <label className="block text-gray-700">Admin Email</label>
                <input name="adminEmail" className="w-full p-2 border rounded" defaultValue={settings.adminEmail} type="email" />
              </div>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md">
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedItem.id ? 'Edit' : 'Add'} {selectedItem.type === 'user' ? 'User' : 'Vendor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700">Name</label>
                <input
                  className="w-full p-2 border rounded"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  className="w-full p-2 border rounded"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              {selectedItem.type === 'vendor' && (
                <div>
                  <label className="block text-gray-700">Location</label>
                  <input
                    className="w-full p-2 border rounded"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              )}
              <button type="submit" className="w-full p-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded">
                {selectedItem.id ? 'Update' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedItem.type === 'user' ? 'User' : 'Vendor'} Details</h3>
              <button onClick={() => setIsDetailsModalOpen(false)}>
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedItem.name}</p>
              <p><strong>Email:</strong> {selectedItem.email}</p>
              <p><strong>Status:</strong> {selectedItem.status}</p>
              {selectedItem.type === 'user' ? (
                <>
                  <p><strong>Waste Recycled:</strong> {selectedItem.wasteRecycled}T</p>
                  <p><strong>Join Date:</strong> {selectedItem.joinDate}</p>
                  <p><strong>Last Activity:</strong> {selectedItem.lastActivity}</p>
                </>
              ) : (
                <>
                  <p><strong>Pickups:</strong> {selectedItem.pickups}</p>
                  <p><strong>Location:</strong> {selectedItem.location}</p>
                  <p><strong>Rating:</strong> {selectedItem.rating}</p>
                  <p><strong>Join Date:</strong> {selectedItem.joinDate}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
    <div className="p-3 bg-gradient-to-br from-green-400 to-blue-500 rounded-full text-white mr-4">
      {icon}
    </div>
    <div>
      <p className="text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const TableSection = ({ title, data, columns, onDelete, onEdit, onViewDetails, onAdd, type, onSort, sortConfig }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <button 
        onClick={onAdd}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th 
                key={col} 
                className="p-3 text-left text-gray-600 cursor-pointer hover:text-green-600"
                onClick={() => onSort(col)}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)}
                {sortConfig.key === col && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
            <th className="p-3 text-left text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="p-3">{item[col]}</td>
              ))}
              <td className="p-3 flex space-x-2">
                <button 
                  onClick={() => onViewDetails(type, item)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => onEdit(type, item)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => onDelete(type, item.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminDashboard;