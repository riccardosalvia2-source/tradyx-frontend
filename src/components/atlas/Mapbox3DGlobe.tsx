// ============================================================================
// TRADYX ATLAS — ZERO-KEY MAPLIBRE GL JS 3D VECTOR NIGHT-EARTH GLOBE
// (src/components/atlas/Mapbox3DGlobe.tsx)
// - 100% Zero-Key open-source WebGL 3D Globe (maplibre-gl v6 + Carto Dark Matter)
// - True spherical projection ({ type: 'globe' }) + orbital sky atmosphere
// - Night-Earth calibrated layers: abyssal oceans (#050914), slate land (#12213D),
//   crisp national borders (#38BDF8 @ 0.35), subtle regional borders
// - 3 GPU-native GeoJSON layers (hubs-glow, hubs-core, hubs-labels) — ZERO DOM markers
// - Full vector sharpness from zoom 1.3 to 12, ResizeObserver & clean cleanup
// ============================================================================

import React, { useEffect, useRef, useMemo } from 'react';
import {
    Map as MapLibreMap,
    GeoJSONSource,
    MapLayerMouseEvent,
    setWorkerUrl
} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Minus, RotateCcw, Globe } from 'lucide-react';
import { GlobalHub } from '../../types/atlas';
import { UNIQUE_COUNTRIES_COUNT } from '../../data/globalHubs';

// Guarantee MapLibre Web Worker loads cleanly in both Vite dev & Vercel production builds
if (typeof window !== 'undefined' && maplibreWorkerUrl) {
    setWorkerUrl(maplibreWorkerUrl);
}

interface Mapbox3DGlobeProps {
    hubs: GlobalHub[];
    onSelectHub: (hub: GlobalHub) => void;
    isHidden: boolean;
}

const CARTO_DARK_MATTER_STYLE =
    'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function buildHubsGeoJSON(hubs: GlobalHub[]) {
    return {
        type: 'FeatureCollection' as const,
        features: hubs.map((h) => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [h.lng, h.lat] as [number, number]
            },
            properties: {
                id: h.id,
                city: h.city,
                countryName: h.countryName,
                iso2: h.iso2,
                flag: h.flag,
                symbol: h.primaryIndex.symbol,
                isFlagship: h.isFlagship ? 1 : 0
            }
        }))
    };
}

