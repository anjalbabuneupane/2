import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import getFirestore if you plan to use Firestore

// Ensure these global variables are defined in the Canvas environment
// For local development, you might need to mock them:
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase outside the component to avoid re-initialization
let firebaseApp;
let auth;
let db;

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp); // Initialize Firestore
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Handle cases where firebaseConfig might be invalid or missing
}

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  // Firebase Authentication Effect
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth not initialized.");
      setIsAuthReady(true); // Mark as ready even if auth failed to avoid blocking UI
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // If no user is logged in, try to sign in anonymously
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
            setUserId(auth.currentUser?.uid);
          } else {
            const anonymousUserCredential = await signInAnonymously(auth);
            setUserId(anonymousUserCredential.user.uid);
          }
        } catch (error) {
          console.error("Firebase Auth error during sign-in:", error);
          setUserId('anonymous-user-failed'); // Indicate anonymous sign-in failed
        }
      }
      setIsAuthReady(true);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, initialAuthToken]); // Depend on auth and initialAuthToken

  // Function to handle navigation
  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // Mock payment function
  const handlePayment = async (amount) => {
    setShowPaymentModal(true);
    setPaymentStatus('Processing payment...');
    try {
      // Simulate API call to eSewa/Khalti
      const response = await fetch('https://api.mocky.io/v2/5d47f24c3300006214488390?mocky-delay=2000ms', { // Mock API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, userId }),
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentStatus(`Payment successful! Transaction ID: ${result.transactionId || 'MOCK_TXN_123'}`);
      } else {
        setPaymentStatus('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus('Payment failed due to network error.');
    } finally {
      setTimeout(() => setShowPaymentModal(false), 3000); // Hide modal after 3 seconds
    }
  };

  // Render content based on current page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage navigate={navigate} handlePayment={handlePayment} />;
      case 'about':
        return <AboutPage />;
      case 'academics':
        return <AcademicsPage />;
      case 'admission':
        return <AdmissionPage handlePayment={handlePayment} />;
      case 'facilities':
        return <FacilitiesPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage navigate={navigate} handlePayment={handlePayment} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-inter bg-gray-50 text-gray-800">
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
            <h3 className="text-xl font-bold text-blue-800 mb-4">Payment Status</h3>
            <p className="text-gray-700">{paymentStatus}</p>
            {paymentStatus.includes('Processing') && (
              <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            )}
          </div>
        </div>
      )}

      {/* Header Component */}
      <Header navigate={navigate} userId={userId} isAuthReady={isAuthReady} />

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderPage()}
      </main>

      {/* Footer Component */}
      <Footer />

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/9779815960187"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300 z-40"
        aria-label="Chat on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          className="h-8 w-8 fill-current"
        >
          {/* Font Awesome WhatsApp icon SVG path */}
          <path d="M380.9 97.1C339.4 55.6 283.8 32 223.7 32c-122.5 0-222 99.5-222 222 0 39.5 10.3 78.4 30.2 112.5L32 480l115.5-30.2c34.1 19.9 73 30.2 112.5 30.2 122.5 0 222-99.5 222-222 0-60.1-23.6-115.7-65.1-157.2zM339.4 414.7c-25.1 25.1-58.4 38.7-93.7 38.7-35.3 0-68.6-13.6-93.7-38.7-25.1-25.1-38.7-58.4-38.7-93.7 0-35.3 13.6-68.6 38.7-93.7 25.1-25.1 58.4-38.7 93.7-38.7 35.3 0 68.6 13.6 93.7 38.7 25.1 25.1 38.7 58.4 38.7 93.7 0 35.3-13.6 68.6-38.7 93.7zM223.7 128c-60.1 0-109.2 49.1-109.2 109.2 0 60.1 49.1 109.2 109.2 109.2 60.1 0 109.2-49.1 109.2-109.2 0-60.1-49.1-109.2-109.2-109.2zm-40.1 146.9l-1.9-1.9c-10.4-10.4-27.3-10.4-37.7 0-10.4 10.4-10.4 27.3 0 37.7l40.1 40.1c10.4 10.4 27.3 10.4 37.7 0l40.1-40.1c10.4-10.4 10.4-27.3 0-37.7-10.4-10.4-27.3-10.4-37.7 0l-1.9 1.9-1.9 1.9c-1.9 1.9-4.8 1.9-6.7 0l-1.9-1.9c-1.9-1.9-4.8-1.9-6.7 0l-1.9 1.9c-1.9 1.9-4.8 1.9-6.7 0z"/>
        </svg>
      </a>
    </div>
  );
}

