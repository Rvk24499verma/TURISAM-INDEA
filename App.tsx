
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, History, Sun, Moon, Compass, Landmark, Utensils, ShoppingBag, Hotel, AlertTriangle, RefreshCw, X, Navigation as NavIcon, Star, ChevronRight, Phone, Activity, Shield, ExternalLink, Car, Bike, Smartphone, Home, Castle, Scroll, Cloud, CloudRain, Calendar, CreditCard, CheckCircle, Play, Image as ImageIcon, Loader2, Swords, Users, Music, BookOpen, MessageCircle, Info, Download, Wifi, Camera, Upload, Briefcase, Share2, Clock, Map as MapIcon, Bus, Train, Mic, MicOff, PartyPopper, Sparkles, Facebook, Twitter, Linkedin, Instagram, Link } from 'lucide-react';
import Navigation from './components/Navigation';
import { generateLocationDetails, searchNearbyPlaces, getEmergencyInfo, getPlaceDetails, generateTripItinerary } from './services/geminiService';
import { LocationData, OwnerListing, NearbyPlace, Place, TripPlan } from './types';
import Loader from './components/Loader';

// --- Image Helper ---
const getSmartImageUrl = (keyword: string, type: string = 'tourism') => {
  const safeKeyword = encodeURIComponent(`${keyword} ${type} india high quality realistic`);
  return `https://image.pollinations.ai/prompt/${safeKeyword}?width=800&height=600&nologo=true&seed=${keyword.length}`;
};

// --- Icon Helper ---
const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('fort') || lower.includes('castle')) return <Castle size={18} className="text-stone-700" />;
  if (lower.includes('history') || lower.includes('museum') || lower.includes('ancient') || lower.includes('heritage')) return <History size={18} className="text-amber-700" />;
  if (lower.includes('myth') || lower.includes('legend') || lower.includes('spiritual')) return <Scroll size={18} className="text-purple-700" />;
  if (lower.includes('temple') || lower.includes('worship')) return <Landmark size={18} className="text-orange-600" />;
  if (lower.includes('hotel') || lower.includes('stay') || lower.includes('guest')) return <Hotel size={18} className="text-blue-600" />;
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('eat')) return <Utensils size={18} className="text-green-600" />;
  if (lower.includes('police') || lower.includes('station')) return <Shield size={18} className="text-indigo-800" />;
  if (lower.includes('hospital') || lower.includes('medical') || lower.includes('pharmacy')) return <Activity size={18} className="text-red-600" />;
  if (lower.includes('market') || lower.includes('shop') || lower.includes('mall')) return <ShoppingBag size={18} className="text-pink-600" />;
  if (lower.includes('car') || lower.includes('taxi') || lower.includes('rental')) return <Car size={18} className="text-yellow-600" />;
  if (lower.includes('bike')) return <Bike size={18} className="text-orange-500" />;
  if (lower.includes('home')) return <Home size={18} className="text-teal-600" />;
  return <MapPin size={18} className="text-stone-500" />;
};

// --- Clipboard Helper (Robust Fallback) ---
const fallbackCopy = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Ensure it's part of DOM but hidden, yet interactive enough for copy
  textArea.style.position = "fixed";
  textArega.style.left = "0";
  textArea.style.top = "0";
  textArea.style.opacity = "0";
  textArea.setAttribute('readonly', '');
  
  document.body.appendChild(textArea);
  
  try {
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
        alert("Link copied to clipboard!");
    } else {
        // Graceful degradation: Ask user to copy manually
        prompt("Copy this link:", text);
    }
  } catch (err) {
    if (document.body.contains(textArea)) {
        document.body.removeChild(textArea);
    }
    console.warn("Fallback copy failed", err);
    prompt("Copy this link:", text);
  }
};

const copyToClipboard = (text: string) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => alert("Link copied to clipboard!"))
      .catch((err) => {
         console.warn("Clipboard API failed, retrying with fallback...", err);
         fallbackCopy(text);
      });
  } else {
    fallbackCopy(text);
  }
};

// --- Share Modal Component ---
const ShareModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  data: { title: string; text: string; url: string } 
}> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const encodedText = encodeURIComponent(data.text);
  const encodedUrl = encodeURIComponent(data.url);
  const fullShareText = encodeURIComponent(`${data.text} ${data.url}`);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        onClose();
      } catch (err) {
        console.error("Native share failed", err);
      }
    } else {
      alert("System sharing not supported on this device.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-stone-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="text-center">
             <div className="w-12 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mb-4"></div>
             <h3 className="text-lg font-bold text-stone-900 dark:text-white">Share via</h3>
          </div>

          <div className="grid grid-cols-4 gap-4">
             <a 
               href={`https://api.whatsapp.com/send?text=${fullShareText}`} 
               target="_blank" rel="noreferrer"
               className="flex flex-col items-center gap-2 group"
             >
               <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                 <MessageCircle size={28} fill="currentColor" className="text-green-500" />
               </div>
               <span className="text-xs font-medium text-stone-600 dark:text-stone-300">WhatsApp</span>
             </a>

             <a 
               href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} 
               target="_blank" rel="noreferrer"
               className="flex flex-col items-center gap-2 group"
             >
               <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                 <Facebook size={28} fill="currentColor" />
               </div>
               <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Facebook</span>
             </a>

             <a 
               href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} 
               target="_blank" rel="noreferrer"
               className="flex flex-col items-center gap-2 group"
             >
               <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                 <Twitter size={28} fill="currentColor" />
               </div>
               <span className="text-xs font-medium text-stone-600 dark:text-stone-300">X / Twitter</span>
             </a>

             <a 
               href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} 
               target="_blank" rel="noreferrer"
               className="flex flex-col items-center gap-2 group"
             >
               <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-700 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                 <Linkedin size={28} fill="currentColor" />
               </div>
               <span className="text-xs font-medium text-stone-600 dark:text-stone-300">LinkedIn</span>
             </a>
          </div>
          
          <div className="space-y-3 pt-2">
             {navigator.share && (
                <button onClick={handleNativeShare} className="w-full flex items-center justify-center gap-2 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                    <Share2 size={18} /> More Options
                </button>
             )}
             <button onClick={() => { copyToClipboard(`${data.text} ${data.url}`); onClose(); }} className="w-full flex items-center justify-center gap-2 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                 <Link size={18} /> Copy Link
             </button>
          </div>
          
          <button onClick={onClose} className="w-full p-3 rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Place Detail Modal ---