export const Mapbox3DGlobe: React.FC<Mapbox3DGlobeProps> = React.memo(
    ({ hubs, onSelectHub, isHidden }) => {
        const containerRef = useRef<HTMLDivElement | null>(null);
        const mapRef = useRef<MapLibreMap | null>(null);
        const isStyleLoadedRef = useRef<boolean>(false);

        const hubsByIdRef = useRef<Map<string, GlobalHub>>(new Map());
        const onSelectHubRef = useRef(onSelectHub);
        onSelectHubRef.current = onSelectHub;

        const geojsonData = useMemo(() => buildHubsGeoJSON(hubs), [hubs]);
        const latestGeojsonRef = useRef(geojsonData);
        latestGeojsonRef.current = geojsonData;

        useEffect(() => {
            const lookup = new Map<string, GlobalHub>();
            hubs.forEach((h) => lookup.set(h.id, h));
            hubsByIdRef.current = lookup;
        }, [hubs]);

        // Deterministic deep space starfield behind the 3D sphere
        const spaceStars = useMemo(() => {
            return Array.from({ length: 64 }).map((_, i) => ({
                id: i,
                left: `${(i * 37.3 + 4) % 98}%`,
                top: `${(i * 61.7 + 6) % 96}%`,
                size: i % 5 === 0 ? 2 : 1.2,
                opacity: 0.18 + (i % 4) * 0.17
            }));
        }, []);

        // Initialize MapLibre GL JS 3D Globe once
        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const map = new MapLibreMap({
                container,
                style: CARTO_DARK_MATTER_STYLE,
                center: [12, 25],
                zoom: 1.85,
                minZoom: 1.3,
                maxZoom: 12,
                attributionControl: false
            });

            mapRef.current = map;
            map.getCanvas().style.cursor = 'grab';

            map.on('style.load', () => {
                isStyleLoadedRef.current = true;

                // 1. Activate Native 3D Spherical Globe Projection & Orbital Atmosphere
                try {
                    map.setProjection({ type: 'globe' });
                } catch {
                    /* projection fallback */
                }

                try {
                    map.setSky({
                        'sky-color': '#03060E',
                        'sky-horizon-blend': 0.5,
                        'horizon-color': '#2563EB',
                        'horizon-fog-blend': 0.4,
                        'fog-color': '#0B1733',
                        'fog-ground-blend': 0.15,
                        'atmosphere-blend': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0,
                            0.85,
                            5,
                            0.45,
                            7,
                            0
                        ]
                    });
                } catch {
                    /* sky fallback */
                }

                // 2. Customize Carto Dark Matter Vector Layers for Night-Earth from Space
                const styleLayers = map.getStyle()?.layers || [];
                for (const layer of styleLayers) {
                    const id = layer.id;
                    try {
                        if (layer.type === 'background') {
                            map.setPaintProperty(id, 'background-color', '#12213D');
                        } else if (
                            (id === 'landcover' ||
                                id === 'landuse' ||
                                id === 'landuse_residential' ||
                                id === 'park_national_park' ||
                                id === 'park_nature_reserve') &&
                            layer.type === 'fill'
                        ) {
                            map.setPaintProperty(id, 'fill-color', '#12213D');
                        } else if (
                            (id === 'water' || id === 'water_shadow') &&
                            layer.type === 'fill'
                        ) {
                            map.setPaintProperty(id, 'fill-color', '#050914');
                        } else if (id === 'waterway' && layer.type === 'line') {
                            map.setPaintProperty(id, 'line-color', '#09142A');
                        } else if (id === 'boundary_country_inner' && layer.type === 'line') {
                            map.setPaintProperty(id, 'line-color', '#38BDF8');
                            map.setPaintProperty(id, 'line-opacity', 0.35);
                        } else if (id === 'boundary_country_outline' && layer.type === 'line') {
                            map.setPaintProperty(id, 'line-color', '#081226');
                            map.setPaintProperty(id, 'line-opacity', 0.45);
                        } else if (
                            (id === 'boundary_state' || id === 'boundary_county') &&
                            layer.type === 'line'
                        ) {
                            map.setPaintProperty(id, 'line-color', 'rgba(148, 163, 184, 0.16)');
                        } else if (
                            (id === 'building' || id === 'building-top') &&
                            layer.type === 'fill'
                        ) {
                            map.setPaintProperty(id, 'fill-color', '#1B2E52');
                        }
                    } catch {
                        // Skip layers with incompatible paint expressions
                    }
                }

                // 3. GPU-Native GeoJSON Source + 3 Golden City-Light Layers (ZERO DOM Markers)
                if (!map.getSource('hubs-source')) {
                    map.addSource('hubs-source', {
                        type: 'geojson',
                        data: latestGeojsonRef.current
                    });
                }

                // Layer 1: Warm Golden Outer Glow
                if (!map.getLayer('hubs-glow')) {
                    map.addLayer({
                        id: 'hubs-glow',
                        type: 'circle',
                        source: 'hubs-source',
                        paint: {
                            'circle-color': '#F59E0B',
                            'circle-blur': 1,
                            'circle-opacity': 0.35,
                            'circle-radius': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                1.5,
                                7,
                                5,
                                12,
                                9,
                                17
                            ]
                        }
                    });
                }

                // Layer 2: Crisp Yellow-Gold City Core (3px -> 6.5px)
                if (!map.getLayer('hubs-core')) {
                    map.addLayer({
                        id: 'hubs-core',
                        type: 'circle',
                        source: 'hubs-source',
                        paint: {
                            'circle-color': '#FDE047',
                            'circle-radius': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                1.5,
                                3,
                                5,
                                4.5,
                                9,
                                6.5
                            ],
                            'circle-stroke-width': 1,
                            'circle-stroke-color': '#FEF08A'
                        }
                    });
                }

                // Layer 3: Crisp GPU City Labels (visible from zoom 3.2+)
                if (!map.getLayer('hubs-labels')) {
                    map.addLayer({
                        id: 'hubs-labels',
                        type: 'symbol',
                        source: 'hubs-source',
                        minzoom: 3.2,
                        layout: {
                            'text-field': ['get', 'city'],
                            'text-font': [
                                'Montserrat SemiBold',
                                'Open Sans Bold',
                                'Noto Sans Regular'
                            ],
                            'text-size': 11,
                            'text-offset': [0, 1.15],
                            'text-anchor': 'top',
                            'text-allow-overlap': false
                        },
                        paint: {
                            'text-color': '#FEF08A',
                            'text-halo-color': '#050914',
                            'text-halo-width': 1.5
                        }
                    });
                }
            });

            // Guaranteed GPU Click Handling on hubs-core and hubs-glow
            const handleLayerClick = (e: MapLayerMouseEvent) => {
                const feat = e.features?.[0] as
                    | { properties?: Record<string, unknown> }
                    | undefined;
                const hubId = feat?.properties?.id;
                if (!hubId) return;
                const found = hubsByIdRef.current.get(String(hubId));
                if (found) {
                    onSelectHubRef.current(found);
                }
            };

            const setPointer = () => {
                map.getCanvas().style.cursor = 'pointer';
            };
            const setGrab = () => {
                map.getCanvas().style.cursor = 'grab';
            };

            map.on('click', 'hubs-core', handleLayerClick);
            map.on('click', 'hubs-glow', handleLayerClick);
            map.on('mouseenter', 'hubs-core', setPointer);
            map.on('mouseenter', 'hubs-glow', setPointer);
            map.on('mouseleave', 'hubs-core', setGrab);
            map.on('mouseleave', 'hubs-glow', setGrab);

            // ResizeObserver keeps WebGL canvas razor-sharp on viewport changes
            const ro = new ResizeObserver(() => {
                if (mapRef.current && container.offsetWidth > 0 && container.offsetHeight > 0) {
                    mapRef.current.resize();
                }
            });
            ro.observe(container);

            return () => {
                ro.disconnect();
                isStyleLoadedRef.current = false;
                map.remove();
                mapRef.current = null;
            };
        }, []);

        // Update GPU GeoJSON data in place when continent or search filter changes
        useEffect(() => {
            const map = mapRef.current;
            if (!map || !isStyleLoadedRef.current) return;
            const src = map.getSource('hubs-source') as GeoJSONSource | undefined;
            if (src && typeof src.setData === 'function') {
                src.setData(geojsonData);
            }
        }, [geojsonData]);

        // Realign canvas smoothly when returning from CountryDrilldownDrawer
        useEffect(() => {
            if (!isHidden) {
                const t = setTimeout(() => {
                    mapRef.current?.resize();
                }, 50);
                return () => clearTimeout(t);
            }
        }, [isHidden]);

        const handleZoomIn = () => {
            mapRef.current?.zoomIn({ duration: 280 });
        };

        const handleZoomOut = () => {
            mapRef.current?.zoomOut({ duration: 280 });
        };

        const handleResetGlobalView = () => {
            mapRef.current?.flyTo({
                center: [12, 25],
                zoom: 1.85,
                pitch: 0,
                bearing: 0,
                duration: 850
            });
        };

        return (
            <div
                className={`${isHidden ? 'hidden' : 'block'} relative w-full h-full overflow-hidden`}
                style={{
                    background:
                        'radial-gradient(ellipse at 50% 48%, #071329 0%, #03060E 65%, #020409 100%)'
                }}
            >
                {/* Deep Space Starfield Backdrop */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    {spaceStars.map((st) => (
                        <span
                            key={st.id}
                            className="absolute rounded-full bg-slate-200"
                            style={{
                                left: st.left,
                                top: st.top,
                                width: `${st.size}px`,
                                height: `${st.size}px`,
                                opacity: st.opacity
                            }}
                        />
                    ))}
                </div>

                {/* MapLibre GL JS 3D WebGL Canvas */}
                <div ref={containerRef} className="relative z-10 w-full h-full" />

                {/* Minimalist Bottom-Left Zoom (+ / -) & Reset Global View Controls */}
                <div className="absolute left-3.5 bottom-24 sm:bottom-24 z-30 flex items-center gap-1.5">
                    <div className="flex flex-col gap-1.5">
                        <button
                            type="button"
                            onClick={handleZoomIn}
                            className="w-9 h-9 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.14] hover:border-[#10B981]/70 text-slate-200 hover:text-[#10B981] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                            title="Zoom avanti"
                            aria-label="Zoom avanti"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            className="w-9 h-9 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.14] hover:border-[#10B981]/70 text-slate-200 hover:text-[#10B981] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                            title="Zoom indietro"
                            aria-label="Zoom indietro"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleResetGlobalView}
                        className="self-end h-9 px-3 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.14] hover:border-[#FACC15]/70 text-[10px] font-mono font-bold text-slate-200 hover:text-[#FACC15] flex items-center gap-1.5 backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                        title="Reset Vista Globale"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset Vista Globale</span>
                    </button>
                </div>

                {/* Bottom-Right Orbital Telemetry Badge */}
                <div className="pointer-events-none absolute right-3.5 bottom-24 sm:bottom-24 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#08090C]/85 border border-white/[0.12] backdrop-blur-xl text-[10px] font-mono font-bold text-slate-200 shadow-xl">
                    <Globe className="w-3 h-3 text-[#10B981]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FDE047] shadow-[0_0_8px_#FDE047]" />
                    <span>
                        {UNIQUE_COUNTRIES_COUNT} PAESI · {hubs.length} HUB · GLOBE 3D
                    </span>
                </div>
            </div>
        );
    }
);

Mapbox3DGlobe.displayName = 'Mapbox3DGlobe';
export default Mapbox3DGlobe;