// Header Component
const Header = ({ navigate, userId, isAuthReady }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap">
        {/* Logo and School Name */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('home')}>
          {/* School Emblem/Logo */}
          <img
            src="image_2dd6aa.jpg" // Updated to use the uploaded school logo
            alt="Pathibhara English Boarding School Logo"
            className="rounded-full shadow-md transition-transform duration-300 group-hover:scale-110"
          />
          <h1 className="text-2xl font-bold text-gold-300 tracking-wide transition-colors duration-300 group-hover:text-white">
            Pathibhara English Boarding School
          </h1>
        </div>

        {/* Mobile Menu Button */}
        <div className="block lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white rounded-md p-2"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Navbar - Desktop */}
        <nav className="hidden lg:flex space-x-6">
          <NavLink onClick={() => navigate('home')}>Home</NavLink>
          <NavLink onClick={() => navigate('about')}>About Us</NavLink>
          <NavLink onClick={() => navigate('academics')}>Academics</NavLink>
          <NavLink onClick={() => navigate('admission')}>Admission</NavLink>
          <NavLink onClick={() => navigate('facilities')}>Facilities</NavLink>
          <NavLink onClick={() => navigate('gallery')}>Gallery</NavLink>
          <NavLink onClick={() => navigate('contact')}>Contact</NavLink>
        </nav>

        {/* User ID Display */}
        {isAuthReady && userId && (
          <div className="hidden lg:block text-sm text-blue-200 ml-4 p-2 bg-blue-700 rounded-md">
            User ID: {userId.substring(0, 8)}...
          </div>
        )}
      </div>

      {/* Mobile Menu - Collapsible */}
      {isMobileMenuOpen && (
        <nav className="lg:hidden bg-blue-700 pb-4">
          <MobileNavLink onClick={() => { navigate('home'); setIsMobileMenuOpen(false); }}>Home</MobileNavLink>
          <MobileNavLink onClick={() => { navigate('about'); setIsMobileMenuOpen(false); }}>About Us</MobileNavLink>
          <MobileNavLink onClick={() => { navigate('academics'); setIsMobileMenuOpen(false); }}>Academics</MobileNavLink>
          <MobileNavLink onClick={() => { navigate('admission'); setIsMobileMenuOpen(false); }}>Admission</MobileNavLink>
          <MobileNavLink onClick={() => { navigate('facilities'); setIsMobileMenuOpen(false); }}>Facilities</MobileNavLink>
          <MobileNavLink onClick={() => { navigate('gallery'); setIsMobileMenuOpen(false); }}>Gallery</MobileNavLink>
          <MobileNavLink onClick={() => { navigate('contact'); setIsMobileMenuOpen(false); }}>Contact</MobileNavLink>
          {isAuthReady && userId && (
            <div className="text-sm text-blue-200 px-4 py-2 mt-2 bg-blue-600 rounded-md mx-4">
              User ID: {userId.substring(0, 8)}...
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

// Helper component for desktop navigation links
const NavLink = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-lg text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
  >
    {children}
  </button>
);

// Helper component for mobile navigation links
const MobileNavLink = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="block w-full text-left px-4 py-2 text-white hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white"
  >
    {children}
  </button>
);

// HomePage Component
const HomePage = ({ navigate, handlePayment }) => {
  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative bg-blue-900 rounded-xl shadow-lg overflow-hidden h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-center">
        {/* Updated to use the new school building image */}
        <img
          src="image_2dd3a0.jpg"
          alt="Pathibhara English Boarding School Building"
          className="absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-500"
        />
        <div className="relative z-10 p-6 bg-black bg-opacity-40 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            Quality Education Since 2053 B.S.
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 drop-shadow-md">
            Nurturing Future Leaders with Excellence and Values.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('admission')}
              className="px-8 py-3 bg-gold-500 text-blue-900 font-bold rounded-full shadow-lg hover:bg-gold-600 transition-transform transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gold-300"
            >
              Apply Now
            </button>
            <button
              onClick={() => navigate('about')}
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-full shadow-lg hover:bg-white hover:text-blue-900 transition-transform transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Quick Info Box */}
      <section className="bg-white p-8 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        <div className="flex flex-col items-center">
          <svg className="h-10 w-10 text-blue-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24.95.31 1.97.48 3 .48.55 0 1 .45 1 1v3.5c0 .55-.45 1-1 1C10.7 22 2 13.3 2 3c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.03.17 2.05.48 3 .12.35.03.75-.24 1.02l-2.2 2.2z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700">+977-023-45233</p>
          <p className="text-sm text-gray-500">+977-9815960187 (WhatsApp)</p>
        </div>
        <div className="flex flex-col items-center">
          <svg className="h-10 w-10 text-blue-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700">Kamal-2, Jhapa</p>
          <p className="text-sm text-gray-500">Nepal</p>
        </div>
        <div className="flex flex-col items-center">
          <svg className="h-10 w-10 text-blue-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 13H11v-6h1.5v6zm0-8H11V7h1.5v.5z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700">Sun-Fri: 9AM-4PM</p>
          <p className="text-sm text-gray-500">School Hours</p>
        </div>
        <div className="flex flex-col items-center">
          <svg className="h-10 w-10 text-blue-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700">Government Recognized</p>
          <p className="text-sm text-gray-500">Affiliated with NEB</p>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="bg-white p-8 rounded-xl shadow-lg flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        <img
          src="image_2dd344.png" // Updated to use the uploaded image
          alt="Principal's Photo"
          className="w-36 h-36 rounded-full object-cover shadow-md border-4 border-blue-100"
        />
        <div>
          <h3 className="text-3xl font-bold text-blue-800 mb-4">A Message from Our Principal</h3>
          <p className="text-gray-700 leading-relaxed">
            "Welcome to Pathibhara English Boarding School! For over two decades, we have been dedicated to fostering a nurturing and stimulating environment where every child can thrive academically, socially, and personally. Our commitment to holistic education ensures that students are not only equipped with knowledge but also with critical thinking skills, strong values, and a compassionate outlook. We believe in empowering our students to become responsible global citizens and lifelong learners. Join us in shaping a brighter future for your child."
          </p>
          <p className="text-blue-700 font-semibold mt-4">- Ram Prasad Limbu</p>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-center text-blue-800 mb-8">Our Key Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon="📚"
            title="Government Recognized"
            description="Our curriculum is fully recognized and approved by the Ministry of Education, Nepal."
          />
          <FeatureCard
            icon="🖥️"
            title="State-of-the-Art Computer Lab"
            description="Modern computer lab with high-speed internet access for digital learning."
          />
          <FeatureCard
            icon="🏆"
            title="Comprehensive Sports Facilities"
            description="Excellent facilities for various sports, promoting physical fitness and teamwork."
          />
          <FeatureCard
            icon="🧪"
            title="Advanced Science Lab"
            description="Well-equipped science laboratories for practical learning and experimentation."
          />
          <FeatureCard
            icon="🚌"
            title="School Transportation"
            description="Safe and reliable bus service covering various routes for student convenience."
          />
          <FeatureCard
            icon="🎨"
            title="Creative Arts & Music"
            description="Dedicated programs and facilities for art, music, and cultural activities."
          />
          <FeatureCard
            icon="📖"
            title="Well-Stocked Library"
            description="A vast collection of books and digital resources to foster a love for reading."
          />
          <FeatureCard
            icon="🛡️"
            title="Safe & Nurturing Environment"
            description="A secure and supportive atmosphere where students feel valued and encouraged."
          />
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-center text-blue-800 mb-8">News & Updates</h3>
        <div className="space-y-6">
          <NewsItem
            icon="📢"
            title="2025 Admissions Open!"
            date="July 20, 2025"
            description="Applications are now open for all grades (Nursery to Grade 10). Apply early to secure your child's spot!"
            linkText="Apply Now"
            onLinkClick={() => navigate('admission')}
          />
          <NewsItem
            icon="🗓️"
            title="Annual Sports Day - Feb 15"
            date="February 15, 2025"
            description="Our Annual Sports Day was a grand success! Students showcased their athletic prowess and sportsmanship."
            linkText="View Gallery"
            onLinkClick={() => navigate('gallery')}
          />
          <NewsItem
            icon="🔔"
            title="Parent-Teacher Meeting"
            date="August 10, 2025"
            description="Scheduled for all grades. Please check your child's diary for specific timings."
            linkText="More Info"
            onLinkClick={() => navigate('contact')}
          />
        </div>
      </section>

      {/* Call to Action for Payment */}
      <section className="bg-blue-800 text-white p-8 rounded-xl shadow-lg text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to Pay Fees?</h3>
        <p className="text-lg mb-6">Experience our seamless online fee payment system.</p>
        <button
          onClick={() => handlePayment(1000)} // Example payment amount
          className="px-10 py-4 bg-gold-500 text-blue-900 font-bold rounded-full shadow-lg hover:bg-gold-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gold-300"
        >
          Pay Fees Online (Mock)
        </button>
      </section>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center transition-transform transform hover:scale-105 hover:shadow-xl group">
    <div className="text-5xl mb-4 text-blue-700 transition-colors duration-300 group-hover:text-gold-600">{icon}</div>
    <h4 className="text-xl font-semibold text-blue-800 mb-2 transition-colors duration-300 group-hover:text-blue-900">{title}</h4>
    <p className="text-gray-600">{description}</p>
  </div>
);