const PlaceDetailModal: React.FC<{ 
  place: NearbyPlace | null; 
  details: any; 
  isLoading: boolean; 
  onClose: () => void;
  onShare: (place: NearbyPlace) => void; 
}> = ({ place, details, isLoading, onClose, onShare }) => {
  if (!place) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="relative h-48 bg-stone-200 dark:bg-stone-800">
           <img 
             src={getSmartImageUrl(place.title, details?.type || 'place')} 
             alt={place.title} 
             className="w-full h-full object-cover"
           />
           <button onClick={onClose} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all">
             <X size={20} />
           </button>
           <button onClick={() => onShare(place)} className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all">
             <Share2 size={20} />
           </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{place.title}</h2>
              <div className="flex items-center text-stone-500 dark:text-stone-400 text-sm mt-1">
                {details?.type && <span className="bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded text-xs font-medium uppercase tracking-wider mr-2">{details.type}</span>}
                {details?.rating > 0 && (
                  <div className="flex items-center text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <span className="ml-1">{details.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 space-y-3">
              <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-full animate-pulse" />
              <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-5/6 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                {details?.description || "No description available for this location."}
              </p>
              
              <a 
                href={place.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <NavIcon size={18} className="mr-2" />
                Get Directions
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Booking Modal ---
const BookingModal: React.FC<{ hotel: Place | null; onClose: () => void }> = ({ hotel, onClose }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activeMedia, setActiveMedia] = useState<'image' | 'video' | 'map'>('image');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!hotel) return null;

    const galleryImages = [
        { type: 'image', keyword: 'hotel luxury building exterior', label: 'Exterior' },
        { type: 'image', keyword: 'hotel bedroom modern interior', label: 'Bedroom' },
        { type: 'image', keyword: 'hotel luxury bathroom', label: 'Bathroom' },
        { type: 'image', keyword: 'hotel swimming pool', label: 'Pool' },
        { type: 'image', keyword: 'hotel restaurant food', label: 'Dining' }
    ];

    const handleBook = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(3);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300 backdrop-blur-sm">
            <div className="bg-white dark:bg-stone-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-stone-200 dark:border-stone-800 z-10 bg-white dark:bg-stone-900">
                    <div>
                        <h3 className="font-bold text-lg dark:text-white leading-tight">
                            {step === 3 ? "Booking Confirmed" : hotel.name}
                        </h3>
                        {step === 1 && <p className="text-xs text-stone-500 flex items-center"><MapPin size={10} className="mr-1"/> {hotel.location || "Prime Location"}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                        <X size={20} className="dark:text-white" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-6 pb-6">
                            
                            {/* Media Showcase */}
                            <div className="relative h-64 sm:h-80 bg-black group">
                                {activeMedia === 'image' && (
                                    <img 
                                        src={getSmartImageUrl(galleryImages[currentImageIndex].keyword, 'luxury hotel')} 
                                        alt="Hotel View" 
                                        className="w-full h-full object-cover animate-in fade-in duration-500"
                                    />
                                )}
                                {activeMedia === 'video' && (
                                    <div className="w-full h-full flex items-center justify-center bg-stone-900 relative overflow-hidden">
                                         <img 
                                            src={getSmartImageUrl(hotel.name, 'hotel cinematic video thumbnail')} 
                                            className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" 
                                            alt="Video bg"
                                        />
                                        <div className="z-10 text-center">
                                            <div className="w-16 h-16 bg-saffron-600 rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg animate-pulse cursor-pointer hover:scale-110 transition-transform">
                                                <Play size={32} fill="white" className="text-white ml-1" />
                                            </div>
                                            <p className="text-white font-medium drop-shadow-md">Watch Virtual Tour</p>
                                        </div>
                                    </div>
                                )}
                                {activeMedia === 'map' && (
                                    <iframe 
                                        title="Hotel Location"
                                        width="100%" 
                                        height="100%" 
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ' ' + (hotel.location || 'India'))}&z=15&output=embed`}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                    />
                                )}

                                {/* Media Tabs */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full">
                                    <button 
                                        onClick={() => setActiveMedia('image')} 
                                        className={`p-2 rounded-full transition-colors ${activeMedia === 'image' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
                                    >
                                        <ImageIcon size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setActiveMedia('video')} 
                                        className={`p-2 rounded-full transition-colors ${activeMedia === 'video' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
                                    >
                                        <Play size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setActiveMedia('map')} 
                                        className={`p-2 rounded-full transition-colors ${activeMedia === 'map' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
                                    >
                                        <MapPin size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnails (only if image mode) */}
                            {activeMedia === 'image' && (
                                <div className="px-4 overflow-x-auto hide-scrollbar">
                                    <div className="flex gap-2">
                                        {galleryImages.map((img, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`relative min-w-[80px] h-16 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-saffron-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                            >
                                                <img src={getSmartImageUrl(img.keyword, 'hotel')} alt={img.label} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Details & Booking Form */}
                            <div className="px-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold dark:text-white">Executive Suite</h4>
                                        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
                                            Spacious room with city view, king size bed, and premium amenities.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-saffron-600">₹3,499</span>
                                        <span className="text-xs text-stone-400 line-through">₹5,000</span>
                                        <span className="block text-xs text-green-600 font-bold">30% OFF</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                                        <label className="block text-xs text-stone-500 mb-1">Check-in</label>
                                        <div className="flex items-center font-medium dark:text-white"><Calendar size={14} className="mr-2 text-saffron-500"/> Today</div>
                                    </div>
                                    <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                                        <label className="block text-xs text-stone-500 mb-1">Guests</label>
                                        <div className="flex items-center font-medium dark:text-white"><Users size={14} className="mr-2 text-saffron-500"/> 2 Adults</div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                     <h5 className="font-bold text-sm mb-2 dark:text-white">Amenities</h5>
                                     <div className="flex gap-4 text-stone-600 dark:text-stone-400">
                                         <div className="flex flex-col items-center text-xs"><Utensils size={20} className="mb-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-full box-content"/> Breakfast</div>
                                         <div className="flex flex-col items-center text-xs"><Activity size={20} className="mb-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-full box-content"/> Gym</div>
                                         <div className="flex flex-col items-center text-xs"><CloudRain size={20} className="mb-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-full box-content"/> AC</div>
                                         <div className="flex flex-col items-center text-xs"><Shield size={20} className="mb-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-full box-content"/> Sanitized</div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {step === 2 && (
                         <div className="p-6 space-y-6">
                            <div className="p-4 border border-saffron-200 bg-saffron-50 dark:bg-stone-800 dark:border-stone-700 rounded-xl">
                                <div className="flex justify-between font-semibold dark:text-white">
                                    <span>Total Amount</span>
                                    <span>₹3,499</span>
                                </div>
                                <p className="text-xs text-stone-500 mt-1">Includes taxes & fees</p>
                            </div>

                            <div className="space-y-3">
                                <button onClick={handleBook} disabled={loading} className="w-full p-4 border dark:border-stone-700 rounded-xl flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                    <div className="flex items-center">
                                        <CreditCard className="mr-3 text-blue-600" />
                                        <div className="text-left">
                                            <div className="font-semibold dark:text-white">Pay Online</div>
                                            <div className="text-xs text-stone-500">UPI / Card / Netbanking</div>
                                        </div>
                                    </div>
                                    <div className="w-4 h-4 border rounded-full"></div>
                                </button>
                                <button onClick={handleBook} disabled={loading} className="w-full p-4 border dark:border-stone-700 rounded-xl flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                    <div className="flex items-center">
                                        <Home className="mr-3 text-green-600" />
                                        <div className="text-left">
                                            <div className="font-semibold dark:text-white">Pay at Hotel</div>
                                            <div className="text-xs text-stone-500">Cash / QR</div>
                                        </div>
                                    </div>
                                    <div className="w-4 h-4 border-2 border-saffron-600 rounded-full"></div>
                                </button>
                            </div>
                            
                             {loading && <div className="flex items-center justify-center py-4 text-saffron-600 font-bold animate-pulse"><Loader2 className="animate-spin mr-2"/> Processing...</div>}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle size={48} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold dark:text-white mb-2">Booking Confirmed!</h4>
                                <p className="text-stone-600 dark:text-stone-400">Your stay at {hotel.name} is secured.</p>
                            </div>
                            <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-xl w-full text-sm text-stone-600 dark:text-stone-300">
                                <div className="flex justify-between mb-2"><span>Booking ID</span><span className="font-mono font-bold">BY-8839</span></div>
                                <div className="flex justify-between"><span>Check-in</span><span>Today, 12:00 PM</span></div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer Buttons */}
                <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 z-10">
                    {step === 1 && (
                         <button onClick={() => setStep(2)} className="w-full bg-saffron-600 hover:bg-saffron-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-saffron-200 dark:shadow-none transition-all active:scale-95">
                            Select Room & Continue
                        </button>
                    )}
                    {step === 3 && (
                        <button onClick={onClose} className="w-full bg-stone-900 dark:bg-white dark:text-stone-900 text-white py-3.5 rounded-xl font-bold transition-all">
                            Back to Explore
                        </button>
                    )}
                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="w-full text-stone-500 font-medium text-sm py-2 hover:text-stone-800 dark:hover:text-stone-300">
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- OwnerPanel Component ---
const OwnerPanel: React.FC<{
  listings: OwnerListing[];
  setListings: React.Dispatch<React.SetStateAction<OwnerListing[]>>;
  geoLocation: { lat: number; lng: number } | null;
  geoError: string | null;
  onRetryLocation: () => void;
}> = ({ listings, setListings, geoLocation, geoError, onRetryLocation }) => {
  const [form, setForm] = useState({ name: '', category: 'Hotel', description: '', contact: '', image: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        setForm({...form, image: url});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newListing: OwnerListing = {
      id: Date.now().toString(),
      name: form.name,
      category: form.category as any,
      description: form.description,
      contact: form.contact,
      address: geoLocation ? `${geoLocation.lat.toFixed(4)}, ${geoLocation.lng.toFixed(4)}` : 'Unknown',
      image: form.image
    };
    setListings((prev) => [newListing, ...prev]);
    setForm({ name: '', category: 'Hotel', description: '', contact: '', image: '' });
    if(fileInputRef.current) fileInputRef.current.value = '';
    alert("Listing added successfully!");
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-stone-50 dark:bg-stone-950">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Owner Dashboard</h2>
      
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-lg mb-8">
         <h3 className="text-lg font-bold mb-4 text-saffron-600">Add Your Business</h3>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Business Name</label>
              <input 
                required
                type="text" 
                className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white focus:ring-2 focus:ring-saffron-500 outline-none"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Category</label>
              <select 
                 className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white outline-none"
                 value={form.category}
                 onChange={e => setForm({...form, category: e.target.value})}
              >
                 <option>Hotel</option>
                 <option>Shop</option>
                 <option>Temple</option>
                 <option>Restaurant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Description</label>
              <textarea 
                required
                className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white focus:ring-2 focus:ring-saffron-500 outline-none h-24"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Business Photo</label>
              <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors"
                  >
                      <Upload size={18} /> Upload Photo
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {form.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200">
                          <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                  )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Contact Number</label>
              <input 
                required
                type="tel" 
                className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white focus:ring-2 focus:ring-saffron-500 outline-none"
                value={form.contact}
                onChange={e => setForm({...form, contact: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-3 p-3 bg-stone-100 dark:bg-stone-800 rounded-lg">
                <div className="flex items-center justify-between gap-2 text-sm text-stone-500 dark:text-stone-400">
                   <div className="flex items-center gap-2">
                     <MapPin size={16} className={geoLocation ? "text-green-600" : "text-red-500"} />
                     <span className="truncate max-w-[200px]">
                        {geoLocation 
                          ? `Lat: ${geoLocation.lat.toFixed(4)}, Lng: ${geoLocation.lng.toFixed(4)}` 
                          : geoError 
                              ? `GPS Error: ${geoError}` 
                              : "Waiting for GPS..."}
                     </span>
                   </div>
                   <button 
                     type="button" 
                     onClick={onRetryLocation} 
                     className="p-2 bg-white dark:bg-stone-700 rounded-full shadow hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                     title="Retry Location"
                   >
                     <RefreshCw size={16} />
                   </button>
                </div>
                {geoLocation && (
                   <div className="w-full h-32 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-600">
                      <iframe 
                        title="Location Preview"
                        width="100%" 
                        height="100%" 
                        src={`https://maps.google.com/maps?q=${geoLocation.lat},${geoLocation.lng}&z=15&output=embed`}
                        className="w-full h-full"
                        loading="lazy"
                      />
                   </div>
                )}
            </div>

            <button type="submit" className="w-full bg-saffron-600 hover:bg-saffron-700 text-white font-bold py-3 rounded-lg transition-colors">
               Register Business
            </button>
         </form>
      </div>

      <h3 className="text-xl font-bold mb-4 dark:text-white">My Listings</h3>
      <div className="space-y-4">
        {listings.length === 0 ? (
           <p className="text-stone-500 dark:text-stone-400 italic">No listings added yet.</p>
        ) : (
           listings.map((item) => (
              <div key={item.id} className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow border-l-4 border-saffron-500 overflow-hidden">
                 <div className="flex justify-between items-start gap-3">
                    {item.image && (
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                             <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1">
                       <h4 className="font-bold text-stone-800 dark:text-white">{item.name}</h4>
                       <span className="text-xs bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300 mt-1 inline-block">{item.category}</span>
                       <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">{item.description}</p>
                    </div>
                 </div>
                 <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
                    <span className="flex items-center"><MapPin size={12} className="mr-1"/> {item.address}</span>
                    <span className="flex items-center"><Phone size={12} className="mr-1"/> {item.contact}</span>
                 </div>
              </div>
           ))
        )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchText, setSearchText] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<OwnerListing[]>([]);
  
  // Geolocation State
  const [geoLocation, setGeoLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Map State
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchCategory, setSearchCategory] = useState('tourist attraction');
  const [downloadingMap, setDownloadingMap] = useState(false);

  // Trip Planner State
  const [tripData, setTripData] = useState<TripPlan | null>(null);
  const [tripForm, setTripForm] = useState({ destination: '', days: 3, type: 'Leisure' });
  const [tripLoading, setTripLoading] = useState(false);

  // Booking Modal State
  const [bookingHotel, setBookingHotel] = useState<Place | null>(null);

  // Emergency Info
  const [emergencyInfo, setEmergencyInfo] = useState<string | null>(null);

  // Theme
  const [darkMode, setDarkMode] = useState(false);

  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  // Quick Search Trigger (e.g. from Home or Emergency)
  const [quickSearch, setQuickSearch] = useState<string | null>(null);

  // Sharing
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({ title: '', text: '', url: '' });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    requestLocation();
  }, []);

  // Handle Quick Search Trigger
  useEffect(() => {
    if (quickSearch && geoLocation) {
        setActiveTab('map');
        handleNearbySearch(quickSearch);
        setQuickSearch(null);
    }
  }, [quickSearch, geoLocation]);

  const requestLocation = () => {
    setGeoError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Warn for permission denied instead of error
          if (error.code === 1) {
             console.warn("Geolocation permission denied");
          } else {
             console.error("Error getting location:", error.message);
          }

          let errorMessage = "Location unavailable";
          switch(error.code) {
            case 1: errorMessage = "Location Permission Denied. Please enable it in browser settings."; break;
            case 2: errorMessage = "Position Unavailable. Check GPS signal."; break;
            case 3: errorMessage = "Location Timeout. Try again."; break;
            default: errorMessage = error.message || "Unknown Error";
          }
          setGeoError(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGeoError("Not supported");
    }
  };

  const handleSearch = async (overrideQuery?: string) => {
    const query = overrideQuery || searchText;
    if (!query) return;
    setLoading(true);
    try {
      const data = await generateLocationDetails(query);
      setLocationData(data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-IN'; // Focus on Indian English context
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchText(transcript);
      handleSearch(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const handleNearbySearch = async (query: string = searchCategory) => {
    if (!geoLocation) {
        alert("Please enable location services first.");
        return;
    }
    setMapLoading(true);
    setSearchCategory(query);
    const result = await searchNearbyPlaces(geoLocation.lat, geoLocation.lng, query);
    setNearbyPlaces(result.places);
    setMapLoading(false);
  };

  const handleDownloadMap = () => {
      setDownloadingMap(true);
      setTimeout(() => {
          if(nearbyPlaces.length > 0) {
             localStorage.setItem('offlineMapData', JSON.stringify(nearbyPlaces));
             alert("Map area downloaded successfully for offline use!");
          } else {
             alert("No places to download. Search for an area first.");
          }
          setDownloadingMap(false);
      }, 1500);
  };

  const handlePlaceClick = async (place: NearbyPlace) => {
    setSelectedPlace(place);
    setDetailsLoading(true);
    const details = await getPlaceDetails(place.title);
    setPlaceDetails(details);
    setDetailsLoading(false);
  };
  
  const handleTripGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripForm.destination) return;
    setTripLoading(true);
    try {
        const plan = await generateTripItinerary(tripForm.destination, tripForm.days, tripForm.type);
        setTripData(plan);
    } catch (err) {
        alert("Could not generate itinerary. Please try again.");
    } finally {
        setTripLoading(false);
    }
  };

  const handleTriggerShare = async (specificPlace?: NearbyPlace) => {
    let title = 'Bharat Yatra AI';
    let text = 'Explore India with AI!';
    let url = window.location.href;

    if (specificPlace) {
        title = specificPlace.title;
        text = `Found this place on Bharat Yatra: ${specificPlace.title}`;
        if (specificPlace.uri && specificPlace.uri.startsWith('http')) {
            url = specificPlace.uri;
        } else {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specificPlace.title)}`;
        }
    } else if (activeTab === 'home' && locationData) {
        title = locationData.name;
        text = `Discovering ${locationData.name}: ${locationData.summary}`;
    } else if (activeTab === 'trips' && tripData) {
        title = `Trip to ${tripData.destination}`;
        text = `Check out my ${tripData.duration}-day trip plan to ${tripData.destination}!`;
    } else if (activeTab === 'map' && selectedPlace) {
         // Fallback if triggered generally while a place is open
        title = selectedPlace.title;
        text = `Found this place: ${selectedPlace.title}`;
        if (selectedPlace.uri && selectedPlace.uri.startsWith('http')) {
            url = selectedPlace.uri;
        } else {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.title)}`;
        }
    }
    
    setShareData({ title, text, url });
    setShareModalOpen(true);
  };

  const loadEmergencyInfo = async () => {
     if (!locationData?.name && !geoLocation) return;
     const locName = locationData?.name || "Current Location";
     const info = await getEmergencyInfo(locName);
     setEmergencyInfo(info);
  };
  
  useEffect(() => {
      if(activeTab === 'emergency') loadEmergencyInfo();
  }, [activeTab]);


  const renderHome = () => (
    <div className="p-6 pb-24 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-stone-50 dark:bg-stone-950 z-20 py-2">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-saffron-600 to-purple-600 bg-clip-text text-transparent">Bharat Yatra</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">AI Tourism Companion</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => handleTriggerShare()} className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-stone-700 transition-colors">
               <Share2 size={20} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm text-stone-600 dark:text-stone-300">
               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </div>

      {/* Search Bar with Voice */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search village, city (e.g. Malana)"
          className="w-full p-4 pl-12 pr-12 rounded-2xl bg-white dark:bg-stone-900 border-none shadow-md text-stone-800 dark:text-white focus:ring-2 focus:ring-saffron-500 outline-none transition-all"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Search className="absolute left-4 top-4 text-stone-400" size={20} />
        
        {/* Voice Search Button */}
        <button 
          onClick={startVoiceSearch}
          className={`absolute right-14 top-2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-stone-400 hover:text-saffron-500'}`}
          title="Voice Search"
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button 
          onClick={() => handleSearch()}
          className="absolute right-2 top-2 bg-saffron-500 text-white p-2 rounded-xl hover:bg-saffron-600 transition-colors"
        >
          Go
        </button>
      </div>

      {loading ? (
        <Loader text="Discovering India's wonders..." />
      ) : locationData ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Compact Weather Widget */}
          {locationData.weather && (
             <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                   {locationData.weather.condition.toLowerCase().includes('rain') ? <CloudRain size={24} /> : <Cloud size={24} />}
                   <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{locationData.weather.temp}</span>
                      <span className="text-sm opacity-90 border-l border-white/30 pl-2">{locationData.weather.condition}</span>
                   </div>
                </div>
                {locationData.weather.alert && (
                   <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse uppercase tracking-wider">
                      ⚠ Alert
                   </div>
                )}
             </div>
          )}

          {/* Hero Section */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-lg border border-stone-100 dark:border-stone-800 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-saffron-100 dark:bg-saffron-900/20 rounded-full blur-3xl"></div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-2 relative">{locationData.name}</h2>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed relative">{locationData.summary}</p>
            
             {/* Old Name vs New Name */}
             {locationData.history?.name_history && (
                <div className="mt-4 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-start gap-3">
                   <Info size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                   <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Did You Know?</span>
                      <p className="text-sm text-stone-700 dark:text-stone-300 italic">{locationData.history.name_history}</p>
                   </div>
                </div>
             )}
          </div>

          {/* NEW: Detailed Village Festivals & Traditions Section */}
          {locationData.culture?.festivals && locationData.culture.festivals.length > 0 && (
             <section>
                <div className="flex items-center mb-4 space-x-2">
                  <PartyPopper className="text-pink-600" />
                  <h3 className="text-xl font-bold dark:text-white">Village Festivals & Stories</h3>
                </div>
                <div className="space-y-4">
                   {locationData.culture.festivals.map((fest, idx) => (
                      <div key={idx} className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-pink-100 dark:border-stone-700 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-16 h-16 bg-pink-50 dark:bg-pink-900/20 rounded-bl-full -mr-8 -mt-8"></div>
                         <h4 className="font-bold text-lg text-pink-700 dark:text-pink-400 mb-3">{fest.name}</h4>
                         
                         <div className="grid grid-cols-1 gap-3">
                            {fest.history && (
                                <div className="text-sm text-stone-600 dark:text-stone-300">
                                   <strong className="text-stone-800 dark:text-stone-200 block text-xs uppercase tracking-wide mb-1">Origins</strong>
                                   {fest.history}
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                {fest.why && (
                                    <div className="flex-1 bg-pink-50 dark:bg-stone-800 p-3 rounded-xl">
                                       <div className="flex items-center gap-2 text-pink-800 dark:text-pink-300 font-bold text-xs uppercase mb-1">
                                           <Sparkles size={14}/> Why we celebrate
                                       </div>
                                       <p className="text-sm text-stone-700 dark:text-stone-300">{fest.why}</p>
                                    </div>
                                )}
                                {fest.how && (
                                    <div className="flex-1 bg-saffron-50 dark:bg-stone-800 p-3 rounded-xl">
                                       <div className="flex items-center gap-2 text-saffron-800 dark:text-saffron-300 font-bold text-xs uppercase mb-1">
                                           <Music size={14}/> How we celebrate
                                       </div>
                                       <p className="text-sm text-stone-700 dark:text-stone-300">{fest.how}</p>
                                    </div>
                                )}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
          )}

          {/* Detailed History Section */}
          <section>
             <div className="flex items-center mb-4 space-x-2">
               <History className="text-amber-700" />
               <h3 className="text-xl font-bold dark:text-white">Time Capsule</h3>
             </div>
             
             <div className="space-y-4">
                {/* Ancient Origins */}
                <div className="bg-amber-50 dark:bg-stone-900 p-5 rounded-2xl border-l-4 border-amber-500">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-400 text-sm uppercase tracking-wide mb-2">Ancient Origins</h4>
                  <p className="text-stone-800 dark:text-stone-300 text-sm leading-relaxed">{locationData.history?.ancient}</p>
                </div>

                {/* Kings & Battles Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {locationData.history?.kings && locationData.history.kings.length > 0 && (
                        <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
                            <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                                <Castle size={18}/>
                                <h4 className="font-bold text-sm">Rulers & Dynasties</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {locationData.history.kings.map((king, idx) => (
                                    <span key={idx} className="text-xs bg-purple-50 dark:bg-stone-900 text-purple-800 dark:text-purple-300 px-2 py-1 rounded border border-purple-100 dark:border-stone-600">
                                        {king}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {locationData.history?.battles && locationData.history.battles.length > 0 && (
                        <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
                             <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                                <Swords size={18}/>
                                <h4 className="font-bold text-sm">Historic Battles</h4>
                            </div>
                             <ul className="space-y-1">
                                {locationData.history.battles.map((battle, idx) => (
                                    <li key={idx} className="text-xs text-stone-600 dark:text-stone-300 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                                        {battle}
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}
                </div>

                 {/* Architecture & Languages */}
                <div className="grid grid-cols-2 gap-4">
                     {locationData.history?.architecture && (
                         <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
                             <div className="flex items-center gap-2 text-stone-500 text-xs uppercase font-bold mb-1">
                                 <BookOpen size={14} /> Architecture
                             </div>
                             <p className="text-sm font-medium text-stone-800 dark:text-white">{locationData.history.architecture}</p>
                         </div>
                     )}
                      {locationData.history?.languages && (
                         <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
                             <div className="flex items-center gap-2 text-stone-500 text-xs uppercase font-bold mb-1">
                                 <MessageCircle size={14} /> Languages
                             </div>
                             <p className="text-sm font-medium text-stone-800 dark:text-white">{locationData.history.languages.join(', ')}</p>
                         </div>
                     )}
                </div>
             </div>
          </section>

          {/* Culture Hub */}
          <section>
             <div className="flex items-center mb-4 space-x-2">
               <Users className="text-pink-600" />
               <h3 className="text-xl font-bold dark:text-white">Culture & Traditions</h3>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {/* Main Attributes */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-pink-50 dark:bg-stone-900 p-4 rounded-2xl flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-pink-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-2">
                            <Music size={20} className="text-pink-600"/>
                        </div>
                        <h4 className="font-bold text-sm mb-1 dark:text-white">Dance & Music</h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400">{locationData.culture?.dance || "Local folk music"}</p>
                     </div>
                     
                     <div className="bg-saffron-50 dark:bg-stone-900 p-4 rounded-2xl flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-saffron-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-2">
                            <Star size={20} className="text-saffron-600"/>
                        </div>
                        <h4 className="font-bold text-sm mb-1 dark:text-white">Rituals</h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3">{locationData.culture?.rituals || "Local customs"}</p>
                     </div>
                </div>

                {/* Folk Tales & Tribes */}
                <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
                    <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300 mb-2">Folk Tales & Beliefs</h4>
                    <p className="text-sm text-stone-600 dark:text-stone-400 italic border-l-2 border-stone-300 pl-3">
                        "{locationData.culture?.stories || "Many legends surround this ancient land..."}"
                    </p>
                </div>

                {locationData.culture?.tribes && (
                    <div className="bg-teal-50 dark:bg-stone-900 p-4 rounded-2xl">
                         <h4 className="font-bold text-sm text-teal-800 dark:text-teal-400 mb-1">Tribal Heritage</h4>
                         <p className="text-sm text-stone-600 dark:text-stone-400">{locationData.culture.tribes}</p>
                    </div>
                )}
             </div>
          </section>
          
          {/* Culture (Food) Visual Gallery */}
           <section>
            <div className="flex items-center mb-4 space-x-2">
               <Utensils className="text-green-600" />
               <h3 className="text-xl font-bold dark:text-white">Taste of {locationData.name}</h3>
             </div>
             <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
                {locationData.culture?.food?.map((dish, index) => (
                   <div key={index} className="min-w-[160px] h-48 rounded-xl overflow-hidden relative shadow-md group flex-shrink-0">
                      <img src={getSmartImageUrl(dish, 'indian food dish')} alt={dish} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                         <span className="text-white font-bold text-sm">{dish}</span>
                      </div>
                   </div>
                )) || <p className="text-stone-500">No food data available.</p>}
             </div>
          </section>

          {/* Travel & Stay Shortcuts */}
          <section>
             <div className="flex items-center mb-4 space-x-2">
               <Compass className="text-blue-600" />
               <h3 className="text-xl font-bold dark:text-white">Travel & Stay</h3>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setQuickSearch('car rental')} className="flex items-center p-3 bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3"><Car size={20}/></div>
                   <span className="font-medium text-sm dark:text-white">Rent Car</span>
                </button>
                <button onClick={() => setQuickSearch('bike rental')} className="flex items-center p-3 bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3"><Bike size={20}/></div>
                   <span className="font-medium text-sm dark:text-white">Rapido/Bike</span>
                </button>
                <a href="https://m.uber.com" target="_blank" rel="noreferrer" className="flex items-center p-3 bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-black text-white p-2 rounded-lg mr-3"><Car size={20}/></div>
                   <span className="font-medium text-sm dark:text-white">Uber / Ola</span>
                </a>
                <button onClick={() => setQuickSearch('homestay')} className="flex items-center p-3 bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-teal-100 text-teal-600 p-2 rounded-lg mr-3"><Home size={20}/></div>
                   <span className="font-medium text-sm dark:text-white">Homestays</span>
                </button>
             </div>
          </section>

          {/* Must Visit Places */}
          {locationData.temples?.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Landmark className="text-saffron-600" />
                    <h3 className="text-xl font-bold dark:text-white">Spiritual & Heritage</h3>
                </div>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
                {locationData.temples.map((place, index) => (
                  <div key={index} className="min-w-[280px] bg-white dark:bg-stone-900 rounded-2xl shadow-md overflow-hidden border border-stone-100 dark:border-stone-800 flex-shrink-0">
                    <div className="h-40 relative">
                       <img src={getSmartImageUrl(place.name, 'temple')} alt={place.name} className="w-full h-full object-cover" />
                       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                           <h4 className="font-bold text-white truncate">{place.name}</h4>
                       </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                          {place.extras?.map((extra, idx) => (
                              <div key={idx} className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1 last:border-0">
                                  <span className="text-stone-400 text-xs uppercase">{extra.key}</span>
                                  <span className="font-medium text-right text-stone-800 dark:text-stone-200">{extra.value}</span>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => {setQuickSearch(place.name)}} className="mt-4 w-full py-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-white rounded-lg text-sm font-medium flex items-center justify-center">
                          <MapPin size={16} className="mr-1" /> View on Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Hotels Section */}
          {locationData.hotels?.length > 0 && (
            <section>
                <div className="flex items-center mb-4 space-x-2">
                   <Hotel className="text-blue-600" />
                   <h3 className="text-xl font-bold dark:text-white">Stays Nearby</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {locationData.hotels.map((hotel, idx) => (
                        <div key={idx} className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow flex gap-4">
                            <div className="w-24 h-24 rounded-xl bg-stone-200 flex-shrink-0 overflow-hidden">
                                <img src={getSmartImageUrl(hotel.name, 'luxury hotel bedroom')} alt={hotel.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold dark:text-white">{hotel.name}</h4>
                                <div className="flex items-center text-yellow-500 text-xs my-1">
                                    <Star size={12} fill="currentColor"/> 4.5
                                </div>
                                <p className="text-xs text-stone-500 line-clamp-2 mb-3">{hotel.description}</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setBookingHotel(hotel)}
                                        className="bg-saffron-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex-1"
                                    >
                                        Book Room
                                    </button>
                                    <button onClick={() => setQuickSearch(hotel.name)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                                        <MapPin size={16} className="text-stone-600 dark:text-stone-300"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
          )}

        </div>
      ) : (
         // --- Default Landing: Trending Destinations ---
         <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Trending Carousel */}
            <section>
                <h3 className="text-lg font-bold text-stone-800 dark:text-white mb-4 flex items-center gap-2">
                    <Star size={18} className="text-yellow-500" fill="currentColor"/> Trending Now
                </h3>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
                    {[
                        { name: 'Varanasi', tag: 'Spirituality', img: 'varanasi ghat ganga aarti' },
                        { name: 'Goa', tag: 'Beaches', img: 'goa beach palm trees' },
                        { name: 'Jaipur', tag: 'Heritage', img: 'hawa mahal jaipur' },
                        { name: 'Manali', tag: 'Mountains', img: 'manali snow mountains' },
                        { name: 'Kerala', tag: 'Nature', img: 'kerala backwaters houseboat' }
                    ].map((place, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {setSearchText(place.name); handleSearch(place.name);}}
                            className="relative min-w-[140px] h-56 rounded-2xl overflow-hidden shadow-md group text-left"
                        >
                            <img src={getSmartImageUrl(place.img)} alt={place.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                                <span className="text-xs text-saffron-300 font-medium uppercase tracking-wider mb-1">{place.tag}</span>
                                <h4 className="text-white font-bold text-lg">{place.name}</h4>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Categories Grid */}
            <section>
                 <h3 className="text-lg font-bold text-stone-800 dark:text-white mb-4">Explore by Interest</h3>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                        { name: 'Temples', icon: <Landmark size={24} className="text-orange-500"/>, search: 'famous temples' },
                        { name: 'Forts', icon: <Castle size={24} className="text-stone-600"/>, search: 'historical forts' },
                        { name: 'Food', icon: <Utensils size={24} className="text-green-600"/>, search: 'famous food' },
                        { name: 'Hill Station', icon: <Cloud size={24} className="text-blue-400"/>, search: 'hill stations' },
                        { name: 'Wildlife', icon: <ScanFace size={24} className="text-green-800"/>, search: 'wildlife sanctuary' }, // Replaced undefined PawPrint with generic ScanFace or similar if needed, but sticking to lucide imports
                        { name: 'Beaches', icon: <Sun size={24} className="text-yellow-500"/>, search: 'beaches' },
                    ].map((cat, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {setSearchText(cat.search); handleSearch(cat.search);}}
                            className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                        >
                            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full">{cat.icon}</div>
                            <span className="text-xs font-medium dark:text-stone-300">{cat.name}</span>
                        </button>
                    ))}
                 </div>
            </section>
         </div>
      )}
    </div>
  );

  const renderMap = () => (
    <div className="relative h-screen w-full bg-stone-100 dark:bg-stone-900 flex flex-col overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
         <div className="flex gap-2">
            <input 
                type="text" 
                className="flex-1 p-3 rounded-xl shadow-lg bg-white dark:bg-stone-800 border-none outline-none dark:text-white"
                placeholder="Search nearby (e.g. ATM, Hotel)"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
            />
            <button onClick={() => handleNearbySearch()} className="bg-saffron-600 text-white p-3 rounded-xl shadow-lg">
                <Search size={20} />
            </button>
            <button onClick={handleDownloadMap} disabled={downloadingMap} className="bg-stone-800 text-white p-3 rounded-xl shadow-lg">
                {downloadingMap ? <Loader2 size={20} className="animate-spin"/> : <Download size={20} />}
            </button>
         </div>
         
         {/* Map Filters */}
         <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {['Temples', 'Hotels', 'Food', 'Police', 'Hospital', 'Forts', 'Rentals'].map(cat => (
                <button 
                    key={cat}
                    onClick={() => handleNearbySearch(cat)}
                    className="px-4 py-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur shadow rounded-full text-xs font-medium whitespace-nowrap dark:text-stone-200"
                >
                    {cat}
                </button>
            ))}
         </div>
      </div>

      {/* Map Visualization */}
      <div className="flex-1 relative w-full h-full touch-none" style={{ touchAction: 'none' }}> 
        {geoLocation ? (
             <iframe 
                title="Google Map"
                width="100%" 
                height="100%" 
                src={`https://maps.google.com/maps?q=${selectedPlace ? encodeURIComponent(selectedPlace.title) : `${geoLocation.lat},${geoLocation.lng}`}&z=${selectedPlace ? 16 : 14}&output=embed`}
                className="w-full h-full border-none"
                style={{ pointerEvents: 'auto' }} // Ensure map is interactable with one finger if container prevents scroll
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 bg-stone-200 dark:bg-stone-800 p-6 text-center">
                <MapIcon size={48} className="mb-4 opacity-50" />
                {geoError ? (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 max-w-xs">
                        <p className="text-red-600 dark:text-red-400 font-bold mb-1">GPS Error</p>
                        <p className="text-sm mb-3">{geoError}</p>
                    </div>
                ) : (
                    <p>Waiting for GPS...</p>
                )}
                <button onClick={requestLocation} className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg">
                    {geoError ? "Retry Permission" : "Enable Location"}
                </button>
            </div>
        )}
        
        {/* Offline Mode Indicator */}
        {localStorage.getItem('offlineMapData') && (
            <div className="absolute bottom-20 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                <Wifi size={12} /> Offline Ready
            </div>
        )}
      </div>

      {/* Nearby List Overlay */}
      <div className="absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-stone-900 dark:via-stone-900 pt-12 z-0">
         <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
             {mapLoading ? (
                <div className="flex gap-4">
                    {[1,2,3].map(i => <div key={i} className="w-64 h-24 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse flex-shrink-0" />)}
                </div>
             ) : nearbyPlaces.map((place, idx) => (
                 <div 
                    key={idx} 
                    onClick={() => handlePlaceClick(place)}
                    className="bg-white dark:bg-stone-800 p-3 rounded-xl shadow-lg min-w-[240px] border border-stone-100 dark:border-stone-700 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                 >
                    <div className="bg-stone-100 dark:bg-stone-700 p-3 rounded-full">
                        {getCategoryIcon(searchCategory)}
                    </div>
                    <div className="overflow-hidden">
                        <h4 className="font-bold text-sm truncate dark:text-white">{place.title}</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                            View Details <ChevronRight size={12} />
                        </p>
                    </div>
                 </div>
             ))}
         </div>
      </div>
    </div>
  );

  const renderTrips = () => (
    <div className="p-6 pb-24 min-h-screen bg-stone-50 dark:bg-stone-950">
       <h2 className="text-2xl font-bold mb-6 dark:text-white">AI Trip Planner</h2>
       
       {/* Planner Form */}
       <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-lg mb-8">
           <form onSubmit={handleTripGenerate} className="space-y-4">
               <div>
                   <label className="text-xs font-bold uppercase text-stone-500">Destination</label>
                   <input 
                        type="text" 
                        className="w-full p-3 border-b-2 border-stone-200 dark:border-stone-700 bg-transparent outline-none dark:text-white focus:border-saffron-500 transition-colors"
                        placeholder="Where to? (e.g. Ladakh)"
                        value={tripForm.destination}
                        onChange={e => setTripForm({...tripForm, destination: e.target.value})}
                        required
                   />
               </div>
               <div className="flex gap-4">
                   <div className="flex-1">
                       <label className="text-xs font-bold uppercase text-stone-500">Days</label>
                       <select 
                            className="w-full p-3 border-b-2 border-stone-200 dark:border-stone-700 bg-transparent outline-none dark:text-white"
                            value={tripForm.days}
                            onChange={e => setTripForm({...tripForm, days: parseInt(e.target.value)})}
                        >
                            {[1,2,3,4,5,7,10].map(d => <option key={d} value={d}>{d} Days</option>)}
                       </select>
                   </div>
                   <div className="flex-1">
                       <label className="text-xs font-bold uppercase text-stone-500">Style</label>
                       <select 
                            className="w-full p-3 border-b-2 border-stone-200 dark:border-stone-700 bg-transparent outline-none dark:text-white"
                            value={tripForm.type}
                            onChange={e => setTripForm({...tripForm, type: e.target.value})}
                        >
                            <option>Leisure</option>
                            <option>Adventure</option>
                            <option>Spiritual</option>
                            <option>Family</option>
                            <option>Budget</option>
                       </select>
                   </div>
               </div>
               <button disabled={tripLoading} type="submit" className="w-full py-4 bg-stone-900 dark:bg-white dark:text-stone-900 text-white rounded-xl font-bold mt-4">
                   {tripLoading ? <Loader2 className="animate-spin mx-auto"/> : "Plan My Trip"}
               </button>
           </form>
       </div>

       {/* Itinerary Result */}
       {tripData && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
               <div className="flex justify-between items-end">
                   <div>
                       <p className="text-xs text-stone-500 uppercase font-bold">Itinerary For</p>
                       <h3 className="text-3xl font-bold text-saffron-600">{tripData.destination}</h3>
                   </div>
                   <div className="text-right">
                       <span className="block text-2xl font-bold dark:text-white">{tripData.duration} Days</span>
                       <span className="text-xs bg-stone-200 dark:bg-stone-800 px-2 py-1 rounded">{tripData.type}</span>
                   </div>
               </div>

               <div className="relative border-l-2 border-stone-200 dark:border-stone-800 ml-4 space-y-8">
                   {tripData.itinerary.map((day) => (
                       <div key={day.day} className="relative pl-8">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 bg-saffron-500 rounded-full border-4 border-white dark:border-stone-950"></div>
                           <h4 className="font-bold text-lg dark:text-white mb-1">Day {day.day}: {day.theme}</h4>
                           <div className="space-y-3 mt-3">
                               {day.activities.map((act, idx) => (
                                   <div key={idx} className="bg-white dark:bg-stone-900 p-3 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 flex gap-3">
                                       <div className="text-xs font-bold text-stone-400 w-12 pt-1">{act.time}</div>
                                       <div>
                                           <p className="font-medium text-sm dark:text-stone-200">{act.activity}</p>
                                           {act.location && <span className="text-xs text-blue-500 flex items-center mt-1"><MapPin size={10} className="mr-1"/> {act.location}</span>}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}
    </div>
  );

  const renderEmergency = () => (
    <div className="p-6 pb-24 min-h-screen bg-red-50 dark:bg-stone-950">
      <h2 className="text-3xl font-bold text-red-600 mb-6 flex items-center gap-2">
        <AlertTriangle /> Emergency
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <a href="tel:100" className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-stone-800 transition-colors border border-red-100 dark:border-red-900/30">
           <Shield size={32} className="text-indigo-600" />
           <span className="font-bold text-lg dark:text-white">Police (100)</span>
        </a>
        <a href="tel:108" className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-stone-800 transition-colors border border-red-100 dark:border-red-900/30">
           <Activity size={32} className="text-red-600" />
           <span className="font-bold text-lg dark:text-white">Ambulance (108)</span>
        </a>
        <a href="tel:101" className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-stone-800 transition-colors border border-red-100 dark:border-red-900/30">
           <div className="text-orange-600 font-bold text-2xl">🔥</div>
           <span className="font-bold text-lg dark:text-white">Fire (101)</span>
        </a>
        <a href="tel:112" className="bg-red-600 text-white p-6 rounded-2xl shadow-lg shadow-red-200 dark:shadow-none flex flex-col items-center justify-center gap-2">
           <Phone size={32} />
           <span className="font-bold text-lg">SOS (112)</span>
        </a>
      </div>

      <div className="space-y-4">
         <h3 className="font-bold text-stone-700 dark:text-stone-300">Find Nearby Help</h3>
         <button onClick={() => setQuickSearch('police station')} className="w-full bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full"><Shield size={20}/></div>
                <div>
                    <span className="block font-bold dark:text-white">Nearest Police Station</span>
                    <span className="text-xs text-stone-500">Locate on map</span>
                </div>
            </div>
            <ChevronRight className="text-stone-400" />
         </button>
         <button onClick={() => setQuickSearch('hospital')} className="w-full bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
                <div className="bg-red-100 text-red-600 p-2 rounded-full"><Activity size={20}/></div>
                <div>
                    <span className="block font-bold dark:text-white">Nearest Hospital</span>
                    <span className="text-xs text-stone-500">Locate on map</span>
                </div>
            </div>
            <ChevronRight className="text-stone-400" />
         </button>
      </div>

      {emergencyInfo && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-stone-900 border border-yellow-200 dark:border-yellow-900 rounded-xl">
           <h4 className="font-bold text-yellow-800 dark:text-yellow-500 mb-2 flex items-center gap-2"><Info size={16}/> Local Emergency Info</h4>
           <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">{emergencyInfo}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="font-sans bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-200">
      {activeTab === 'home' && renderHome()}
      {activeTab === 'map' && renderMap()}
      {activeTab === 'trips' && renderTrips()}
      {activeTab === 'emergency' && renderEmergency()}
      {activeTab === 'owner' && (
        <OwnerPanel 
          listings={listings} 
          setListings={setListings}
          geoLocation={geoLocation}
          geoError={geoError}
          onRetryLocation={requestLocation}
        />
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {selectedPlace && (
        <PlaceDetailModal 
          place={selectedPlace} 
          details={placeDetails}
          isLoading={detailsLoading}
          onClose={() => {setSelectedPlace(null); setPlaceDetails(null);}}
          onShare={handleTriggerShare}
        />
      )}

      {bookingHotel && (
          <BookingModal 
            hotel={bookingHotel} 
            onClose={() => setBookingHotel(null)} 
          />
      )}
      
      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={shareData}
      />
    </div>
  );
};

export default App;

// ScanFace icon replacement for lucide-react compatibility if missing, purely illustrative
const ScanFace = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect width="7" height="7" x="8.5" y="8.5" rx="1"/></svg>
);
