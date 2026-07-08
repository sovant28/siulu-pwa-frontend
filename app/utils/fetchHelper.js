import { supabase } from '../supabase';

export const fetchDestinationsData = async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // 1. Try fetching from FastAPI with a timeout
  try {
    const fetchWithTimeout = async (url, options = {}, timeout = 2500) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    // Hugging Face api url may not have trailing /api
    const cleanUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
    const res = await fetchWithTimeout(`${cleanUrl}/knowledge/destinasi`);
    if (res.ok) {
      const data = await res.json();
      
      // Parse string fields for database items
      return (data || []).map(item => {
        if (item.informasi_biaya && typeof item.informasi_biaya === 'string') {
          try {
            item.informasi_biaya = JSON.parse(item.informasi_biaya);
          } catch (e) {
            console.error('Failed to parse informasi_biaya:', e);
          }
        }
        return item;
      });
    }
  } catch (err) {
    console.warn("Gagal mengambil destinasi dari API PWA, mencoba fallback Supabase:", err);
  }

  // 2. Fallback: Fetch directly from Supabase
  try {
    const { data, error } = await supabase
      .from('destinasi_wisata')
      .select('*')
      .order('terakhir_diperbarui', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => {
      let gps = item.koordinat_gps;
      if (typeof gps === 'string' && gps.startsWith("POINT")) {
        try {
          const parts = gps.replace("POINT(", "").replace(")", "").split(" ");
          gps = [parseFloat(parts[1]), parseFloat(parts[0])];
        } catch (e) {}
      }
      
      let infoBiaya = item.informasi_biaya;
      if (infoBiaya && typeof infoBiaya === 'string') {
        try {
          infoBiaya = JSON.parse(infoBiaya);
        } catch (e) {}
      }

      return {
        ...item,
        koordinat_gps: gps,
        informasi_biaya: infoBiaya
      };
    });
  } catch (dbErr) {
    console.error("Gagal memuat destinasi via Supabase fallback di PWA:", dbErr);
    return [];
  }
};