// News Item Component
const NewsItem = ({ icon, title, date, description, linkText, onLinkClick }) => (
  <div className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 transition-transform transform hover:scale-[1.01] hover:shadow-xl group">
    <div className="text-5xl text-blue-700 flex-shrink-0 transition-colors duration-300 group-hover:text-gold-600">{icon}</div>
    <div className="flex-grow">
      <h4 className="text-xl font-semibold text-blue-800 mb-1 transition-colors duration-300 group-hover:text-blue-900">{title}</h4>
      <p className="text-sm text-gray-500 mb-2">{date}</p>
      <p className="text-gray-700">{description}</p>
    </div>
    {onLinkClick && (
      <button
        onClick={onLinkClick}
        className="mt-4 sm:mt-0 px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg"
      >
        {linkText}
      </button>
    )}
  </div>
);

// About Us Page
const AboutPage = () => (
  <div className="space-y-10">
    <h2 className="text-4xl font-extrabold text-blue-800 text-center mb-8">About Pathibhara English Boarding School</h2>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Our History</h3>
      <p className="text-gray-700 leading-relaxed">
        Established in **2053 B.S. (1996 A.D.)**, Pathibhara English Boarding School has proudly served the community of Kamal-2, Jhapa, Nepal, for over two decades. From humble beginnings, we have grown into a reputable institution known for its commitment to academic excellence and holistic development. Our journey has been marked by continuous innovation in teaching methodologies and a steadfast dedication to nurturing responsible citizens.
      </p>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Mission & Vision</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-2xl font-semibold text-gold-600 mb-2">Our Mission</h4>
          <p className="text-gray-700 leading-relaxed">
            To provide a dynamic and challenging learning environment that fosters intellectual curiosity, critical thinking, and creativity. We aim to equip students with the knowledge, skills, and values necessary to excel in a rapidly changing world and become compassionate, responsible, and ethical leaders.
          </p>
        </div>
        <div>
          <h4 className="text-2xl font-semibold text-gold-600 mb-2">Our Vision</h4>
          <p className="text-gray-700 leading-relaxed">
            To be a leading educational institution in Nepal, recognized for its innovative pedagogical approaches, commitment to academic rigor, and dedication to nurturing well-rounded individuals who contribute positively to society.
          </p>
        </div>
      </div>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">School Committee</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Placeholder for committee members */}
        <CommitteeMember name="Mr. Tikaram Puri" role="Chairman" img="https://placehold.co/120x120/E0E7FF/002366?text=Chair" />
        <CommitteeMember name="Mrs. Sita Devi" role="Vice Principal" img="https://placehold.co/120x120/E0E7FF/002366?text=VP" />
        <CommitteeMember name="Mr. Ram Bahadur" role="Academic Coordinator" img="https://placehold.co/120x120/E0E7FF/002366?text=Coord" />
        <CommitteeMember name="Ms. Pooja Sharma" role="Parent Representative" img="https://placehold.co/120x120/E0E7FF/002366?text=Parent" />
      </div>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Achievements & Testimonials</h3>
      <p className="text-gray-700 mb-6 leading-relaxed">
        Over the years, Pathibhara English Boarding School has consistently achieved excellent results in academic examinations and excelled in various co-curricular activities. Our students have gone on to pursue successful careers in diverse fields, a testament to the strong foundation they receive here.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Testimonial
          quote="Pathibhara School provided me with an exceptional learning experience. The dedicated teachers and supportive environment truly prepared me for higher education and life."
          author="Alumni, Class of 2070 B.S."
        />
        <Testimonial
          quote="My children love going to school here. The focus on both academics and character development is truly commendable. Highly recommend!"
          author="Parent of Grade 5 Student"
        />
      </div>
    </section>
  </div>
);

