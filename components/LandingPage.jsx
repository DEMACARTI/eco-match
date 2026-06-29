import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Recycle, 
  Users, 
  Building, 
  BarChart3, 
  Globe, 
  Award, 
  Truck,
  Leaf,
  Search,
  Smartphone,
  Calendar,
  MessageSquare,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('individuals');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ vendors: 0, users: 0, waste: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Smooth scrolling function
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Stats animation effect
  useEffect(() => {
    const targetStats = { vendors: 500, users: 10000, waste: 75 };
    const duration = 2000;
    const stepTime = 50;
    const steps = duration / stepTime;

    let current = { vendors: 0, users: 0, waste: 0 };
    const increment = {
      vendors: targetStats.vendors / steps,
      users: targetStats.users / steps,
      waste: targetStats.waste / steps,
    };

    const timer = setInterval(() => {
      current = {
        vendors: Math.min(current.vendors + increment.vendors, targetStats.vendors),
        users: Math.min(current.users + increment.users, targetStats.users),
        waste: Math.min(current.waste + increment.waste, targetStats.waste),
      };
      
      setStats({
        vendors: Math.round(current.vendors),
        users: Math.round(current.users),
        waste: Math.round(current.waste),
      });

      if (current.vendors >= targetStats.vendors && 
          current.users >= targetStats.users && 
          current.waste >= targetStats.waste) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  // Handle signup and login
  const handleSignup = () => {
    alert('Sign up clicked! Implement your signup logic here.');
  };

  const handleLogin = () => {
    const isAdmin = prompt('Are you an admin? (yes/no)') === 'yes';
    setIsAuthenticated(true);
    
    if (isAdmin) {
      navigate('/admin');
    } else {
      alert('Login successful! Regular user dashboard coming soon.');
    }
  };

  const FeatureButton = ({ icon, title, description }) => (
    <button 
      className="group flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300 w-full text-left"
    >
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white">
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-gray-800 font-medium group-hover:text-green-600 transition-colors">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </button>
  );

  const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-300">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="relative">
              <Recycle className="h-8 w-8 text-green-600" />
              <div className="absolute -inset-1 bg-green-400/30 rounded-full blur-lg -z-10" />
            </div>
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">
              EcoMatch
            </span>
          </div>

          <div className="hidden md:flex space-x-8">
            {['features', 'how-it-works', 'marketplace', 'about'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className="text-gray-600 hover:text-green-600 transition-colors capitalize"
              >
                {section.replace('-', ' ')}
              </button>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Dashboard
              </button>
            )}
          </div>

          <div className="flex space-x-4">
            <button 
              onClick={handleLogin}
              className="px-4 py-2 text-gray-600 hover:text-green-600 rounded transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={handleSignup}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:shadow-lg transition-all"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                Sustainable Solution for Waste Management
              </span>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Connect, Recycle,
                </span>{' '}
                Create Impact
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Our AI-powered platform connects waste generators with recycling vendors in real-time. 
                Transform waste into valuable resources while tracking your environmental impact.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={handleSignup}
                  className="group px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-white/80 border border-green-200 text-green-600 rounded-md hover:shadow-md transition-all"
                >
                  Watch Demo
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.vendors}+</div>
                  <div className="text-sm text-gray-500">Vendors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.users.toLocaleString()}+</div>
                  <div className="text-sm text-gray-500">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.waste}T</div>
                  <div className="text-sm text-gray-500">Waste Recycled</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FeatureButton 
                  icon={<Users />}
                  title="Smart Waste Matching"
                  description="AI-powered matching for optimal recycling"
                />
                <FeatureButton 
                  icon={<Globe />}
                  title="Carbon Footprint"
                  description="Track and reduce your emissions"
                />
                <FeatureButton 
                  icon={<Smartphone />}
                  title="Mobile App"
                  description="Manage everything on the go"
                />
                <FeatureButton 
                  icon={<Award />}
                  title="Eco Rewards"
                  description="Earn tokens for sustainable actions"
                />
              </div>
            </div>

            <div className="hidden md:block relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg blur opacity-30" />
              <img 
                src="https://via.placeholder.com/600x500?text=Waste+Recycling"
                alt="Waste recycling illustration"
                className="relative rounded-lg shadow-lg"
                loading="lazy"
              />

              <div className="absolute -top-6 -right-6 p-4 bg-white rounded-lg shadow-lg animate-float">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium">Carbon Saved</div>
                    <div className="text-lg font-bold text-green-600">145 tons</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 p-4 bg-white rounded-lg shadow-lg animate-float-delay">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Recycle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium">Recycling Rate</div>
                    <div className="text-lg font-bold text-blue-600">+40%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How EcoMatch Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our intelligent platform streamlines the waste recycling process from listing to impact tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Search />, title: "List Your Waste", description: "Describe your waste material and quantity using our smart categorization system." },
              { icon: <Building />, title: "Get Matched", description: "Our AI matches you with qualified recyclers who specialize in your waste type." },
              { icon: <Calendar />, title: "Schedule Pickup", description: "Arrange convenient pickup times through our automated scheduling system." },
              { icon: <BarChart3 />, title: "Track Impact", description: "Monitor your environmental impact and get detailed sustainability reports." }
            ].map((step, index) => (
              <div key={index} className="flex flex-col items-center relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white">
                  {step.icon}
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500 transform translate-x-1/2" />
                )}
                <h3 className="mt-6 text-xl font-semibold text-gray-800">{step.title}</h3>
                <p className="mt-2 text-gray-600 text-center">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore our innovative tools designed for both waste generators and recycling vendors.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setActiveTab('individuals')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'individuals'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                For Individuals & Businesses
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'vendors'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                For Recycling Vendors
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {activeTab === 'individuals' ? (
              <>
                <FeatureCard icon={<Leaf />} title="AI Waste Classification" description="Take a photo of your waste and our AI will identify and categorize it automatically." />
                <FeatureCard icon={<Award />} title="Sustainability Reports" description="Generate detailed reports showing your environmental impact and carbon savings." />
                <FeatureCard icon={<MessageSquare />} title="In-app Chat" description="Communicate directly with recycling vendors through our secure messaging system." />
                <FeatureCard icon={<Globe />} title="Community Challenges" description="Join recycling challenges and compete with others to make a bigger impact." />
                <FeatureCard icon={<Smartphone />} title="Mobile Notifications" description="Get alerts about pickup schedules, new matches, and recycling opportunities." />
                <FeatureCard icon={<Search />} title="Price Comparison" description="Compare offers from multiple vendors to get the best value for your materials." />
              </>
            ) : (
              <>
                <FeatureCard icon={<Building />} title="Business Dashboard" description="Manage all your recycling operations from a comprehensive dashboard." />
                <FeatureCard icon={<Truck />} title="Route Optimization" description="Optimize pickup routes to save time, fuel, and reduce emissions." />
                <FeatureCard icon={<Users />} title="Customer Management" description="Track customer interactions and build lasting relationships." />
                <FeatureCard icon={<BarChart3 />} title="Analytics Suite" description="Access detailed insights about your recycling business and market trends." />
                <FeatureCard icon={<Calendar />} title="Smart Scheduling" description="Automatically schedule pickups based on your availability and capacity." />
                <FeatureCard icon={<Recycle />} title="Material Database" description="Access comprehensive information about different waste materials and recycling methods." />
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of users already transforming waste management with EcoMatch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleSignup}
              className="px-8 py-4 bg-white text-green-600 rounded-md hover:shadow-lg transition-all"
            >
              Sign Up Now
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-transparent border border-white text-white rounded-md hover:bg-white/10 transition-all"
            >
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 relative animate-fade-in">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 hover:text-gray-800 transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
            <h3 className="text-xl font-bold mb-4">EcoMatch Demo</h3>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="EcoMatch Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

// Add these CSS animations to your stylesheet
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-float-delay {
    animation: float 3s ease-in-out infinite 0.5s;
  }
`;

// If you're using a CSS-in-JS solution or separate CSS file, add the above styles