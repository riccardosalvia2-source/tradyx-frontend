// ============================================================================
// TRADYX ATLAS — PHOTOREALISTIC 3D NIGHT-EARTH ORBITAL GLOBE
// (src/components/atlas/PhotorealisticEarthGlobe.tsx)
// Powered by react-globe.gl + Three.js PBR Materials:
// - NASA Earth-at-Night satellite texture + 3D topography bump (bumpScale 3.5)
// - Specular ocean reflections + ISS-style orbital blue atmosphere glow
// - Vector country borders (GeoJSON + offline TopoJSON fallback) with hover glow
// - 137 golden-yellow (#FACC15) city lights via htmlElementsData + ringsData
//   + pointsData dual hit-testing for 100% guaranteed click/tap on mobile & desktop
// ============================================================================

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { GlobalHub } from '../../types/atlas';
import { UNIQUE_COUNTRIES_COUNT } from '../../data/globalHubs';

interface PhotorealisticEarthGlobeProps {
    hubs: GlobalHub[];
    selectedHub: GlobalHub | null;
    onSelectHub: (hub: GlobalHub) => void;
    hideFloatingControls?: boolean;
}

const EARTH_NIGHT_TEX = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
const EARTH_BUMP_TEX = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const EARTH_WATER_TEX = 'https://unpkg.com/three-globe/example/img/earth-water.png';
const NIGHT_SKY_TEX = 'https://unpkg.com/three-globe/example/img/night-sky.png';
const COUNTRIES_GEOJSON_URL =
    'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