// Committee Member Card Component
const CommitteeMember = ({ name, role, img }) => (
  <div className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
    <img src={img} alt={name} className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-blue-200" />
    <h4 className="text-xl font-semibold text-blue-800">{name}</h4>
    <p className="text-gray-600 text-sm">{role}</p>
  </div>
);

// Testimonial Card Component
const Testimonial = ({ quote, author }) => (
  <div className="bg-blue-50 p-6 rounded-lg shadow-md border-l-4 border-gold-500">
    <p className="italic text-gray-700 mb-4">"{quote}"</p>
    <p className="font-semibold text-blue-700">- {author}</p>
  </div>
);

// Academics Page
const AcademicsPage = () => (
  <div className="space-y-10">
    <h2 className="text-4xl font-extrabold text-blue-800 text-center mb-8">Academics at Pathibhara</h2>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Our Curriculum</h3>
      <p className="text-gray-700 leading-relaxed mb-6">
        Pathibhara English Boarding School follows the national curriculum prescribed by the Ministry of Education, Nepal, for grades 1 to 10. Our approach integrates modern pedagogical techniques with traditional values to ensure a well-rounded education. We focus on activity-based learning, critical thinking, and practical application of knowledge.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-2xl font-semibold text-gold-600 mb-2">Pre-School Level (Nursery - UKG)</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Play-based learning</li>
            <li>Early literacy and numeracy</li>
            <li>Motor skill development</li>
            <li>Creative expression through art and music</li>
          </ul>
        </div>
        <div>
          <h4 className="text-2xl font-semibold text-gold-600 mb-2">Elementary Level (Grade 1 - 5)</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Core subjects: English, Nepali, Mathematics, Science, Social Studies</li>
            <li>Computer education</li>
            <li>Moral education and general knowledge</li>
            <li>Co-curricular activities</li>
          </ul>
        </div>
        <div>
          <h4 className="text-2xl font-semibold text-gold-600 mb-2">Middle School Level (Grade 6 - 8)</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>In-depth study of core subjects</li>
            <li>Introduction to optional subjects</li>
            <li>Emphasis on research and project-based learning</li>
            <li>Preparation for secondary level</li>
          </ul>
        </div>
        <div>
          <h4 className="text-2xl font-semibold text-gold-600 mb-2">Secondary Level (Grade 9 - 10)</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Comprehensive preparation for Secondary Education Examination (SEE)</li>
            <li>Advanced concepts in all subjects</li>
            <li>Career counseling and guidance</li>
            <li>Focus on independent learning and problem-solving</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Exam Schedule</h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        Our academic year is structured with regular assessments to monitor student progress. Key examination dates are provided below. A detailed schedule can be downloaded.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-blue-50 rounded-lg shadow-md">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="py-3 px-4 text-left rounded-tl-lg">Examination</th>
              <th className="py-3 px-4 text-left">Grades</th>
              <th className="py-3 px-4 text-left rounded-tr-lg">Approximate Dates</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-blue-200">
              <td className="py-3 px-4">First Terminal Exam</td>
              <td className="py-3 px-4">Nursery - 10</td>
              <td className="py-3 px-4">Mangsir (Nov/Dec)</td>
            </tr>
            <tr className="border-b border-blue-200">
              <td className="py-3 px-4">Second Terminal Exam</td>
              <td className="py-3 px-4">Nursery - 10</td>
              <td className="py-3 px-4">Falgun (Feb/Mar)</td>
            </tr>
            <tr>
              <td className="py-3 px-4 rounded-bl-lg">Annual Examination</td>
              <td className="py-3 px-4">Nursery - 9</td>
              <td className="py-3 px-4 rounded-br-lg">Chaitra (Mar/Apr)</td>
            </tr>
            <tr>
              <td className="py-3 px-4 rounded-bl-lg">SEE Examination</td>
              <td className="py-3 px-4">Grade 10</td>
              <td className="py-3 px-4 rounded-br-lg">Chaitra (Mar/Apr)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button className="mt-6 px-6 py-3 bg-gold-500 text-blue-900 font-bold rounded-full hover:bg-gold-600 transition-colors duration-200 shadow-md hover:shadow-lg">
        Download Full Schedule (PDF)
      </button>
    </section>
  </div>
);

