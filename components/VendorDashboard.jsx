import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building, Recycle, LogOut, Trash2, Plus, X, Truck, Search, BarChart3, 
  Settings, DollarSign, Clock, MapPin, CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

const VendorDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [vendorLocation, setVendorLocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [collectedWaste, setCollectedWaste] = useState([]);
  const [processedWaste, setProcessedWaste] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const VENDOR_ID = "vendor1"; // Adjust based on your test vendor ID
  const API_BASE_URL = "http://localhost:8080/api"; // Ensure this matches your backend

  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch vendor details
        const vendorResponse = await fetch(`${API_BASE_URL}/vendors/${VENDOR_ID}`);
        if (!vendorResponse.ok) {
          const errorText = await vendorResponse.text();
          console.warn(`Vendor fetch failed: ${vendorResponse.status} - ${errorText}`);
          throw new Error(`Failed to fetch vendor: ${errorText || 'Unknown error'}`);
        }
        const vendorData = await vendorResponse.json();
        setVendor(vendorData);

        // Fetch requests - Use standardized endpoint
        const requestsResponse = await fetch(`${API_BASE_URL}/requests/vendor/${VENDOR_ID}`);
        if (!requestsResponse.ok) {
          const errorText = await requestsResponse.text();
          console.warn(`Requests fetch failed: ${requestsResponse.status} - ${errorText}`);
          throw new Error(`Failed to fetch requests: ${errorText || 'Unknown error'}`);
        }
        const requestData = await requestsResponse.json();
        setRequests(requestData);

        // Fetch pickups
        const pickupsResponse = await fetch(`${API_BASE_URL}/pickups/vendor/${VENDOR_ID}`);
        if (!pickupsResponse.ok) {
          const errorText = await pickupsResponse.text();
          console.warn(`Pickups fetch failed: ${pickupsResponse.status} - ${errorText}`);
          throw new Error(`Failed to fetch pickups: ${errorText || 'Unknown error'}`);
        }
        setPickups(await pickupsResponse.json());

        // Fetch collected waste
        const collectedWasteResponse = await fetch(`${API_BASE_URL}/collected-waste/vendor/${VENDOR_ID}`);
        if (!collectedWasteResponse.ok) {
          const errorText = await collectedWasteResponse.text();
          console.warn(`Collected waste fetch failed: ${collectedWasteResponse.status} - ${errorText}`);
          throw new Error(`Failed to fetch collected waste: ${errorText || 'Unknown error'}`);
        }
        setCollectedWaste(await collectedWasteResponse.json());

        // Fetch processed waste
        const processedWasteResponse = await fetch(`${API_BASE_URL}/processed-waste/vendor/${VENDOR_ID}`);
        if (!processedWasteResponse.ok) {
          const errorText = await processedWasteResponse.text();
          console.warn(`Processed waste fetch failed: ${processedWasteResponse.status} - ${errorText}`);
          throw new Error(`Failed to fetch processed waste: ${errorText || 'Unknown error'}`);
        }
        setProcessedWaste(await processedWasteResponse.json());

        // Set vendor location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => setVendorLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            () => setVendorLocation(vendorData?.location || { lat: 40.7128, lng: -74.0060 })
          );
        } else {
          setVendorLocation(vendorData?.location || { lat: 40.7128, lng: -74.0060 });
        }
      } catch (err) {
        setError(`Failed to load dashboard: ${err.message}. Check backend logs and MongoDB for VENDOR_ID: ${VENDOR_ID}`);
        console.error("Fetch error:", err);
        // Set fallback data to prevent UI crash
        setVendor({ name: 'Unknown Vendor', services: [], totalPickups: 0, totalWasteCollected: 0, totalWasteProcessed: 0, revenue: 0 });
        setRequests([]);
        setPickups([]);
        setCollectedWaste([]);
        setProcessedWaste([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [VENDOR_ID, API_BASE_URL]);

  const calculateDistance = useCallback((loc1, loc2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const debouncedSearch = useCallback(debounce((query) => setSearchQuery(query), 300), []);

  const filteredData = useMemo(() => {
    if (!vendor) return { requests: [], pickups: [], collectedWaste: [], processedWaste: [] };

    const updatedRequests = requests.map(request => ({
      ...request,
      userName: request.userId || 'Unknown User', // Fallback if userName isn't provided
      distance: vendorLocation && request.location ? calculateDistance(vendorLocation, request.location) : null,
    }));

    return {
      requests: updatedRequests.filter(request => 
        vendor.services?.includes(request.wasteType) &&
        ((request.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
         (request.date || '').includes(searchQuery))
      ).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity)),
      pickups: pickups.filter(pickup => 
        (pickup.userName || pickup.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (pickup.date || '').includes(searchQuery)
      ),
      collectedWaste: collectedWaste.filter(waste => 
        (waste.userName || waste.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (waste.date || '').includes(searchQuery)
      ),
      processedWaste: processedWaste.filter(waste => 
        (waste.type || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (waste.dateProcessed || '').includes(searchQuery)
      ),
    };
  }, [requests, pickups, collectedWaste, processedWaste, searchQuery, vendorLocation, vendor, calculateDistance]);

  const wasteStats = useMemo(() => ({
    collected: collectedWaste.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + (record.amount || 0);
      return acc;
    }, {}),
    processed: processedWaste.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + (record.amount || 0);
      return acc;
    }, {}),
  }), [collectedWaste, processedWaste]);

  const handleProcessRequest = useCallback(async (requestId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to process request: ${await response.text()}`);
      const updatedRequest = await response.json();
      setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
      const newPickup = { 
        id: updatedRequest.pickupId, 
        vendorId: VENDOR_ID, 
        requestId, 
        status: 'Scheduled', 
        date: updatedRequest.date 
      };
      setPickups(prev => [...prev, newPickup]);
      setSelectedItem({ type: 'pickup', requestId });
      setFormData({ userId: updatedRequest.userId || '', date: updatedRequest.date || '', time: '', address: '' });
      setIsModalOpen(true);
    } catch (err) {
      setError(`Error processing request: ${err.message}`);
      console.error(err);
    }
  }, [VENDOR_ID, API_BASE_URL]);

  const handleAddPickup = useCallback(() => {
    setSelectedItem({ type: 'pickup' });
    setFormData({ userId: '', date: '', time: '', address: '' });
    setIsModalOpen(true);
  }, []);

  const handleAddCollectedWaste = useCallback(() => {
    setSelectedItem({ type: 'waste' });
    setFormData({ userId: '', type: '', amount: '', date: new Date().toISOString().split('T')[0], pickupId: '' });
    setIsModalOpen(true);
  }, []);

  const handleProcessWaste = useCallback((wasteId) => {
    const waste = collectedWaste.find(w => w.id === wasteId);
    if (waste && waste.status === 'Collected') {
      setSelectedItem({ type: 'process' });
      setFormData({ type: waste.type, amount: waste.amount, dateProcessed: new Date().toISOString().split('T')[0], revenue: '', sourceId: wasteId });
      setIsModalOpen(true);
    } else {
      alert('Waste must be collected before processing!');
    }
  }, [collectedWaste]);

  const handleDelete = useCallback(async (type, id) => {
    try {
      const endpoint = type === 'pickup' ? 'pickups' : type === 'waste' ? 'collected-waste' : 'processed-waste';
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete ${type}: ${await response.text()}`);
      
      if (type === 'pickup') {
        setPickups(prev => prev.filter(p => p.id !== id));
        setVendor(prev => ({ ...prev, totalPickups: (prev.totalPickups || 0) - 1 }));
      } else if (type === 'waste') {
        const deleted = collectedWaste.find(w => w.id === id);
        setCollectedWaste(prev => prev.filter(w => w.id !== id));
        setVendor(prev => ({ ...prev, totalWasteCollected: (prev.totalWasteCollected || 0) - (deleted?.amount || 0) }));
      } else if (type === 'processed') {
        const deleted = processedWaste.find(w => w.id === id);
        setProcessedWaste(prev => prev.filter(w => w.id !== id));
        setVendor(prev => ({
          ...prev,
          totalWasteProcessed: (prev.totalWasteProcessed || 0) - (deleted?.amount || 0),
          revenue: (prev.revenue || 0) - (deleted?.revenue || 0),
        }));
      }
      alert(`${type} deleted successfully!`);
    } catch (err) {
      setError(`Error deleting ${type}: ${err.message}`);
      console.error(err);
    }
  }, [collectedWaste, processedWaste, API_BASE_URL]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const newItem = { ...formData, vendorId: VENDOR_ID };
    try {
      if (selectedItem.type === 'pickup') {
        newItem.status = 'Scheduled';
        newItem.requestId = selectedItem.requestId || null;
        const response = await fetch(`${API_BASE_URL}/pickups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (!response.ok) throw new Error(`Failed to schedule pickup: ${await response.text()}`);
        const savedPickup = await response.json();
        setPickups(prev => [...prev, savedPickup]);
        if (selectedItem.requestId) {
          // No need to update request status here; backend handles it via /process
          setRequests(prev => prev.map(r => r.id === selectedItem.requestId ? { ...r, pickupId: savedPickup.id } : r));
        }
        setVendor(prev => ({ ...prev, totalPickups: (prev.totalPickups || 0) + 1 }));
      } else if (selectedItem.type === 'waste') {
        newItem.status = 'Collected';
        const response = await fetch(`${API_BASE_URL}/collected-waste`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (!response.ok) throw new Error(`Failed to add collected waste: ${await response.text()}`);
        const savedWaste = await response.json();
        setCollectedWaste(prev => [...prev, savedWaste]);
        setVendor(prev => ({ ...prev, totalWasteCollected: (prev.totalWasteCollected || 0) + Number(formData.amount) }));
      } else if (selectedItem.type === 'process') {
        newItem.revenue = Number(formData.revenue);
        const response = await fetch(`${API_BASE_URL}/processed-waste`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (!response.ok) throw new Error(`Failed to process waste: ${await response.text()}`);
        const savedProcessed = await response.json();
        setProcessedWaste(prev => [...prev, savedProcessed]);
        const waste = collectedWaste.find(w => w.id === formData.sourceId);
        await fetch(`${API_BASE_URL}/collected-waste/${formData.sourceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...waste, status: 'Processed' })
        });
        setCollectedWaste(prev => prev.map(w => w.id === formData.sourceId ? { ...w, status: 'Processed' } : w));
        setVendor(prev => ({
          ...prev,
          totalWasteProcessed: (prev.totalWasteProcessed || 0) + Number(formData.amount),
          revenue: (prev.revenue || 0) + Number(formData.revenue),
        }));
      }
      setIsModalOpen(false);
      alert(`${selectedItem.type} added successfully!`);
    } catch (err) {
      setError(`Error submitting ${selectedItem.type}: ${err.message}`);
      console.error(err);
    }
  }, [formData, selectedItem, requests, collectedWaste, VENDOR_ID, API_BASE_URL]);

  const handlePickupStatusUpdate = useCallback(async (id, newStatus) => {
    const pickup = pickups.find(p => p.id === id);
    try {
      const response = await fetch(`${API_BASE_URL}/pickups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pickup, status: newStatus })
      });
      if (!response.ok) throw new Error(`Failed to update pickup status: ${await response.text()}`);
      setPickups(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (newStatus === 'Completed' && pickup?.requestId) {
        const request = requests.find(r => r.id === pickup.requestId);
        await fetch(`${API_BASE_URL}/requests/${pickup.requestId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...request, status: 'Completed' })
        });
        setRequests(prev => prev.map(r => r.id === pickup.requestId ? { ...r, status: 'Completed' } : r));
      }
      alert(`Pickup status updated to ${newStatus}!`);
    } catch (err) {
      setError(`Error updating pickup status: ${err.message}`);
      console.error(err);
    }
  }, [pickups, requests, API_BASE_URL]);

  const handleSaveSettings = useCallback(async (e) => {
    e.preventDefault();
    const form = e.target;
    const updatedVendor = {
      ...vendor,
      name: form.name.value,
      email: form.email.value,
      address: form.address.value,
      services: form.services.value.split(',').map(s => s.trim()),
      certifications: form.certifications.value.split(',').map(c => c.trim()),
    };
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${VENDOR_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVendor)
      });
      if (!response.ok) throw new Error(`Failed to save settings: ${await response.text()}`);
      setVendor(await response.json());
      alert('Settings saved successfully!');
    } catch (err) {
      setError(`Error saving settings: ${err.message}`);
      console.error(err);
    }
  }, [vendor, VENDOR_ID, API_BASE_URL]);

  const handleOptimizeSchedule = useCallback(() => {
    setPickups(prev => [...prev].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA - dateB;
    }));
    alert('Pickup schedule optimized!');
  }, []);

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
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <div className="flex items-center mb-8">
          <Recycle className="h-8 w-8 text-green-600" />
          <span className="ml-2 text-xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">EcoMatch</span>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<Building className="h-5 w-5" />} title="Overview" section="overview" />
          <SidebarItem icon={<MapPin className="h-5 w-5" />} title="User Requests" section="requests" />
          <SidebarItem icon={<Truck className="h-5 w-5" />} title="Pickups" section="pickups" />
          <SidebarItem icon={<Recycle className="h-5 w-5" />} title="Collected Waste" section="waste" />
          <SidebarItem icon={<BarChart3 className="h-5 w-5" />} title="Processed Waste" section="processed" />
          <SidebarItem icon={<Settings className="h-5 w-5" />} title="Settings" section="settings" />
        </nav>
        <button onClick={() => navigate('/')} className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>

      <div className="flex-1 p-8">
        {loading && <div className="mb-4 text-gray-600">Loading dashboard data...</div>}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
        )}
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Welcome, {vendor?.name || 'Vendor'}!
        </h1>

        <div className="mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user or date..."
              value={searchQuery}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 p-2 border rounded-md"
            />
          </div>
        </div>

        {activeSection === 'overview' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              <StatCard title="Total Pickups" value={vendor?.totalPickups || 0} icon={<Truck className="h-6 w-6" />} />
              <StatCard title="Waste Collected" value={`${vendor?.totalWasteCollected || 0} kg`} icon={<Recycle className="h-6 w-6" />} />
              <StatCard title="Waste Processed" value={`${vendor?.totalWasteProcessed || 0} kg`} icon={<BarChart3 className="h-6 w-6" />} />
              <StatCard title="Revenue" value={`₹${(vendor?.revenue || 0).toFixed(2)}`} icon={<DollarSign className="h-6 w-6" />} />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Collected Waste Breakdown</h2>
                {Object.entries(wasteStats.collected).length > 0 ? (
                  Object.entries(wasteStats.collected).map(([type, amount]) => (
                    <div key={type} className="flex items-center mb-2">
                      <div className="w-1/3 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
                      <span className="ml-2">{type}: {amount} kg</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No collected waste data available.</p>
                )}
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Processed Waste Breakdown</h2>
                {Object.entries(wasteStats.processed).length > 0 ? (
                  Object.entries(wasteStats.processed).map(([type, amount]) => (
                    <div key={type} className="flex items-center mb-2">
                      <div className="w-1/3 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
                      <span className="ml-2">{type}: {amount} kg</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No processed waste data available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'requests' && (
          <RequestSection 
            title="Nearby User Requests" 
            data={filteredData.requests} 
            onProcess={handleProcessRequest}
          />
        )}

        {activeSection === 'pickups' && (
          <TableSection 
            title="Scheduled Pickups" 
            data={filteredData.pickups} 
            columns={['userName', 'date', 'time', 'status', 'address']} 
            onDelete={handleDelete}
            onAdd={handleAddPickup}
            type="pickup"
            onStatusUpdate={handlePickupStatusUpdate}
          >
            <button 
              onClick={handleOptimizeSchedule}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md"
            >
              <Clock className="h-5 w-5 mr-2" />
              Optimize Schedule
            </button>
          </TableSection>
        )}

        {activeSection === 'waste' && (
          <TableSection 
            title="Collected Waste" 
            data={filteredData.collectedWaste} 
            columns={['userName', 'type', 'amount', 'date', 'pickupId', 'status']} 
            onDelete={handleDelete}
            onAdd={handleAddCollectedWaste}
            type="waste"
            onProcess={handleProcessWaste}
          />
        )}

        {activeSection === 'processed' && (
          <TableSection 
            title="Processed Waste" 
            data={filteredData.processedWaste} 
            columns={['type', 'amount', 'dateProcessed', 'revenue', 'sourceId']} 
            onDelete={handleDelete}
            type="processed"
          />
        )}

        {activeSection === 'settings' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Vendor Settings</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-gray-700">Company Name</label>
                <input name="name" className="w-full p-2 border rounded" defaultValue={vendor?.name || ''} required />
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input name="email" className="w-full p-2 border rounded" defaultValue={vendor?.email || ''} type="email" required />
              </div>
              <div>
                <label className="block text-gray-700">Address</label>
                <input name="address" className="w-full p-2 border rounded" defaultValue={vendor?.address || ''} required />
              </div>
              <div>
                <label className="block text-gray-700">Services (comma-separated)</label>
                <input name="services" className="w-full p-2 border rounded" defaultValue={vendor?.services?.join(', ') || ''} required />
              </div>
              <div>
                <label className="block text-gray-700">Certifications (comma-separated)</label>
                <input name="certifications" className="w-full p-2 border rounded" defaultValue={vendor?.certifications?.join(', ') || ''} />
              </div>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md">
                Save Changes
              </button>
            </form>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {selectedItem.type === 'pickup' ? 'Schedule Pickup' : selectedItem.type === 'waste' ? 'Add Collected Waste' : 'Process Waste'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedItem.type === 'pickup' ? (
                  <>
                    <div>
                      <label className="block text-gray-700">User ID</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.userId || ''}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Date</label>
                      <input
                        className="w-full p-2 border rounded"
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Time</label>
                      <input
                        className="w-full p-2 border rounded"
                        type="time"
                        value={formData.time || ''}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Address</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                  </>
                ) : selectedItem.type === 'waste' ? (
                  <>
                    <div>
                      <label className="block text-gray-700">User ID</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.userId || ''}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Waste Type</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={formData.type || ''}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Plastic">Plastic</option>
                        <option value="Paper">Paper</option>
                        <option value="Organic">Organic</option>
                        <option value="Metal">Metal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700">Amount (kg)</label>
                      <input
                        className="w-full p-2 border rounded"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Date</label>
                      <input
                        className="w-full p-2 border rounded"
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Pickup ID</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.pickupId || ''}
                        onChange={(e) => setFormData({ ...formData, pickupId: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-gray-700">Waste Type</label>
                      <input className="w-full p-2 border rounded" value={formData.type || ''} disabled />
                    </div>
                    <div>
                      <label className="block text-gray-700">Amount (kg)</label>
                      <input
                        className="w-full p-2 border rounded"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Date Processed</label>
                      <input
                        className="w-full p-2 border rounded"
                        type="date"
                        value={formData.dateProcessed || ''}
                        onChange={(e) => setFormData({ ...formData, dateProcessed: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Revenue (₹)</label>
                      <input
                        className="w-full p-2 border rounded"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.revenue || ''}
                        onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Source Waste ID</label>
                      <input className="w-full p-2 border rounded" value={formData.sourceId || ''} disabled />
                    </div>
                  </>
                )}
                <button type="submit" className="w-full p-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded">
                  {selectedItem.type === 'pickup' ? 'Schedule Pickup' : selectedItem.type === 'waste' ? 'Add Waste' : 'Process Waste'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
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

const RequestSection = ({ title, data, onProcess }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-2xl font-semibold mb-4">{title}</h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left text-gray-600">User ID</th>
            <th className="p-3 text-left text-gray-600">Waste Type</th>
            <th className="p-3 text-left text-gray-600">Amount</th>
            <th className="p-3 text-left text-gray-600">Date</th>
            <th className="p-3 text-left text-gray-600">Distance (km)</th>
            <th className="p-3 text-left text-gray-600">Status</th>
            <th className="p-3 text-left text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{item.userId || 'N/A'}</td>
              <td className="p-3">{item.wasteType || 'N/A'}</td>
              <td className="p-3">{item.amount ? `${item.amount} kg` : 'N/A'}</td>
              <td className="p-3">{item.date || 'N/A'}</td>
              <td className="p-3">{item.distance ? item.distance.toFixed(2) : 'N/A'}</td>
              <td className="p-3">{item.status || 'N/A'}</td>
              <td className="p-3">
                {item.status === 'Pending' && (
                  <button 
                    onClick={() => onProcess(item.id)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="7" className="p-3 text-center text-gray-600">No requests available. Create some from User Dashboard.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const TableSection = ({ title, data, columns, onDelete, onAdd, type, onStatusUpdate, onProcess, children }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="flex space-x-2">
        {onAdd && (
          <button 
            onClick={onAdd}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            {type === 'pickup' ? 'Schedule Pickup' : 'Add Waste'}
          </button>
        )}
        {children}
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th key={col} className="p-3 text-left text-gray-600">
                {col === 'userName' ? 'User ID' : col.charAt(0).toUpperCase() + col.slice(1)}
              </th>
            ))}
            <th className="p-3 text-left text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="p-3">
                  {col === 'amount' ? `${item[col] || 0} kg` : col === 'revenue' ? `₹${(item[col] || 0).toFixed(2)}` : item[col] || 'N/A'}
                </td>
              ))}
              <td className="p-3 flex space-x-2">
                {type === 'pickup' && (
                  <select
                    value={item.status || 'Scheduled'}
                    onChange={(e) => onStatusUpdate(item.id, e.target.value)}
                    className="p-1 border rounded text-sm"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                )}
                {type === 'waste' && item.status === 'Collected' && (
                  <button 
                    onClick={() => onProcess(item.id)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                  >
                    <Recycle className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => onDelete(type, item.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length + 1} className="p-3 text-center text-gray-600">No {type} data available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default VendorDashboard;