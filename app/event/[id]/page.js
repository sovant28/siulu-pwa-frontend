"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { fetchDestinationsData } from '../../utils/fetchHelper';
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
  Home,
  Phone,
  CreditCard,
  Users,
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

function getEventStatus(dateInfo) {
  if (!dateInfo || !dateInfo.raw) return null;
  const raw = dateInfo.raw;
  const startMatch = raw.match(/Mulai:\s*([\d-]+)/);
  const endMatch = raw.match(/Selesai:\s*([\d-]+)/);
  
  if (!startMatch) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(startMatch[1]);
  startDate.setHours(0, 0, 0, 0);
  
  let endDate = null;
  if (endMatch && endMatch[1]) {
    endDate = new Date(endMatch[1]);
    endDate.setHours(23, 59, 59, 999);
  } else {
    endDate = new Date(startMatch[1]);
    endDate.setHours(23, 59, 59, 999);
  }
  
  if (today < startDate) {
    return { label: 'Akan Datang', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  } else if (today >= startDate && today <= endDate) {
    return { label: 'Sedang Berlangsung', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  } else {
    return { label: 'Telah Selesai', color: 'bg-slate-50 text-slate-500 border-slate-200/80' };
  }
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
  const eventId = params.id ? decodeURIComponent(params.id) : '';

  const [event, setEvent] = useState(null);
  const [allDestinations, setAllDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMaps, setOpenMaps] = useState({});

  const toggleMap = (cafeId) => {
    setOpenMaps(prev => ({
      ...prev,
      [cafeId]: !prev[cafeId]
    }));
  };

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
        const parsedData = await fetchDestinationsData();

        let found = parsedData.find(d => d.id === eventId);

        setAllDestinations(parsedData || []);
        if (!found) throw new Error('Detail destinasi tidak ditemukan');
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
    const shareUrl = `${window.location.origin}/${event.kategori === 'event' ? 'event' : 'destinasi'}/${event.id}`;
    if (navigator.share) {
      navigator.share({
        title: event.nama_tempat,
        text: event.deskripsi_lengkap,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
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
  const imageUrl = event.informasi_biaya?.image_url || 
    (event.id === 'FOOD-PAPIONG-AYAM' ? '/ai_food.png' : 
     event.id === 'FOOD-DEPPA-TORI' ? '/icon_kopi.png' : null);
  const dateInfo = parseEventDates(event.jam_operasional);
  const mapsUrl = buildMapsUrl(event.koordinat_gps, event.lokasi_wilayah, event.nama_tempat);
  const isEvent = event.kategori === 'event';
  const isFoodCatalog = 
    event.kategori === 'kuliner' && 
    (
      event.id?.startsWith('FOOD-') || 
      (event.informasi_biaya && (
        event.informasi_biaya.jenis === 'makanan_khas' ||
        (typeof event.informasi_biaya === 'string' && event.informasi_biaya.includes('makanan_khas'))
      ))
    );
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

  // Determine event status badge (Upcoming, Ongoing, Passed)
  const statusInfo = isEvent ? getEventStatus(dateInfo) : null;

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

  // Get related items with smart event priority and naming fallback
  let rawRelated = allDestinations.filter(d => d.id !== eventId);
  let showingOtherEvents = false;

  if (event.kategori === 'event') {
    // Try to find other active/upcoming events (exclude completed ones)
    const otherActiveEvents = rawRelated.filter(d => {
      if (d.kategori !== 'event') return false;
      const dDateInfo = parseEventDates(d.jam_operasional);
      const status = getEventStatus(dDateInfo);
      return status && status.label !== 'Telah Selesai';
    });

    if (otherActiveEvents.length > 0) {
      rawRelated = otherActiveEvents;
      showingOtherEvents = true;
    } else {
      // Fallback to tourism spots if no active/upcoming events are found
      rawRelated = rawRelated.filter(d => d.kategori === 'alam' || d.kategori === 'budaya_religi');
    }
  } else {
    // Non-event pages logic
    if (event.kategori === 'akomodasi') {
      rawRelated = rawRelated.filter(d => d.kategori === 'akomodasi');
    } else if (event.kategori === 'kuliner') {
      rawRelated = rawRelated.filter(d => d.kategori === 'kuliner');
    } else {
      rawRelated = rawRelated.filter(d => d.kategori === 'alam' || d.kategori === 'budaya_religi');
    }
  }

  const relatedDestinations = rawRelated.slice(0, 4);

  const relatedSectionTitle = showingOtherEvents 
    ? 'Jelajahi Event Lain' 
    : (event.kategori === 'event' ? 'Jelajahi Destinasi Wisata' : 'Jelajahi Destinasi Lain');

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
                ? `${isSaved ? 'bg-violet-50 text-[#4C1D95] border-violet-200' : 'bg-slate-50 text-slate-800 border-slate-200'} border active:bg-slate-100` 
                : `bg-black/25 ${isSaved ? 'text-violet-400' : 'text-white'} hover:bg-black/35 active:scale-95`
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

      {/* ── DETAILS WRAPPER (UNIFIED CANVAS STYLE) ── */}
      <div className="relative -mt-6 z-20 bg-white rounded-t-[32px] pt-8 px-6 space-y-8 text-left border-t border-slate-100 pb-[calc(env(safe-area-inset-bottom)+96px)]">
        
        {/* Section 1: Title, Category & Key Info Grid */}
        <div className="space-y-4">
          {/* Title */}
          <h1 className="text-xl font-black text-slate-800 leading-snug">
            {event.nama_tempat}
          </h1>

          {/* Category & Status Badges */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded-full tracking-wider">
              {isEvent ? 'Festival / Acara' : (categoryLabels[event.kategori] || 'Wisata')}
            </span>
            {isEvent && statusInfo && (
              <span className={`text-[10px] font-extrabold border px-2.5 py-1 rounded-full tracking-wider ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            )}
          </div>

          {!isFoodCatalog && (
            <div className="space-y-4 pt-2">
              {/* 1. Date Info */}
              {dateInfo && dateInfo.startStr && (
                <div className="flex items-start gap-3.5">
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${themeBgLight}`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider leading-none">Tanggal</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                      {dateInfo.startStr}
                      {dateInfo.endStr && dateInfo.endStr !== dateInfo.startStr && ` — ${dateInfo.endStr}`}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Operational Hours */}
              {((isEvent && dateInfo?.timeStr) || (!isEvent && event.jam_operasional)) && (
                <div className="flex items-start gap-3.5">
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${themeBgLight}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider leading-none">Waktu / Jam Buka</span>
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
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider leading-none">Lokasi</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                      {event.lokasi_wilayah}
                    </span>
                  </div>
                </div>
              )}

              {/* 4. Penyelenggara */}
              {event.informasi_biaya?.penyelenggara && (
                <div className="flex items-start gap-3.5">
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${themeBgLight}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider leading-none">Penyelenggara</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                      {event.informasi_biaya.penyelenggara}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: AI Chat Link */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100/80 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <h4 className="text-xs font-black text-slate-800">Tanya AI Siulu'</h4>
          </div>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            Ingin tahu cerita sejarah, legenda rakyat, atau tips tersembunyi tentang {event.nama_tempat}? Tanyakan langsung kepada AI.
          </p>
          <button
            onClick={() => router.push(`/chat?prompt=Ceritakan kepada saya tentang sejarah, mitos, dan tips menarik untuk berkunjung ke ${event.nama_tempat}`)}
            className="bg-[#4C1D95] text-white font-bold text-xs py-3 px-4 rounded-xl active:scale-[0.98] transition-all text-center w-full mt-1"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Mulai Obrolan AI
          </button>
        </div>

        {/* Section 3: Description (Tentang) */}
        {description && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                {isFoodCatalog ? 'Tentang Kuliner' : (isEvent ? 'Tentang Event' : 'Tentang Destinasi')}
              </h3>
              <div className={`relative ${!isDescExpanded ? 'max-h-[8rem] overflow-hidden' : ''}`}>
                <p className="text-[13px] font-normal text-slate-600 leading-relaxed whitespace-pre-line">
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
          </>
        )}

        {/* Section 4: YouTube / Instagram Embeds */}
        {!isFoodCatalog && (event.youtube_url || event.instagram_url) && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
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
          </>
        )}

        {/* Section 5: Detailed Breakdown of ticket prices */}
        {!isFoodCatalog && ((costItems && costItems.length > 0) || event.informasi_biaya?.harga_tiket) && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Rincian Biaya & Tiket
              </h3>
              {costItems && costItems.length > 0 && (
                <div className="space-y-3 pt-1">
                  {costItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span className="text-slate-500 font-medium">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {event.informasi_biaya?.harga_tiket && (
                <p className="text-xs font-semibold text-slate-600 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line">
                  {event.informasi_biaya.harga_tiket}
                </p>
              )}
            </div>
          </>
        )}

        {/* Section 6: Facilities (Only for non-food catalog items) */}
        {!isFoodCatalog && event.fitur_fasilitas && event.fitur_fasilitas.length > 0 && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Fasilitas Tersedia
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {event.fitur_fasilitas.map((fac, idx) => (
                  <span key={idx} className="bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-full border border-slate-100 flex items-center gap-1.5">
                    <span className={themeText}>✓</span>
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Section: Linked Cafes & Restaurants (only for Food Catalog) */}
        {isFoodCatalog && servingCafes.length > 0 && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div id="kedai-penyedia" className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Tempat Menikmati Hidangan Ini
              </h3>
              <div className="space-y-6 pt-1">
                {servingCafes.map((cafe, idx) => {
                  const cafeLat = cafe.koordinat_gps ? cafe.koordinat_gps[0] : null;
                  const cafeLng = cafe.koordinat_gps ? cafe.koordinat_gps[1] : null;
                  const cafeHasCoords = cafeLat !== null && cafeLng !== null;
                  const cafeDelta = 0.003;
                  const cafeBbox = cafeHasCoords ? `${cafeLng - cafeDelta}%2C${cafeLat - cafeDelta}%2C${cafeLng + cafeDelta}%2C${cafeLat + cafeDelta}` : '';
                  const cafeOsmUrl = cafeHasCoords ? `https://www.openstreetmap.org/export/embed.html?bbox=${cafeBbox}&layer=mapnik&marker=${cafeLat}%2C${cafeLng}` : '';
                  
                  const isMapOpen = !!openMaps[cafe.id];
                  
                  return (
                    <div key={cafe.id} className="space-y-3.5 text-xs text-slate-700 font-semibold">
                      {/* Cafe Header: Home Icon + Name (clickable to detail) */}
                      <div 
                        onClick={() => router.push(`/destinasi/${cafe.id}`)}
                        className="flex items-center gap-2.5 cursor-pointer text-slate-900 group active:scale-[0.99] transition-all"
                      >
                        <Home className="w-4 h-4 text-[#4C1D95] flex-shrink-0" />
                        <span className="text-sm font-black group-hover:text-[#4C1D95] transition-colors">
                          {cafe.nama_tempat}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {/* Address Row: Pin Icon + Address + OPEN MAP button */}
                      <div className="flex items-start gap-2.5 justify-between">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>{cafe.lokasi_wilayah}</span>
                        </div>
                        {cafeHasCoords && (
                          <button
                            onClick={() => toggleMap(cafe.id)}
                            className="text-[10px] font-black text-[#4C1D95] border border-slate-200 rounded-lg px-2 py-1 active:bg-slate-50 transition-colors tracking-wider flex-shrink-0"
                          >
                            {isMapOpen ? 'Close Map' : 'Open Map'}
                          </button>
                        )}
                      </div>
                      
                      {/* Inline Map Dropdown */}
                      {cafeHasCoords && isMapOpen && (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-40 w-full my-2 transition-all duration-300">
                          <iframe
                            title={`Peta ${cafe.nama_tempat}`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src={cafeOsmUrl}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                      
                      {/* Phone Row */}
                      {cafe.kontak_info && (
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{cafe.kontak_info}</span>
                        </div>
                      )}
                      
                      {/* Hours Row */}
                      {cafe.jam_operasional && (
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{cafe.jam_operasional}</span>
                        </div>
                      )}
                      
                      {/* Menu Price List Row */}
                      {cafe.informasi_biaya?.menu_items && Array.isArray(cafe.informasi_biaya.menu_items) && cafe.informasi_biaya.menu_items.length > 0 && (
                        <div className="flex items-start gap-2.5">
                          <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            {cafe.informasi_biaya.menu_items.map((menu, mIdx) => (
                              <div key={mIdx} className="flex justify-between items-center text-slate-700 font-semibold">
                                <span className="text-slate-600">{menu.nama}</span>
                                <span className="text-slate-900 font-bold">{menu.harga}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Divider line between multiple cafes (except last one) */}
                      {idx < servingCafes.length - 1 && (
                        <div className="border-t border-slate-100 my-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Section 7: Rules & Tips */}
        {!isFoodCatalog && event.aturan_tips && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Tips & Aturan
              </h3>
              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100/50 text-[#4C1D95] font-semibold leading-relaxed">
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  {event.aturan_tips}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Section 8: Location & Map (Only for non-food catalog items) */}
        {!isFoodCatalog && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Lokasi & Peta
              </h3>
              
              {hasCoords ? (
                <>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-40 w-full mb-3">
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
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-1.5 w-full py-3.5 font-bold text-xs rounded-2xl active:scale-95 transition-all ${
                      statusInfo?.label === 'Telah Selesai'
                        ? 'bg-slate-100 text-slate-500 border border-slate-200/80 hover:bg-slate-200/50'
                        : 'bg-[#4C1D95] text-white hover:bg-[#3B1570]'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{statusInfo?.label === 'Telah Selesai' ? 'Lokasi Venue (Selesai)' : 'Petunjuk Arah'}</span>
                  </a>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs mb-3.5 font-semibold">
                  Peta koordinat GPS tidak tersedia.
                </div>
              )}
            </div>
          </>
        )}

        {/* Section 9: Related Destinations Carousel */}
        {relatedDestinations.length > 0 && (
          <>
            <div className="h-[1px] bg-slate-100" />
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                {relatedSectionTitle}
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scroll-pl-6 scroll-pr-6 scrollbar-none snap-x snap-mandatory sm:mx-0 sm:px-0 sm:scroll-pl-0 sm:scroll-pr-0">
                {relatedDestinations.map((dest) => {
                  const imageUrl = dest.informasi_biaya?.image_url;
                  return (
                    <div
                      key={dest.id}
                      onClick={() => router.push(`/${dest.kategori === 'event' ? 'event' : 'destinasi'}/${dest.id}`)}
                      className="w-48 flex-shrink-0 snap-start flex flex-col space-y-2.5 active:scale-95 transition-all cursor-pointer"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="relative w-full aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/60">
                        <Image
                          src={imageUrl || "/dummy_destination.png"}
                          alt={dest.nama_tempat}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="px-1 text-left">
                        <h4 className="text-xs font-black text-slate-800 line-clamp-1">
                          {dest.nama_tempat}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                          {dest.lokasi_wilayah}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>



      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
      >
        {/* Rainbow Gradient Definition for AI Icon */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>

        {/* 1. Beranda */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M17.7218 8.08382L14.7218 5.29811C13.4309 4.09937 12.7854 3.5 12 3.5C11.2146 3.5 10.5691 4.09937 9.2782 5.29811L6.2782 8.08382C5.64836 8.66867 5.33345 8.96109 5.16672 9.34342C5 9.72575 5 10.1555 5 11.015V16.9999C5 18.8856 5 19.8284 5.58579 20.4142C6.17157 20.9999 7.11438 20.9999 9 20.9999H9.75V16.9999C9.75 15.7573 10.7574 14.7499 12 14.7499C13.2426 14.7499 14.25 15.7573 14.25 16.9999V20.9999H15C16.8856 20.9999 17.8284 20.9999 18.4142 20.4142C19 19.8284 19 18.8856 19 16.9999L19 11.015C19 10.1555 19 9.72575 18.8333 9.34342C18.6666 8.96109 18.3516 8.66866 17.7218 8.08382Z" fill="currentColor"></path> 
              <path d="M19 9L19 17C19 18.8856 19 19.8284 18.4142 20.4142C17.8284 21 16.8856 21 15 21L14 21L10 21L9 21C7.11438 21 6.17157 21 5.58579 20.4142C5 19.8284 5 18.8856 5 17L5 9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path> 
              <path d="M3 11L7.5 7L10.6713 4.18109C11.429 3.50752 12.571 3.50752 13.3287 4.18109L16.5 7L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M10 21V17C10 15.8954 10.8954 15 12 15V15C13.1046 15 14 15.8954 14 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Beranda</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => router.push('/destinasi')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" fillRule="evenodd" clipRule="evenodd" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM14.149 15.1848C13.4576 17.1053 10.6665 16.8584 10.323 14.8464C10.2169 14.2248 9.72996 13.7379 9.10837 13.6318C7.09631 13.2882 6.84941 10.4971 8.76993 9.80572L12.6761 8.39948C14.4674 7.75462 16.2001 9.48732 15.5553 11.2786L14.149 15.1848Z" fill="currentColor"></path> 
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M13.9137 15.1001L15.32 11.1939C15.8932 9.60167 14.353 8.06149 12.7608 8.6347L8.85455 10.0409C7.1758 10.6453 7.39162 13.085 9.15038 13.3853C9.87655 13.5093 10.4454 14.0781 10.5694 14.8043C10.8696 16.5631 13.3094 16.7789 13.9137 15.1001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Jelajah</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 3. Tanya AI */}
        <button
          onClick={() => router.push('/chat')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M21 12.1818L16.9354 13.6599C16.3462 13.8741 15.8916 14.3521 15.7073 14.9513L14.1538 20C14.1072 20.1515 13.8928 20.1515 13.8461 20L12.2927 14.9513C12.1083 14.3521 11.6537 13.8741 11.0646 13.6599L6.99999 12.1818C6.83019 12.1201 6.83019 11.8799 6.99999 11.8182L11.0646 10.3401C11.6537 10.1259 12.1083 9.64786 12.2927 9.04872L13.8461 4C13.8928 3.8485 14.1072 3.8485 14.1538 4L15.7073 9.04872C15.8916 9.64786 16.3462 10.1259 16.9354 10.3401L21 11.8182C21.1698 11.8799 21.1698 12.1201 21 12.1818Z" fill="url(#rainbow-gradient)"></path> 
              <path d="M21 12.1818L16.9354 13.6599C16.3462 13.8741 15.8916 14.3521 15.7073 14.9513L14.1538 20C14.1072 20.1515 13.8928 20.1515 13.8461 20L12.2927 14.9513C12.1083 14.3521 11.6537 13.8741 11.0646 13.6599L6.99999 12.1818C6.83019 12.1201 6.83019 11.8799 6.99999 11.8182L11.0646 10.3401C11.6537 10.1259 12.1083 9.64786 12.2927 9.04872L13.8461 4C13.8928 3.8485 14.1072 3.8485 14.1538 4L15.7073 9.04872C15.8916 9.64786 16.3462 10.1259 16.9354 10.3401L21 11.8182C21.1698 11.8799 21.1698 12.1201 21 12.1818Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M3.75 5.25C4.22214 5.40738 4.59262 5.77786 4.75 6.25C4.83008 6.49025 5.16992 6.49025 5.25 6.25C5.40738 5.77786 5.77786 5.40738 6.25 5.25C6.49025 5.16992 6.49025 4.83008 6.25 4.75C5.77786 4.59262 5.40738 4.22214 5.25 3.75C5.16992 3.50975 4.83008 3.50975 4.75 3.75C4.59262 4.22214 4.22214 4.59262 3.75 4.75C3.50975 4.83008 3.50975 5.16992 3.75 5.25Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M7.25 19.25C6.77786 19.4074 6.40738 19.7779 6.25 20.25C6.16992 20.4903 5.83008 20.4903 5.75 20.25C5.59262 19.7779 5.22214 19.4074 4.75 19.25C4.50975 19.1699 4.50975 18.8301 4.75 18.75C5.22214 18.5926 5.59262 18.2221 5.75 17.75C5.83008 17.5097 6.16992 17.5097 6.25 17.75C6.40738 18.2221 6.77786 18.5926 7.25 18.75C7.49025 18.8301 7.49025 19.1699 7.25 19.25Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tanya AI</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 4. Disimpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M4.8824 12.9557L10.5021 19.3071C11.2981 20.2067 12.7019 20.2067 13.4979 19.3071L19.1176 12.9557C20.7905 11.0649 21.6596 8.6871 20.4027 6.41967C18.9505 3.79992 16.2895 3.26448 13.9771 5.02375C13.182 5.62861 12.5294 6.31934 12.2107 6.67771C12.1 6.80224 11.9 6.80224 11.7893 6.67771C11.4706 6.31934 10.818 5.62861 10.0229 5.02375C7.71053 3.26448 5.04945 3.79992 3.59728 6.41967C2.3404 8.6871 3.20947 11.0649 4.8824 12.9557Z" fill="currentColor"></path> 
              <path d="M4.8824 12.9557L10.5021 19.3071C11.2981 20.2067 12.7019 20.2067 13.4979 19.3071L19.1176 12.9557C20.7905 11.0649 21.6596 8.6871 20.4027 6.41967C18.9505 3.79992 16.2895 3.26448 13.9771 5.02375C13.182 5.62861 12.5294 6.31934 12.2107 6.67771C12.1 6.80224 11.9 6.80224 11.7893 6.67771C11.4706 6.31934 10.818 5.62861 10.0229 5.02375C7.71053 3.26448 5.04945 3.79992 3.59728 6.41967C2.3404 8.6871 3.20947 11.0649 4.8824 12.9557Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tersimpan</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" fillRule="evenodd" clipRule="evenodd" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 16.3106 20.4627 18.6515 18.5549 19.8557L18.2395 18.878C17.9043 17.6699 17.2931 16.8681 16.262 16.3834C15.2532 15.9092 13.8644 15.75 12 15.75C10.134 15.75 8.74481 15.922 7.73554 16.4097C6.70593 16.9073 6.09582 17.7207 5.7608 18.927L5.45019 19.8589C3.53829 18.6556 3 16.3144 3 12ZM8.75 10C8.75 8.20507 10.2051 6.75 12 6.75C13.7949 6.75 15.25 8.20507 15.25 10C15.25 11.7949 13.7949 13.25 12 13.25C10.2051 13.25 8.75 11.7949 8.75 10Z" fill="currentColor"></path> 
              <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M6 19C6.63819 16.6928 8.27998 16 12 16C15.72 16 17.3618 16.6425 18 18.9497" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Akun</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>
      </nav>

    </div>
  );
}
