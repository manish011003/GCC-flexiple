'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Globe } from 'lucide-react';
import companiesData from '@/data/companies.json';
import { Company } from '@/lib/schema';

interface CityPin {
  key: string;
  name: string;
  lat: number;
  lng: number;
}

const CITY_PINS: CityPin[] = [
  { key: 'Bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { key: 'Hyderabad', name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { key: 'Pune', name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { key: 'Mumbai', name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { key: 'Delhi NCR', name: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  { key: 'Chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { key: 'Kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { key: 'Tier-2 Cities', name: 'Tier-2', lat: 22.7196, lng: 75.8577 },
];

export function MapPreviewCard() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Compute exact city counts from registry
  const cityCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    CITY_PINS.forEach((pin) => {
      counts[pin.key] = 0;
    });

    const companies = companiesData as Company[];
    companies.forEach((c) => {
      const city = c.india_cities?.[0];
      if (city && counts[city] !== undefined) {
        counts[city] += 1;
      } else if (city === 'Tier-2' || city === 'Tier-2 Cities') {
        counts['Tier-2 Cities'] += 1;
      }
    });

    return counts;
  }, []);

  // Ensure Leaflet JS & CSS are loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      setLeafletReady(true);
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        setLeafletReady(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  // Initialize non-interactive-by-default preview map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 78.9],
        zoom: 4,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
        keyboard: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);

      CITY_PINS.forEach((pin) => {
        const count = cityCounts[pin.key] || 0;
        const iconHtml = `
          <div class="group relative flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110">
            <div class="flex items-center justify-center rounded-full px-2 py-0.5 font-mono font-bold text-[11px] shadow-lg bg-[#072A1B] text-[#D0F07A] border-2 border-[#D0F07A] group-hover:bg-[#14503A]">
              <span class="tracking-tight">${count}</span>
            </div>
            <div class="mt-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-sans font-semibold tracking-wide whitespace-nowrap shadow-md bg-[#072A1B]/95 text-white border border-[#14503A]">
              ${pin.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-preview-pin',
          html: iconHtml,
          iconSize: [50, 40],
          iconAnchor: [25, 20],
        });

        const marker = L.marker([pin.lat, pin.lng], { icon: customIcon });

        marker.on('click', () => {
          router.push(`/map?city=${encodeURIComponent(pin.key)}`);
        });

        marker.addTo(markersGroup);
      });

      mapInstanceRef.current = map;

      // Invalidate size once container layout stabilizes
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [leafletReady, cityCounts, router]);

  return (
    <div className="relative w-full min-w-0 max-w-full rounded-[24px] border border-[#14503A] bg-[#072A1B] overflow-hidden shadow-xl flex flex-col isolate">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between border-b border-[#14503A] bg-[#0C3A26]/85 px-4 sm:px-6 py-3 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#14503A] text-[#D0F07A]">
            <Globe className="h-3.5 w-3.5" />
          </span>
          <span className="font-serif text-sm sm:text-base font-bold text-white">
            Footprint Preview
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-[#8FA89A]">
            • 8 Regional Hubs
          </span>
        </div>

        <button
          type="button"
          onClick={() => router.push('/map')}
          className="flex items-center gap-1.5 rounded-full bg-[#D0F07A] px-3.5 py-1 text-xs font-bold text-[#072A1B] hover:bg-[#BDE658] transition-all shadow-sm cursor-pointer"
        >
          <span>Open full map</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Map Stage Container (Height strictly 290px, width 100%, min-width 0, overflow hidden, isolated stacking context) */}
      <div className="relative w-full h-[290px] min-w-0 max-w-full bg-[#072A1B] overflow-hidden isolate">
        <div
          ref={mapContainerRef}
          className="w-full h-full min-w-0 max-w-full relative overflow-hidden"
          style={{ width: '100%', height: '100%', minWidth: 0, minHeight: '100%' }}
        />

        {/* Bottom Floating Caption Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 sm:left-4 sm:right-auto z-10 pointer-events-auto">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#14503A] bg-[#072A1B]/95 px-3 py-1.5 backdrop-blur-md text-[11px] font-sans text-white shadow-lg">
            <span className="h-2 w-2 rounded-full bg-[#D0F07A]"></span>
            <span>
              Map of the 303 sourced GCCs (subset of 2,117, Zinnov-Nasscom FY26, India only)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
