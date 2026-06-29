import React, { useState, useEffect, useRef } from 'react';
import { 
  Recycle, LogOut, Plus, X, Truck, Search, MapPin, Star, Settings, Award, Leaf, Calendar, DollarSign, BarChart, Users, Download, RefreshCw,
  Upload, Camera, Image, AlertCircle, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const UserDashboard = () => {
  const [activeSection, setActiveSection] = useState('findVendors');
  const [userLocation, setUserLocation] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteNeeds, setWasteNeeds] = useState({ type: '', urgency: 'Standard', frequency: 'One-time' });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ 
    wasteType: '', 
    amount: '', 
    date: '', 
    notes: '',
    recurring: false,
    frequency: 'Weekly',
    vendorId: ''
  });
  const [wasteHistory, setWasteHistory] = useState([]);
  const [rewards, setRewards] = useState({ points: 0, level: 'Bronze' });
  const [reviews, setReviews] = useState({});
  const navigate = useNavigate();

  // Waste detection state
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectedImage, setDetectedImage] = useState(null);
  const [detectionData, setDetectionData] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState(null);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  const INR_CONVERSION_RATE = 83;
  const API_BASE_URL = 'http://localhost:8080/api';
  const USER_ID = "testUser123"; // Replace with actual user ID or auth later
  const WS_URL = 'http://localhost:8080/ws';

  // WebSocket client setup
  const [stompClient, setStompClient] = useState(null);

  // Fetch user data with fallback
  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${USER_ID}`);
      if (!response.ok) {
        if (response.status === 404) {
          const defaultUser = { name: 'Test User', email: 'test@example.com', impactStats: { wasteDiverted: 0, co2Saved: 0 } };
          setUser(defaultUser);
          setError('User not found. Using default profile.');
          console.warn('User fetch 404, defaulting to:', defaultUser);
        } else {
          throw new Error(`User fetch failed: ${response.status}`);
        }
      } else {
        const userData = await response.json();
        setUser(userData);
        console.log('User data fetched:', userData);
      }
    } catch (err) {
      setError(`Error fetching user: ${err.message}`);
      const defaultUser = { name: 'Test User', email: 'test@example.com', impactStats: { wasteDiverted: 0, co2Saved: 0 } };
      setUser(defaultUser);
      console.error('User fetch error:', err.message);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`);
      if (!response.ok) throw new Error(`Vendors fetch failed: ${response.status}`);
      const vendorData = await response.json();
      setVendors(vendorData);
      console.log('Vendors fetched:', vendorData);
    } catch (err) {
      setError(`Error fetching vendors: ${err.message}`);
      setVendors([]);
      console.error('Vendors fetch error:', err.message);
    }
  };

  // Fetch waste history
  const fetchWasteHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${USER_ID}/requests`);
      if (!response.ok) throw new Error(`History fetch failed: ${response.status}`);
      const historyData = await response.json();
      setWasteHistory(historyData);
      console.log('Waste history fetched:', historyData);
    } catch (err) {
      setError(`Error fetching waste history: ${err.message}`);
      setWasteHistory([]);
      console.error('History fetch error:', err.message);
    }
  };

  // Fetch rewards
  const fetchRewards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${USER_ID}/rewards`);
      if (!response.ok) throw new Error(`Rewards fetch failed: ${response.status}`);
      const rewardData = await response.json();
      setRewards(rewardData);
      console.log('Rewards fetched:', rewardData);
    } catch (err) {
      setError(`Error fetching rewards: ${err.message}`);
      setRewards({ points: 0, level: 'Bronze' });
      console.error('Rewards fetch error:', err.message);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/leaderboard`);
      if (!response.ok) throw new Error(`Leaderboard fetch failed: ${response.status}`);
      const leaderboardData = (await response.json()).map((item, index) => ({ ...item, rank: index + 1 }));
      setLeaderboard(leaderboardData);
      console.log('Leaderboard fetched:', leaderboardData);
    } catch (err) {
      setError(`Error fetching leaderboard: ${err.message}`);
      setLeaderboard([]);
      console.error('Leaderboard fetch error:', err.message);
    }
  };

  // Combined fetch function for initial load
  const fetchInitialData = async () => {
    setError(null);
    await Promise.all([
      fetchUser(),
      fetchVendors(),
      fetchWasteHistory(),
      fetchRewards(),
      fetchLeaderboard()
    ]);
  };

  // Setup WebSocket connection
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });

    client.onConnect = () => {
      console.log('Connected to WebSocket');
      client.subscribe(`/topic/requests/${USER_ID}`, (message) => {
        const updatedRequest = JSON.parse(message.body);
        setWasteHistory((prev) => {
          const exists = prev.some((r) => r.id === updatedRequest.id);
          if (exists) {
            return prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r));
          } else {
            return [...prev, updatedRequest];
          }
        });
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      setError('WebSocket error: ' + frame.headers['message']);
    };

    client.activate();
    setStompClient(client);

    // Initial data fetch
    fetchInitialData();

    return () => {
      if (client) {
        client.deactivate();
        console.log('Disconnected from WebSocket');
      }
    };
  }, []);

  // Geolocation fetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setUserLocation({ lat: 40.7128, lng: -74.0060 })
      );
    } else {
      setUserLocation({ lat: 40.7128, lng: -74.0060 });
    }
  }, []);

  // Filter vendors based on waste needs and search
  useEffect(() => {
    if (userLocation && vendors.length > 0) {
      const updatedVendors = vendors.map(vendor => ({
        ...vendor,
        distance: calculateDistance(userLocation, vendor.location || { lat: 40.7128, lng: -74.0060 }),
        estimatedEarnings: wasteNeeds.type && vendor.pricing && vendor.pricing[wasteNeeds.type] 
          ? (requestForm.amount * vendor.pricing[wasteNeeds.type] * INR_CONVERSION_RATE).toFixed(2) 
          : 'N/A'
      }));

      const filtered = updatedVendors
        .filter(vendor => 
          (!wasteNeeds.type || (vendor.services && vendor.services.includes(wasteNeeds.type))) &&
          (vendor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
          (!requestForm.amount || (vendor.minAmount || 0) <= Number(requestForm.amount))
        )
        .sort((a, b) => a.distance - b.distance);

      setFilteredVendors(filtered);
    } else {
      setFilteredVendors([]);
    }
  }, [userLocation, vendors, wasteNeeds, searchQuery, requestForm.amount]);

  const calculateDistance = (loc1, loc2) => {
    const R = 6371;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.vendorId) {
      setError("Please select a vendor before submitting the request.");
      return;
    }

    const request = {
      userId: USER_ID,
      vendorId: requestForm.vendorId,
      wasteType: requestForm.wasteType,
      amount: Number(requestForm.amount),
      date: requestForm.date,
      notes: requestForm.notes,
      recurring: requestForm.recurring,
      frequency: requestForm.recurring ? requestForm.frequency : null,
      status: 'Pending'
    };

    try {
      console.log('Submitting request:', JSON.stringify(request, null, 2));
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      const requestData = await response.json();
      if (!response.ok) throw new Error(`Failed to submit request: ${requestData.message || response.status}`);

      console.log('Request created:', requestData);
      alert(`Request submitted to ${filteredVendors.find(v => v.id === requestForm.vendorId)?.name || 'vendor'}!`);
    } catch (err) {
      setError('Error submitting request: ' + err.message);
      console.error('Submission error:', err.message);
    } finally {
      setIsRequestModalOpen(false);
      setRequestForm({ wasteType: '', amount: '', date: '', notes: '', recurring: false, frequency: 'Weekly', vendorId: '' });
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (!response.ok) throw new Error(`Failed to cancel request: ${response.status}`);
      alert('Request cancelled successfully!');
    } catch (err) {
      setError('Error cancelling request: ' + err.message);
      console.error('Cancel request error:', err.message);
    }
  };

  const handleReviewSubmit = async (vendorId, rating, comment) => {
    const review = { userId: USER_ID, vendorId, rating: Number(rating), comment };
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(`Failed to submit review: ${responseData.message || response.status}`);
      setReviews(prev => ({ ...prev, [vendorId]: responseData }));
      alert('Review submitted successfully!');
    } catch (err) {
      setError('Error submitting review: ' + err.message);
      console.error('Review submission error:', err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const form = e.target;
    const updatedUser = {
      name: form.name.value,
      email: form.email.value,
      address: form.address.value,
      phone: form.phone.value,
      preferences: {
        notifications: form.notifications.checked,
        preferredTime: form.preferredTime.value
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/users/${USER_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(`Failed to save settings: ${responseData.message || response.status}`);
      setUser(responseData);
      alert('Settings saved successfully!');
      await fetchInitialData();
    } catch (err) {
      setError('Error saving settings: ' + err.message);
      console.error('Settings save error:', err.message);
    }
  };

  const handleLogout = () => navigate('/');

  // Waste detection functions
  // Note: Ensure the model server is running before using these functions
  // Run ./model/check_and_start_model_server.sh to start the model server if it's not running
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Reset previous detection results
      setDetectedImage(null);
      setDetectionData(null);
      setDetectionError(null);

      // Set the selected image
      setSelectedImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const detectWaste = async () => {
    if (!selectedImage) {
      setDetectionError("Please select an image first");
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);
    setDetectedImage(null);
    setDetectionData(null);
    
    console.log('Starting waste detection process...');

    const formData = new FormData();
    formData.append('file', selectedImage.file);

    try {
      // Get the detection data with a timeout (now includes the image as base64)
      const dataPromise = fetch(`${API_BASE_URL}/waste-detection/detect-data`, {
        method: 'POST',
        body: formData
      });

      // Add a timeout of 30 seconds
      const dataTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Detection timed out after 30 seconds')), 30000)
      );

      // Race the fetch against the timeout
      const dataResponse = await Promise.race([dataPromise, dataTimeoutPromise]);

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text().catch(() => 'Unknown error');
        throw new Error(`Detection failed (${dataResponse.status}): ${errorText}`);
      }

      const data = await dataResponse.json();

      if (!data) {
        throw new Error('No data returned from detection service');
      }

      if (data.error) {
        throw new Error(`Detection error: ${data.error}`);
      }

      // Important: Set the detection data FIRST
      console.log('Setting detection data...');
      setDetectionData(data);

      // Then immediately set the image without waiting for onload
      if (data.image_base64) {
        try {
          // Create a data URL from the base64 string
          const imageUrl = `data:image/jpeg;base64,${data.image_base64}`;
          console.log('Setting detected image from base64 data');
          
          // Set the image immediately
          setDetectedImage(imageUrl);
          
          // Still load the image in the background to verify it's valid
          const img = new Image();
          img.onload = () => {
            console.log('Image loaded successfully:', img.width, 'x', img.height);
          };
          img.onerror = (e) => {
            console.error('Error loading image:', e);
            // Only show error but don't clear the image - it might still display
            setDetectionError('Image might not display correctly, but detection data is available');
          };
          img.src = imageUrl;
        } catch (imgErr) {
          console.error('Error processing image:', imgErr);
          setDetectionError('Error processing the detection image');
        }
      } else {
        console.warn('No image data in response');
        // Don't throw - we still have detection data
        setDetectionError('No image data returned, but detection data is available');
      }

      // Check if any objects were detected
      if (data.total_items_detected === 0) {
        console.warn('No waste objects detected in the image');
        setDetectionError("No waste objects were detected in this image. Try a different image with clearer waste items.");
      }
    } catch (err) {
      console.error('Waste detection error:', err);

      // Check if the error is related to the model server not running
      if (err.message.includes('service is currently unavailable') || 
          err.message.includes('model server is not running') ||
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError')) {
        setDetectionError(
          "The waste detection service is currently unavailable. Please ensure the model server is running by executing './model/check_and_start_model_server.sh' in the terminal."
        );
      } else {
        // Keep the detected image if we have it, just show error with the data
        if (!detectedImage) {
          setDetectionError(`Error detecting waste: ${err.message}`);
        } else {
          setDetectionError(`Error getting detection data: ${err.message}`);
        }
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const resetDetection = () => {
    setSelectedImage(null);
    setDetectedImage(null);
    setDetectionData(null);
    setDetectionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createRequestFromDetection = () => {
    if (!detectionData) return;

    // Extract waste type from detection data
    let wasteType = 'Mixed';
    if (detectionData.categories) {
      // Find the category with the most items
      const categories = Object.entries(detectionData.categories);
      if (categories.length > 0) {
        categories.sort((a, b) => b[1] - a[1]);
        wasteType = categories[0][0];
      }
    }

    // Estimate amount based on detected items
    const amount = detectionData.total_items_detected ? (detectionData.total_items_detected * 0.5).toFixed(1) : 1;

    // Open request modal with pre-filled data
    setRequestForm({
      ...requestForm,
      wasteType,
      amount,
      notes: `AI detected ${detectionData.total_items_detected || 0} waste items. ${detectionData.recyclable_items || 0} are recyclable.`
    });
    setIsRequestModalOpen(true);
  };

  const downloadWasteHistoryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(0, 128, 0);
    doc.text('EcoMatch Waste History Report', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Name: ${user?.name || 'N/A'}`, 20, 30);
    doc.text(`Email: ${user?.email || 'N/A'}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 50);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text('Summary', 20, 65);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Waste Diverted: ${user?.impactStats?.wasteDiverted || 0} kg`, 20, 75);
    doc.text(`Total CO2 Saved: ${user?.impactStats?.co2Saved || 0} kg`, 20, 85);
    doc.text(`Total Earnings: ₹${wasteHistory.reduce((sum, item) => sum + (item.earnings || 0), 0).toFixed(2)}`, 20, 95);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text('Waste History', 20, 110);

    const tableData = wasteHistory.map(item => [
      item.date ? new Date(item.date).toLocaleDateString('en-IN') : 'N/A',
      filteredVendors.find(v => v.id === item.vendorId)?.name || item.vendorId || 'N/A',
      item.wasteType || 'N/A',
      item.amount?.toString() || 'N/A',
      `₹${(item.earnings || 0).toFixed(2)}`,
      item.status || 'N/A'
    ]);

    doc.autoTable({
      startY: 115,
      head: [['Date', 'Vendor', 'Waste Type', 'Amount (kg)', 'Earnings', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [0, 128, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 }
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Page ${i} of ${pageCount} | Generated by EcoMatch`, 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`Waste_History_${user?.name || 'User'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const SidebarItem = ({ icon, title, section }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ${
        activeSection === section 
          ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm'
      }`}
    >
      {icon}
      <span className="ml-3">{title}</span>
    </button>
  );

  const WasteHistoryCard = ({ request }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-semibold text-lg">
              {filteredVendors.find(v => v.id === request.vendorId)?.name || request.vendorId || 'N/A'}
            </h3>
          </div>
          <p className="text-gray-600">Waste: {request.wasteType || 'N/A'}</p>
          <p className="text-gray-600">Amount: {request.amount || 'N/A'} kg</p>
          <p className="text-gray-600">Date: {request.date ? new Date(request.date).toLocaleDateString('en-IN') : 'N/A'}</p>
          <p className="text-gray-600">Earnings: ₹{(request.earnings || 0).toFixed(2)}</p>
        </div>
        <span 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            request.status === 'Completed' ? 'bg-green-100 text-green-800' :
            request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          {request.status || 'N/A'}
        </span>
      </div>
    </div>
  );

  const RewardCard = ({ title, points, reward, icon, onClick }) => (
    <div 
      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-green-400 to-blue-500 rounded-full text-white">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-gray-600">{reward}</p>
            <p className="text-sm text-gray-500">Cost: {points} points</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
          Redeem
        </button>
      </div>
    </div>
  );

  const LeaderboardItem = ({ rank, name, wasteDiverted, isCurrentUser }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg ${isCurrentUser ? 'bg-green-50 border-2 border-green-200' : 'bg-white'} shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center space-x-4">
        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold ${
          rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-amber-600' : 'bg-gray-200 text-gray-800'
        }`}>
          {rank}
        </span>
        <span className="font-semibold">{name || 'Anonymous'}</span>
      </div>
      <span className="text-green-600 font-medium">{wasteDiverted || 0} kg</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-xl p-6 flex flex-col border-r">
        <div className="flex items-center mb-8">
          <Recycle className="h-8 w-8 text-green-600" />
          <span className="ml-2 text-xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">EcoMatch</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<MapPin className="h-5 w-5" />} title="Find Vendors" section="findVendors" />
          <SidebarItem icon={<Truck className="h-5 w-5" />} title="My Requests" section="requests" />
          <SidebarItem icon={<Camera className="h-5 w-5" />} title="Waste Detection" section="wasteDetection" />
          <SidebarItem icon={<Calendar className="h-5 w-5" />} title="Waste History" section="history" />
          <SidebarItem icon={<Award className="h-5 w-5" />} title="Rewards" section="rewards" />
          <SidebarItem icon={<Leaf className="h-5 w-5" />} title="Impact" section="impact" />
          <SidebarItem icon={<Users className="h-5 w-5" />} title="Leaderboard" section="leaderboard" />
          <SidebarItem icon={<Settings className="h-5 w-5" />} title="Settings" section="settings" />
        </nav>

        <button onClick={handleLogout} className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Welcome, {user?.name || 'User'}! {rewards.level} Member
          </h1>
          <button
            onClick={fetchInitialData}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {activeSection === 'findVendors' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Waste Diverted" value={`${user?.impactStats?.wasteDiverted || 0} kg`} icon={<Recycle className="h-6 w-6" />} />
              <StatCard title="CO2 Saved" value={`${user?.impactStats?.co2Saved || 0} kg`} icon={<Leaf className="h-6 w-6" />} />
              <StatCard title="Reward Points" value={rewards.points || 0} icon={<Award className="h-6 w-6" />} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Find Nearby Vendors</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Waste Type</label>
                  <select
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                    value={wasteNeeds.type}
                    onChange={(e) => setWasteNeeds({ ...wasteNeeds, type: e.target.value })}
                  >
                    <option value="">All Types</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Paper">Paper</option>
                    <option value="Organic">Organic</option>
                    <option value="Metal">Metal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Urgency</label>
                  <select
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                    value={wasteNeeds.urgency}
                    onChange={(e) => setWasteNeeds({ ...wasteNeeds, urgency: e.target.value })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Urgent">Urgent (Within 24h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Frequency</label>
                  <select
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                    value={wasteNeeds.frequency}
                    onChange={(e) => setWasteNeeds({ ...wasteNeeds, frequency: e.target.value })}
                  >
                    <option value="One-time">One-time</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md flex items-center hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Request Pickup
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Nearby Vendors</h2>
              <div className="space-y-4">
                {filteredVendors.length > 0 ? (
                  filteredVendors.map(vendor => (
                    <div key={vendor.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-all">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{vendor.name || 'Unnamed Vendor'}</h3>
                          <p className="text-gray-600">Services: {(vendor.services || []).join(', ') || 'N/A'}</p>
                          <p className="text-gray-600">Distance: {vendor.distance ? vendor.distance.toFixed(2) : 'N/A'} km</p>
                          <p className="text-gray-600 flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" /> {vendor.rating || 'N/A'} / 5
                          </p>
                          <p className="text-gray-600">Next Available: {vendor.availability || 'N/A'}</p>
                          <p className="text-green-600">Est. Earnings: ₹{vendor.estimatedEarnings}</p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => {
                              setRequestForm({ ...requestForm, vendorId: vendor.id });
                              setIsRequestModalOpen(true);
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                          >
                            Request
                          </button>
                          <button
                            onClick={() => {
                              const rating = prompt('Rate 1-5:');
                              const comment = prompt('Leave a comment:');
                              if (rating && comment) handleReviewSubmit(vendor.id, Number(rating), comment);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                      {reviews[vendor.id] && (
                        <p className="mt-2 text-gray-600">Your Review: {reviews[vendor.id].rating}/5 - "{reviews[vendor.id].comment}"</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No vendors available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'requests' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4">My Requests</h2>
            <div className="space-y-4">
              {wasteHistory.filter(r => r.status === 'Pending').length > 0 ? (
                wasteHistory.filter(r => r.status === 'Pending').map(request => (
                  <div key={request.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <p>Vendor: {filteredVendors.find(v => v.id === request.vendorId)?.name || request.vendorId || 'N/A'}</p>
                    <p>Waste: {request.wasteType || 'N/A'} ({request.amount || 'N/A'} kg)</p>
                    <p>Date: {request.date ? new Date(request.date).toLocaleDateString('en-IN') : 'N/A'}</p>
                    <p>Status: {request.status || 'N/A'}</p>
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="px-4 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No pending requests.</p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Waste History</h2>
                <div className="flex items-center space-x-4">
                  <select className="p-2 border rounded-md focus:ring-2 focus:ring-green-500">
                    <option>Sort by Date</option>
                    <option>Sort by Amount</option>
                    <option>Sort by Earnings</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search history..." 
                      className="p-2 pl-10 border rounded-md focus:ring-2 focus:ring-green-500" 
                    />
                  </div>
                  <button
                    onClick={downloadWasteHistoryPDF}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wasteHistory.length > 0 ? (
                  wasteHistory.map(request => <WasteHistoryCard key={request.id} request={request} />)
                ) : (
                  <p className="text-gray-600 col-span-2 text-center py-8">No waste history yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold mb-6">Rewards Program</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-400 to-blue-500 p-6 rounded-lg text-white">
                  <h3 className="text-lg font-semibold">Current Level</h3>
                  <p className="text-2xl mt-2">{rewards.level || 'Bronze'}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Points Earned</h3>
                  <p className="text-2xl mt-2 text-green-600">{rewards.points || 0}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">Next Level</h3>
                  <p className="text-2xl mt-2 text-blue-600">
                    {rewards.level === 'Bronze' ? 'Silver (200)' : rewards.level === 'Silver' ? 'Gold (500)' : 'Platinum (1000)'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RewardCard 
                  title="Cash Reward" 
                  points={500} 
                  reward="₹500 Cash Voucher" 
                  icon={<DollarSign className="h-6 w-6" />}
                  onClick={() => rewards.points >= 500 && alert('₹500 Voucher Redeemed!')}
                />
                <RewardCard 
                  title="Premium Badge" 
                  points={1000} 
                  reward="Exclusive Eco Warrior Badge" 
                  icon={<Award className="h-6 w-6" />}
                  onClick={() => rewards.points >= 1000 && alert('Premium Badge Redeemed!')}
                />
              </div>
              <p className="text-gray-600 mt-6 text-center">Earn 10 points per kg of waste diverted!</p>
            </div>
          </div>
        )}

        {activeSection === 'impact' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Your Environmental Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <Leaf className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-xl font-bold">{user?.impactStats?.wasteDiverted || 0} kg</p>
                <p>Waste Diverted from Landfills</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <BarChart className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-xl font-bold">{user?.impactStats?.co2Saved || 0} kg</p>
                <p>CO2 Emissions Prevented</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold mb-6">Eco Warriors Leaderboard</h2>
              <div className="space-y-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <LeaderboardItem 
                      key={entry.id}
                      rank={entry.rank}
                      name={entry.name}
                      wasteDiverted={entry.wasteDiverted}
                      isCurrentUser={entry.id === USER_ID}
                    />
                  ))
                ) : (
                  <p className="text-gray-600">No leaderboard data available.</p>
                )}
              </div>
              <p className="text-gray-600 mt-6 text-center">Keep diverting waste to climb the ranks!</p>
            </div>
          </div>
        )}

        {activeSection === 'wasteDetection' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold mb-4">AI Waste Detection</h2>
              <p className="text-gray-600 mb-6">
                Upload an image of your waste to automatically detect and classify waste objects. 
                Our AI will identify recyclable items and help you create a waste collection request.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-700">Upload Image</h3>

                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedImage ? 'border-green-300' : 'border-gray-300'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedImage ? (
                      <div className="space-y-4 w-full">
                        <img 
                          src={selectedImage.preview} 
                          alt="Selected" 
                          className="max-h-64 mx-auto rounded-lg shadow-md" 
                        />
                        <p className="text-center text-sm text-gray-500">
                          {selectedImage.file.name} ({(selectedImage.file.size / 1024).toFixed(1)} KB)
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">Click to select an image or drag and drop</p>
                        <p className="text-gray-400 text-sm mt-1">Supports JPG, PNG (max 10MB)</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={detectWaste}
                      disabled={!selectedImage || isDetecting}
                      className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center ${
                        !selectedImage || isDetecting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-md'
                      }`}
                    >
                      {isDetecting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Camera className="h-5 w-5 mr-2" />
                          Detect Waste
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetDetection}
                      disabled={!selectedImage}
                      className={`py-2 px-4 rounded-md ${
                        !selectedImage
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-700">Detection Results</h3>

                  {isDetecting ? (
                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 flex flex-col items-center justify-center text-blue-500 bg-blue-50">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="font-medium">Detecting waste objects...</p>
                      <p className="text-sm mt-1 text-blue-400">This may take up to 30 seconds</p>
                    </div>
                  ) : detectionData ? (
                    <div className="space-y-4">
                      {detectedImage ? (
                        <img 
                          src={detectedImage} 
                          alt="Detected waste" 
                          className="max-h-64 w-auto mx-auto rounded-lg shadow-md border border-green-300" 
                          style={{ display: 'block', objectFit: 'contain' }}
                          onError={(e) => {
                            console.error('Image failed to load:', e);
                            e.target.onerror = null;
                            // Fall back to the original image if detected image fails
                            e.target.src = selectedImage?.preview || '';
                            setDetectionError('Failed to load detection result image, showing original image instead');
                          }}
                        />
                      ) : selectedImage?.preview ? (
                        <img 
                          src={selectedImage.preview} 
                          alt="Original uploaded image" 
                          className="max-h-64 w-auto mx-auto rounded-lg shadow-md border border-yellow-300" 
                          style={{ display: 'block', objectFit: 'contain' }}
                        />
                      ) : null}

                      {detectionError && (
                        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg flex items-start">
                          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Detection Warning</p>
                            <p className="text-sm">{detectionError}</p>
                          </div>
                        </div>
                      )}

                      {detectionData && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-green-800">Detection Summary</h4>
                            {detectionData.status === "success" && (
                              <span className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Success
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Items detected:</span> 
                              <span className="font-bold">{detectionData.total_items_detected || 0}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Recyclable:</span> 
                              <span className="font-bold text-green-600">{detectionData.recyclable_items || 0}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Non-recyclable:</span> 
                              <span className="font-bold text-red-600">{detectionData.non_recyclable_items || 0}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Sustainability:</span> 
                              <span className={`font-bold ${
                                (detectionData.sustainability_score || 0) > 70 ? 'text-green-600' : 
                                (detectionData.sustainability_score || 0) > 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {detectionData.sustainability_score || 0}%
                              </span>
                            </div>
                          </div>

                          {detectionData.categories && Object.keys(detectionData.categories).length > 0 && (
                            <div className="mt-3">
                              <h4 className="font-semibold text-green-800 mb-1">Categories</h4>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(detectionData.categories).map(([category, count]) => (
                                  <span 
                                    key={category}
                                    className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm"
                                  >
                                    {category}: {count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={createRequestFromDetection}
                            disabled={detectionData.total_items_detected === 0}
                            className={`mt-4 w-full py-2 rounded-md flex items-center justify-center ${
                              detectionData.total_items_detected === 0 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                            }`}
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Create Request from Detection
                          </button>
                        </div>
                      )}

                      {!detectionData && !detectionError && !isDetecting && (
                        <div className="p-4 bg-gray-50 text-gray-700 rounded-lg">
                          <p className="font-medium">No detection results yet</p>
                          <p className="text-sm">Upload an image and click "Detect Waste" to see results.</p>
                        </div>
                      )}
                      
                      {isDetecting && (
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p>Processing image...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400">
                      <Image className="h-12 w-12 mb-2" />
                      <p>Detection results will appear here</p>
                      <p className="text-sm mt-1">Upload an image and click "Detect Waste"</p>
                    </div>
                  )}
                  
                  {/* Debug info for detection state */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
                      <p>Debug: isDetecting={isDetecting.toString()}</p>
                      <p>Debug: detectedImage={detectedImage ? 'set' : 'null'}</p>
                      <p>Debug: detectionData={detectionData ? 'set' : 'null'}</p>
                      <p>Debug: detectionError={detectionError ? 'set' : 'null'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Upload Image</h3>
                  <p className="text-gray-600 text-sm">Take a photo of your waste or upload an existing image.</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. AI Detection</h3>
                  <p className="text-gray-600 text-sm">Our AI identifies and classifies waste objects in your image.</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Truck className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Request Pickup</h3>
                  <p className="text-gray-600 text-sm">Create a waste collection request based on the detection results.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-gray-700">Name</label>
                <input name="name" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500" defaultValue={user?.name || ''} required />
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input name="email" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500" defaultValue={user?.email || ''} type="email" required />
              </div>
              <div>
                <label className="block text-gray-700">Phone</label>
                <input name="phone" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500" defaultValue={user?.phone || ''} type="tel" />
              </div>
              <div>
                <label className="block text-gray-700">Address</label>
                <input 
                  name="address" 
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500" 
                  defaultValue={user?.address || ''} 
                  placeholder="Enter your address for pickups" 
                  required 
                />
              </div>
              <div>
                <label className="block text-gray-700">Preferred Pickup Time</label>
                <select name="preferredTime" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500" defaultValue={user?.preferences?.preferredTime || 'Morning'}>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  name="notifications" 
                  defaultChecked={user?.preferences?.notifications || false} 
                  className="mr-2" 
                />
                <label className="text-gray-700">Enable Notifications</label>
              </div>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:shadow-lg transition-all">
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full m-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Request Pickup</h3>
              <button onClick={() => setIsRequestModalOpen(false)}>
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700">Vendor</label>
                <select
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  value={requestForm.vendorId}
                  onChange={(e) => setRequestForm({ ...requestForm, vendorId: e.target.value })}
                  required
                >
                  <option value="">Select Vendor</option>
                  {filteredVendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name || 'Unnamed Vendor'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700">Waste Type</label>
                <select
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  value={requestForm.wasteType}
                  onChange={(e) => setRequestForm({ ...requestForm, wasteType: e.target.value })}
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
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Preferred Date</label>
                <input
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  type="date"
                  value={requestForm.date}
                  onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Additional Notes</label>
                <textarea
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  placeholder="Special instructions for pickup..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={requestForm.recurring}
                  onChange={(e) => setRequestForm({ ...requestForm, recurring: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-gray-700">Set as Recurring</label>
              </div>
              {requestForm.recurring && (
                <div>
                  <label className="block text-gray-700">Frequency</label>
                  <select
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                    value={requestForm.frequency}
                    onChange={(e) => setRequestForm({ ...requestForm, frequency: e.target.value })}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              )}
              <button type="submit" className="w-full p-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:shadow-lg transition-all">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center hover:shadow-lg transition-all">
    <div className="p-3 bg-gradient-to-br from-green-400 to-blue-500 rounded-full text-white mr-4">
      {icon}
    </div>
    <div>
      <p className="text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default UserDashboard;
