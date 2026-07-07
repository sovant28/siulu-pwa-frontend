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

// Fallback local datasets for dynamic detail route loading
const localCulinaryFallback = [
  {
    id: "FOOD-PAPIONG-AYAM",
    nama_tempat: "Pa'piong Ayam Khas Toraja",
    kategori: "kuliner",
    lokasi_wilayah: "Rantepao & Sangalla",
    koordinat_gps: [-2.9734, 119.8972],
    deskripsi_lengkap: `Pa'piong Ayam adalah kuliner khas tradisional Toraja yang dimasak secara unik di dalam tabung bambu tipis. Potongan daging ayam kampung segar dicampur dengan parutan kelapa muda, batang pisang muda (kallang) yang diiris tipis, cabai lokal (katokkon) yang pedas segar, garam, serta rempah-rempah Toraja.

Setelah semua bumbu merata, adonan dimasukkan ke dalam bambu yang dilapisi daun pisang, lalu dibakar di atas bara api terbuka selama sekitar 1 hingga 1.5 jam hingga matang sempurna dan mengeluarkan aroma harum bambu yang khas.

Bahan & Cara Membuat:
1. 1 ekor ayam kampung segar (potong kecil-kecil)
2. 1 batang pisang muda bagian dalam (kallang), iris halus
3. 1 butir kelapa parut setengah muda
4. 5-10 buah cabai katokkon (cabai khas Toraja)
5. Garam, sereh, dan daun kemangi secukupnya
6. Tabung bambu sedang (sekitar 50-60 cm)`,
    jam_operasional: "Tersedia di rumah makan tradisional",
    informasi_biaya: {
      jenis: "makanan_khas",
      harga_tiket: "Rp 40.000 - Rp 80.000 / porsi",
      image_url: "/ai_food.png"
    },
    fitur_fasilitas: ["TOR-ARAS-CAF", "TOR-LEMO-CAF"],
    aturan_tips: "Pa'piong tradisional memakan waktu masak yang cukup lama karena harus dibakar perlahan. Jika ingin memesan langsung di restoran, disarankan menelepon kedai terlebih dahulu agar hidangan siap saat Anda tiba.",
    kontak_info: ""
  },
  {
    id: "FOOD-DEPPA-TORI",
    nama_tempat: "Deppa Tori' Kue Manis Toraja",
    kategori: "kuliner",
    lokasi_wilayah: "Makale & Rantepao",
    koordinat_gps: [-3.1028, 119.8556],
    deskripsi_lengkap: `Deppa Tori' adalah kue tradisional camilan khas Tana Toraja yang terbuat dari tepung beras pilihan, gula merah aren lokal yang manis legit, dan taburan biji wijen di bagian luarnya. Kue ini memiliki bentuk lonjong memanjang khas and bertekstur renyah di luar namun empuk dan gurih di bagian dalamnya.

Sangat cocok disajikan sebagai teman bersantai minum kopi Toraja hangat di pagi atau sore hari.

Bahan-bahan Utama:
1. Tepung beras ketan lokal
2. Gula merah aren Toraja asli
3. Air bersih & minyak kelapa untuk menggoreng
4. Biji wijen sangrai untuk taburan luar`,
    jam_operasional: "Tersedia di pasar tradisional & toko oleh-oleh",
    informasi_biaya: {
      jenis: "makanan_khas",
      harga_tiket: "Rp 15.000 - Rp 35.000 / bungkus",
      image_url: "/icon_kopi.png"
    },
    fitur_fasilitas: ["TOR-ARAS-CAF"],
    aturan_tips: "Deppa Tori' sangat lezat disajikan dalam kondisi hangat bersama secangkir kopi Toraja Arabika tanpa gula.",
    kontak_info: ""
  }
];

