"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchDestinationsData } from './utils/fetchHelper';
import { supabase } from './supabase';
import {
  Bell,
  Search,
  MapPin,
  Calendar,
  Hotel,
  Utensils,
  Map,
  Home,
  Compass,
  Bookmark,
  User,
  MessageSquare,
  List,
  Heart,
  CloudFog,
  CloudSun,
  Cloud,
  CloudMoon
} from 'lucide-react';

function formatEventDate(jam_operasional) {
  if (!jam_operasional) return null;
  const match = jam_operasional.match(/Mulai:\s*([\d-]+)/);
  if (match && match[1]) {
    const date = new Date(match[1]);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (!isNaN(date.getTime())) {
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  }
  return null;
}

export default function AppHome() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("Selamat pagi");
  const [user, setUser] = useState(null);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: "22°C", text: "Cerah Berawan", type: "cloud-sun" });
  const carouselRef = useRef(null);

  const renderWeatherIcon = (type) => {
    switch (type) {
      case 'fog':
        return <CloudFog className="w-3.5 h-3.5 text-slate-400" />;
      case 'cloud-sun':
        return <CloudSun className="w-3.5 h-3.5 text-amber-500" />;
      case 'cloud':
        return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
      case 'moon':
        return <CloudMoon className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <CloudSun className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollLeft;
    const containerWidth = container.clientWidth;
    if (containerWidth > 0) {
      const itemWidth = containerWidth * 0.88;
      const activeIndex = Math.round(scrollPosition / (itemWidth + 16));
      setCurrentSlide(activeIndex);
    }
  };

  const handleDotClick = (index) => {
    if (carouselRef.current) {
      const containerWidth = carouselRef.current.clientWidth;
      const itemWidth = containerWidth * 0.88;
      carouselRef.current.scrollTo({
        left: index * (itemWidth + 16),
        behavior: 'smooth'
      });
      setCurrentSlide(index);
    }
  };

  useEffect(() => {
    if (loading || featuredEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextIndex = (prev + 1) % featuredEvents.length;
        if (carouselRef.current) {
          const containerWidth = carouselRef.current.clientWidth;
          const itemWidth = containerWidth * 0.88;
          carouselRef.current.scrollTo({
            left: nextIndex * (itemWidth + 16),
            behavior: 'smooth'
          });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, featuredEvents.length]);


  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
        setUsername(name);
      } else {
        setUser(null);
        const storedName = localStorage.getItem('username') || localStorage.getItem('user_name') || localStorage.getItem('name');
        if (storedName) {
          setUsername(storedName);
        } else {
          setUsername("");
        }
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
        setUsername(name);
      } else {
        setUser(null);
        setUsername("");
      }
    });

    const hrs = new Date().getHours();
    if (hrs < 11) {
      setGreeting("Selamat pagi");
    } else if (hrs < 15) {
      setGreeting("Selamat siang");
    } else if (hrs < 18) {
      setGreeting("Selamat sore");
    } else {
      setGreeting("Selamat malam");
    }

    // Weather simulation based on Tana Toraja climate patterns
    if (hrs >= 5 && hrs < 10) {
      setWeather({ temp: "20°C", text: "Berkabut", type: "fog" });
    } else if (hrs >= 10 && hrs < 15) {
      setWeather({ temp: "26°C", text: "Cerah Berawan", type: "cloud-sun" });
    } else if (hrs >= 15 && hrs < 18) {
      setWeather({ temp: "23°C", text: "Berawan", type: "cloud" });
    } else {
      setWeather({ temp: "19°C", text: "Cerah/Dingin", type: "moon" });
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Fetch data for featured events
    const fetchDestinations = async () => {
      try {
        const data = await fetchDestinationsData();
        // Filter out those that are marked as featured event and have an image_url
        const featured = (data || []).filter(d => d && d.kategori === 'event' && d.is_featured && d.informasi_biaya && d.informasi_biaya.image_url);
        setFeaturedEvents(featured.slice(0, 3)); // Take top 3
      } catch (err) {
        console.error("Failed to fetch featured data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-white font-sans pb-[calc(env(safe-area-inset-bottom)+68px)] relative overflow-x-hidden z-0">

      {/* HEADER BAR (Horizontal & Native-like) */}
      <header className="w-full flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-2 relative z-10 space-y-3.5">
        {/* Row 1: Logo & Weather Widget */}
        <div className="flex items-center justify-between w-full">
          <span className="text-xl font-black text-[#BE1641] tracking-tight select-none">siulu</span>
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 text-[10px] font-black text-slate-600 select-none">
            {renderWeatherIcon(weather.type)}
            <span>{weather.temp} • {weather.text}</span>
          </div>
        </div>

        {/* Row 2: Avatar & Greeting/Name (Clickable to profile/login) */}
        <div
          onClick={() => router.push(user ? '/profile' : '/login')}
          className="flex items-center space-x-3 cursor-pointer active:scale-[0.98] transition-all"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {user ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200/80 bg-white flex-shrink-0">
              <Image src="/avatar_v2.png" alt="Avatar" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-700 tracking-wider leading-none">{greeting}</span>
            {user ? (
              <span className="text-sm font-black text-slate-800 mt-1.5 leading-none">
                {username}
              </span>
            ) : (
              <div className="flex items-center space-x-1.5 mt-1.5 leading-none">
                <span className="text-sm font-black text-slate-800 leading-none">Guest</span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className="text-[10px] font-bold text-[#4C1D95] hover:underline leading-none">Masuk / Daftar</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PROMINENT SEARCH BAR (Native-like) */}
      <div className="px-5 mt-3">
        <div
          onClick={() => router.push('/destinasi')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/destinasi')}
          className="w-full flex items-center bg-white border border-slate-100 rounded-2xl px-4.5 py-3 active:scale-[0.99] transition cursor-pointer select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Search className="w-4 h-4 text-slate-700 mr-2.5 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-700">Cari destinasi pariwisata Tana Toraja...</span>
        </div>
      </div>

      {/* FEATURED CAROUSEL */}
      <section className="mt-6 w-full">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory w-full px-5 scroll-pl-5 scroll-pr-5"
        >
          {loading ? (
            <div className="w-full h-48 rounded-3xl bg-slate-200 animate-pulse flex-shrink-0"></div>
          ) : featuredEvents.length > 0 ? (
            featuredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/event/${event.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/event/${event.id}`)}
                className={`relative ${featuredEvents.length === 1 ? 'w-full' : 'w-[88%]'} h-48 rounded-3xl overflow-hidden flex-shrink-0 snap-start group cursor-pointer active:scale-[0.98] transition-transform border border-slate-200/50`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Image
                  src={event.informasi_biaya.image_url}
                  alt={event.nama_tempat}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                  unoptimized
                />
                {/* Bottom Dark Gradient Overlay with Text details */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-5 px-5.5 flex flex-col justify-end text-left">
                  <span className="text-[9px] font-black text-rose-400 tracking-widest leading-none mb-1">Featured Event</span>
                  <h4 className="text-base font-black text-white leading-snug line-clamp-1">{event.nama_tempat}</h4>
                  {formatEventDate(event.jam_operasional) && (
                    <p className="text-[11px] text-white/85 font-semibold mt-0.5">{formatEventDate(event.jam_operasional)}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-48 rounded-3xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center p-6 text-center select-none">
              <p className="text-xs text-slate-700 font-medium">Belum ada event/destinasi bergambar yang diunggah dari CMS.</p>
            </div>
          )}
        </div>

        {/* Dot Indicators */}
        {!loading && featuredEvents.length > 1 && (
          <div className="flex justify-center items-center space-x-1.5 mt-3 select-none">
            {featuredEvents.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'bg-[#7C3AED] w-4' : 'bg-slate-300 w-1.5'
                  }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            ))}
          </div>
        )}
      </section>


      <section className="px-5 mt-8">
        <h3 className="text-base font-semibold text-slate-800">Kategori Populer</h3>
        <div className="grid grid-cols-4 gap-y-4 gap-x-3 mt-4">
          {/* Card 1: Events */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/event')}
              className="w-[52px] h-[52px] flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg 
                viewBox="0 0 1024 1024" 
                className="w-9 h-9" 
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="#000000"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M837.7856 918.3232H249.6c-63.3856 0-114.7904-51.4048-114.7904-114.7904V324.9152c0-63.3856 51.4048-114.7904 114.7904-114.7904h588.1856c63.3856 0 114.7904 51.4048 114.7904 114.7904v478.6688c0 63.3856-51.4048 114.7392-114.7904 114.7392z" fill="#FF7D7B"></path>
                  <path d="M952.832 780.3392V323.0208c0-71.0656-57.1904-116.48-111.9744-112.7424 14.6432 17.8176 30.3616 51.5584 30.3616 114.5856v483.2256c0 21.3504-3.7376 70.1952-40.8064 109.568 67.8912-1.4848 122.4192-62.3616 122.4192-137.3184z" fill="#F75252"></path>
                  <path d="M65.9968 467.5072c-8.4992 0-15.36-6.8608-15.36-15.36v-17.3568c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v17.3568c0 8.448-6.8608 15.36-15.36 15.36z" fill="#333333"></path>
                  <path d="M815.1552 933.6832H203.4176c-84.224 0-152.7296-68.5056-152.7296-152.7296V520.704c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v260.1984c0 67.2768 54.7328 122.0096 122.0096 122.0096h611.7376c67.2768 0 122.0096-54.7328 122.0096-122.0096V287.8976c0-67.2768-54.7328-122.0096-122.0096-122.0096H203.4176c-67.2768 0-122.0096 54.7328-122.0096 122.0096v51.1488c0 8.4992-6.8608 15.36-15.36 15.36s-15.36-6.8608-15.36-15.36v-51.1488c0-84.224 68.5056-152.7296 152.7296-152.7296h611.7376c84.224 0 152.7296 68.5056 152.7296 152.7296v493.0048c0.0512 84.2752-68.5056 152.7808-152.7296 152.7808z" fill="#333333"></path>
                  <path d="M349.8496 288.4608a32.768 32.768 0 0 1-32.768-32.768V116.992a32.768 32.768 0 0 1 32.768-32.768 32.768 32.768 0 0 1 32.768 32.768v138.7008c0 18.1248-14.6432 32.768-32.768 32.768zM668.7232 288.4608a32.768 32.768 0 0 1-32.768-32.768V116.992a32.768 32.768 0 0 1 32.768-32.768 32.768 32.768 0 0 1 32.768 32.768v138.7008c0.0512 18.1248-14.6432 32.768-32.768 32.768z" fill="#76BFFF"></path>
                  <path d="M349.8496 303.8208c-26.5728 0-48.128-21.6064-48.128-48.1792V116.992c0-26.5728 21.6064-48.1792 48.128-48.1792 26.5728 0 48.1792 21.6064 48.1792 48.1792v138.7008c-0.0512 26.5216-21.6064 48.128-48.1792 48.128z m0-204.288c-9.6256 0-17.408 7.8336-17.408 17.4592v138.7008c0 9.6256 7.8336 17.4592 17.408 17.4592 9.6256 0 17.4592-7.8336 17.4592-17.4592V116.992c-0.0512-9.6256-7.8336-17.4592-17.4592-17.4592z" fill="#333333"></path>
                  <path d="M251.4944 551.68a32.768 32.768 0 0 1 32.768-32.768h64.8192a32.768 32.768 0 0 1 32.768 32.768 32.768 32.768 0 0 1-32.768 32.768H284.2624c-18.1248 0-32.768-14.6432-32.768-32.768zM251.4944 693.4016a32.768 32.768 0 0 1 32.768-32.768h64.8192a32.768 32.768 0 0 1 32.768 32.768 32.768 32.768 0 0 1-32.768 32.768H284.2624c-18.1248 0-32.768-14.6432-32.768-32.768zM441.7024 551.68a32.768 32.768 0 0 1 32.768-32.768h64.8192a32.768 32.768 0 0 1 32.768 32.768 32.768 32.768 0 0 1-32.768 32.768H474.5216c-18.1248 0-32.8192-14.6432-32.8192-32.768zM441.7024 693.4016a32.768 32.768 0 0 1 32.768-32.768h64.8192a32.768 32.768 0 0 1 32.768 32.768 32.768 32.768 0 0 1-32.768 32.768H474.5216c-18.1248 0-32.8192-14.6432-32.8192-32.768zM632.832 551.68a32.768 32.768 0 0 1 32.768-32.768h64.8192a32.768 32.768 0 0 1 32.768 32.768 32.768 32.768 0 0 1-32.768 32.768H665.6a32.768 32.768 0 0 1-32.768-32.768zM632.832 693.4016a32.768 32.768 0 0 1 32.768-32.768h64.8192a32.768 32.768 0 0 1 32.768 32.768 32.768 32.768 0 0 1-32.768 32.768H665.6a32.768 32.768 0 0 1-32.768-32.768z" fill="#ECD300"></path>
                  <path d="M349.0816 599.808H284.2624c-26.5728 0-48.128-21.6064-48.128-48.1792s21.6064-48.128 48.128-48.128h64.8192c26.5728 0 48.128 21.6064 48.128 48.128 0.0512 26.5728-21.5552 48.1792-48.128 48.1792z m-64.8192-65.5872c-9.6256 0-17.408 7.8336-17.408 17.408 0 9.6256 7.8336 17.4592 17.408 17.4592h64.8192a17.43872 17.43872 0 0 0 0-34.8672H284.2624zM349.0816 742.9632H284.2624c-26.5728 0-48.128-21.6064-48.128-48.1792s21.6064-48.128 48.128-48.128h64.8192c26.5728 0 48.128 21.6064 48.128 48.128 0.0512 26.5728-21.5552 48.1792-48.128 48.1792zM284.2624 677.376c-9.6256 0-17.408 7.8336-17.408 17.408 0 9.6256 7.8336 17.4592 17.408 17.4592h64.8192a17.43872 17.43872 0 0 0 0-34.8672H284.2624zM541.3376 599.808H476.5184c-26.5728 0-48.128-21.6064-48.128-48.1792s21.6064-48.128 48.128-48.128h64.8192c26.5728 0 48.128 21.6064 48.128 48.128 0 26.5728-21.6064 48.1792-48.128 48.1792z m-64.8192-65.5872c-9.6256 0-17.408 7.8336-17.408 17.408 0 9.6256 7.8336 17.4592 17.408 17.4592h64.8192a17.43872 17.43872 0 0 0 0-34.8672H476.5184zM541.3376 742.9632H476.5184c-26.5728 0-48.128-21.6064-48.128-48.1792s21.6064-48.128 48.128-48.128h64.8192c26.5728 0 48.128 21.6064 48.128 48.128 0 26.5728-21.6064 48.1792-48.128 48.1792zM476.5184 677.376c-9.6256 0-17.408 7.8336-17.408 17.408 0 9.6256 7.8336 17.4592 17.408 17.4592h64.8192a17.43872 17.43872 0 0 0 0-34.8672H476.5184zM731.6992 599.808h-64.8192c-26.5728 0-48.128-21.6064-48.128-48.1792s21.6064-48.128 48.128-48.128h64.8192c26.5728 0 48.1792 21.6064 48.1792 48.128-0.0512 26.5728-21.6576 48.1792-48.1792 48.1792z m-64.8704-65.5872c-9.6256 0-17.408 7.8336-17.408 17.408 0 9.6256 7.8336 17.4592 17.408 17.4592h64.8192c9.6256 0 17.4592-7.8336 17.4592-17.4592 0-9.6256-7.8336-17.408-17.4592-17.408h-64.8192zM731.6992 742.9632h-64.8192c-26.5728 0-48.128-21.6064-48.128-48.1792s21.6064-48.128 48.128-48.128h64.8192c26.5728 0 48.1792 21.6064 48.1792 48.128-0.0512 26.5728-21.6576 48.1792-48.1792 48.1792z m-64.8704-65.5872c-9.6256 0-17.408 7.8336-17.408 17.408 0 9.6256 7.8336 17.4592 17.408 17.4592h64.8192c9.6256 0 17.4592-7.8336 17.4592-17.4592 0-9.6256-7.8336-17.408-17.4592-17.408h-64.8192zM665.7024 303.8208c-26.5728 0-48.128-21.6064-48.128-48.1792V116.992c0-26.5728 21.6064-48.1792 48.128-48.1792 26.5728 0 48.1792 21.6064 48.1792 48.1792v138.7008c0 26.5216-21.6064 48.128-48.1792 48.128z m0-204.288c-9.6256 0-17.408 7.8336-17.408 17.4592v138.7008c0 9.6256 7.8336 17.4592 17.408 17.4592 9.6256 0 17.4592-7.8336 17.4592-17.4592V116.992c0-9.6256-7.8336-17.4592-17.4592-17.4592zM861.0304 372.9408H162.2016c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h698.8288c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36z" fill="#333333"></path>
                  <path d="M191.5904 544.1024a12.8 12.8 0 0 1-12.8-12.8v-75.776c0-20.4288 16.64-37.0688 37.0688-37.0688h41.7792a12.8 12.8 0 0 1 0 25.6h-41.7792c-6.2976 0-11.4688 5.12-11.4688 11.4688v75.7248c0 7.1168-5.7344 12.8512-12.8 12.8512zM191.5904 603.136a12.8 12.8 0 0 1-12.8-12.8v-15.9232a12.8 12.8 0 0 1 25.6 0v15.9232a12.8 12.8 0 0 1-12.8 12.8z" fill="#FFFFFF"></path>
                </g>
              </svg>
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Event</span>
          </div>

          {/* Card 2: Destinasi */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/destinasi')}
              className="w-[52px] h-[52px] flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg 
                viewBox="0 0 1024 1024" 
                className="w-9 h-9" 
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="#000000"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M178.6368 833.8432a362.5984 102.912 0 1 0 725.1968 0 362.5984 102.912 0 1 0-725.1968 0Z" fill="#8F93FB"></path>
                  <path d="M703.6416 925.8496c118.6816-16.896 200.192-51.7632 200.192-92.0064 0-33.2288-55.552-62.7712-141.7216-81.5616 31.232 15.1552 59.6992 37.12 62.1568 67.2768 0.768 31.232-35.1744 67.84-120.6272 106.2912z" fill="#787CF5"></path>
                  <path d="M816.8448 435.6608c0-151.8592-123.136-274.9952-274.9952-274.9952S266.8032 283.8016 266.8032 435.6608c0 144.7424 145.2544 286.1056 258.4576 378.2144a25.71776 25.71776 0 0 0 32.768-0.3072c117.4528-99.072 258.816-232.7552 258.816-377.9072z" fill="#ECD300"></path>
                  <path d="M642.4064 179.712c41.0624 42.8544 118.5792 123.648 97.9456 266.9568-10.9056 68.5056-105.3696 264.96-229.4272 355.3792 4.8128 4.0448 9.6256 7.9872 14.3872 11.8272a25.71776 25.71776 0 0 0 32.768-0.3072c117.4016-99.072 258.7648-232.8064 258.7648-377.9072 0-116.3776-72.3456-215.7568-174.4384-255.9488z" fill="#E8A200"></path>
                  <path d="M517.2224 835.0208c-9.6768 0-19.3536-3.2256-27.2896-9.6768-158.72-129.1264-249.6-245.0944-277.8112-354.5088-2.0992-8.192 2.816-16.5888 11.0592-18.688 8.192-2.0992 16.5888 2.816 18.688 11.0592 26.1632 101.376 116.1216 215.1936 267.4688 338.3296 4.6592 3.7888 11.4176 3.7376 16.0768-0.1536 136.5504-115.2 276.1216-252.7744 276.1216-399.4624 0-156.5184-127.3344-283.8528-283.8528-283.8528-121.1392 0-229.0176 76.9024-268.4416 191.3344a15.31904 15.31904 0 0 1-19.5072 9.5232 15.33952 15.33952 0 0 1-9.5232-19.5072c43.7248-126.8224 163.2768-212.0192 297.472-212.0192 173.4656 0 314.5728 141.1072 314.5728 314.5728 0 159.232-145.1008 303.1552-287.0272 422.912a43.93984 43.93984 0 0 1-28.0064 10.1376z" fill="#333333"></path>
                  <path d="M218.8288 431.9744c-8.0384 0-14.7968-6.2464-15.3088-14.3872-0.3072-5.2224-0.512-10.496-0.512-15.7184 0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36c0 4.5568 0.1536 9.216 0.4096 13.824a15.36 15.36 0 0 1-14.3872 16.2816h-0.9216z" fill="#333333"></path>
                  <path d="M534.0672 414.3616m-91.136 0a91.136 91.136 0 1 0 182.272 0 91.136 91.136 0 1 0-182.272 0Z" fill="#FF7D7B"></path>
                  <path d="M535.9104 323.328c19.2 12.288 52.7872 41.6256 47.9232 94.8224-5.4272 41.1136-48.4352 74.9056-80.1792 82.0736 9.5232 3.3792 19.7632 5.3248 30.464 5.3248 50.3296 0 91.136-40.8064 91.136-91.136-0.0512-49.7664-39.8848-90.0608-89.344-91.0848z" fill="#F75252"></path>
                  <path d="M517.632 522.2912c-66.4064 0-120.4224-54.016-120.4224-120.4224s54.016-120.4224 120.4224-120.4224 120.4224 54.016 120.4224 120.4224-54.0672 120.4224-120.4224 120.4224z m0-210.1248c-49.4592 0-89.7024 40.2432-89.7024 89.7024s40.2432 89.7024 89.7024 89.7024 89.7024-40.2432 89.7024-89.7024-40.2432-89.7024-89.7024-89.7024zM244.7872 924.6208c-1.3312 0-2.6624-0.1536-3.9936-0.512-88.32-23.6544-135.0144-56.9344-135.0144-96.2048 0-53.4528 83.9168-84.48 154.3168-101.0688 8.2432-1.9456 16.5376 3.1744 18.4832 11.4176 1.9456 8.2432-3.1744 16.5376-11.4176 18.4832-96.4096 22.7328-130.6624 52.5312-130.6624 71.168 0 16.7936 29.3888 44.3392 112.2304 66.56 8.192 2.2016 13.056 10.5984 10.8544 18.7904a15.3088 15.3088 0 0 1-14.7968 11.3664zM515.5328 955.136c-60.5696 0-118.8352-3.7888-173.1072-11.1616a15.39584 15.39584 0 0 1-13.1584-17.3056 15.45216 15.45216 0 0 1 17.3056-13.1584c52.8896 7.2192 109.7728 10.9056 168.96 10.9056 234.8032 0 378.9824-56.2176 378.9824-96.5632 0-19.3024-36.1472-49.9712-137.9328-72.8576a15.34464 15.34464 0 0 1-11.6224-18.3296 15.31904 15.31904 0 0 1 18.3296-11.6224c104.3968 23.4496 161.9456 59.9552 161.9456 102.8096 0 82.688-211.0976 127.2832-409.7024 127.2832z" fill="#333333"></path>
                  <path d="M318.4128 381.2864c-0.9728 0-1.9456-0.1024-2.9696-0.3584a12.81024 12.81024 0 0 1-9.5232-15.4112c0.9728-4.1984 2.0992-8.3968 3.328-12.4928a12.78464 12.78464 0 0 1 15.9232-8.6016c6.7584 1.9968 10.6496 9.1648 8.6016 15.9232-1.0752 3.6352-2.048 7.3216-2.9696 11.0592-1.28 5.9392-6.5536 9.8816-12.3904 9.8816zM340.992 324.4544a12.84096 12.84096 0 0 1-11.0592-19.2512c28.5696-49.2544 67.0208-72.192 68.6592-73.1648a12.78976 12.78976 0 1 1 12.9536 22.0672c-0.3584 0.2048-34.4576 20.7872-59.4944 63.9488-2.3552 4.096-6.656 6.4-11.0592 6.4zM470.8864 409.856a12.78976 12.78976 0 0 1-12.5952-15.0528c4.8128-27.0336 24.1152-41.0624 24.9344-41.6768a12.8512 12.8512 0 0 1 17.8688 2.9696c4.096 5.7344 2.7648 13.6704-2.8672 17.8176-0.6656 0.512-11.8272 9.1136-14.6944 25.3952a12.91264 12.91264 0 0 1-12.6464 10.5472zM273.5616 864c-1.1776 0-2.4064-0.1536-3.584-0.512-12.7488-3.7376-51.456-15.0528-48.7936-40.704 2.0992-19.7632 28.2624-30.6176 51.712-32.4096a12.78976 12.78976 0 0 1 1.9456 25.4976c-13.824 1.024-24.32 6.144-27.5456 9.2672 2.048 2.2016 8.8576 7.6288 29.8496 13.7728 6.8096 1.9968 10.6496 9.1136 8.704 15.872a12.84096 12.84096 0 0 1-12.288 9.216z" fill="#FFFFFF"></path>
                </g>
              </svg>
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Destinasi</span>
          </div>

          {/* Card 3: Kuliner */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/kuliner')}
              className="w-[52px] h-[52px] flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg 
                viewBox="0 0 512 512" 
                className="w-9 h-9" 
                version="1.1" 
                xmlSpace="preserve" 
                xmlns="http://www.w3.org/2000/svg" 
                xmlnsXlink="http://www.w3.org/1999/xlink" 
                fill="#000000"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <g id="_x34_85_x2C__book_x2C__pen_x2C__food_x2C__education">
                    <g>
                      <path d="M451,440.78v30H106c-24.85,0-45-20.15-45-45c0-12.42,5.04-23.681,13.18-31.82 c8.14-8.14,19.4-13.18,31.82-13.18h5h40h40h40h200h20v30V440.78z" style={{ fill: "#FEBE76" }}></path>
                      <path d="M66.833,436.78c0-12.42,5.04-23.681,13.18-31.82c8.14-8.14,19.4-13.18,31.82-13.18h5h40h40h40h200 H451v-11h-20H231h-40h-40h-40h-5c-12.42,0-23.68,5.04-31.82,13.18C66.04,402.1,61,413.36,61,425.78 c0,9.831,3.163,18.92,8.514,26.323C67.782,447.32,66.833,442.161,66.833,436.78z" style={{ fill: "#E8A664" }}></path>
                      <polygon points="151,380.78 111,380.78 111,310.78 131,310.78 351,310.78 361,310.78 431,310.78 431,380.78 231,380.78 191,380.78" style={{ fill: "#FFF2D4" }}></polygon>
                      <polygon points="120.583,320.78 140.583,320.78 360.584,320.78 370.584,320.78 431,320.78 431,310.78 361,310.78 351,310.78 131,310.78 111,310.78 111,380.78 120.583,380.78" style={{ fill: "#F0DCA0" }}></polygon>
                      <path d="M351,310.78H131v-100h105.95h38.99H361c13.8,0,26.3,5.6,35.35,14.65 c9.051,9.05,14.65,21.55,14.65,35.35c0,27.609-22.39,50-50,50H351z" style={{ fill: "#FCD884" }}></path>
                      <path d="M142.554,222.78h105.95h38.99h85.061c11.134,0,21.419,3.65,29.732,9.812 c-1.758-2.568-3.744-4.968-5.938-7.162c-9.05-9.05-21.55-14.65-35.35-14.65h-85.06h-38.99H131v100h11.554V222.78z" style={{ fill: "#EABF6A" }}></path>
                      <path d="M258.2,90.41c7.22-11.07,19.87-18.36,34.06-18.36c76.62,0,25.84,138.73-16.319,138.73 c-6.811,0-13.15-1.81-18.591-4.53h-0.91h-0.91c-5.44,2.72-11.78,4.53-18.58,4.53c-42.17,0-92.95-138.73-16.33-138.73 c15.42,0,29.02,8.61,35.82,21.31C256.98,92.35,257.57,91.36,258.2,90.41z" style={{ fill: "#FF7979" }}></path>
                      <g>
                        <g>
                          <g>
                            <path d="M230.899,79.8c6.893,0,13.417,1.73,19.137,4.768c-7.411-7.716-17.905-12.518-29.416-12.518 c-69.614,0-34.062,114.508,4.65,135.452C191.3,174.668,167.537,79.8,230.899,79.8z" style={{ fill: "#D65B5B" }}></path>
                          </g>
                        </g>
                      </g>
                      <rect height="20" width="20" x="251" y="250.78"></rect>
                      <rect height="20" width="20" x="221" y="250.78"></rect>
                      <rect height="20" width="20" x="191" y="250.78"></rect>
                      <rect height="20" width="20" x="161" y="250.78"></rect>
                      <path d="M451,475.78H106c-27.57,0-50-22.43-50-50c0-13.356,5.201-25.913,14.645-35.355c9.443-9.443,22-14.645,35.355-14.645h5 c2.761,0,5,2.238,5,5s-2.239,5-5,5h-5c-10.685,0-20.729,4.16-28.284,11.715C70.161,405.05,66,415.095,66,425.78 c0,22.056,17.944,40,40,40h340v-80h-15c-2.762,0-5-2.238-5-5s2.238-5,5-5h20c2.762,0,5,2.238,5,5v90 C456,473.542,453.762,475.78,451,475.78z"></path>
                      <path d="M361,315.78c-2.762,0-5-2.238-5-5s2.238-5,5-5c24.813,0,45-20.187,45-45c0-12.014-4.683-23.313-13.186-31.814 c-8.503-8.503-19.802-13.186-31.814-13.186H136v95c0,2.762-2.239,5-5,5s-5-2.238-5-5v-100c0-2.761,2.239-5,5-5h230 c14.685,0,28.494,5.723,38.885,16.115C410.277,232.285,416,246.095,416,260.78C416,291.107,391.327,315.78,361,315.78z"></path>
                      <path d="M431,385.78H111c-2.761,0-5-2.238-5-5v-70c0-2.762,2.239-5,5-5h320c2.762,0,5,2.238,5,5v70 C436,383.542,433.762,385.78,431,385.78z M116,375.78h310v-60H116V375.78z"></path>
                      <path d="M151,385.78c-2.761,0-5-2.238-5-5v-40c0-2.762,2.239-5,5-5s5,2.238,5,5v40C156,383.542,153.761,385.78,151,385.78z"></path>
                      <path d="M191,385.78c-2.761,0-5-2.238-5-5v-40c0-2.762,2.239-5,5-5s5,2.238,5,5v40C196,383.542,193.761,385.78,191,385.78z"></path>
                      <path d="M231,385.78c-2.761,0-5-2.238-5-5v-40c0-2.762,2.239-5,5-5s5,2.238,5,5v40C236,383.542,233.761,385.78,231,385.78z"></path>
                      <path d="M451,445.78H131c-2.761,0-5-2.238-5-5s2.239-5,5-5h320c2.762,0,5,2.238,5,5S453.762,445.78,451,445.78z"></path>
                      <path d="M451,415.78H131c-2.761,0-5-2.238-5-5s2.239-5,5-5h320c2.762,0,5,2.238,5,5S453.762,415.78,451,415.78z"></path>
                      <path d="M351,315.78c-2.762,0-5-2.238-5-5v-70c0-2.761,2.238-5,5-5s5,2.239,5,5v70C356,313.542,353.762,315.78,351,315.78z"></path>
                      <path d="M275.94,215.78c-6.542,0-13.253-1.524-19.5-4.419c-6.247,2.895-12.954,4.419-19.49,4.419 c-14.143,0-29.514-12.598-42.172-34.564c-11.76-20.408-18.781-44.714-18.781-65.019c0-14.341,3.391-25.902,10.077-34.362 c7.753-9.81,19.376-14.784,34.546-14.784c14.17,0,27.294,6.449,35.828,17.238c8.579-10.855,21.687-17.238,35.812-17.238 c15.17,0,26.793,4.974,34.547,14.785c6.687,8.461,10.077,20.022,10.077,34.363c0,20.305-7.021,44.61-18.778,65.018 C305.448,203.182,290.08,215.78,275.94,215.78z M255.53,201.25h1.82c0.776,0,1.542,0.181,2.236,0.528 c5.236,2.618,10.892,4.002,16.354,4.002c10.159,0,22.995-11.325,33.5-29.557c10.76-18.673,17.443-41.674,17.443-60.025 c0-11.866-2.739-21.604-7.923-28.163c-5.761-7.29-14.744-10.985-26.701-10.985c-12.133,0-23.3,6.016-29.871,16.092 c-0.562,0.846-1.072,1.702-1.54,2.576c-0.869,1.626-2.563,2.642-4.408,2.642c-1.844,0-3.539-1.014-4.409-2.64 c-6.167-11.517-18.203-18.67-31.412-18.67c-11.957,0-20.94,3.696-26.701,10.985c-5.183,6.558-7.923,16.296-7.923,28.162 c0,39.35,28.572,89.583,50.954,89.583c5.457,0,11.108-1.384,16.343-4.002C253.988,201.431,254.753,201.25,255.53,201.25z"></path>
                      <path d="M258.246,95.641c-2.252,0-4.296-1.531-4.854-3.816c-0.034-0.133-0.063-0.262-0.089-0.391 c-10.052-41.71,8.759-53.958,9.566-54.459l5.279,8.492l0.09-0.058c-0.136,0.093-13.453,9.676-5.18,43.824 c0.019,0.078,0.036,0.156,0.051,0.234c0.646,2.679-0.997,5.377-3.676,6.03C259.037,95.595,258.638,95.641,258.246,95.641z"></path>
                      <path d="M271.724,185.701c-1.577,0-3.13-0.745-4.103-2.137c-1.582-2.264-1.028-5.381,1.235-6.962 c13.325-9.311,17.975-26.965,18.02-27.142c0.686-2.676,3.413-4.288,6.084-3.603c2.676,0.686,4.289,3.409,3.604,6.084 c-0.223,0.87-5.648,21.447-21.98,32.858C273.711,185.408,272.713,185.701,271.724,185.701z"></path>
                    </g>
                  </g>
                  <g id="Layer_1"></g>
                </g>
              </svg>
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Kuliner</span>
          </div>

          {/* Card 4: Hotel */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/hotel')}
              className="w-[52px] h-[52px] flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg 
                viewBox="0 0 1024 1024" 
                className="w-9 h-9" 
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="#000000"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M605.184 145.2032H226.0992c-25.5488 0-46.2336 22.2208-46.2336 49.6128v706.6112h471.552V194.816c0-27.392-20.6848-49.6128-46.2336-49.6128z" fill="#76BFFF"></path>
                  <path d="M605.184 145.2032h-12.9536v756.224h59.1872V194.816c0-27.392-20.6848-49.6128-46.2336-49.6128z" fill="#659CF8"></path>
                  <path d="M124.6208 380.7232c-8.4992 0-15.36-6.8608-15.36-15.36v-25.6512c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v25.6512c0 8.448-6.912 15.36-15.36 15.36zM124.6208 717.312c-8.4992 0-15.36-6.8608-15.36-15.36V433.2032c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v268.7488c0 8.4992-6.912 15.36-15.36 15.36z" fill="#333333"></path>
                  <path d="M865.3824 287.7952h-168.704v613.632h206.5408V331.9808c0-24.4224-16.9472-44.1856-37.8368-44.1856z" fill="#FF7D7B"></path>
                  <path d="M903.2192 901.4272h-57.6512V288.0512h23.7568c18.7392 0 33.9456 15.2064 33.9456 33.9456v579.4304z" fill="#F75252"></path>
                  <path d="M835.7376 416.1536h-114.8928c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h114.8928c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36zM835.7376 594.176h-114.8928c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h114.8928c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36zM835.7376 766.3616h-114.8928c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h114.8928c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36z" fill="#333333"></path>
                  <path d="M503.7056 363.3664H307.6608c-10.1888 0-18.4832-8.2944-18.4832-18.4832V281.5488c0-10.1888 8.2944-18.4832 18.4832-18.4832h196.0448c10.1888 0 18.4832 8.2944 18.4832 18.4832v63.3344c0 10.1888-8.2432 18.4832-18.4832 18.4832zM503.7056 564.6336H307.6608c-10.1888 0-18.4832-8.2944-18.4832-18.4832V482.8672c0-10.1888 8.2944-18.4832 18.4832-18.4832h196.0448c10.1888 0 18.4832 8.2944 18.4832 18.4832v63.3344a18.432 18.432 0 0 1-18.4832 18.432zM503.7056 767.4368H307.6608c-10.1888 0-18.4832-8.2944-18.4832-18.4832v-63.3344c0-10.1888 8.2944-18.4832 18.4832-18.4832h196.0448c10.1888 0 18.4832 8.2944 18.4832 18.4832v63.3344c0 10.1888-8.2432 18.4832-18.4832 18.4832z" fill="#ECD300"></path>
                  <path d="M469.5552 265.8304h45.2096v89.6h-45.2096zM469.5552 470.528h45.2096v89.6h-45.2096zM469.5552 670.6688h45.2096v89.6h-45.2096z" fill="#E8A200"></path>
                  <path d="M503.7056 378.7264H338.944c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h164.7616c1.6896 0 3.1232-1.3824 3.1232-3.1232V274.0224c0-1.6896-1.3824-3.1232-3.1232-3.1232h-231.424c-1.6896 0-3.1232 1.3824-3.1232 3.1232v70.8608c0 1.6896 1.3824 3.1232 3.1232 3.1232h18.0224c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36h-18.0224c-18.6368 0-33.8432-15.1552-33.8432-33.8432V274.0224c0-18.6368 15.1552-33.8432 33.8432-33.8432h231.424c18.6368 0 33.8432 15.1552 33.8432 33.8432v70.8608a33.8432 33.8432 0 0 1-33.8432 33.8432zM503.7056 583.0144H341.8112c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h161.9456c1.6896 0 3.1232-1.3824 3.1232-3.1232V478.3104c0-1.6896-1.3824-3.1232-3.1232-3.1232h-231.424c-1.6896 0-3.1232 1.3824-3.1232 3.1232v70.8608c0 1.6896 1.3824 3.1232 3.1232 3.1232h18.3296c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36h-18.3296c-18.6368 0-33.8432-15.1552-33.8432-33.8432V478.3104c0-18.6368 15.1552-33.8432 33.8432-33.8432h231.424c18.6368 0 33.8432 15.1552 33.8432 33.8432v70.8608c-0.0512 18.688-15.2064 33.8432-33.8944 33.8432zM503.7056 787.3024H339.8144c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h163.9424c1.6896 0 3.1232-1.3824 3.1232-3.1232v-70.8608c0-1.6896-1.3824-3.1232-3.1232-3.1232h-231.424c-1.6896 0-3.1232 1.3824-3.1232 3.1232v70.8608c0 1.6896 1.3824 3.1232 3.1232 3.1232h18.0224c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36h-18.0224c-18.6368 0-33.8432-15.1552-33.8432-33.8432v-70.8608c0-18.6368 15.1552-33.8432 33.8432-33.8432h231.424c18.6368 0 33.8432 15.1552 33.8432 33.8432v70.8608c-0.0512 18.688-15.2064 33.8432-33.8944 33.8432z" fill="#333333"></path>
                  <path d="M973.7216 886.0672h-55.1424V307.4048c0-33.8944-27.5456-61.44-61.44-61.44h-190.3616v-80.384c0-36.9664-30.0544-67.0208-67.0208-67.0208H176.2304c-36.9664 0-67.0208 30.0544-67.0208 67.0208v74.5984c0 8.4992 6.8608 15.36 15.36 15.36s15.36-6.8608 15.36-15.36V165.5808c0-20.0192 16.2816-36.3008 36.3008-36.3008h423.5264c20.0192 0 36.3008 16.2816 36.3008 36.3008v720.4864H139.9808v-128.7168c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v128.7168H52.48c-8.4992 0-15.36 6.8608-15.36 15.36s6.8608 15.36 15.36 15.36h921.2416c8.4992 0 15.36-6.8608 15.36-15.36s-6.912-15.36-15.36-15.36z m-306.688 0V276.6848h190.1056c16.9472 0 30.72 13.7728 30.72 30.72v578.6624h-220.8256z" fill="#333333"></path>
                  <path d="M402.2784 204.7488H288.4608a12.8 12.8 0 0 1 0-25.6h113.8176a12.8 12.8 0 0 1 0 25.6zM243.7632 204.7488h-9.3696a12.8 12.8 0 0 1 0-25.6h9.3696a12.8 12.8 0 0 1 0 25.6zM802.304 340.992h-34.7648a12.8 12.8 0 0 1 0-25.6h34.7648a12.8 12.8 0 0 1 0 25.6zM731.8528 340.992h-5.632a12.8 12.8 0 0 1 0-25.6h5.632a12.8 12.8 0 0 1 0 25.6zM394.0864 315.6992h-34.7648a12.8 12.8 0 0 1 0-25.6h34.7648a12.8 12.8 0 0 1 0 25.6zM323.6352 315.6992h-5.632a12.8 12.8 0 0 1 0-25.6h5.632a12.8 12.8 0 0 1 0 25.6zM394.0864 517.5296h-34.7648a12.8 12.8 0 0 1 0-25.6h34.7648a12.8 12.8 0 0 1 0 25.6zM323.6352 517.5296h-5.632a12.8 12.8 0 0 1 0-25.6h5.632a12.8 12.8 0 0 1 0 25.6zM394.0864 722.7392h-34.7648a12.8 12.8 0 0 1 0-25.6h34.7648a12.8 12.8 0 0 1 0 25.6zM323.6352 722.7392h-5.632a12.8 12.8 0 0 1 0-25.6h5.632a12.8 12.8 0 0 1 0 25.6z" fill="#FFFFFF"></path>
                </g>
              </svg>
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Hotel</span>
          </div>

          {/* Card 5: Tiket */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-[52px] h-[52px] opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg 
                  viewBox="0 0 1024 1024" 
                  className="w-9 h-9" 
                  version="1.1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M269.7728 317.5936l355.4304-218.368c21.4016-13.1584 49.408-6.5024 62.6176 14.848l129.024 208.128" fill="#FFAC48"></path>
                    <path d="M594.3296 123.1872l133.5808 198.9632h88.9856l-149.1456-229.7344c0 0.0512-42.2912 0.7168-73.4208 30.7712z" fill="#FC992D"></path>
                    <path d="M424.704 316.6208l284.9792-167.3216 71.3728 115.0976-86.9888 57.8048" fill="#76BFFF"></path>
                    <path d="M639.488 190.5152l77.9776 116.1216 62.4128-41.472-73.8304-113.7152z" fill="#659CF8"></path>
                    <path d="M837.2224 923.4944H259.328c-45.6192 0-82.5856-36.9664-82.5856-82.5856V451.2256c0-45.6192 36.9664-82.5856 82.5856-82.5856h577.8944c45.6192 0 82.5856 36.9664 82.5856 82.5856v389.7344c0 45.568-36.9664 82.5344-82.5856 82.5344z" fill="#FF7D7B"></path>
                    <path d="M837.2224 368.64h-15.5136c10.6496 14.4896 22.528 43.52 22.528 100.9664v349.0304c0 40.4992-5.2224 104.8576-69.2736 104.8576h22.016c73.1136-2.1504 122.8288-28.0064 122.8288-111.4112V451.2256c0-45.6192-36.9664-82.5856-82.5856-82.5856z" fill="#F75252"></path>
                    <path d="M733.2864 727.3984h186.5216v-209.152h-186.5216c-57.7536 0-104.6016 46.7968-104.6016 104.6016 0 57.7536 46.848 104.5504 104.6016 104.5504z" fill="#F2C336"></path>
                    <path d="M844.2368 518.2464h64.8704v206.2848h-64.8704z" fill="#E8A200"></path>
                    <path d="M114.5344 562.3808c8.4992 0 15.36-6.8608 15.36-15.36v-11.8784c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v11.8784c0 8.4992 6.912 15.36 15.36 15.36z" fill="#333333"></path>
                    <path d="M825.4464 306.8416l-31.3344-50.5344v-0.0512l-63.488-102.4512-29.696-47.9232c-17.664-28.4672-55.1936-37.3248-83.712-19.8144L511.1296 151.296a15.42144 15.42144 0 0 0-5.0688 21.1456 15.3856 15.3856 0 0 0 21.1456 5.0688l106.0352-65.1776c14.1824-8.704 32.768-4.2496 41.5232 9.8304l13.568 21.9136-271.4112 159.2832c-1.5872 0.9216-2.8672 2.0992-3.9936 3.4304h-96.256l160.3584-98.5088c7.2192-4.4544 9.472-13.8752 5.0688-21.1456a15.37536 15.37536 0 0 0-21.1456-5.0688L261.7344 304.5376a13.824 13.824 0 0 0-2.816 2.304h-49.5616c-60.7232 0-110.1312 49.408-110.1312 110.1312v48.128c0 8.4992 6.8608 15.36 15.36 15.36s15.36-6.8608 15.36-15.36v-48.128c0-43.776 35.6352-79.4112 79.4112-79.4112h615.68c43.776 0 79.4112 35.6352 79.4112 79.4112v85.9648H698.88c-66.1504 0-119.9616 53.8112-119.9616 119.9104 0 66.1504 53.8112 119.9616 119.9616 119.9616h205.568v85.9648c0 43.776-35.6352 79.4112-79.4112 79.4112H209.3056c-43.776 0-79.4112-35.6352-79.4112-79.4112v-231.3728c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v231.3728c0 60.7232 49.408 110.1312 110.1312 110.1312h615.68c60.7232 0 110.1312-49.408 110.1312-110.1312V416.9728c0.0512-60.6208-49.152-109.9264-109.6704-110.1312z m-36.1472 0h-44.3392l31.3856-20.8896 12.9536 20.8896z m-84.736-136.704l47.0528 75.9296 8.5504 13.7728-70.7072 47.0016H471.7056l232.8576-136.704z m-5.6832 541.9008c-49.2032 0-89.2416-40.0384-89.2416-89.2416s40.0384-89.1904 89.2416-89.1904h205.568v178.432H698.88z" fill="#333333"></path>
                    <path d="M694.0672 567.3472c-30.5664 0-55.4496 24.8832-55.4496 55.4496s24.8832 55.5008 55.4496 55.5008 55.5008-24.8832 55.5008-55.5008-24.9344-55.4496-55.5008-55.4496z m0 80.2304a24.7552 24.7552 0 0 1 0-49.5104c13.6704 0 24.7808 11.1104 24.7808 24.7296 0 13.7216-11.1104 24.7808-24.7808 24.7808z" fill="#333333"></path>
                    <path d="M239.616 657.8688a12.8 12.8 0 0 1-12.8-12.8v-16.0256a12.8 12.8 0 0 1 25.6 0v16.0256a12.8 12.8 0 0 1-12.8 12.8zM239.616 597.76a12.8 12.8 0 0 1-12.8-12.8V474.4704c0-30.976 25.1904-56.1152 56.1664-56.1152h42.2912a12.8 12.8 0 0 1 0 25.6h-42.2912c-16.8448 0-30.5664 13.7216-30.5664 30.5152v110.5408c0 7.0656-5.7344 12.7488-12.8 12.7488z" fill="#FFFFFF"></path>
                    <path d="M816.384 585.6768h-42.1376a12.8 12.8 0 0 1 0-25.6h42.1376a12.8 12.8 0 0 1 0 25.6z" fill="#FFFFFF"></path>
                    <path d="M591.2576 288.9728a12.78976 12.78976 0 0 1-6.7584-23.6544l34.6624-21.5552a12.78976 12.78976 0 0 1 13.5168 21.7088l-34.6624 21.5552c-2.0992 1.28-4.4032 1.9456-6.7584 1.9456z" fill="#FFFFFF"></path>
                  </g>
                </svg>
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Tiket</span>
          </div>

          {/* Card 6: Oleh-oleh */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-[52px] h-[52px] opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg 
                  viewBox="0 0 1024 1024" 
                  className="w-9 h-9" 
                  version="1.1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M316.5184 267.9808l-33.9456-53.248c-24.6784-38.7072-13.2608-90.0608 25.4464-114.7392s90.0608-13.2608 114.7392 25.4464L505.344 255.0784M699.2896 267.9808l33.9456-53.248c24.6784-38.7072 13.2608-90.0608-25.4464-114.7392s-90.0608-13.2608-114.7392 25.4464L510.5152 255.0784M882.5856 525.1072H201.5232c-30.6176 0-55.4496-24.832-55.4496-55.4496V369.152c0-30.6176 24.832-55.4496 55.4496-55.4496h681.0624c30.6176 0 55.4496 24.832 55.4496 55.4496v100.4544c0 30.6688-24.832 55.5008-55.4496 55.5008z" fill="#FF6339"></path>
                    <path d="M640.9728 86.9888s79.8208 40.9088 48.896 94.7712c-30.9248 53.8624-61.4912 91.1872-61.4912 91.1872h68.608s31.7952-38.5536 40.1408-65.024 18.9952-83.456-20.7872-101.632-75.3664-19.3024-75.3664-19.3024zM881.6128 313.7024h-25.088v149.9136c0 23.296-1.3312 58.5216-26.624 58.5216 54.4768 0 108.1856 5.3248 108.1856-59.1872V370.176c-0.0512-31.1808-25.2928-56.4736-56.4736-56.4736zM287.0784 125.5424s53.8624-33.28 88.4736 17.9712 85.8112 129.4336 85.8112 129.4336h57.1904S448.3584 150.9888 422.7072 125.44c-25.6-25.5488-60.5184-47.7696-103.424-31.488s-32.2048 31.5904-32.2048 31.5904z" fill="#F94A21"></path>
                    <path d="M800.0512 931.8912H277.8624c-33.792 0-61.184-27.392-61.184-61.184v-345.6h644.5568v345.6c0 33.792-27.392 61.184-61.184 61.184z" fill="#FFAC48"></path>
                    <path d="M216.6784 577.6896h572.9792v290.3552c0 25.9584-5.9904 63.8464-56.8832 63.8464 70.8608 0 128.512-2.9696 128.512-74.8544v-324.3008H216.6784v44.9536z" fill="#FC992D"></path>
                    <path d="M881.6128 252.3648h-154.112l18.7392-29.3888c29.184-45.7728 15.6672-106.752-30.1568-135.936-45.7728-29.184-106.752-15.6672-135.936 30.1568L507.904 230.5536 435.712 117.1968C406.528 71.3728 345.5488 57.856 299.776 87.04c-45.7728 29.184-59.2896 90.1632-30.1568 135.936l18.7392 29.3888H139.4176c-39.5776 0-71.8336 32.2048-71.8336 71.8336v18.8928c0 8.4992 6.8608 15.36 15.36 15.36s15.36-6.8608 15.36-15.36v-18.8928c0-22.6304 18.432-41.1136 41.1136-41.1136H492.544v226.6624H139.4176c-22.6304 0-41.1136-18.432-41.1136-41.1136V407.3472c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v61.2864c0 39.5776 32.2048 71.8336 71.8336 71.8336h4.9664v59.3408c0 8.4992 6.8608 15.36 15.36 15.36s15.36-6.8608 15.36-15.36v-59.3408h317.44v59.3408c0 8.4992 6.8608 15.36 15.36 15.36s15.36-6.8608 15.36-15.36v-59.3408h322.6624v329.1648c0 25.856-21.0432 46.9504-46.9504 46.9504H523.264v-227.9936c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v227.9936H222.0544c-25.856 0-46.9504-21.0432-46.9504-46.9504V740.352c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v129.28c0 42.8032 34.816 77.6704 77.6704 77.6704h576.9216c42.8032 0 77.6704-34.816 77.6704-77.6704v-329.1648h4.9664c39.5776 0 71.8336-32.2048 71.8336-71.8336V324.1984c-0.0512-39.5776-32.256-71.8336-71.8336-71.8336z m-275.5584-118.6816c20.0704-31.488 62.0032-40.8064 93.5424-20.736 31.488 20.0704 40.8064 62.0032 20.736 93.5424l-29.2352 45.9264H530.432l75.6224-118.7328zM295.5264 206.4896c-20.0704-31.488-10.752-73.472 20.736-93.5424s73.472-10.752 93.5424 20.736l75.6224 118.6816H324.7616l-29.2352-45.8752z m627.1488 262.1952c0 22.6304-18.432 41.1136-41.1136 41.1136H523.264V283.0848h358.3488c22.6304 0 41.1136 18.432 41.1136 41.1136v144.4864z" fill="#333333"></path>
                    <path d="M159.744 703.8976c8.4992 0 15.36-6.8608 15.36-15.36v-15.5136c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v15.5136c0 8.4992 6.8608 15.36 15.36 15.36z" fill="#333333"></path>
                    <path d="M193.792 431.5648a12.8 12.8 0 0 1-12.8-12.8v-28.8256c0-24.1152 19.6096-43.7248 43.7248-43.7248h99.4304a12.8 12.8 0 0 1 0 25.6H224.7168c-9.984 0-18.1248 8.1408-18.1248 18.1248v28.8256a12.8 12.8 0 0 1-12.8 12.8zM394.2912 371.8144H372.736a12.8 12.8 0 0 1 0-25.6h21.5552a12.8 12.8 0 0 1 0 25.6zM320.7168 199.424c-5.12 0-9.9328-3.072-11.9296-8.0896-11.6224-29.3376 6.0416-51.2 16.9472-58.6752 5.8368-3.9936 13.824-2.4576 17.7664 3.3792 3.9424 5.7856 2.5088 13.7216-3.2768 17.7152-2.5088 1.792-14.336 11.4176-7.68 28.16 2.6112 6.5536-0.6144 14.0288-7.168 16.5888-1.536 0.6144-3.1232 0.9216-4.6592 0.9216zM610.9696 199.424a12.83072 12.83072 0 0 1-10.8032-19.6608l22.528-35.6352a12.83072 12.83072 0 0 1 17.664-3.9936c5.9904 3.7888 7.7312 11.6736 3.9936 17.664l-22.528 35.6352c-2.4576 3.8912-6.6048 5.9904-10.8544 5.9904zM269.568 831.6416a12.8 12.8 0 0 1-12.8-12.8v-13.312a12.8 12.8 0 0 1 25.6 0v13.312a12.8 12.8 0 0 1-12.8 12.8z" fill="#FFFFFF"></path>
                    <path d="M269.568 772.4032a12.8 12.8 0 0 1-12.8-12.8v-108.4416a12.8 12.8 0 0 1 25.6 0v108.4416a12.8 12.8 0 0 1-12.8 12.8z" fill="#FFFFFF"></path>
                  </g>
                </svg>
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Oleh-oleh</span>
          </div>

          {/* Card 7: Pengaduan */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-[52px] h-[52px] opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg 
                  viewBox="0 0 1024 1024" 
                  className="w-9 h-9" 
                  version="1.1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M697.4976 158.3104h-470.528c-48.3328 0-87.552 39.168-87.552 87.552v484.7104c0 16.64 18.688 26.368 32.3584 16.8448l91.392-63.7952h434.3296c48.3328 0 87.552-39.168 87.552-87.552v-350.208c0-48.3328-39.2192-87.552-87.552-87.552z" fill="#ECD300"></path>
                    <path d="M84.5824 393.3184c-8.4992 0-15.36-6.8608-15.36-15.36V348.672c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v29.2864c0 8.4992-6.8608 15.36-15.36 15.36z" fill="#333333"></path>
                    <path d="M720.2816 161.3824v406.6304c0 28.4672-3.7888 100.608-49.664 108.032 61.1328 0.512 114.432-16.5376 114.432-116.1728V245.8624c0-40.448-27.4944-74.3936-64.768-84.48z" fill="#E8A200"></path>
                    <path d="M105.1648 766.4128c-5.6832 0-11.3664-1.3312-16.64-4.096a35.76832 35.76832 0 0 1-19.3024-31.8464V437.7088c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v292.8128c0 2.7648 1.7408 4.0448 2.816 4.608 1.024 0.5632 3.1232 1.2288 5.376-0.3584l102.0928-71.2704c2.56-1.792 5.632-2.7648 8.8064-2.7648h470.9376c43.9808 0 79.7696-35.7888 79.7696-79.7696v-380.416c0-43.9808-35.7888-79.7696-79.7696-79.7696H179.6608c-43.9808 0-79.7696 35.7888-79.7696 79.7696V255.488c0 8.4992-6.8608 15.36-15.36 15.36s-15.36-6.8608-15.36-15.36V200.5504c0-60.928 49.5616-110.4896 110.4896-110.4896h510.2592c60.928 0 110.4896 49.5616 110.4896 110.4896v380.416c0 60.928-49.5616 110.4896-110.4896 110.4896H223.8464l-98.0992 68.5056a35.98848 35.98848 0 0 1-20.5824 6.4512z" fill="#333333"></path>
                    <path d="M847.5648 311.0912v291.1744c0 75.8272-61.44 137.2672-137.2672 137.2672H218.5728v24.1152c0 49.7152 40.2944 90.0096 90.0096 90.0096h498.3808l99.7888 67.6352c13.6704 9.2672 32.1024-0.512 32.1024-17.0496V405.9648c0-51.2-40.5504-92.8768-91.2896-94.8736z" fill="#FFAC48"></path>
                    <path d="M938.8544 405.9648c0-41.0112-26.0096-75.8272-62.4128-89.1392v409.856c0 50.8416 5.4784 126.9248-77.6192 126.9248h8.1408l99.7888 67.6352c13.6704 9.2672 32.1024-0.512 32.1024-17.0496V405.9648z" fill="#FC992D"></path>
                    <path d="M918.272 940.1856c-7.0656 0-14.08-2.0992-20.1728-6.1952l-95.8464-64.9728h-147.6096c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h152.32c3.072 0 6.0928 0.9216 8.6016 2.6624l99.7888 67.6352c2.2528 1.536 4.3008 0.8192 5.376 0.3072s2.7648-1.8944 2.7648-4.608V406.016c0-37.4272-25.5488-68.8128-60.5696-77.3632v273.6128c0 84.1728-68.4544 152.6272-152.6272 152.6272H233.9328v8.7552c0 41.1648 33.4848 74.6496 74.6496 74.6496h264.96c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36H308.5824c-58.112 0-105.3696-47.2576-105.3696-105.3696v-24.1152c0-8.4992 6.8608-15.36 15.36-15.36h491.7248c67.2256 0 121.9072-54.6816 121.9072-121.9072V311.0912c0-4.1984 1.6896-8.192 4.7104-11.0592 3.0208-2.9184 7.168-4.352 11.264-4.2496 59.4944 2.3552 106.0352 50.7904 106.0352 110.2848v498.2272c0 13.312-7.3216 25.4976-19.0976 31.744-5.3248 2.7648-11.0592 4.1472-16.8448 4.1472z" fill="#333333"></path>
                    <path d="M222.7712 392.0384m-45.6704 0a45.6704 45.6704 0 1 0 91.3408 0 45.6704 45.6704 0 1 0-91.3408 0Z" fill="#76BFFF"></path>
                    <path d="M429.4656 392.0384m-45.6704 0a45.6704 45.6704 0 1 0 91.3408 0 45.6704 45.6704 0 1 0-91.3408 0Z" fill="#76BFFF"></path>
                    <path d="M636.1088 392.0384m-45.6704 0a45.6704 45.6704 0 1 0 91.3408 0 45.6704 45.6704 0 1 0-91.3408 0Z" fill="#76BFFF"></path>
                    <path d="M222.7712 453.0688c-33.6384 0-61.0304-27.392-61.0304-61.0304s27.392-61.0304 61.0304-61.0304S283.8016 358.4 283.8016 392.0384s-27.3408 61.0304-61.0304 61.0304z m0-91.3408c-16.6912 0-30.3104 13.568-30.3104 30.3104 0 16.6912 13.568 30.3104 30.3104 30.3104 16.6912 0 30.3104-13.568 30.3104-30.3104 0-16.6912-13.568-30.3104-30.3104-30.3104zM429.5168 453.0688c-33.6384 0-61.0304-27.392-61.0304-61.0304s27.392-61.0304 61.0304-61.0304S490.5472 358.4 490.5472 392.0384c-0.0512 33.6384-27.392 61.0304-61.0304 61.0304z m0-91.3408c-16.6912 0-30.3104 13.568-30.3104 30.3104 0 16.6912 13.568 30.3104 30.3104 30.3104 16.6912 0 30.3104-13.568 30.3104-30.3104-0.0512-16.6912-13.6192-30.3104-30.3104-30.3104zM636.1088 453.0688c-33.6384 0-61.0304-27.392-61.0304-61.0304s27.392-61.0304 61.0304-61.0304 61.0304 27.392 61.0304 61.0304-27.392 61.0304-61.0304 61.0304z m0-91.3408c-16.6912 0-30.3104 13.568-30.3104 30.3104 0 16.6912 13.568 30.3104 30.3104 30.3104 16.6912 0 30.3104-13.568 30.3104-30.3104 0-16.6912-13.568-30.3104-30.3104-30.3104z" fill="#333333"></path>
                    <path d="M186.8288 290.1504a12.8 12.8 0 0 1-12.8-12.8v-28.3136c0-23.808 19.3536-43.2128 43.2128-43.2128h97.6896a12.8 12.8 0 0 1 0 25.6H217.2416c-9.6768 0-17.6128 7.8848-17.6128 17.6128v28.3136a12.8 12.8 0 0 1-12.8 12.8zM383.8464 231.424h-21.1968a12.8 12.8 0 0 1 0-25.6h21.1968a12.8 12.8 0 0 1 0 25.6zM458.5984 802.7136H359.5776a12.8 12.8 0 0 1 0-25.6h99.0208a12.8 12.8 0 0 1 0 25.6zM306.0224 802.7136h-14.592a12.8 12.8 0 0 1 0-25.6h14.592a12.8 12.8 0 0 1 0 25.6z" fill="#FFFFFF"></path>
                  </g>
                </svg>
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Pengaduan</span>
          </div>

          {/* Card 8: Bantuan */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-[52px] h-[52px] opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-[14px] bg-white border border-slate-200/80 cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg 
                  viewBox="0 0 1024 1024" 
                  className="w-9 h-9" 
                  version="1.1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M834.9184 909.1584H242.5856c-41.728 0-75.52-34.304-75.52-76.6464V249.7024c0-52.4288 26.5216-84.6848 78.1312-84.6848h431.9744c51.6608 0 83.2512 42.496 83.2512 94.9248v567.6032c0-0.0512-1.8432 67.9424 74.496 81.6128z" fill="#76BFFF"></path>
                    <path d="M745.216 801.6384V207.5648c-10.0864-31.1808-31.6928-42.5984-61.6448-42.5984h-2.9184v654.9504c0 32.6656-0.512 89.2416-32.5632 89.2416h138.24s-41.1136-17.3056-41.1136-107.52z" fill="#659CF8"></path>
                    <path d="M803.0208 277.3504v550.9632c0 44.6464 25.1904 80.896 56.2176 80.896 31.0784 0 56.2176-36.1984 56.2176-80.896V277.3504h-112.4352z" fill="#8F93FB"></path>
                    <path d="M859.2384 909.1584c31.0784 0 56.2176-36.1984 56.2176-80.896V277.3504h-56.2176v533.4528c0 30.3616 5.6832 74.0352-27.648 87.8592 8.192 6.656 17.6128 10.496 27.648 10.496z" fill="#787CF5"></path>
                    <path d="M106.6496 506.2144c-8.4992 0-15.36-6.8608-15.36-15.36v-15.5648c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v15.5648c0 8.4992-6.912 15.36-15.36 15.36z" fill="#333333"></path>
                    <path d="M915.456 261.9904h-146.432v-50.3296c0-64.6656-52.6336-117.2992-117.3504-117.2992H208.5888c-64.7168 0-117.3504 52.6336-117.3504 117.2992v177.5616c0 8.4992 6.8608 15.36 15.36 15.36s15.36-6.8608 15.36-15.36V211.6608c0-47.7696 38.8608-86.5792 86.6304-86.5792h443.136c47.7696 0 86.6304 38.8608 86.6304 86.5792V828.3136c0 25.344 9.8816 48.3328 25.9584 65.536H188.9792c-36.9152 0-66.9696-30.0544-66.9696-66.9696v-277.9136c0-8.4992-6.8608-15.36-15.36-15.36s-15.36 6.8608-15.36 15.36v277.9136c0 53.8624 43.8272 97.6896 97.6896 97.6896h645.9392c0.1536 0 0.256-0.0512 0.3584-0.0512 52.736-0.4096 95.5392-43.3664 95.5392-96.2048V277.3504c0-8.4992-6.8608-15.36-15.36-15.36z m-15.36 566.3232c0 35.6352-28.6208 64.6656-64.0512 65.4336-63.4368-11.9808-66.9184-61.8496-66.9696-71.3728V292.6592h131.072v535.6544z" fill="#333333"></path>
                    <path d="M405.1456 467.8144H282.4192a20.1216 20.1216 0 0 1-20.1216-20.1216V281.3952a20.1216 20.1216 0 0 1 20.1216-20.1216h122.7776a20.1216 20.1216 0 0 1 20.1216 20.1216v166.3488a20.19328 20.19328 0 0 1-20.1728 20.0704z" fill="#ECD300"></path>
                    <path d="M420.6592 415.232l3.9936-138.5984a20.03456 20.03456 0 0 0-19.456-15.3088h-21.2992v161.28c0 13.2608 1.4848 31.232-9.3184 38.2464 24.9856 1.4848 40.192 0 40.192 0l5.888-45.6192z" fill="#E8A200"></path>
                    <path d="M392.448 483.1744H258.0992c-26.5728 0-48.2304-21.6064-48.2304-48.2304V352.4608c0-8.4992 6.8608-15.36 15.36-15.36s15.36 6.8608 15.36 15.36v82.5344c0 9.6256 7.8336 17.5104 17.5104 17.5104h134.2976c9.6256 0 17.5104-7.8336 17.5104-17.5104V264.1408c0-9.6256-7.8336-17.5104-17.5104-17.5104H258.0992c-9.6256 0-17.5104 7.8336-17.5104 17.5104v36.864c0 8.4992-6.8608 15.36-15.36 15.36s-15.36-6.8608-15.36-15.36v-36.864c0-26.5728 21.6064-48.2304 48.2304-48.2304h134.2976c26.5728 0 48.2304 21.6064 48.2304 48.2304v170.8544c0 26.5728-21.6064 48.1792-48.1792 48.1792zM641.9456 269.9264h-122.5728c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h122.5728c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36zM641.9456 417.024h-122.5728c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h122.5728c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36zM641.9456 599.04H225.28c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h416.6656c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36zM641.9456 768.6656H225.28c-8.4992 0-15.36-6.8608-15.36-15.36s6.8608-15.36 15.36-15.36h416.6656c8.4992 0 15.36 6.8608 15.36 15.36s-6.8608 15.36-15.36 15.36z" fill="#333333"></path>
                    <path d="M286.8224 401.0496a12.8 12.8 0 0 1-12.8-12.8v-10.4448a12.8 12.8 0 0 1 25.6 0v10.4448a12.8 12.8 0 0 1-12.8 12.8zM286.8224 350.0544a12.8 12.8 0 0 1-12.8-12.8V297.984a22.528 22.528 0 0 1 22.528-22.528h33.4336a12.8 12.8 0 0 1 0 25.6h-30.3616v36.1984a12.8 12.8 0 0 1-12.8 12.8z" fill="#FFFFFF"></path>
                  </g>
                </svg>
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Informasi</span>
          </div>
        </div>
      </section>

      {/* YOUTUBE VIDEO HOOK */}
      <section className="px-5 mt-8 mb-12">
        <h3 className="text-base font-semibold text-slate-800">Pesona Tana Toraja</h3>
        <p className="text-xs font-normal text-slate-700 mt-1 mb-4 leading-relaxed">
          Ikuti perjalanan spiritual Maria menelusuri Tana Toraja.
        </p>
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-100 bg-slate-100">
          <iframe
            title="Pesona Tana Toraja Video"
            src="https://www.youtube.com/embed/uMYcKFbvORU"
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>

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

        {/* 1. Beranda (Active) */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-900 active:scale-90 transition cursor-pointer"
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
          <div className="h-1 w-1 rounded-full bg-slate-900 mt-1" />
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => {}}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-default"
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