// Admission Page
const AdmissionPage = ({ handlePayment }) => {
  const [grade, setGrade] = useState('1-5');
  const [includeHostel, setIncludeHostel] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState(85000);

  useEffect(() => {
    calculateFee();
  }, [grade, includeHostel]);

  const calculateFee = () => {
    let baseFee;
    if (grade === '1-5') {
      baseFee = 85000;
    } else if (grade === '6-8') {
      baseFee = 110000;
    } else if (grade === '9-10') {
      baseFee = 135000;
    }

    let totalFee = baseFee;
    if (includeHostel) {
      totalFee += 75000;
    }
    setEstimatedFee(totalFee);
  };

  const handleSubmitAdmission = (e) => {
    e.preventDefault();
    // In a real application, this would send form data to the backend
    console.log("Admission form submitted!");
    // You might trigger a payment process here for the admission form fee
    handlePayment(500); // Example: Admission form fee
  };

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-extrabold text-blue-800 text-center mb-8">Admission to Pathibhara</h2>

      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Fee Structure</h3>
        <p className="text-gray-700 leading-relaxed mb-6">
          Below is the detailed fee structure for the academic year 2082/83 B.S. Please note that fees are subject to annual review.
        </p>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full bg-blue-50 rounded-lg shadow-md">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="py-3 px-4 text-left rounded-tl-lg">Grade Level</th>
                <th className="py-3 px-4 text-left">Annual Tuition Fee (NPR)</th>
                <th className="py-3 px-4 text-left">Other Charges (NPR/Year)</th>
                <th className="py-3 px-4 text-left rounded-tr-lg">Total Annual Fee (NPR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-blue-200">
                <td className="py-3 px-4">Nursery-LKG</td>
                <td className="py-3 px-4">75,000</td>
                <td className="py-3 px-4">10,000</td>
                <td className="py-3 px-4">**85,000**</td>
              </tr>
              <tr className="border-b border-blue-200">
                <td className="py-3 px-4">UKG-Grade 5</td>
                <td className="py-3 px-4">95,000</td>
                <td className="py-3 px-4">15,000</td>
                <td className="py-3 px-4">**110,000**</td>
              </tr>
              <tr className="border-b border-blue-200">
                <td className="py-3 px-4">Grade 6-8</td>
                <td className="py-3 px-4">115,000</td>
                <td className="py-3 px-4">20,000</td>
                <td className="py-3 px-4">**135,000**</td>
              </tr>
              <tr>
                <td className="py-3 px-4 rounded-bl-lg">Grade 9-10</td>
                <td className="py-3 px-4">130,000</td>
                <td className="py-3 px-4">25,000</td>
                <td className="py-3 px-4 rounded-br-lg">**155,000**</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="text-gray-700 list-disc list-inside space-y-2">
          <li>**Hostel Fee (Optional):** NPR 75,000 per year (includes lodging, food).</li>
          <li>**Transportation Fee (Optional):** Varies by route (details available upon inquiry).</li>
          <li>**Admission Form Cost:** NPR 500 (non-refundable)</li>
          <li>**Entrance Exam Fee:** NPR 1,000 (non-refundable)</li>
          <li>*Note: Fees are subject to change annually. Please contact the school for the most current details.*</li>
        </ul>
      </section>

      {/* NPR Fee Calculator */}
      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Estimate Your Annual Fee</h3>
        <div className="flex flex-col space-y-4">
          <label htmlFor="grade-select" className="text-lg font-semibold text-gray-700">Select Grade Level:</label>
          <select
            id="grade-select"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1-5">Nursery - Grade 5</option>
            <option value="6-8">Grade 6 - 8</option>
            <option value="9-10">Grade 9 - 10</option>
          </select>

          <label className="flex items-center space-x-2 text-lg font-semibold text-gray-700">
            <input
              type="checkbox"
              id="hostel-option"
              checked={includeHostel}
              onChange={(e) => setIncludeHostel(e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Include Hostel (NPR 75,000 extra)</span>
          </label>

          {/* Transportation option, if implemented, would go here */}
          {/* <label className="flex items-center space-x-2 text-lg font-semibold text-gray-700">
            <input type="checkbox" id="transport-option" className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" />
            <span>Include Transportation (Varies by route)</span>
          </label> */}

          <div id="estimated-fee" className="text-2xl font-bold text-blue-800 mt-4">
            Estimated Annual Fee: NPR {estimatedFee.toLocaleString()}
          </div>
        </div>
      </section>

      {/* Online Admission Form */}
      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Online Admission Form</h3>
        <p className="text-gray-700 leading-relaxed mb-6">
          Please fill out the form below to submit your admission inquiry. An admission counselor will contact you shortly.
        </p>
        <form onSubmit={handleSubmitAdmission} className="space-y-6">
          <div>
            <label htmlFor="studentName" className="block text-gray-700 text-sm font-bold mb-2">Student's Full Name:</label>
            <input
              type="text"
              id="studentName"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Ram Bahadur Thapa"
              required
            />
          </div>
          <div>
            <label htmlFor="parentName" className="block text-gray-700 text-sm font-bold mb-2">Parent/Guardian's Full Name:</label>
            <input
              type="text"
              id="parentName"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Sita Devi Thapa"
              required
            />
          </div>
          <div>
            <label htmlFor="contactNumber" className="block text-gray-700 text-sm font-bold mb-2">Contact Number:</label>
            <input
              type="tel"
              id="contactNumber"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., +977-98XXXXXXXX"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email Address:</label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., example@email.com"
            />
          </div>
          <div>
            <label htmlFor="applyingGrade" className="block text-gray-700 text-sm font-bold mb-2">Applying for Grade:</label>
            <select
              id="applyingGrade"
              className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Grade</option>
              <option value="Nursery">Nursery</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(gradeNum => (
                <option key={gradeNum} value={`Grade ${gradeNum}`}>{`Grade ${gradeNum}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="previousSchool" className="block text-gray-700 text-sm font-bold mb-2">Previous School (if any):</label>
            <input
              type="text"
              id="previousSchool"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., ABC School"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Submit Admission Form (Mock Payment)
          </button>
        </form>
      </section>

      {/* Download Form Button */}
      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Prefer Offline?</h3>
        <p className="text-gray-700 mb-6">Download our admission form and submit it manually at the school office.</p>
        <button className="px-8 py-3 bg-gold-500 text-blue-900 font-bold rounded-full shadow-lg hover:bg-gold-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gold-300">
          Download Admission Form (PDF)
        </button>
      </section>
    </div>
  );
};

// Facilities Page
const FacilitiesPage = () => (
  <div className="space-y-10">
    <h2 className="text-4xl font-extrabold text-blue-800 text-center mb-8">Our Facilities</h2>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Modern Classrooms</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <img
          src="https://placehold.co/600x400/E0E7FF/002366?text=Smart+Classroom"
          alt="Modern Classroom"
          className="rounded-lg shadow-md w-full h-auto object-cover"
        />
        <p className="text-gray-700 leading-relaxed">
          Our classrooms are designed to be conducive to learning, equipped with comfortable seating, ample natural light, and modern teaching aids including interactive whiteboards and projectors. We create an engaging environment for every student.
        </p>
      </div>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Science & Computer Labs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <p className="text-gray-700 leading-relaxed">
          The school boasts well-equipped Science Laboratories for Physics, Chemistry, and Biology, allowing students to gain practical experience. Our Computer Lab features modern computers with high-speed internet, providing students with essential digital literacy skills.
        </p>
        <img
          src="https://placehold.co/600x400/E0E7FF/002366?text=Science+Lab"
          alt="Science Lab"
          className="rounded-lg shadow-md w-full h-auto object-cover"
        />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <img
          src="https://placehold.co/600x400/E0E7FF/002366?text=Computer+Lab"
          alt="Computer Lab"
          className="rounded-lg shadow-md w-full h-auto object-cover"
        />
        <p className="text-gray-700 leading-relaxed">
          Our computer lab is a hub of innovation, where students learn programming, digital design, and research skills, preparing them for the technological demands of the future.
        </p>
      </div>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Library & Resource Center</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <p className="text-gray-700 leading-relaxed">
          The school library is a treasure trove of knowledge, offering a vast collection of books, journals, and digital resources. It provides a quiet and comfortable space for reading, research, and self-study, fostering a lifelong love for learning.
        </p>
        <img
          src="https://placehold.co/600x400/E0E7FF/002366?text=School+Library"
          alt="School Library"
          className="rounded-lg shadow-md w-full h-auto object-cover"
        />
      </div>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Sports Facilities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <img
          src="https://placehold.co/600x400/E0E7FF/002366?text=Sports+Ground"
          alt="Sports Ground"
          className="rounded-lg shadow-md w-full h-auto object-cover"
        />
        <p className="text-gray-700 leading-relaxed">
          We believe in the importance of physical activity for overall development. Our school features a spacious playground for football and cricket, a basketball court, and facilities for various indoor games like table tennis and badminton.
        </p>
      </div>
    </section>

    <section className="bg-white p-8 rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold text-blue-700 mb-4">Hostel Accommodation (Optional)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <p className="text-gray-700 leading-relaxed">
          For students seeking a comprehensive residential experience, our comfortable and secure hostel facilities provide a home away from home. Separate accommodations for boys and girls are supervised by dedicated wardens, ensuring a safe and disciplined environment.
        </p>
        <img
          src="https://placehold.co/600x400/E0E7FF/002366?text=School+Hostel"
          alt="School Hostel"
          className="rounded-lg shadow-md w-full h-auto object-cover"
        />
      </div>
    </section>
  </div>
);

// Gallery Page
const GalleryPage = () => {
  const photos = [
    { src: "image_2dd3a0.jpg", alt: "Pathibhara School Building Exterior" }, // New image
    { src: "image_2dd3c7.jpg", alt: "Pathibhara School Campus View" },    // New image
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=Classroom+1", alt: "Classroom Activity" },
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=Sports+Day", alt: "Annual Sports Day" },
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=Science+Fair", alt: "Science Fair Project" },
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=Computer+Lab+2", alt: "Computer Lab Session" },
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=Cultural+Event", alt: "Cultural Program" },
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=Library+Reading", alt: "Students in Library" },
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=School+Building+2", alt: "School Building Exterior" },
    { src: "https://placehold.co/400x300/E0E7FF/002366?text=Art+Class", alt: "Art Class" },
  ];

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-extrabold text-blue-800 text-center mb-8">Our Gallery</h2>

      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Moments at Pathibhara</h3>
        <p className="text-gray-700 leading-relaxed mb-6">
          Explore our vibrant school life through a collection of photographs showcasing our facilities, events, and daily activities.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <div key={index} className="rounded-lg overflow-hidden shadow-md group cursor-pointer transform transition-transform hover:scale-105">
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-48 object-cover transition-opacity duration-300 group-hover:opacity-80"
              />
              <div className="p-4 bg-blue-50 text-blue-800 font-semibold text-center">
                {photo.alt}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Virtual Tour (Coming Soon)</h3>
        <p className="text-gray-700 mb-6">
          We are working on an immersive 360° virtual tour of our campus. Stay tuned to explore our facilities from the comfort of your home!
        </p>
        <img
          src="https://placehold.co/600x300/E0E7FF/002366?text=Virtual+Tour+Placeholder"
          alt="Virtual Tour Placeholder"
          className="rounded-lg shadow-md mx-auto w-full max-w-lg"
        />
      </section>
    </div>
  );
};

// Contact Page
const ContactPage = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, this would send an email or store form data
    console.log("Contact form submitted!");
    // Provide user feedback
    alert("Thank you for your message! We will get back to you shortly."); // Using alert for simplicity, but a custom modal is preferred.
    e.target.reset(); // Clear form
  };

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-extrabold text-blue-800 text-center mb-8">Contact Pathibhara</h2>

      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Get in Touch</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-700 leading-relaxed mb-6">
              We'd love to hear from you! Whether you have questions about admissions, academics, or anything else, please feel free to reach out to us using the contact details below or by filling out the form.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24.95.31 1.97.48 3 .48.55 0 1 .45 1 1v3.5c0 .55-.45 1-1 1C10.7 22 2 13.3 2 3c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.03.17 2.05.48 3 .12.35.03.75-.24 1.02l-2.2 2.2z" />
                </svg>
                <a href="tel:+97702345233" className="text-blue-700 hover:underline">+977-023-45233</a>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <a href="mailto:pebs.jhapa@gmail.com" className="text-blue-700 hover:underline">pebs.jhapa@gmail.com</a>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <a
                  href="https://maps.app.goo.gl/GQMVJC6Panchgachhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  Kamal-2, Jhapa, Nepal
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 8.12 11.12 7 12.5 7H15v3h-2c-.55 0-1 .45-1 1v1h3v3h-3v6.95c5.05-.72 9-4.99 9-9.95z" />
                </svg>
                <a
                  href="https://www.facebook.com/profile.php?id=100063819312891"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  facebook.com/PathibharaSchool
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Your Name:</label>
              <input
                type="text"
                id="name"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Your Email:</label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">Subject:</label>
              <input
                type="text"
                id="subject"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">Your Message:</label>
              <textarea
                id="message"
                rows="5"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Embedded Google Map */}
      <section className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-blue-700 mb-4">Our Location</h3>
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-md">
          {/* Using an iframe for Google Maps. Replace with actual embed code if available. */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3550.596957608246!2d87.97340627506972!3d27.30058937648366!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e5b02b7e0d3761%3A0x86e6d1f0e2d3f0d!2sKamal-2%2C%20Jhapa%2C%20Nepal!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Pathibhara English Boarding School Location"
            className="rounded-lg"
          ></iframe>
        </div>
      </section>
    </div>
  );
};

// Footer Component
const Footer = () => (
  <footer className="bg-blue-900 text-blue-200 py-8 mt-12 rounded-t-xl shadow-inner">
    <div className="container mx-auto px-4 text-center">
      <p className="mb-4">
        © {new Date().getFullYear()} Pathibhara English Boarding School. All rights reserved.
      </p>
      <div className="flex flex-wrap justify-center items-center space-x-6 mb-4">
        <a href="tel:+97702345233" className="hover:text-white transition-colors duration-200">
          📞 +977-023-45233
        </a>
        <a href="tel:+9779815960187" className="hover:text-white transition-colors duration-200">
          📱 +977-9815960187
        </a>
        <a href="mailto:pebs.jhapa@gmail.com" className="hover:text-white transition-colors duration-200">
          ✉️ pebs.jhapa@gmail.com
        </a>
      </div>
      <div className="flex justify-center items-center space-x-6">
        <a
          href="https://maps.app.goo.gl/GQMVJC6Panchgachhi"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span>Location</span>
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=100063819312891"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 8.12 11.12 7 12.5 7H15v3h-2c-.55 0-1 .45-1 1v1h3v3h-3v6.95c5.05-.72 9-4.99 9-9.95z" />
          </svg>
          <span>Facebook</span>
        </a>
      </div>
    </div>
  </footer>
);

export default App;