export const PhotorealisticEarthGlobe: React.FC<PhotorealisticEarthGlobeProps> = ({
    hubs,
    selectedHub,
    onSelectHub,
    hideFloatingControls = false
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const globeRef = useRef<GlobeMethods | undefined>(undefined);
    const lastTapSelectRef = useRef<number>(0);

    const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768
    }));
    const [hoveredPolygon, setHoveredPolygon] = useState<object | null>(null);
    const [isCloseZoom, setIsCloseZoom] = useState<boolean>(false);

    // Offline immediate country borders from world-atlas TopoJSON, upgraded with GeoJSON if reachable
    const offlineCountryPolygons = useMemo(() => {
        try {
            const topo = countriesAtlas as unknown as Topology<{
                countries: GeometryCollection;
            }>;
            const geo = feature(topo, topo.objects.countries);
            return geo.features as object[];
        } catch {
            return [];
        }
    }, []);

    const [countryPolygons, setCountryPolygons] = useState<object[]>(offlineCountryPolygons);

    // Fetch rich GeoJSON borders with ISO codes from react-globe.gl dataset (non-blocking)
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);

        fetch(COUNTRIES_GEOJSON_URL, { signal: controller.signal })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (isMounted && data?.features && Array.isArray(data.features)) {
                    setCountryPolygons(data.features);
                }
            })
            .catch(() => {
                // Keep bundled offline TopoJSON borders seamlessly
            })
            .finally(() => clearTimeout(timer));

        return () => {
            isMounted = false;
            controller.abort();
            clearTimeout(timer);
        };
    }, []);

    // Measure container dynamically for full-bleed mobile/desktop responsiveness
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateSize = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setDimensions({
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                });
            }
        };

        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(el);
        window.addEventListener('resize', updateSize);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    // Realistic PBR Globe Material (3D Topography Bump + Specular Ocean Water Map)
    const globeMaterial = useMemo(() => {
        const mat = new THREE.MeshPhongMaterial({
            color: new THREE.Color('#ffffff'),
            emissive: new THREE.Color('#091326'),
            emissiveIntensity: 0.28,
            specular: new THREE.Color('#3b82f6'),
            shininess: 18,
            bumpScale: 3.5
        });

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
            EARTH_WATER_TEX,
            (waterTex) => {
                mat.specularMap = waterTex;
                mat.needsUpdate = true;
            },
            undefined,
            () => {
                /* ignore if offline */
            }
        );

        return mat;
    }, []);

    // Dispose custom Three.js material on unmount
    useEffect(() => {
        return () => {
            globeMaterial.dispose();
        };
    }, [globeMaterial]);

    // Configure OrbitControls inertia, zoom bounds, auto-rotation, and ISS orbital lighting
    const handleGlobeReady = useCallback(() => {
        const globe = globeRef.current;
        if (!globe) return;

        const controls = globe.controls();
        if (controls) {
            controls.enableDamping = true;
            controls.dampingFactor = 0.07;
            controls.enableZoom = true;
            controls.enablePan = false;
            controls.minDistance = 125;
            controls.maxDistance = 500;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.3;

            // Stop auto-rotation immediately on first user interaction & monitor close zoom
            const onControlStart = () => {
                controls.autoRotate = false;
            };
            const onControlChange = () => {
                const pov = globe.pointOfView();
                if (pov && typeof pov.altitude === 'number') {
                    setIsCloseZoom((prev) => {
                        const next = pov.altitude < 1.65;
                        return prev === next ? prev : next;
                    });
                }
            };
            controls.addEventListener('start', onControlStart);
            controls.addEventListener('change', onControlChange);
        }

        // Initial ISS-style centered Europe/Atlantic/Americas view
        globe.pointOfView({ lat: 24, lng: 12, altitude: 2.35 }, 0);

        // Soft directional space light illuminating the Earth's limb
        const scene = globe.scene();
        if (scene) {
            const existingRim = scene.getObjectByName('atlas-orbital-rim-light');
            if (!existingRim) {
                const dirLight = new THREE.DirectionalLight('#93c5fd', 1.35);
                dirLight.name = 'atlas-orbital-rim-light';
                dirLight.position.set(-220, 140, 260);
                scene.add(dirLight);

                const ambient = new THREE.AmbientLight('#cbd5e1', 0.55);
                ambient.name = 'atlas-orbital-ambient-light';
                scene.add(ambient);
            }
        }
    }, []);

    // Fly camera smoothly to selected hub ({ lat, lng, altitude: 1.4 }, 700ms)
    useEffect(() => {
        const globe = globeRef.current;
        if (!globe || !selectedHub) return;

        const controls = globe.controls();
        if (controls) {
            controls.autoRotate = false;
        }
        globe.pointOfView(
            {
                lat: selectedHub.lat,
                lng: selectedHub.lng,
                altitude: 1.4
            },
            700
        );
    }, [selectedHub]);

    // Deduplicated guaranteed hub selection handler
    const triggerSelectHub = useCallback(
        (hub: GlobalHub) => {
            const now = Date.now();
            if (now - lastTapSelectRef.current < 220) return;
            lastTapSelectRef.current = now;
            const controls = globeRef.current?.controls();
            if (controls) controls.autoRotate = false;
            onSelectHub(hub);
        },
        [onSelectHub]
    );

    // Pulsing rings on flagship hubs + selected hub
    const ringsData = useMemo(() => {
        return hubs
            .filter((h) => h.isFlagship || h.id === selectedHub?.id)
            .map((h) => ({
                lat: h.lat,
                lng: h.lng,
                isSelected: h.id === selectedHub?.id,
                maxR: h.id === selectedHub?.id ? 5.2 : 2.6,
                propagationSpeed: h.id === selectedHub?.id ? 2.4 : 1.1,
                repeatPeriod: h.id === selectedHub?.id ? 950 : 2100
            }));
    }, [hubs, selectedHub]);

    // Render warm golden-yellow HTML city light markers anchored to 3D globe coordinates
    const createHtmlMarker = useCallback(
        (d: object) => {
            const hub = d as GlobalHub;
            const isSelected = hub.id === selectedHub?.id;
            const isFlagship = Boolean(hub.isFlagship);

            const wrapper = document.createElement('div');
            wrapper.className =
                'w-6 h-6 -ml-3 -mt-3 cursor-pointer flex items-center justify-center relative group';
            wrapper.style.pointerEvents = 'auto';
            wrapper.style.touchAction = 'manipulation';
            wrapper.title = `${hub.flag} ${hub.countryName} — ${hub.city} (${hub.primaryIndex.symbol})`;

            // Glowing core dot
            const dot = document.createElement('span');
            const dotSize = isSelected ? 10 : isFlagship ? 7 : 5;
            dot.style.width = `${dotSize}px`;
            dot.style.height = `${dotSize}px`;
            dot.style.borderRadius = '9999px';
            dot.style.display = 'block';
            dot.style.transition = 'transform 160ms ease';
            dot.style.background = isSelected
                ? 'radial-gradient(circle, #ECFDF5 0%, #10B981 65%, #059669 100%)'
                : 'radial-gradient(circle, #FEF08A 0%, #FACC15 65%, #EAB308 100%)';
            dot.style.boxShadow = isSelected
                ? '0 0 14px 5px rgba(16, 185, 129, 0.85)'
                : isFlagship
                ? '0 0 12px 4px rgba(250, 204, 21, 0.72)'
                : '0 0 8px 2px rgba(250, 204, 21, 0.55)';
            wrapper.appendChild(dot);

            // City name label visible when zoomed in or selected
            if (isSelected || (isCloseZoom && isFlagship) || isCloseZoom) {
                const label = document.createElement('span');
                label.textContent = hub.city;
                label.style.position = 'absolute';
                label.style.left = '18px';
                label.style.top = '50%';
                label.style.transform = 'translateY(-50%)';
                label.style.whiteSpace = 'nowrap';
                label.style.fontSize = isSelected ? '10px' : '9px';
                label.style.fontWeight = '800';
                label.style.fontFamily = 'JetBrains Mono, ui-monospace, monospace';
                label.style.color = isSelected ? '#6EE7B7' : '#FEF08A';
                label.style.textShadow = '0 1px 6px rgba(0,0,0,0.95)';
                label.style.pointerEvents = 'none';
                wrapper.appendChild(label);
            }

            // Hover zoom effect
            wrapper.addEventListener('mouseenter', () => {
                dot.style.transform = 'scale(1.55)';
            });
            wrapper.addEventListener('mouseleave', () => {
                dot.style.transform = 'scale(1)';
            });

            // Guaranteed click/tap handling that NEVER gets swallowed by OrbitControls drag
            let downX = 0;
            let downY = 0;
            wrapper.addEventListener('pointerdown', (e) => {
                downX = e.clientX;
                downY = e.clientY;
                const controls = globeRef.current?.controls();
                if (controls) controls.autoRotate = false;
            });
            wrapper.addEventListener('pointerup', (e) => {
                const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
                if (moved < 10) {
                    e.stopPropagation();
                    triggerSelectHub(hub);
                }
            });
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerSelectHub(hub);
            });

            return wrapper;
        },
        [selectedHub, isCloseZoom, triggerSelectHub]
    );

    // Optional: Clicking a country polygon opens its main hub if ISO matches
    const handlePolygonClick = useCallback(
        (poly: object) => {
            const props = (poly as any)?.properties;
            if (!props) return;
            const iso2 = String(props.ISO_A2 || props.iso_a2 || '').toUpperCase();
            const iso3 = String(props.ISO_A3 || props.ADM0_A3 || props.iso_a3 || '').toUpperCase();
            const nameEn = String(props.ADMIN || props.NAME || props.name || '').toLowerCase();

            const matched =
                hubs.find((h) => h.iso2 === iso2 && h.isFlagship) ||
                hubs.find((h) => h.iso2 === iso2) ||
                hubs.find((h) => h.iso3 === iso3) ||
                hubs.find((h) => h.countryNameEn.toLowerCase() === nameEn);

            if (matched) {
                triggerSelectHub(matched);
            }
        },
        [hubs, triggerSelectHub]
    );

    // Zoom & Reset helpers
    const handleZoom = (deltaFactor: number) => {
        const globe = globeRef.current;
        if (!globe) return;
        const pov = globe.pointOfView();
        const nextAlt = Math.max(0.55, Math.min(3.8, (pov.altitude || 2.2) * deltaFactor));
        globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: nextAlt }, 350);
    };

    const handleResetOrbit = () => {
        const globe = globeRef.current;
        if (!globe) return;
        globe.pointOfView({ lat: 24, lng: 12, altitude: 2.35 }, 700);
        const controls = globe.controls();
        if (controls) controls.autoRotate = true;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-[#02040A] overflow-hidden pointer-events-auto select-none"
        >
            {/* 3D Photorealistic WebGL Night-Earth Globe */}
            <Globe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="#02040A"
                backgroundImageUrl={NIGHT_SKY_TEX}
                globeImageUrl={EARTH_NIGHT_TEX}
                bumpImageUrl={EARTH_BUMP_TEX}
                globeMaterial={globeMaterial}
                showAtmosphere={true}
                atmosphereColor="#3b82f6"
                atmosphereAltitude={0.22}
                onGlobeReady={handleGlobeReady}
                /* Crisp Vector Country Borders with Hover Highlight */
                polygonsData={countryPolygons}
                polygonAltitude={(d) => (d === hoveredPolygon ? 0.009 : 0.004)}
                polygonCapColor={(d) =>
                    d === hoveredPolygon ? 'rgba(16, 185, 129, 0.22)' : 'rgba(15, 23, 42, 0.12)'
                }
                polygonSideColor={() => 'rgba(15, 23, 42, 0.06)'}
                polygonStrokeColor={() => 'rgba(148, 163, 184, 0.28)'}
                onPolygonHover={(poly) => setHoveredPolygon(poly || null)}
                onPolygonClick={handlePolygonClick}
                /* Dual Raycast Hit Target Underneath HTML City Lights */
                pointsData={hubs}
                pointLat="lat"
                pointLng="lng"
                pointAltitude={0.012}
                pointRadius={(d) => ((d as GlobalHub).isFlagship ? 0.42 : 0.28)}
                pointColor={(d) =>
                    (d as GlobalHub).id === selectedHub?.id ? '#10B981' : '#FACC15'
                }
                onPointClick={(pt) => triggerSelectHub(pt as GlobalHub)}
                /* Pulsing Orbital Rings for Flagship & Selected Hubs */
                ringsData={ringsData}
                ringLat="lat"
                ringLng="lng"
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                ringColor={(d: any) =>
                    d.isSelected
                        ? (t: number) => `rgba(16, 185, 129, ${Math.max(0, 1 - t)})`
                        : (t: number) => `rgba(250, 204, 21, ${Math.max(0, 0.65 - t * 0.65)})`
                }
                /* Warm Golden-Yellow Glowing HTML City Lights (#FACC15) */
                htmlElementsData={hubs}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={0.016}
                htmlElement={createHtmlMarker}
            />

            {/* Floating Orbital Zoom & Reset Controls (Auto-hidden when country drawer is open) */}
            {!hideFloatingControls && (
                <div className="absolute right-3.5 bottom-32 sm:bottom-28 z-30 flex flex-col gap-1.5 pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => handleZoom(0.72)}
                        className="w-10 h-10 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.14] hover:border-[#10B981]/70 text-slate-200 hover:text-[#10B981] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                        title="Zoom avanti"
                        aria-label="Zoom avanti"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleZoom(1.36)}
                        className="w-10 h-10 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.14] hover:border-[#10B981]/70 text-slate-200 hover:text-[#10B981] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                        title="Zoom indietro"
                        aria-label="Zoom indietro"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleResetOrbit}
                        className="w-10 h-10 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.14] hover:border-[#FACC15]/70 text-slate-300 hover:text-[#FACC15] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                        title="Ripristina orbita"
                        aria-label="Ripristina orbita"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Bottom-Right Info Badge: 110 PAESI · 137 HUB · TERRA DI NOTTE */}
            {!hideFloatingControls && (
                <div className="pointer-events-none absolute right-3.5 bottom-20 sm:bottom-22 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#08090C]/85 border border-white/[0.12] backdrop-blur-xl text-[10px] font-mono font-bold text-slate-200 shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-[#FACC15] shadow-[0_0_8px_#FACC15] animate-pulse" />
                    <span>
                        {UNIQUE_COUNTRIES_COUNT} PAESI · {hubs.length} HUB · TERRA DI NOTTE
                    </span>
                </div>
            )}
        </div>
    );
};

export default PhotorealisticEarthGlobe;
