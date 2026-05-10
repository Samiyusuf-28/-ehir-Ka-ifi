import React, { useState, useEffect } from 'react';
import { Search, MapPin, Utensils, Camera, Landmark, Loader2, Sparkles, Navigation, ArrowRight, Map as MapIcon, Calendar, Heart, Car, Bike, Footprints, Plane, Star, Bed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCityDetails, CityData, getItinerary, ItineraryRoute, getTravelEstimates, TravelInfo } from './services/geminiService';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export default function App() {
  const [query, setQuery] = useState('');
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070');
  const [wikiImage, setWikiImage] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryRoute | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>('Tarihi Mekanlar');
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const themes = ['Tarihi Mekanlar', 'Gastronomi Turu', 'Doğa Harikaları'];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => console.error("Error getting location:", err)
      );
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setWikiImage(null);
    setGalleryImages([]);
    setItinerary(null);
    setTravelInfo(null);
    try {
      const data = await getCityDetails(query);
      setCityData(data);
      
      const searchTerms = encodeURIComponent(`${data.name} ${data.aestheticPrompt} wide scenic`);
      setBgImage(`https://images.unsplash.com/featured/?${searchTerms}`);
      
      try {
        const wikiResponse = await fetch(`https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.name)}`);
        const wikiData = await wikiResponse.json();
        if (wikiData.originalimage?.source) {
          setWikiImage(wikiData.originalimage.source);
          setBgImage(wikiData.originalimage.source);
        }
      } catch (wikiErr) {
        console.error("Wiki fetch error:", wikiErr);
      }

      // Fetch Wikipedia Gallery Images
      try {
        const mediaResponse = await fetch(`https://tr.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(data.name)}`);
        const mediaData = await mediaResponse.json();
        if (mediaData.items) {
          const images = mediaData.items
            .filter((item: any) => item.type === 'image' && item.srcset && item.srcset.length > 0)
            .map((item: any) => item.srcset[item.srcset.length - 1].src)
            .slice(0, 10);
          setGalleryImages(images);
        }
      } catch (mediaErr) {
        console.error("Wiki media fetch error:", mediaErr);
      }
      
      // Load initial itinerary
      fetchThemeItinerary(data.name, themes[0]);

      // Get travel estimates if user location is available
      if (userLocation) {
        // We'll reverse geocode or just use coords as string for Gemini
        // For simplicity, let's just use the current city if we had it, but coordinates are better
        const estimates = await getTravelEstimates(`${userLocation.lat}, ${userLocation.lng}`, data.name);
        setTravelInfo(estimates);
      } else {
        // Try to get estimates from a general "current location" if coordinates failed
        const estimates = await getTravelEstimates("Bulunduğum Yer", data.name);
        setTravelInfo(estimates);
      }
    } catch (err) {
      console.error(err);
      setError('Şehir bilgileri alınırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const fetchThemeItinerary = async (cityName: string, theme: string) => {
    setItineraryLoading(true);
    setActiveTheme(theme);
    try {
      const route = await getItinerary(cityName, theme);
      setItinerary(route);
    } catch (err) {
      console.error(err);
    } finally {
      setItineraryLoading(false);
    }
  };

  const MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-white/20">
      <APIProvider apiKey={MAPS_KEY} version="weekly">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={bgImage}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img 
              src={bgImage} 
              alt="Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/60 to-[#050505]" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decorative Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Navigation / Header */}
        <nav className="p-6 md:p-8 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCityData(null)}
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-xs ring-4 ring-white/10 group-hover:scale-110 transition-transform">ŞK</div>
            <span className="font-display text-lg tracking-tighter font-semibold">ŞehirKaşifi</span>
          </motion.div>

          <div className="hidden md:flex gap-8 text-xs uppercase tracking-[0.2em] font-medium text-white/40">
            <span className="hover:text-white transition-colors cursor-pointer">Destinasyonlar</span>
            <span className="hover:text-white transition-colors cursor-pointer">Deneyimler</span>
            <span className="hover:text-white transition-colors cursor-pointer">Hakkımızda</span>
          </div>
        </nav>

        {!cityData ? (
          <div className="h-[80vh] flex flex-col justify-center items-center px-6 text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-display text-7xl md:text-9xl font-bold tracking-tighter leading-[0.85] mb-8">
                DÜNYAYI <br />
                <span className="italic text-white/40 bg-clip-text text-transparent bg-gradient-to-r from-white/60 to-white/20">KEŞFEDİN</span>
              </h1>
              
              <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur opacity-40 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Bir şehir yazın..."
                    className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full py-6 px-16 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 transition-all text-xl"
                  />
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={24} />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="absolute right-3 top-3 bottom-3 bg-white text-black px-10 rounded-full font-bold hover:bg-white/80 disabled:opacity-50 transition-all flex items-center gap-2 overflow-hidden"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "KEŞFET"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        ) : (
          <main className="container mx-auto px-6 py-12">
            <header className="mb-24 flex flex-col md:flex-row justify-between items-end gap-12">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs uppercase tracking-[0.5em] text-white/40 mb-4 flex items-center gap-2 text-blue-400">
                    <MapPin size={14} className="text-blue-400" /> {cityData.country}
                  </p>
                  <h2 className="font-display text-8xl md:text-[10rem] font-bold tracking-tighter leading-none mb-8 -ml-1 md:-ml-2">
                    {cityData.name.toUpperCase()}
                  </h2>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col md:flex-row gap-12 items-start"
                >
                  <div className="flex-shrink-0 w-16 h-px bg-white/20 mt-4" />
                  <div className="space-y-6">
                    <p className="text-xl md:text-2xl font-light text-white/80 leading-relaxed max-w-2xl italic">
                      &ldquo;{cityData.description.split('.')[0]}.&rdquo;
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed max-w-xl border-l border-white/10 pl-6">
                      {cityData.description.split('.').slice(1).join('.')}
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden lg:block w-64 h-64 rounded-full overflow-hidden border-8 border-white/5 relative group"
              >
                <img 
                  src={wikiImage || `https://images.unsplash.com/featured/?${encodeURIComponent(cityData.name + ' ' + cityData.aestheticPrompt + ' landscape')}`} 
                  alt={cityData.name} 
                  className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={32} className="text-white shadow-xl" />
                </div>
              </motion.div>
            </header>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px] mb-32 text-left">
              {/* Etkileşimli Harita - Large */}
              <BentoItem 
                span="md:col-span-8 md:row-span-2"
                title="Şehir Haritası"
                icon={<MapIcon size={20} className="text-blue-400" />}
                color="border-blue-500/20"
                delay={0.6}
              >
                <div key={cityData.name} className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
                  <Map
                    defaultCenter={cityData.coordinates}
                    defaultZoom={12}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    gestureHandling={'greedy'}
                    className="w-full h-full"
                  >
                    <AdvancedMarker position={cityData.coordinates} title={cityData.name}>
                       <Pin background="#FBBC04" glyphColor="#000" />
                    </AdvancedMarker>
                    {userLocation && (
                      <AdvancedMarker position={userLocation} title="Sizin Konumunuz">
                        <Pin background="#4285F4" glyphColor="#fff" />
                      </AdvancedMarker>
                    )}
                    {cityData.landmarks.map((l, i) => l.coordinates && (
                      <AdvancedMarker key={`l-${i}`} position={l.coordinates} title={l.name}>
                         <Pin background="#EA4335" glyphColor="#fff" scale={0.8} />
                      </AdvancedMarker>
                    ))}
                    {cityData.scenicSpots.map((s, i) => s.coordinates && (
                      <AdvancedMarker key={`s-${i}`} position={s.coordinates} title={s.name}>
                         <Pin background="#34A853" glyphColor="#fff" scale={0.8} />
                      </AdvancedMarker>
                    ))}
                    {cityData.hotels.map((h, i) => h.coordinates && (
                      <AdvancedMarker key={`h-${i}`} position={h.coordinates} title={h.name}>
                         <Pin background="#A142F4" glyphColor="#fff" scale={0.8} />
                      </AdvancedMarker>
                    ))}
                  </Map>
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase font-bold tracking-widest pointer-events-none">
                    Etkileşimli Görünüm
                  </div>
                </div>
              </BentoItem>

              {/* Fotoğraf Galerisi */}
              <BentoItem 
                span="md:col-span-4 md:row-span-2"
                title="Şehir Galerisi"
                icon={<Camera size={20} className="text-pink-400" />}
                color="border-pink-500/20"
                delay={0.65}
              >
                <div className="grid grid-cols-2 gap-2 p-1 max-h-[500px] overflow-y-auto scrollbar-hidden">
                  {(galleryImages.length > 0 ? galleryImages : [1, 2, 3, 4, 5, 6]).map((img, idx) => {
                    const imgUrl = typeof img === 'string' ? 'https:' + img : `https://images.unsplash.com/featured/?${encodeURIComponent(cityData.name + " " + cityData.aestheticPrompt + " " + idx)}`;
                    return (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 0.98 }}
                        className="aspect-square rounded-xl overflow-hidden cursor-pointer bg-white/5 border border-white/10"
                        onClick={() => setSelectedImage(imgUrl)}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Gallery ${idx}`}
                          className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-white/30 text-center mt-4">FOTOĞRAFLARI BÜYÜTMEK İÇİN TIKLAYIN</p>
              </BentoItem>

              {/* Gezi Rotaları - AI Itinerary */}
              <BentoItem 
                span="md:col-span-4 md:row-span-2"
                title="AI Gezi Rotaları"
                icon={<Calendar size={20} className="text-yellow-400" />}
                color="border-yellow-500/20"
                delay={0.7}
              >
                <div className="flex flex-wrap gap-2 mb-6">
                  {themes.map(t => (
                    <button
                      key={t}
                      onClick={() => fetchThemeItinerary(cityData.name, t)}
                      disabled={itineraryLoading}
                      className={`text-[9px] px-3 py-1.5 rounded-full border transition-all uppercase tracking-tighter ${activeTheme === t ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                
                {itineraryLoading ? (
                  <div className="h-40 flex items-center justify-center text-xs text-white/20 uppercase tracking-widest animate-pulse">Rota Hazırlanıyor...</div>
                ) : itinerary && (
                  <div className="space-y-4">
                    {itinerary.steps.map((step, i) => (
                      <div key={i} className="flex gap-4 group/step">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-white/20 group-hover/step:bg-yellow-400 transition-colors" />
                          {i < itinerary.steps.length - 1 && <div className="w-px h-full bg-white/5" />}
                        </div>
                        <div className="pb-4">
                          <h5 className="text-[11px] font-bold text-white/80 group-hover/step:text-white">{step.locationName}</h5>
                          <p className="text-[10px] text-white/40 leading-snug mt-1">{step.description}</p>
                          <span className="text-[9px] text-yellow-400/60 mt-1 block">{step.estimatedTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BentoItem>

              {/* Mutfak Kültürü - Small */}
              <BentoItem 
                span="md:col-span-4 md:row-span-2"
                title="Mutfak Kültürü"
                icon={<Utensils size={20} className="text-orange-400" />}
                color="border-orange-500/20"
                delay={0.8}
              >
                <div className="space-y-6">
                  {cityData.foods.map((food, i) => (
                    <div key={i} className="group/food border-b border-white/5 pb-4 last:border-0">
                      <h4 className="font-bold text-sm mb-1 text-white/90 group-hover/food:text-orange-400 transition-colors">{food.name}</h4>
                      <p className="text-[11px] text-white/40 leading-relaxed italic">{food.description}</p>
                    </div>
                  ))}
                </div>
              </BentoItem>

              {/* Tarihi Mekanlar - List */}
              <BentoItem 
                span="md:col-span-4 md:row-span-2"
                title="Tarihi Noktalar"
                icon={<Landmark size={20} className="text-blue-400" />}
                color="border-blue-500/20"
                delay={0.9}
              >
                 <div className="space-y-4">
                  {cityData.landmarks.map((item, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                      <h4 className="font-bold text-[11px] uppercase tracking-wide mb-1">{item.name}</h4>
                      <p className="text-[10px] text-white/30 truncate">{item.description}</p>
                    </div>
                  ))}
                </div>
              </BentoItem>

               {/* Manzaralar - Small */}
               <BentoItem 
                 span="md:col-span-4 md:row-span-2"
                 title="Büyüleyici Manzaralar"
                 icon={<Camera size={20} className="text-green-400" />}
                 color="border-green-500/20"
                 delay={1.0}
               >
                <div className="space-y-4">
                  {cityData.scenicSpots.map((spot, i) => (
                    <div key={i} className="text-[11px] text-white/40 border-l border-white/10 pl-4 py-1 hover:border-green-500/40 transition-colors">
                      <span className="text-white/80 block font-bold mb-1">{spot.name}</span>
                      {spot.description}
                    </div>
                  ))}
                </div>
              </BentoItem>

              {/* Kalacak Yerler - Hotels */}
              <BentoItem 
                span="md:col-span-12 md:row-span-2"
                title="Nerede Kalınır?"
                icon={<Bed size={20} className="text-purple-400" />}
                color="border-purple-500/20"
                delay={0.7}
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 scrollbar-hidden">
                  {[1, 2, 3, 4, 5].map(star => (
                    <div key={star} className="min-w-[200px] flex flex-col gap-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        {Array.from({ length: star }).map((_, si) => (
                           <Star key={si} size={8} className="fill-yellow-500 text-yellow-500" />
                        ))}
                        <span className="text-[9px] uppercase tracking-widest text-white/40 ml-1">{star} Yıldızlı</span>
                      </div>
                      {cityData.hotels.filter(h => h.stars === star).map((hotel, hi) => (
                        <div key={hi} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all flex flex-col gap-2">
                          <h6 className="font-bold text-[11px] text-white/90 truncate">{hotel.name}</h6>
                          <p className="text-[9px] text-white/30 line-clamp-2 leading-tight">{hotel.description}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">İtibari Fiyat</span>
                            <span className="text-[9px] text-white/40">{hotel.approxPrice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </BentoItem>

              {/* Ulaşım Bilgileri */}
              <BentoItem 
                span="md:col-span-12 md:row-span-1"
                title="Şehre Ulaşım & Yolculuk"
                icon={<Navigation size={20} className="text-red-400" />}
                color="border-red-500/20"
                delay={1.1}
              >
                {travelInfo ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center h-full">
                    <div className="text-center group/travel">
                       <MapPin size={24} className="mx-auto mb-2 text-red-500/60 group-hover/travel:scale-110 transition-transform" />
                       <p className="text-[10px] text-white/30 uppercase tracking-widest">Mesafe</p>
                       <p className="text-sm font-bold">{travelInfo.distKm} KM</p>
                    </div>
                    <div className="text-center group/travel">
                       <Car size={24} className="mx-auto mb-2 text-blue-400/60 group-hover/travel:scale-110 transition-transform" />
                       <p className="text-[10px] text-white/30 uppercase tracking-widest">Arabayla</p>
                       <p className="text-sm font-bold">{travelInfo.driving}</p>
                    </div>
                    <div className="text-center group/travel">
                       <Footprints size={24} className="mx-auto mb-2 text-green-400/60 group-hover/travel:scale-110 transition-transform" />
                       <p className="text-[10px] text-white/30 uppercase tracking-widest">Yürüyerek</p>
                       <p className="text-sm font-bold">{travelInfo.walking}</p>
                    </div>
                    <div className="text-center group/travel">
                       <Bike size={24} className="mx-auto mb-2 text-yellow-400/60 group-hover/travel:scale-110 transition-transform" />
                       <p className="text-[10px] text-white/30 uppercase tracking-widest">Bisikletle</p>
                       <p className="text-sm font-bold">{travelInfo.cycling}</p>
                    </div>
                    <div className="text-center group/travel">
                       <Plane size={24} className="mx-auto mb-2 text-purple-400/60 group-hover/travel:scale-110 transition-transform" />
                       <p className="text-[10px] text-white/30 uppercase tracking-widest">Uçakla</p>
                       <p className="text-sm font-bold">{travelInfo.flight || "Gerek yok"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-white/20 uppercase tracking-widest animate-pulse">Ulaşım Analizi Yapılıyor...</div>
                )}
              </BentoItem>
            </div>
            
            {/* Action Footer */}
            <footer className="mt-40 border-t border-white/10 pt-12 pb-24 grid md:grid-cols-2 items-center gap-12 text-left">
               <div>
                 <h2 className="font-display text-4xl italic mb-4">Bir sonraki durağınız neresi?</h2>
                 <p className="text-white/40 max-w-sm">Daha fazlasını keşfetmek için yukarıdaki arama alanına başka bir şehir yazın.</p>
               </div>
               <div className="flex justify-end gap-4">
                 <button className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                   <Heart size={16} /> Favorilerime Ekle
                 </button>
                 <button 
                  onClick={() => {
                    setCityData(null);
                    setBgImage('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-12 py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl text-xs"
                 >
                   Yeni Şehir Keşfet
                 </button>
               </div>
            </footer>
          </main>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-5xl w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Enlarged view" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <button 
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              Kapat (ESC)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 text-center px-6">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
             className="w-16 h-16 border-2 border-white/10 border-t-white rounded-full"
           />
           <p className="text-sm font-bold uppercase tracking-[0.4em] animate-pulse">Dünya Sizin İçin Hazırlanıyor...</p>
        </div>
      )}
      </APIProvider>
    </div>
  );
}

function BentoItem({ title, icon, color, children, span, delay }: { title: string, icon: React.ReactNode, color: string, children: React.ReactNode, span: string, delay: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className={`${span} bg-white/5 backdrop-blur-md rounded-[2.5rem] border ${color} overflow-hidden flex flex-col hover:bg-white/[0.07] transition-all group p-8`}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        {children}
      </div>
    </motion.section>
  );
}
