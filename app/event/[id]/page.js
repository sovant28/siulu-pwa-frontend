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
  Sparkles,
  Share2,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Check saved status from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_events') || '[]');
      setIsSaved(saved.includes(eventId));
    } catch {
      setIsSaved(false);
    }
  }, [eventId]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
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
      <div className="flex flex-col w-full min-h-[100dvh] bg-white font-sans animate-pulse pb-12">
        {/* Header skeleton */}
        <div className="sticky top-0 bg-white px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex flex-col space-y-4 z-40">
          <div className="text-center w-full flex justify-center">
            <div className="h-6 w-20 bg-slate-100 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 items-center w-full">
            <div className="w-9 h-9 rounded-full bg-slate-100 justify-self-start" />
            <div className="h-4 w-20 bg-slate-100 rounded-md mx-auto" />
            <div className="w-9 h-9 justify-self-end" />
          </div>
        </div>
        
        {/* Cover image skeleton */}
        <div className="px-6 mt-3">
          <div className="w-full aspect-[1.6] bg-slate-100 rounded-2xl" />
        </div>

        {/* Content skeleton */}
        <div className="px-6 mt-4 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="h-6 w-3/4 bg-slate-100 rounded-lg" />
            <div className="w-9 h-9 rounded-full bg-slate-100" />
          </div>
          <div className="h-3.5 w-1/2 bg-slate-100 rounded-lg" />
          <div className="h-20 w-full bg-slate-100 rounded-2xl mt-4" />
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] bg-white font-sans px-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-3 border border-rose-100">
          <span className="text-2xl">😕</span>
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1">Informasi Tidak Ditemukan</h2>
        <p className="text-xs text-slate-700 text-center mb-5">
          {error || 'Data detail tidak tersedia saat ini.'}
        </p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-[#BE1641] text-white font-bold text-xs rounded-full active:scale-95 transition"
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
  const description = event.deskripsi_lengkap;
  const costItems = parseCostInfo(event.informasi_biaya);

  const categoryLabels = {
    event: 'Event',
    alam: 'Wisata Alam',
    budaya_religi: 'Budaya & Religi',
    kuliner: 'Kuliner',
    akomodasi: 'Akomodasi',
    transportasi: 'Transportasi',
    darurat: 'Darurat',
  };

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

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-white font-sans pb-12 relative">
      
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex flex-col space-y-4 backdrop-blur-md">
        {/* Row 1: Logo (centered, matching home page styling) */}
        <div className="text-center w-full">
          <span className="text-3xl font-black text-[#BE1641] tracking-tight select-none">siulu</span>
        </div>

        {/* Row 2: Back Button & Page Title */}
        <div className="grid grid-cols-3 items-center w-full">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 active:scale-90 transition-transform hover:bg-slate-100 justify-self-start"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-4.5 h-4.5 text-slate-800" />
          </button>
          <span className="text-lg font-black text-slate-800 text-center select-none whitespace-nowrap">
            {isEvent ? 'Detail Event' : (categoryLabels[event.kategori] || 'Detail Wisata')}
          </span>
          <div className="w-9 h-9 justify-self-end" />
        </div>
      </header>

      {/* ── IMAGE COVER CARD ── */}
      <div className="px-6 mt-3">
        <div className="relative w-full aspect-[1.6] bg-slate-100 rounded-2xl overflow-hidden">
          <Image
            src={imageUrl || "/dummy_destination.png"}
            alt={event.nama_tempat}
            fill
            className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            priority
            unoptimized
          />

          {/* Floating Date Badge for Event */}
          {isEvent && displayDay && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl py-1 px-2.5 flex flex-col items-center border border-slate-100 min-w-[48px]">
              <span className="text-[10px] font-bold text-[#BE1641] uppercase tracking-wider leading-none">
                {displayMonth}
              </span>
              <span className="text-base font-extrabold text-slate-800 leading-none mt-0.5">
                {displayDay}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── TITLE & SUB-INFO ── */}
      <div className="px-6 mt-4">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-2xl font-black text-slate-900 leading-snug flex-1">
            {event.nama_tempat}
          </h1>
          <button
            onClick={toggleSave}
            className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all border flex-shrink-0 ${
              isSaved
                ? 'bg-[#BE1641] text-white border-[#BE1641]'
                : 'bg-white text-slate-400 border-slate-100 hover:text-slate-655'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Sub-info Row: Location & Date/Time inline */}
        {(event.lokasi_wilayah || dateInfo || event.jam_operasional) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-700">
            {event.lokasi_wilayah && <span>{event.lokasi_wilayah}</span>}
            
            {/* For Event Category: Show Date & Time Info */}
            {isEvent && dateInfo && dateInfo.startStr && (
              <>
                <span className="text-slate-300 select-none">•</span>
                <span>
                  {dateInfo.startStr}
                  {dateInfo.endStr && dateInfo.endStr !== dateInfo.startStr && ` s/d ${dateInfo.endStr}`}
                </span>
                {dateInfo.timeStr && (
                  <>
                    <span className="text-slate-300 select-none">•</span>
                    <span>{dateInfo.timeStr}</span>
                  </>
                )}
              </>
            )}

            {/* For Non-Event Category: Show Jam Operasional */}
            {!isEvent && event.jam_operasional && (
              <>
                <span className="text-slate-300 select-none">•</span>
                <span>{event.jam_operasional}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-full h-[1px] bg-slate-100 my-4 px-6" />

      {/* ── DESCRIPTION ── */}
      {description && (
        <div className="px-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1.5">
            Tentang {isEvent ? 'Event' : categoryLabels[event.kategori] || 'Tempat'} Ini
          </h3>
          <div className={`relative ${!isDescExpanded ? 'max-h-[7rem] overflow-hidden' : ''}`}>
            <p className="text-base text-slate-800 leading-relaxed whitespace-pre-line">
              {description}
            </p>
            {!isDescExpanded && description.length > 180 && (
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
          {description.length > 180 && (
            <button
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="flex items-center space-x-1 mt-1 text-[#BE1641] text-xs font-extrabold active:scale-95 transition"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span>{isDescExpanded ? 'Sembunyikan' : 'Selengkapnya'}</span>
              {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* ── BIAYA MASUK / TIKET ── */}
      {costItems && costItems.length > 0 && (
        <div className="px-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2.5">Biaya & Tiket Masuk</h3>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
            {costItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-base font-bold text-slate-800">
                <span className="text-slate-600 font-normal">{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* For Events: Show Harga Tiket if present */}
      {isEvent && event.informasi_biaya?.harga_tiket && (
        <div className="px-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2.5">Harga Tiket</h3>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 text-base font-bold text-slate-800">
            {event.informasi_biaya.harga_tiket}
          </div>
        </div>
      )}

      {/* ── FASILITAS ── */}
      {event.fitur_fasilitas && event.fitur_fasilitas.length > 0 && (
        <div className="px-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2.5">Fasilitas</h3>
          <div className="flex flex-wrap gap-2">
            {event.fitur_fasilitas.map((fac, idx) => (
              <span key={idx} className="bg-slate-50 text-slate-800 text-sm font-bold px-3.5 py-2 rounded-xl border border-slate-100 flex items-center gap-1.5">
                <span className="text-[#C6A470] font-bold">✓</span>
                {fac}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── ATURAN & TIPS ── */}
      {event.aturan_tips && (
        <div className="px-6 mt-6">
          <div className="bg-[#C6A470]/10 border border-[#C6A470]/30 rounded-2xl p-4.5">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
              💡 Tips & Aturan Berkunjung
            </h3>
            <p className="text-base text-slate-800 leading-relaxed font-semibold">
              {event.aturan_tips}
            </p>
          </div>
        </div>
      )}

      {/* ── LIVE INTERACTIVE MAP ── */}
      <div className="px-6 mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Lokasi</h3>

        {hasCoords ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 h-40 w-full mb-2.5">
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
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center text-slate-700 text-sm mb-2.5">
            Peta koordinat GPS tidak tersedia.
          </div>
        )}

        {/* Primary Route Button (Inline) */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#BE1641] hover:bg-[#a01235] text-white font-bold text-sm rounded-xl text-center active:scale-98 transition"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Petunjuk Arah</span>
        </a>
      </div>

      {/* ── KONTAK INFORMASI ── */}
      {event.kontak_info && (
        <div className="px-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Kontak Informasi</h3>
          <p className="text-base font-bold text-slate-800 bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center gap-2">
            📞 <span className="text-slate-800">{event.kontak_info}</span>
          </p>
        </div>
      )}

    </div>
  );
}
