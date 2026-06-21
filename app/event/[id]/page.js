"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Share2,
  UtensilsCrossed,
} from 'lucide-react';

/* ─── Helpers ─── */

function parseEventDates(jam_operasional) {
  if (!jam_operasional) return null;

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const startMatch = jam_operasional.match(/Mulai:\s*([\d-]+)/);
  const endMatch = jam_operasional.match(/Selesai:\s*([\d-]+)/);
  const timeMatch = jam_operasional.match(/Waktu:\s*(.+)/);

  let startStr = null;
  let endStr = null;

  if (startMatch && startMatch[1]) {
    const d = new Date(startMatch[1]);
    if (!isNaN(d.getTime())) {
      startStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  if (endMatch && endMatch[1]) {
    const d = new Date(endMatch[1]);
    if (!isNaN(d.getTime())) {
      endStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  const timeStr = timeMatch ? timeMatch[1].trim() : null;

  return { startStr, endStr, timeStr, raw: jam_operasional };
}

function buildMapsUrl(koordinat_gps, lokasi_wilayah, nama_tempat) {
  if (koordinat_gps && Array.isArray(koordinat_gps) && koordinat_gps.length >= 2) {
    return `https://www.google.com/maps/search/?api=1&query=${koordinat_gps[0]},${koordinat_gps[1]}`;
  }
  const query = lokasi_wilayah || nama_tempat || 'Tana Toraja';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    } else if (url.includes('youtube.com/v/')) {
      videoId = url.split('youtube.com/v/')[1]?.split('?')[0];
    } else {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
    }
  } catch (e) {
    console.error('Error parsing YouTube URL:', e);
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getInstagramEmbedUrl(url) {
  if (!url) return '';
  let cleanUrl = url.split('?')[0];
  if (!cleanUrl.endsWith('/')) {
    cleanUrl += '/';
  }
  if (cleanUrl.endsWith('embed/')) return cleanUrl;
  return `${cleanUrl}embed/`;
}

function parseCostInfo(costObj) {
  if (!costObj || typeof costObj !== 'object') return [];
  return Object.entries(costObj)
    .filter(([key, val]) => 
      key !== 'image_url' && 
      key !== 'harga_tiket' && 
      key !== 'sub_kategori' && 
      key !== 'penyelenggara' && 
      val !== '' && 
      val !== null && 
      val !== undefined
    )
    .map(([key, val]) => {
      const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const value = typeof val === 'number' ? `Rp ${val.toLocaleString('id-ID')}` : String(val);
      return { label, value };
    });
}

/* ─── Main Component ─── */

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [allDestinations, setAllDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check saved status from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_events') || '[]');
      setIsSaved(saved.includes(eventId));
    } catch {
      setIsSaved(false);
    }
  }, [eventId]);

  // Handle scroll to transition header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
        setAllDestinations(data);
        const found = data.find(d => d.id === eventId);
        if (!found) throw new Error('Event tidak ditemukan');
        setEvent(found);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  // Toggle bookmark
  const toggleSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_events') || '[]');
      let updated;
      if (saved.includes(eventId)) {
        updated = saved.filter(id => id !== eventId);
      } else {
        updated = [...saved, eventId];
      }
      localStorage.setItem('saved_events', JSON.stringify(updated));
      setIsSaved(!isSaved);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Trigger share
  const handleShare = () => {
    if (!event) return;
    if (navigator.share) {
      navigator.share({
        title: event.nama_tempat,
        text: event.deskripsi_lengkap,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Tautan berhasil disalin!");
    }
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans animate-pulse pb-12">
        {/* Cover image skeleton */}
        <div className="w-full aspect-[4/3] bg-slate-200" />

        {/* Content skeleton */}
        <div className="px-5 mt-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-4">
            <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg mt-2" />
            <div className="h-[1px] bg-slate-100 my-4" />
            <div className="space-y-3">
              <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
              <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-slate-200 h-28 bg-slate-100" />
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] bg-[#F6F7F9] font-sans px-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-3 border border-rose-100">
          <span className="text-2xl">😕</span>
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1">Informasi Tidak Ditemukan</h2>
        <p className="text-xs text-slate-700 text-center mb-5">
          {error || 'Data detail tidak tersedia saat ini.'}
        </p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-[#4C1D95] text-white font-bold text-xs rounded-full active:scale-95 transition"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Kembali
        </button>
      </div>
    );
  }

  /* ─── Parse Data ─── */
  const imageUrl = event.informasi_biaya?.image_url;
  const dateInfo = parseEventDates(event.jam_operasional);
  const mapsUrl = buildMapsUrl(event.koordinat_gps, event.lokasi_wilayah, event.nama_tempat);
  const isEvent = event.kategori === 'event';
  const isFoodCatalog = event.kategori === 'kuliner' && event.informasi_biaya?.jenis === 'makanan_khas';
  const description = event.deskripsi_lengkap;
  const costItems = parseCostInfo(event.informasi_biaya);

  const servingCafes = isFoodCatalog && event.fitur_fasilitas && allDestinations.length > 0
    ? allDestinations.filter(d => event.fitur_fasilitas.includes(d.id))
    : [];

  const firstCafe = servingCafes[0];
  const foodMapsUrl = firstCafe 
    ? buildMapsUrl(firstCafe.koordinat_gps, firstCafe.lokasi_wilayah, firstCafe.nama_tempat)
    : mapsUrl;

  const scrollToCafes = (e) => {
    e.preventDefault();
    const element = document.getElementById("kedai-penyedia");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const categoryLabels = {
    event: 'Event',
    alam: 'Wisata Alam',
    budaya_religi: 'Budaya & Religi',
    kuliner: 'Kuliner',
    akomodasi: 'Akomodasi',
    transportasi: 'Transportasi',
    darurat: 'Darurat',
  };

  // Dynamic Theme Colors
  const accentColor = '#4C1D95';
  const themeBg = 'bg-[#4C1D95]';
  const themeText = 'text-[#4C1D95]';
  const themeBorder = 'border-[#4C1D95]';
  const themeBgLight = 'bg-purple-50 text-[#4C1D95]';

  // Extract month and day for event badge
  let displayDay = "";
  let displayMonth = "";
  if (isEvent && dateInfo && dateInfo.startStr) {
    const parts = dateInfo.startStr.split(" ");
    if (parts.length >= 2) {
      displayDay = parts[0];
      displayMonth = parts[1].slice(0, 3);
    }
  }

  // Set OSM Map components
  const lat = event.koordinat_gps ? event.koordinat_gps[0] : null;
  const lng = event.koordinat_gps ? event.koordinat_gps[1] : null;
  const hasCoords = lat !== null && lng !== null;
  const delta = 0.003;
  const bbox = hasCoords ? `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}` : '';
  const osmUrl = hasCoords ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}` : '';

  // Ticket price check for Bottom Bar
  const ticketPrice = event.informasi_biaya?.harga_tiket || (costItems.length > 0 ? costItems[0].value : null);
  const showPrice = ticketPrice && 
                    ticketPrice.toLowerCase() !== 'gratis' && 
                    ticketPrice.toLowerCase() !== 'free' && 
                    ticketPrice.toLowerCase() !== '0' && 
                    ticketPrice.toLowerCase() !== 'rp 0' && 
                    ticketPrice.toLowerCase() !== 'tidak ada';

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans relative">
      
      {/* ── STICKY FLOATING HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 max-w-md mx-auto z-40 px-5 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex items-center justify-between transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200' 
          : 'bg-transparent'
      }`}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            scrolled 
              ? 'bg-slate-50 text-slate-800 border border-slate-200 active:bg-slate-100' 
              : 'bg-black/25 text-white hover:bg-black/35 active:scale-95'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>

        {/* Page Title (scrolled only) */}
        <span className={`text-[15px] font-black text-slate-800 truncate px-4 flex-1 text-center transition-opacity duration-300 ${
          scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {event.nama_tempat}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              scrolled 
                ? 'bg-slate-50 text-slate-800 border border-slate-200 active:bg-slate-100' 
                : 'bg-black/25 text-white hover:bg-black/35 active:scale-95'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSave}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              scrolled 
                ? `${isSaved ? 'bg-rose-50 text-[#BE1641] border-rose-200' : 'bg-slate-50 text-slate-800 border-slate-200'} border active:bg-slate-100` 
                : `bg-black/25 ${isSaved ? 'text-rose-500' : 'text-white'} hover:bg-black/35 active:scale-95`
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── IMAGE COVER (EDGE-TO-EDGE) ── */}
      <div className="relative w-full aspect-[4/3] bg-slate-100">
        <Image
          src={imageUrl || "/dummy_destination.png"}
          alt={event.nama_tempat}
          fill
          className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          priority
          unoptimized
        />
        {/* Dark overlay at top for floating buttons legibility */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 via-black/10 to-transparent pointer-events-none" />

        {/* Floating Date Badge inside image (bottom right) */}
        {isEvent && displayDay && (
          <div className="absolute bottom-10 right-4 bg-white/95 backdrop-blur-sm rounded-2xl py-1.5 px-3 flex flex-col items-center border border-slate-200/80 min-w-[52px] z-10">
            <span className="text-[10px] font-extrabold text-[#4C1D95] tracking-wider leading-none">
              {displayMonth}
            </span>
            <span className="text-lg font-black text-slate-800 leading-none mt-1">
              {displayDay}
            </span>
          </div>
        )}
      </div>

      {/* ── DETAILS WRAPPER (OVERLAPPING CARD STYLE) ── */}
      <div className="relative -mt-6 z-20 bg-[#F6F7F9] rounded-t-3xl pt-6 pb-28 px-4 space-y-4">
        
        {/* Card 1: Title, Category & Key Info Grid */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 text-left">
          {/* Title */}
          <h1 className="text-xl font-black text-slate-800 leading-snug">
            {event.nama_tempat}
          </h1>

          {/* Divider */}
          <div className="h-[1px] bg-slate-100 my-4" />

          {/* Info Items List */}
          <div className="space-y-4">
            {/* 1. Date Info (Only if startStr is present) */}
            {dateInfo && dateInfo.startStr && (
              <div className="flex items-start gap-3.5">
                <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${themeBgLight}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider leading-none">Tanggal</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                    {dateInfo.startStr}
                    {dateInfo.endStr && dateInfo.endStr !== dateInfo.startStr && ` — ${dateInfo.endStr}`}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Operational Hours (For non-events, or events if they have timeStr) */}
            {((isEvent && dateInfo?.timeStr) || (!isEvent && event.jam_operasional)) && (
              <div className="flex items-start gap-3.5">
                <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${themeBgLight}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider leading-none">Waktu / Jam Buka</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                    {isEvent ? dateInfo.timeStr : event.jam_operasional}
                  </span>
                </div>
              </div>
            )}

            {/* 3. Location Wilayah */}
            {event.lokasi_wilayah && (
              <div className="flex items-start gap-3.5">
                <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${themeBgLight}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider leading-none">Lokasi</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                    {event.lokasi_wilayah}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: YouTube / Instagram Embeds */}
        {(event.youtube_url || event.instagram_url) && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800">
              Dokumentasi & Media
            </h3>
            {event.youtube_url && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <iframe
                  title="YouTube Video"
                  src={getYouTubeEmbedUrl(event.youtube_url)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {event.instagram_url && (
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50" style={{ height: '480px' }}>
                <iframe
                  title="Instagram Post"
                  src={getInstagramEmbedUrl(event.instagram_url)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency="true"
                />
              </div>
            )}
          </div>
        )}

        {/* Card 3: Description (Tentang) */}
        {description && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Tentang {isEvent ? 'Event' : (categoryLabels[event.kategori] || 'Wisata')}
            </h3>
            <div className={`relative ${!isDescExpanded ? 'max-h-[8rem] overflow-hidden' : ''}`}>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                {description}
              </p>
              {!isDescExpanded && description.length > 180 && (
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent" />
              )}
            </div>
            {description.length > 180 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className={`flex items-center space-x-1 mt-3.5 text-xs font-black active:scale-95 transition-transform ${themeText}`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span>{isDescExpanded ? 'Sembunyikan' : 'Selengkapnya'}</span>
                {isDescExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}

        {/* Card 4: Detailed Breakdown of ticket prices */}
        {((costItems && costItems.length > 0) || event.informasi_biaya?.harga_tiket) && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Rincian Biaya & Tiket
            </h3>
            {costItems && costItems.length > 0 && (
              <div className="space-y-3">
                {costItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="text-slate-500 font-medium">{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            {event.informasi_biaya?.harga_tiket && (
              <p className="text-xs font-medium text-slate-700 mt-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed whitespace-pre-line">
                {event.informasi_biaya.harga_tiket}
              </p>
            )}
          </div>
        )}

        {/* Card 5: Facilities (Only for non-food catalog items) */}
        {!isFoodCatalog && event.fitur_fasilitas && event.fitur_fasilitas.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Fasilitas Tersedia
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.fitur_fasilitas.map((fac, idx) => (
                <span key={idx} className="bg-slate-50 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200 flex items-center gap-1.5">
                  <span className={themeText}>✓</span>
                  {fac}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Card: Linked Cafes & Restaurants (only for Food Catalog) */}
        {isFoodCatalog && servingCafes.length > 0 && (
          <div id="kedai-penyedia" className="bg-white rounded-3xl p-5 border border-slate-200/80 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-3.5">
              Tempat Menikmati Hidangan Ini
            </h3>
            <div className="space-y-4">
              {servingCafes.map((cafe) => (
                <div
                  key={cafe.id}
                  onClick={() => router.push(`/event/${cafe.id}`)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer bg-slate-50/50"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Small cafe thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                    <Image
                      src={cafe.informasi_biaya?.image_url || "/dummy_destination.png"}
                      alt={cafe.nama_tempat}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {/* Cafe Info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate leading-snug">{cafe.nama_tempat}</span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{cafe.lokasi_wilayah}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card 6: Rules & Tips */}
        {event.aturan_tips && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Tips & Aturan
            </h3>
            <div className="p-4 rounded-2xl border bg-purple-50/40 border-purple-200 text-[#4C1D95]">
              <p className="text-xs font-bold leading-relaxed text-slate-800">
                {event.aturan_tips}
              </p>
            </div>
          </div>
        )}

        {/* Card 7: Location & Map (Only for non-food catalog items) */}
        {!isFoodCatalog && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Lokasi & Peta
            </h3>
            
            {hasCoords ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-40 w-full mb-3.5">
                <iframe
                  title="Peta Lokasi"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={osmUrl}
                  className="w-full h-full pointer-events-auto"
                />
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs mb-3.5 font-semibold">
                Peta koordinat GPS tidak tersedia.
              </div>
            )}
            
            {event.kontak_info && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-800">
                <span className="text-sm">📞</span>
                <span>{event.kontak_info}</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── STICKY BOTTOM ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-200 px-5 py-4 flex items-center justify-between z-40 rounded-t-3xl">
        {isFoodCatalog ? (
          servingCafes.length > 1 ? (
            <button
              onClick={scrollToCafes}
              className="flex items-center justify-center gap-1.5 w-full py-3.5 text-white font-bold text-xs rounded-2xl active:scale-95 transition-all bg-[#4C1D95] hover:bg-[#3B1570]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Lihat Kedai Penyedia ({servingCafes.length})</span>
            </button>
          ) : (
            <a
              href={foodMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-3.5 text-white font-bold text-xs rounded-2xl active:scale-95 transition-all bg-[#4C1D95] hover:bg-[#3B1570]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Petunjuk Arah Ke {firstCafe?.nama_tempat || 'Kedai'}</span>
            </a>
          )
        ) : isEvent && showPrice ? (
          <>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider leading-none">Biaya Masuk</span>
              <span className="text-sm font-black text-slate-800 mt-1.5 leading-none">
                {ticketPrice}
              </span>
            </div>
            
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-6 py-3.5 text-white font-bold text-xs rounded-2xl active:scale-95 transition-all bg-[#4C1D95] hover:bg-[#3B1570]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Petunjuk Arah</span>
            </a>
          </>
        ) : (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-3.5 text-white font-bold text-xs rounded-2xl active:scale-95 transition-all bg-[#4C1D95] hover:bg-[#3B1570]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Petunjuk Arah</span>
          </a>
        )}
      </div>

    </div>
  );
}