const localPlacesFallback = [
  {
    id: "TOR-LONDA-001",
    nama_tempat: "Situs Makam Gua Londa",
    kategori: "budaya_religi",
    lokasi_wilayah: "Makale Utara (Londa)",
    koordinat_gps: [-3.0234, 119.8821],
    deskripsi_lengkap: "Londa adalah situs pemakaman gua alam purbakala khas Toraja yang terletak di tebing batu curam. Gua ini menyimpan peti mati kayu (erong), kerangka manusia, tau-tau (patung kayu personifikasi mendiang), serta sesaji yang diletakkan oleh keluarga kerabat.\n\nPengunjung dapat menjelajahi bagian dalam gua yang gelap dengan menyewa lampu petromaks tradisional yang disediakan oleh pemandu lokal di pintu masuk.",
    jam_operasional: "08:00 - 18:00 WITA",
    informasi_biaya: {
      harga_tiket: "Rp 15.000 (Domestik), Rp 30.000 (Mancanegara)",
      image_url: "/dummy_destination.png"
    },
    fitur_fasilitas: ["Pemandu Lokal", "Sewa Lampu Petromaks", "Area Parkir", "Kios Suvenir"],
    aturan_tips: "Jaga sopan santun, jangan menyentuh atau memindahkan tulang belulang dan benda sesaji di dalam gua. Sangat disarankan menyewa pemandu lokal demi keselamatan dan informasi sejarah.",
    kontak_info: ""
  },
  {
    id: "TOR-KETEKESU-002",
    nama_tempat: "Desa Adat Kete Kesu",
    kategori: "budaya_religi",
    lokasi_wilayah: "Sanggalangi (Kete Kesu)",
    koordinat_gps: [-2.9912, 119.9145],
    deskripsi_lengkap: "Kete Kesu adalah desa wisata adat tertua di Tana Toraja yang menyajikan kompleks perumahan adat Tongkonan lengkap dengan lumbung padi (alang) yang berjejer rapi di hadapannya. Dinding Tongkonan dihiasi ukiran kayu tradisional Toraja yang sarat makna filosofis.\n\nDi bukit belakang desa, terdapat situs pemakaman tebing batu kuno dengan peti mati erong berusia ratusan tahun.",
    jam_operasional: "08:00 - 17:30 WITA",
    informasi_biaya: {
      harga_tiket: "Rp 15.000 - Rp 25.000",
      image_url: "/dummy_destination.png"
    },
    fitur_fasilitas: ["Tongkonan Kuno", "Situs Kuburan Tebing", "Toko Kerajinan & Suvenir", "Toilet Umum"],
    aturan_tips: "Hormati keheningan di sekitar situs makam tebing. Gunakan pakaian yang sopan saat berkeliling desa.",
    kontak_info: ""
  },
  {
    id: "TOR-ARAS-CAF",
    nama_tempat: "Café Aras Rantepao",
    kategori: "kuliner",
    lokasi_wilayah: "Rantepao",
    koordinat_gps: [-2.973412, 119.897213],
    deskripsi_lengkap: "Café Aras adalah salah satu kafe legendaris dan paling populer bagi wisatawan asing maupun domestik di pusat kota Rantepao. Kafe ini menyediakan aneka hidangan kuliner khas Toraja yang dijamin 100% Halal (seperti Pa'piong Ayam halal, Kapurung) serta kopi specialty Toraja Arabika dengan berbagai metode seduh manual.\n\nTempatnya sangat nyaman dengan dekorasi interior penuh ukiran kayu khas Toraja yang artistik dan bernuansa hangat.",
    jam_operasional: "10:00 - 22:00 WITA",
    informasi_biaya: {
      jenis: "tempat_makan",
      harga_tiket: "Rp 25.000 - Rp 100.000",
      image_url: "/dummy_destination.png",
      menu_items: [
        { nama: "Pa'piong Ayam Bambu (Halal)", harga: "Rp 70.000" },
        { nama: "Kapurung Toraja", harga: "Rp 30.000" },
        { nama: "Kopi Arabika Specialty", harga: "Rp 25.000" }
      ]
    },
    fitur_fasilitas: ["Makan di tempat", "Halal", "Kopi Specialty Toraja", "Free Wifi", "Dekorasi Ukiran Toraja"],
    aturan_tips: "Cobalah menu Pa'piong Ayam bambu halal mereka yang sangat otentik. Kafe ini sangat ramai menjelang makan malam, jadi disarankan datang lebih awal agar mendapat tempat duduk.",
    kontak_info: "0813-4212-3456"
  },
  {
    id: "TOR-LEMO-CAF",
    nama_tempat: "Lemo Café",
    kategori: "kuliner",
    lokasi_wilayah: "Makale Utara (Lemo)",
    koordinat_gps: [-3.0135, 119.8789],
    deskripsi_lengkap: "Lemo Café terletak strategis di dekat situs makam batu Lemo. Menyajikan hidangan khas Toraja seperti Pa'piong dan kopi Toraja asli sambil menyuguhkan pemandangan sawah hijau yang membentang indah di belakang kafe. Tempat singgah yang sempurna setelah menjelajahi situs budaya Lemo.",
    jam_operasional: "09:00 - 21:00 WITA",
    informasi_biaya: {
      jenis: "tempat_makan",
      harga_tiket: "Rp 20.000 - Rp 75.000",
      image_url: "/dummy_destination.png",
      menu_items: [
        { nama: "Pa'piong Ayam Tradisional", harga: "Rp 75.000" },
        { nama: "Deppa Tori' Wijen Hangat", harga: "Rp 20.000" },
        { nama: "Kopi Robusta Toraja", harga: "Rp 20.000" }
      ]
    },
    fitur_fasilitas: ["Makan di tempat", "Pemandangan Sawah", "Dekat Situs Lemo", "Kopi Toraja"],
    aturan_tips: "Duduklah di area balkon belakang untuk menikmati pemandangan sawah terbaik. Pa'piong di sini dimasak dengan bumbu rempah tradisional yang sangat gurih.",
    kontak_info: "0812-3456-7890"
  }
];

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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        let data = [];
        if (res.ok) {
          data = await res.json();
        }
        
        // Parse string fields for database items
        const parsedData = [...data].map(item => {
          if (item.informasi_biaya && typeof item.informasi_biaya === 'string') {
            try {
              item.informasi_biaya = JSON.parse(item.informasi_biaya);
            } catch (e) {
              console.error('Failed to parse informasi_biaya:', e);
            }
          }
          return item;
        });

        let found = parsedData.find(d => d.id === eventId);
        if (!found) {
          // If not found in database, check fallbacks
          const allFallbacks = [...localPlacesFallback, ...localCulinaryFallback];
          found = allFallbacks.find(f => f.id === eventId);
        }

        setAllDestinations(parsedData.length > 0 ? parsedData : [...localPlacesFallback, ...localCulinaryFallback]);
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
      <div className={`relative -mt-6 z-20 bg-white rounded-t-[32px] pt-8 px-6 space-y-8 text-left ${isFoodCatalog ? 'pb-12' : 'pb-28'} border-t border-slate-100`}>
        
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

      {/* ── STICKY BOTTOM ACTION BAR ── */}
      {!isFoodCatalog && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-200 px-5 py-4 flex items-center justify-between z-40 rounded-t-3xl">
          {isEvent && showPrice ? (
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
                className={`flex items-center justify-center gap-1.5 px-6 py-3.5 font-bold text-xs rounded-2xl active:scale-95 transition-all ${
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
              <span>{statusInfo?.label === 'Telah Selesai' ? 'Lokasi Venue (Event Selesai)' : 'Petunjuk Arah'}</span>
            </a>
          )}
        </div>
      )}

    </div>
  );
}
