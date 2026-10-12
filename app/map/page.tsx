'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  ExternalLink,
  Filter,
  Globe,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Sparkles,
  Table as TableIcon,
  X,
  ChevronRight,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import companiesData from '@/data/companies.json';
import { Company } from '@/lib/schema';
import { StageContainer } from '@/components/stage-container';

interface CityPin {
  key: string;
  name: string;
  lat: number;
  lng: number;
  subtitle?: string;
  stateFeatureId?: string;
  zoomLevel?: number;
}

const CITY_PINS: CityPin[] = [
  { key: 'Bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, stateFeatureId: 'state-karnataka', zoomLevel: 8 },
  { key: 'Hyderabad', name: 'Hyderabad', lat: 17.385, lng: 78.4867, stateFeatureId: 'state-telangana', zoomLevel: 8 },
  { key: 'Pune', name: 'Pune', lat: 18.5204, lng: 73.8567, stateFeatureId: 'state-maharashtra', zoomLevel: 8 },
  { key: 'Mumbai', name: 'Mumbai', lat: 19.076, lng: 72.8777, stateFeatureId: 'state-maharashtra', zoomLevel: 8 },
  { key: 'Delhi NCR', name: 'Delhi NCR', lat: 28.6139, lng: 77.209, stateFeatureId: 'state-haryana-up', zoomLevel: 8 },
  { key: 'Chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707, stateFeatureId: 'state-tamilnadu', zoomLevel: 8 },
  { key: 'Kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639, stateFeatureId: 'state-west-bengal', zoomLevel: 8 },
  {
    key: 'Tier-2 Cities',
    name: 'Tier-2',
    lat: 22.7196,
    lng: 75.8577,
    subtitle: 'Ahmedabad, Kochi, Coimbatore, Jaipur, Indore, etc.',
  },
];

// Representative hub pins for Tier-2 clusters across India
const TIER2_CLUSTER_COORDINATES = [
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
];

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-white font-sans">Loading Map...</div>}>
      <MapContent />
    </Suspense>
  );
}

function MapContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'table' ? 'table' : 'map';
  const initialSearch = searchParams.get('nl') || '';
  const initialCity = searchParams.get('city') || 'all';

  const companies = companiesData as Company[];

  // View state: 'map' | 'table'
  const [viewMode, setViewMode] = useState<'map' | 'table'>(initialView);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCityKey, setSelectedCityKey] = useState<string>(initialCity);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');

  // Mobile Filter Drawer State
  const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

  // Selected city pin for side panel / bottom sheet
  const [activeSidePanelCity, setActiveSidePanelCity] = useState<string | null>(
    initialCity !== 'all' ? initialCity : null
  );

  // Inspected GCC for modal/drawer card
  const [inspectedCompany, setInspectedCompany] = useState<Company | null>(null);

  // Leaflet loading state & refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const highlightLayerGroupRef = useRef<any>(null);
  const indiaGeoJsonRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Distinct sector options
  const sectors = useMemo(() => {
    return Array.from(new Set(companies.map((c) => c.sector))).sort();
  }, [companies]);

  // Distinct size bands
  const sizeBands = useMemo(() => {
    const list = Array.from(new Set(companies.map((c) => c.size_band).filter(Boolean))) as string[];
    return list.sort();
  }, [companies]);

  // Filtered companies based on search, city, sector, size
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesParent = c.parent_name?.toLowerCase().includes(q);
        const matchesSector = c.sector.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        const matchesCity = c.india_cities?.some((ct) => ct.toLowerCase().includes(q));
        if (!matchesName && !matchesParent && !matchesSector && !matchesNotes && !matchesCity) {
          return false;
        }
      }

      // 2. City filter
      if (selectedCityKey !== 'all') {
        const hasCity =
          c.india_cities?.includes(selectedCityKey) ||
          (selectedCityKey === 'Tier-2 Cities' &&
            (c.india_cities?.includes('Tier-2') || c.india_cities?.includes('Tier-2 Cities')));
        if (!hasCity) return false;
      }

      // 3. Sector filter
      if (selectedSector !== 'all') {
        if (c.sector !== selectedSector) return false;
      }

      // 4. Size filter
      if (selectedSize !== 'all') {
        if (c.size_band !== selectedSize) return false;
      }

      return true;
    });
  }, [companies, searchQuery, selectedCityKey, selectedSector, selectedSize]);

  // Counts per city based on current filters (excluding city filter itself so pins show matching counts)
  const cityFilteredCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CITY_PINS.forEach((pin) => {
      counts[pin.key] = 0;
    });

    companies.forEach((c) => {
      // Check search, sector, size
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesParent = c.parent_name?.toLowerCase().includes(q);
        const matchesSector = c.sector.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        const matchesCity = c.india_cities?.some((ct) => ct.toLowerCase().includes(q));
        if (!matchesName && !matchesParent && !matchesSector && !matchesNotes && !matchesCity) {
          return;
        }
      }

      if (selectedSector !== 'all' && c.sector !== selectedSector) {
        return;
      }

      if (selectedSize !== 'all' && c.size_band !== selectedSize) {
        return;
      }

      // Map to city pin
      const city = c.india_cities?.[0];
      if (city && counts[city] !== undefined) {
        counts[city] += 1;
      } else if (city === 'Tier-2' || city === 'Tier-2 Cities') {
        counts['Tier-2 Cities'] += 1;
      }
    });

    return counts;
  }, [companies, searchQuery, selectedSector, selectedSize]);

  // Total matching sum across the 8 pins
  const totalPinsCount = useMemo(() => {
    return Object.values(cityFilteredCounts).reduce((acc, curr) => acc + curr, 0);
  }, [cityFilteredCounts]);

  // Sourced companies for active side panel city
  const activeCityCompanies = useMemo(() => {
    if (!activeSidePanelCity) return [];
    return filteredCompanies.filter((c) => {
      return (
        c.india_cities?.includes(activeSidePanelCity) ||
        (activeSidePanelCity === 'Tier-2 Cities' &&
          (c.india_cities?.includes('Tier-2') || c.india_cities?.includes('Tier-2 Cities')))
      );
    });
  }, [filteredCompanies, activeSidePanelCity]);

  // Sector breakdown for active side panel city
  const activeCitySectorMix = useMemo(() => {
    if (!activeSidePanelCity) return [];
    const counts: Record<string, number> = {};
    activeCityCompanies.forEach((c) => {
      counts[c.sector] = (counts[c.sector] || 0) + 1;
    });

    const total = activeCityCompanies.length;
    return Object.entries(counts)
      .map(([sector, count]) => ({
        sector,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeCityCompanies, activeSidePanelCity]);

  // Fetch public India GeoJSON boundaries
  useEffect(() => {
    fetch('/india.geojson')
      .then((res) => res.json())
      .then((data) => {
        indiaGeoJsonRef.current = data;
      })
      .catch((err) => {
        console.error('Failed to load /india.geojson:', err);
      });
  }, []);

  // Dynamic Leaflet CSS and JS Loader
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
      setLeafletLoaded(true);
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 78.9],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        dragging: true,
        minZoom: 4,
        maxZoom: 18,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Layer group for boundaries and highlights (rendered below pins)
      const highlightLayerGroup = L.layerGroup().addTo(map);
      highlightLayerGroupRef.current = highlightLayerGroup;

      // Layer group for city pins
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      mapInstanceRef.current = map;

      // Invalidate size once rendered to ensure clean pan/pinch on mobile
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      // If initial city was passed via URL searchParams, fly to it
      if (initialCity && initialCity !== 'all') {
        const pin = CITY_PINS.find((p) => p.key === initialCity);
        if (pin) {
          triggerCityFlyAndHighlight(pin.key, map, L);
        }
      }
    }
  }, [leafletLoaded, initialCity]);

  // Function to fly to city and render double-blinking state boundary / city ring
  const triggerCityFlyAndHighlight = (cityKey: string, mapInstance?: any, leafletLib?: any) => {
    const map = mapInstance || mapInstanceRef.current;
    const L = leafletLib || (window as any).L;
    const highlightGroup = highlightLayerGroupRef.current;
    if (!map || !L || !highlightGroup) return;

    highlightGroup.clearLayers();

    if (cityKey === 'Tier-2 Cities') {
      const latLngs = TIER2_CLUSTER_COORDINATES.map((c) => [c.lat, c.lng]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, {
        padding: [40, 40],
        duration: 1.2,
      });

      TIER2_CLUSTER_COORDINATES.forEach((c) => {
        const pulseIcon = L.divIcon({
          className: 'pin-pulse-twice',
          html: `
            <div class="flex items-center justify-center h-6 w-6 rounded-full bg-[#D0F07A] border-2 border-[#072A1B] shadow-lg">
              <span class="h-2.5 w-2.5 rounded-full bg-[#072A1B]"></span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const pulseMarker = L.marker([c.lat, c.lng], {
          icon: pulseIcon,
          interactive: false,
        });
        pulseMarker.addTo(highlightGroup);
      });
      return;
    }

    const pin = CITY_PINS.find((p) => p.key === cityKey);
    if (!pin) return;

    const targetZoom = pin.zoomLevel || 8;
    map.flyTo([pin.lat, pin.lng], targetZoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    // 1. Draw state outline if available in India GeoJSON
    if (indiaGeoJsonRef.current && pin.stateFeatureId) {
      const stateFeature = indiaGeoJsonRef.current.features?.find(
        (f: any) => f.properties?.id === pin.stateFeatureId
      );

      if (stateFeature) {
        const stateLayer = L.geoJSON(stateFeature, {
          style: {
            color: '#D0F07A',
            weight: 3,
            opacity: 0.9,
            fillColor: '#14503A',
            fillOpacity: 0.25,
            className: 'boundary-blink-twice',
          },
        });
        stateLayer.addTo(highlightGroup);
      }
    }

    // 2. Draw city circle boundary ring (18km radius)
    const cityRing = L.circle([pin.lat, pin.lng], {
      radius: 18000,
      color: '#D0F07A',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#D0F07A',
      fillOpacity: 0.18,
      className: 'boundary-blink-twice',
    });
    cityRing.addTo(highlightGroup);
  };

  // Re-render markers whenever filters, active selection, or counts change
  useEffect(() => {
    if (!leafletLoaded) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!L || !map || !markersGroup) return;

    markersGroup.clearLayers();

    CITY_PINS.forEach((pin) => {
      const count = cityFilteredCounts[pin.key] || 0;
      const isSelected = activeSidePanelCity === pin.key;
      const isTier2Selected = activeSidePanelCity === 'Tier-2 Cities' && pin.key === 'Tier-2 Cities';

      // Minimum 44px tap target for touch devices
      const iconHtml = `
        <div class="group relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-110 z-50' : 'hover:scale-105 z-20'
        } ${isTier2Selected ? 'pin-pulse-twice' : ''}">
          <!-- Badge Circle with Count -->
          <div class="flex items-center justify-center rounded-full px-2.5 py-1 font-bold text-xs shadow-lg transition-all ${
            isSelected
              ? 'bg-[#D0F07A] text-[#072A1B] ring-4 ring-[#D0F07A]/40 shadow-[#D0F07A]/20 scale-105'
              : count > 0
              ? 'bg-[#072A1B] text-[#D0F07A] border-2 border-[#D0F07A] hover:bg-[#14503A]'
              : 'bg-[#0C3A26]/80 text-[#8FA89A] border border-[#14503A]'
          }">
            <span class="text-sm font-extrabold tracking-tight tabular-nums">${count}</span>
          </div>

          <!-- City Name Label Pill -->
          <div class="mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap shadow-md ${
            isSelected
              ? 'bg-[#072A1B] text-[#D0F07A] border border-[#D0F07A]'
              : 'bg-[#072A1B]/95 text-white border border-[#14503A]'
          }">
            ${pin.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-city-pin',
        html: iconHtml,
        iconSize: [64, 52],
        iconAnchor: [32, 26],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon });

      marker.on('click', () => {
        handleSelectCity(pin.key);
      });

      marker.addTo(markersGroup);
    });
  }, [leafletLoaded, cityFilteredCounts, activeSidePanelCity]);

  // Handle clicking a pin or city chip
  const handleSelectCity = (cityKey: string) => {
    setActiveSidePanelCity(cityKey);
    setSelectedCityKey(cityKey);
    triggerCityFlyAndHighlight(cityKey);
  };

  // Reset button: flies back to full India view and clears boundaries
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCityKey('all');
    setSelectedSector('all');
    setSelectedSize('all');
    setActiveSidePanelCity(null);

    if (highlightLayerGroupRef.current) {
      highlightLayerGroupRef.current.clearLayers();
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.5, 78.9], 5, { duration: 1.2 });
    }
  };

  // Ensure map resizes properly when switching from table to map
  const handleSwitchView = (newView: 'map' | 'table') => {
    setViewMode(newView);
    if (newView === 'map') {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }
  };

  const hasActiveFilters =
    searchQuery || selectedCityKey !== 'all' || selectedSector !== 'all' || selectedSize !== 'all' || activeSidePanelCity;

  return (
    <div className="pb-16 space-y-4">
      <StageContainer noPadding={true}>
        {/* Header Block with Sourced Context & Transparency Notice */}
        <div className="border-b border-[#14503A] bg-[#072A1B]/95 backdrop-blur-md p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14503A] text-[#D0F07A]">
                  <Globe className="h-4 w-4" />
                </span>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  The Map: India Sourced GCC Footprint
                </h1>
              </div>

              {/* Total census headline & transparency disclaimer */}
              <div className="mt-2 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14503A] px-2.5 py-0.5 font-medium text-[#D0F07A]">
                    Total Ecosystem: 2,117 GCCs
                  </span>
                  <span className="text-[#8FA89A]">
                    (Zinnov-Nasscom FY26 report, India only, March 2026)
                  </span>
                  <span className="text-[#8FA89A] hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0C3A26] px-2.5 py-0.5 text-white border border-[#14503A]">
                    Map shows 303 sourced subset
                  </span>
                </div>

                <p className="text-xs text-[#8FA89A] flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-[#D0F07A] shrink-0" />
                  <span>
                    Entries are sourced to one directory (GCC Journal) and not independently checked.
                  </span>
                </p>
              </div>
            </div>

            {/* View Mode Toggle: Map vs Table */}
            <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
              <div className="inline-flex rounded-full bg-[#0C3A26] p-1 border border-[#14503A] text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchView('map')}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-[34px] transition-all ${
                    viewMode === 'map'
                      ? 'bg-[#D0F07A] text-[#072A1B] font-bold shadow-xs'
                      : 'text-[#8FA89A] hover:text-white'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchView('table')}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-[34px] transition-all ${
                    viewMode === 'table'
                      ? 'bg-[#D0F07A] text-[#072A1B] font-bold shadow-xs'
                      : 'text-[#8FA89A] hover:text-white'
                  }`}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar and Shared Filters: Responsive for Small Screens */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#14503A]/60">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8FA89A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search GCC company, sector, focus, or city..."
                className="w-full rounded-full border border-[#14503A] bg-[#0C3A26] py-1.5 pl-8 pr-8 text-xs text-white placeholder-[#8FA89A] focus:border-[#D0F07A] focus:outline-none min-h-[36px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-[#8FA89A] hover:text-white"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filters Drawer Trigger (visible on mobile only) */}
            <button
              type="button"
              onClick={() => setMobileFilterDrawerOpen(true)}
              className="sm:hidden inline-flex items-center gap-1.5 rounded-full border border-[#14503A] bg-[#0C3A26] px-3.5 py-1.5 text-xs text-[#D0F07A] min-h-[36px]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {(selectedCityKey !== 'all' || selectedSector !== 'all' || selectedSize !== 'all') && (
                <span className="h-2 w-2 rounded-full bg-[#D0F07A]"></span>
              )}
            </button>

            {/* Desktop Filters (Hidden on small mobile screens) */}
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              {/* City Filter */}
              <select
                value={selectedCityKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCityKey(val);
                  if (val !== 'all') {
                    handleSelectCity(val);
                  } else {
                    handleResetFilters();
                  }
                }}
                className="rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1.5 text-xs text-[#8FA89A] hover:text-white focus:outline-none min-h-[36px]"
              >
                <option value="all">All 8 Hubs ({totalPinsCount})</option>
                {CITY_PINS.map((pin) => (
                  <option key={pin.key} value={pin.key}>
                    {pin.name} ({cityFilteredCounts[pin.key] || 0})
                  </option>
                ))}
              </select>

              {/* Sector Filter */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1.5 text-xs text-[#8FA89A] hover:text-white focus:outline-none min-h-[36px]"
              >
                <option value="all">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Size Filter */}
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1.5 text-xs text-[#8FA89A] hover:text-white focus:outline-none min-h-[36px]"
              >
                <option value="all">All Headcounts</option>
                {sizeBands.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz} FTEs
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1.5 text-xs text-[#D0F07A] hover:bg-[#14503A] transition-colors min-h-[36px]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}

            {/* Active filtered count chip */}
            <div className="w-full sm:w-auto sm:ml-auto text-xs text-[#8FA89A] pt-1 sm:pt-0">
              Showing <span className="font-bold text-[#D0F07A]">{filteredCompanies.length}</span> of 303 sourced GCCs
            </div>
          </div>
        </div>

        {/* View 1: Leaflet Interactive Map Stage with City Pins & Slide-over / Bottom-sheet Detail Panel */}
        {viewMode === 'map' ? (
          <div className="relative w-full h-[520px] sm:h-[640px] lg:h-[700px] min-w-0 max-w-full bg-[#072A1B] overflow-hidden flex flex-col justify-end sm:block isolate">
            {/* The Leaflet Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-full min-w-0 max-w-full relative overflow-hidden"
              style={{ width: '100%', height: '100%', minWidth: 0, minHeight: '100%' }}
            />

            {/* City Quick Picker Bar (Top-left floating chip dock, horizontally scrollable on mobile) */}
            <div className="absolute left-2 sm:left-4 top-2 sm:top-4 right-2 sm:right-auto z-20 flex overflow-x-auto no-scrollbar gap-1.5 sm:max-w-md pointer-events-auto py-1">
              {CITY_PINS.map((pin) => {
                const count = cityFilteredCounts[pin.key] || 0;
                const isSelected = activeSidePanelCity === pin.key;
                return (
                  <button
                    key={pin.key}
                    type="button"
                    onClick={() => handleSelectCity(pin.key)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all backdrop-blur-md shadow-md shrink-0 min-h-[34px] ${
                      isSelected
                        ? 'bg-[#D0F07A] text-[#072A1B] font-bold ring-2 ring-[#072A1B]'
                        : 'bg-[#072A1B]/90 text-white border border-[#14503A] hover:border-[#D0F07A]/60'
                    }`}
                  >
                    <span>{pin.name}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isSelected ? 'bg-[#072A1B] text-[#D0F07A]' : 'bg-[#14503A] text-[#D0F07A]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Side Panel on Desktop / Bottom Sheet on Mobile */}
            {activeSidePanelCity && (
              <div className="absolute sm:right-0 bottom-0 left-0 sm:left-auto sm:top-0 w-full sm:w-[420px] max-h-[80%] sm:max-h-full bg-[#072A1B]/98 border-t sm:border-t-0 sm:border-l border-[#14503A] rounded-t-[24px] sm:rounded-none backdrop-blur-xl z-30 shadow-2xl flex flex-col transition-all duration-300">
                {/* Panel Header */}
                <div className="p-4 sm:p-5 border-b border-[#14503A] bg-[#0C3A26]/80 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#D0F07A]" />
                      <h2 className="font-serif text-lg sm:text-2xl font-bold text-white">
                        {activeSidePanelCity === 'Tier-2 Cities' ? 'Tier-2 Cities' : activeSidePanelCity}
                      </h2>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-[#8FA89A]">
                      <span className="font-bold text-[#D0F07A] text-sm tabular-nums">
                        {activeCityCompanies.length} Sourced GCCs
                      </span>
                      {activeCityCompanies.length !== cityFilteredCounts[activeSidePanelCity] && (
                        <span>(filtered)</span>
                      )}
                    </div>
                    {CITY_PINS.find((p) => p.key === activeSidePanelCity)?.subtitle && (
                      <p className="mt-0.5 text-[11px] text-[#8FA89A]">
                        {CITY_PINS.find((p) => p.key === activeSidePanelCity)?.subtitle}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSidePanelCity(null);
                      setSelectedCityKey('all');
                      if (highlightLayerGroupRef.current) {
                        highlightLayerGroupRef.current.clearLayers();
                      }
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([21.5, 78.9], 5, { duration: 1.2 });
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14503A] text-[#8FA89A] hover:text-white transition-colors"
                    title="Close side panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Sector Mix Section */}
                <div className="p-3 sm:p-5 border-b border-[#14503A] bg-[#072A1B]">
                  <h3 className="text-xs uppercase tracking-wider text-[#8FA89A] mb-2 font-medium">
                    Sector Mix in {activeSidePanelCity === 'Tier-2 Cities' ? 'Tier-2' : activeSidePanelCity}
                  </h3>
                  <div className="space-y-1.5 max-h-28 sm:max-h-36 overflow-y-auto pr-1">
                    {activeCitySectorMix.map((mix) => (
                      <div key={mix.sector} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white font-medium">{mix.sector}</span>
                          <span className="text-[#8FA89A] tabular-nums">
                            {mix.count} ({mix.percent}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#0C3A26] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D0F07A]"
                            style={{ width: `${mix.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sourced GCC List */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 max-h-[220px] sm:max-h-none">
                  <div className="flex items-center justify-between text-xs text-[#8FA89A] mb-1">
                    <span>SOURCED DIRECTORY ENTRIES</span>
                    <span className="tabular-nums">{activeCityCompanies.length} TOTAL</span>
                  </div>

                  {activeCityCompanies.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8FA89A]">
                      No GCCs in this city match the active search or sector filters.
                    </div>
                  ) : (
                    activeCityCompanies.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setInspectedCompany(c)}
                        className="group rounded-xl border border-[#14503A] bg-[#0C3A26]/50 p-2.5 sm:p-3 hover:bg-[#14503A]/60 hover:border-[#D0F07A]/60 transition-all cursor-pointer flex items-start justify-between gap-2 shadow-xs min-h-[44px]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-[#D0F07A] shrink-0" />
                            <h4 className="font-bold text-white text-xs truncate group-hover:text-[#D0F07A] transition-colors">
                              {c.name}
                            </h4>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#8FA89A]">
                            <span className="rounded bg-[#072A1B] px-1.5 py-0.5 border border-[#14503A]">
                              {c.sector}
                            </span>
                            {c.size_band && (
                              <span className="text-[#8FA89A] tabular-nums">
                                • {c.size_band} FTEs
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-[#8FA89A] group-hover:text-[#D0F07A] shrink-0 transition-transform group-hover:translate-x-0.5 mt-0.5" />
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Attribution Disclaimer */}
                <div className="p-3 border-t border-[#14503A] bg-[#072A1B] text-[10px] text-[#8FA89A] flex items-center justify-between">
                  <span>Source: GCC Journal Directory (Apr 2026)</span>
                  <a
                    href="https://gccjournal.in/insights/list-of-global-capability-centers-gcc-in-india/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D0F07A] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* View 2: High-Density Tabular View / Mobile Stacked Cards */
          <div className="p-3 sm:p-6 bg-[#072A1B]">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-[#14503A]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C3A26] text-[11px] text-[#8FA89A] uppercase tracking-wider border-b border-[#14503A]">
                  <tr>
                    <th className="py-3 px-4">Company / GCC</th>
                    <th className="py-3 px-4">Parent Entity</th>
                    <th className="py-3 px-4">Sector</th>
                    <th className="py-3 px-4">City Hub</th>
                    <th className="py-3 px-4">Headcount Band</th>
                    <th className="py-3 px-4">Source Reference</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14503A]/60">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#8FA89A]">
                        No GCC companies found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-[#14503A]/30 transition-colors cursor-pointer group"
                        onClick={() => setInspectedCompany(c)}
                      >
                        <td className="py-3 px-4 font-semibold text-white group-hover:text-[#D0F07A]">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 text-[#8FA89A]">
                          {c.parent_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-[#0C3A26] px-2 py-0.5 text-[10px] text-white border border-[#14503A]">
                            {c.sector}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white">
                          {c.india_cities?.join(', ') || 'India'}
                        </td>
                        <td className="py-3 px-4 text-[#8FA89A] tabular-nums">
                          {c.size_band ? `${c.size_band} FTEs` : 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-[#8FA89A]">
                          <span className="text-[11px] text-[#D0F07A]">
                            GCC Journal Directory
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedCompany(c);
                            }}
                            className="rounded-full bg-[#14503A] px-2.5 py-1 text-[11px] text-[#D0F07A] hover:bg-[#1B654A] min-h-[30px]"
                          >
                            Card
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View (Ensures No Table Horizontal Cutoff) */}
            <div className="md:hidden space-y-3">
              {filteredCompanies.length === 0 ? (
                <div className="py-12 text-center text-[#8FA89A] text-xs">
                  No GCC companies found matching the current filters.
                </div>
              ) : (
                filteredCompanies.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setInspectedCompany(c)}
                    className="rounded-2xl border border-[#14503A] bg-[#0C3A26] p-4 space-y-3 cursor-pointer hover:border-[#D0F07A]/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {c.name}
                        </h3>
                        {c.parent_name && (
                          <p className="text-xs text-[#8FA89A] mt-0.5">
                            Parent: {c.parent_name}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-[#072A1B] px-2.5 py-0.5 text-[10px] text-[#D0F07A] border border-[#14503A] shrink-0">
                        {c.sector}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#8FA89A] pt-2 border-t border-[#14503A]/60">
                      <div>
                        <span className="text-[10px] block text-[#8FA89A]">City Hub</span>
                        <span className="text-white font-medium">{c.india_cities?.join(', ') || 'India'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block text-[#8FA89A]">Headcount</span>
                        <span className="text-white font-medium tabular-nums">{c.size_band ? `${c.size_band} FTEs` : 'Unknown'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#14503A]/60 flex items-center justify-between">
                      <span className="text-[11px] text-[#8FA89A]">Sourced from GCC Journal</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedCompany(c);
                        }}
                        className="rounded-full bg-[#14503A] px-3 py-1 text-xs font-semibold text-[#D0F07A] hover:bg-[#1B654A] min-h-[32px]"
                      >
                        Inspect Card →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </StageContainer>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/70 backdrop-blur-sm sm:hidden">
          <div className="w-full rounded-t-[24px] border-t border-[#14503A] bg-[#072A1B] p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#14503A] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#D0F07A]" />
                <h3 className="font-serif text-lg font-bold text-white">Filter Directory</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14503A] text-[#8FA89A] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8FA89A] mb-1 font-medium">Select City Hub</label>
                <select
                  value={selectedCityKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCityKey(val);
                    if (val !== 'all') {
                      handleSelectCity(val);
                    } else {
                      handleResetFilters();
                    }
                  }}
                  className="w-full rounded-xl border border-[#14503A] bg-[#0C3A26] p-2.5 text-white"
                >
                  <option value="all">All 8 Hubs ({totalPinsCount})</option>
                  {CITY_PINS.map((pin) => (
                    <option key={pin.key} value={pin.key}>
                      {pin.name} ({cityFilteredCounts[pin.key] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8FA89A] mb-1 font-medium">Select Sector</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full rounded-xl border border-[#14503A] bg-[#0C3A26] p-2.5 text-white"
                >
                  <option value="all">All Sectors</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8FA89A] mb-1 font-medium">Headcount Band</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full rounded-xl border border-[#14503A] bg-[#0C3A26] p-2.5 text-white"
                >
                  <option value="all">All Headcounts</option>
                  {sizeBands.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} FTEs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#14503A]">
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setMobileFilterDrawerOpen(false);
                }}
                className="rounded-full border border-[#14503A] px-4 py-2 text-xs text-[#D0F07A] hover:bg-[#14503A] min-h-[40px]"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterDrawerOpen(false)}
                className="flex-1 rounded-full bg-[#D0F07A] px-4 py-2 text-xs font-bold text-[#072A1B] hover:bg-[#BDE658] min-h-[40px]"
              >
                Apply Filters ({filteredCompanies.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Card Inspection Slide-over for Selected GCC */}
      {inspectedCompany && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setInspectedCompany(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#14503A] bg-[#072A1B] p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#14503A] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#D0F07A] block font-medium">
                  GCC Profile Card
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  {inspectedCompany.name}
                </h3>
                {inspectedCompany.parent_name && (
                  <p className="text-xs text-[#8FA89A]">
                    Parent: {inspectedCompany.parent_name} ({inspectedCompany.parent_country})
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectedCompany(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14503A] text-[#8FA89A] hover:text-white shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 text-xs">
              <div className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3 space-y-1">
                <span className="text-[#8FA89A] text-[10px] block">Sector</span>
                <span className="font-bold text-white">{inspectedCompany.sector}</span>
              </div>
              <div className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3 space-y-1">
                <span className="text-[#8FA89A] text-[10px] block">City Location</span>
                <span className="font-bold text-white">
                  {inspectedCompany.india_cities?.join(', ')}
                </span>
              </div>
              <div className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3 space-y-1">
                <span className="text-[#8FA89A] text-[10px] block">Sourced Headcount</span>
                <span className="font-bold text-white tabular-nums">
                  {inspectedCompany.size_band ? `${inspectedCompany.size_band} FTEs` : 'Not specified'}
                </span>
              </div>
            </div>

            {inspectedCompany.notes && (
              <div className="rounded-xl border border-[#14503A] bg-[#0C3A26]/60 p-4 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#8FA89A] block font-medium">
                  Key Focus & Core Capabilities:
                </span>
                <p className="text-xs text-[#8FA89A] leading-relaxed">
                  {inspectedCompany.notes}
                </p>
              </div>
            )}

            {/* Mandatory Source Line & Link */}
            <div className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3.5 space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#D0F07A] block font-medium">
                Source Line:
              </span>
              <p className="text-white text-xs">
                Sourced from <span className="font-semibold text-[#D0F07A]">GCC Journal</span> (Complete List of Global Capability Centers in India, April 2026).
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[#8FA89A]">
                  Curated directory listing, not independently checked.
                </span>
                <a
                  href={inspectedCompany.sources?.[0]?.url || 'https://gccjournal.in/insights/list-of-global-capability-centers-gcc-in-india/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#D0F07A] hover:underline"
                >
                  <span>Open Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedCompany(null)}
                className="rounded-full bg-[#14503A] px-5 py-2 text-xs font-semibold text-[#D0F07A] hover:bg-[#1B654A] transition-colors min-h-[36px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
