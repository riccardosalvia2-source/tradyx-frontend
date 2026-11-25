// ============================================================================
// TRADYX ATLAS — MAPBOX GL JS 3D VECTOR GLOBE WITH GPU-NATIVE CITY LIGHTS
// (src/components/atlas/Mapbox3DGlobe.tsx)
// - Native Mapbox 3D Globe projection (zero blur at any zoom level 1.3 -> 12)
// - Custom Night-Earth orbital atmosphere fog, abyssal oceans (#050914),
//   satin slate landmasses (#101B33), crisp national & regional borders
// - 3 GPU-native GeoJSON layers (hubs-glow, hubs-core, hubs-labels)
// - ZERO HTML DOM markers (60fps, zero z-index bleed)
// - ResizeObserver + clean map.remove() lifecycle + auto-resize on reappear
// ============================================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Plus, Minus, RotateCcw, AlertTriangle, Globe } from 'lucide-react';
import { GlobalHub } from '../../types/atlas';
import { UNIQUE_COUNTRIES_COUNT } from '../../data/globalHubs';

interface Mapbox3DGlobeProps {
    hubs: GlobalHub[];
    onSelectHub: (hub: GlobalHub) => void;
    isHidden: boolean;
}

const envMeta = (import.meta as any).env || {};
const MAPBOX_TOKEN: string =
    envMeta.VITE_MAPBOX_TOKEN || envMeta.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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
        const mapRef = useRef<mapboxgl.Map | null>(null);
        const isStyleLoadedRef = useRef<boolean>(false);
        const [mapError, setMapError] = useState<string | null>(null);

        // Stable refs so Mapbox event listeners never recreate the map
        const hubsByIdRef = useRef<Map<string, GlobalHub>>(new Map());
        const onSelectHubRef = useRef(onSelectHub);
        onSelectHubRef.current = onSelectHub;

        const geojsonData = useMemo(() => buildHubsGeoJSON(hubs), [hubs]);

        useEffect(() => {
            const m = new Map<string, GlobalHub>();
            hubs.forEach((h) => m.set(h.id, h));
            hubsByIdRef.current = m;
        }, [hubs]);

        // Initialize Mapbox GL JS 3D Globe once
        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            if (!MAPBOX_TOKEN) {
                setMapError('Token Mapbox non configurato (VITE_MAPBOX_TOKEN).');
                return;
            }

            mapboxgl.accessToken = MAPBOX_TOKEN;

            let map: mapboxgl.Map;
            try {
                map = new mapboxgl.Map({
                    container,
                    style: 'mapbox://styles/mapbox/dark-v11',
                    projection: 'globe',
                    center: [12, 25],
                    zoom: 1.85,
                    minZoom: 1.3,
                    maxZoom: 12,
                    antialias: true,
                    attributionControl: false
                });
            } catch (err: any) {
                setMapError(err?.message || 'Impossibile inizializzare il contesto WebGL Mapbox.');
                return;
            }

            mapRef.current = map;
            map.getCanvas().style.cursor = 'grab';

            map.on('style.load', () => {
                isStyleLoadedRef.current = true;

                // 1. Orbital Space Atmosphere & Stars
                try {
                    map.setFog({
                        color: 'rgb(16, 32, 68)',
                        'high-color': 'rgb(36, 99, 235)',
                        'horizon-blend': 0.08,
                        'space-color': 'rgb(3, 6, 14)',
                        'star-intensity': 0.8
                    });
                } catch {
                    /* ignore fog fallback */
                }

                // 2. Customize Night-Earth Vector Layers (Abyssal Oceans + Satin Slate Land + Crisp Borders)
                const styleLayers = map.getStyle()?.layers || [];
                for (const layer of styleLayers) {
                    const id = layer.id;
                    try {
                        if (layer.type === 'background') {
                            map.setPaintProperty(id, 'background-color', '#101B33');
                        } else if (id === 'land' && layer.type === 'fill') {
                            map.setPaintProperty(id, 'fill-color', '#101B33');
                        } else if (
                            (id === 'water' || id.startsWith('water-')) &&
                            layer.type === 'fill'
                        ) {
                            map.setPaintProperty(id, 'fill-color', '#050914');
                        } else if (
                            id.includes('admin-0-boundary') &&
                            layer.type === 'line'
                        ) {
                            map.setPaintProperty(id, 'line-color', 'rgba(148, 163, 184, 0.35)');
                        } else if (
                            id.includes('admin-1-boundary') &&
                            layer.type === 'line'
                        ) {
                            map.setPaintProperty(id, 'line-color', 'rgba(148, 163, 184, 0.14)');
                        }
                    } catch {
                        // Skip layers that do not support the specific paint property
                    }
                }

                // 3. Add GPU-Native GeoJSON Source & 3 City-Light Layers (ZERO DOM Markers)
                if (!map.getSource('hubs-source')) {
                    map.addSource('hubs-source', {
                        type: 'geojson',
                        data: geojsonData
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
                            'circle-blur': 1.2,
                            'circle-opacity': 0.32,
                            'circle-radius': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                1.5,
                                6,
                                5,
                                11,
                                9,
                                16
                            ]
                        }
                    });
                }

                // Layer 2: Crisp Bright Yellow-Gold City Core
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
                                2.5,
                                5,
                                4,
                                9,
                                6
                            ],
                            'circle-stroke-width': 1,
                            'circle-stroke-color': 'rgba(254, 240, 138, 0.75)'
                        }
                    });
                }

                // Layer 3: Crisp GPU Symbol City Labels (minzoom 3.2)
                if (!map.getLayer('hubs-labels')) {
                    map.addLayer({
                        id: 'hubs-labels',
                        type: 'symbol',
                        source: 'hubs-source',
                        minzoom: 3.2,
                        layout: {
                            'text-field': ['get', 'city'],
                            'text-size': 11,
                            'text-offset': [0, 1.1],
                            'text-anchor': 'top',
                            'text-allow-overlap': false,
                            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold']
                        },
                        paint: {
                            'text-color': '#FEF08A',
                            'text-halo-color': '#050914',
                            'text-halo-width': 1.5
                        }
                    });
                }
            });

            // Guaranteed GPU Click Handling on both hubs-core and hubs-glow
            const handleLayerClick = (e: mapboxgl.MapLayerMouseEvent) => {
                const feat = e.features?.[0] as { properties?: Record<string, unknown> } | undefined;
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

            map.on('error', (ev) => {
                const msg = (ev?.error as any)?.message || '';
                if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('401')) {
                    setMapError('Token Mapbox non valido o scaduto.');
                }
            });

            // Smooth canvas resizing via ResizeObserver
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

        // Update GPU GeoJSON data in place when continent filter changes (zero map rebuild)
        useEffect(() => {
            const map = mapRef.current;
            if (!map || !isStyleLoadedRef.current) return;
            const src = map.getSource('hubs-source') as mapboxgl.GeoJSONSource | undefined;
            if (src) {
                src.setData(geojsonData);
            }
        }, [geojsonData]);

        // Resize canvas smoothly when returning from Country Panel (display: none -> block)
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
                style={{ display: isHidden ? 'none' : 'block' }}
                className="relative w-full h-full bg-[#03060E] overflow-hidden"
            >
                {/* Mapbox GL JS WebGL Canvas Container */}
                <div ref={containerRef} className="w-full h-full" />

                {/* Token Missing / WebGL Fallback Overlay (App Search & Countries remain 100% usable) */}
                {mapError && (
                    <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-20">
                        <div className="max-w-sm p-5 rounded-2xl bg-[#08090C]/90 border border-amber-500/35 backdrop-blur-xl text-center space-y-2.5 pointer-events-auto shadow-2xl">
                            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <h3 className="text-xs font-mono font-black uppercase text-white">
                                Mapbox 3D Globe Ready
                            </h3>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                {mapError} Configura{' '}
                                <code className="text-[#10B981]">VITE_MAPBOX_TOKEN</code> su Vercel
                                per il globo 3D vettoriale. Puoi comunque cercare e aprire tutti i{' '}
                                <strong className="text-white">{hubs.length} hub</strong> dalla
                                barra di ricerca in alto.
                            </p>
                        </div>
                    </div>
                )}

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
                        {UNIQUE_COUNTRIES_COUNT} PAESI · {hubs.length} HUB · MAPBOX 3D
                    </span>
                </div>
            </div>
        );
    }
);

Mapbox3DGlobe.displayName = 'Mapbox3DGlobe';
export default Mapbox3DGlobe;
