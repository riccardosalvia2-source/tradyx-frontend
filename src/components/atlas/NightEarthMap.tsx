// ============================================================================
// TRADYX ATLAS — INTERACTIVE NIGHT-EARTH ORBITAL MAP
// (src/components/atlas/NightEarthMap.tsx)
// High-performance d3-geo + TopoJSON vector map styled as Earth from Space
// at Night: abyssal oceans (#030612), satin slate continents (#111827/#1E293B),
// crisp national borders, atmospheric rim glow, and 115 golden-yellow (#FACC15)
// metropolis city lights with smooth touch/mouse pan, drag & pinch-to-zoom.
// ============================================================================

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { Plus, Minus, RotateCcw, Crosshair } from 'lucide-react';
import { GlobalHub } from '../../types/atlas';
import { getExchangeStatus } from '../../data/globalHubs';

interface NightEarthMapProps {
    hubs: GlobalHub[];
    selectedHubId: string | null;
    onSelectHub: (hub: GlobalHub) => void;
    hideFloatingControls?: boolean;
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 540;
const MIN_SCALE = 1;
const MAX_SCALE = 7.5;

export const NightEarthMap: React.FC<NightEarthMapProps> = ({
    hubs,
    selectedHubId,
    onSelectHub,
    hideFloatingControls = false
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Interactive camera transform (pan + zoom)
    const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({
        x: 0,
        y: 0,
        k: 1.15
    });
    const [hoveredHub, setHoveredHub] = useState<GlobalHub | null>(null);

    // Drag & pinch refs
    const isDraggingRef = useRef(false);
    const dragDistanceRef = useRef(0);
    const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const lastPinchDistRef = useRef<number | null>(null);

    // Precompute Natural Earth projection, sphere outline, graticule, land & national borders
    const { projection, spherePath, graticulePath, landFeatures, borderMeshPath } = useMemo(() => {
        const proj = geoNaturalEarth1()
            .scale(188)
            .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2 + 12]);
        const pathGen = geoPath(proj);

        const topo = countriesAtlas as unknown as Topology<{
            countries: GeometryCollection;
        }>;
        const countriesGeo = feature(topo, topo.objects.countries);
        const bordersGeo = mesh(topo, topo.objects.countries, (a, b) => a !== b);

        return {
            projection: proj,
            spherePath: pathGen({ type: 'Sphere' }) || '',
            graticulePath: pathGen(geoGraticule10()) || '',
            landFeatures: countriesGeo.features.map((f, i) => ({
                id: String(f.id ?? i),
                d: pathGen(f) || ''
            })),
            borderMeshPath: pathGen(bordersGeo) || ''
        };
    }, []);

    // Precompute projected [x, y] coordinates for all 115 financial hubs
    const projectedHubs = useMemo(() => {
        return hubs
            .map((hub) => {
                const coords = projection([hub.lng, hub.lat]);
                if (!coords) return null;
                return { hub, x: coords[0], y: coords[1] };
            })
            .filter(Boolean) as Array<{ hub: GlobalHub; x: number; y: number }>;
    }, [hubs, projection]);

    // Ambient orbital starfield (deterministic positions)
    const orbitalStars = useMemo(() => {
        return Array.from({ length: 68 }).map((_, i) => ({
            id: i,
            x: ((i * 137.5) % MAP_WIDTH),
            y: ((i * 73.1 + 19) % MAP_HEIGHT),
            r: i % 5 === 0 ? 1.25 : 0.75,
            opacity: 0.16 + ((i % 4) * 0.14)
        }));
    }, []);

    const clampTransform = useCallback((x: number, y: number, k: number) => {
        const clampedK = Math.max(MIN_SCALE, Math.min(MAX_SCALE, k));
        const maxPanX = (MAP_WIDTH * (clampedK - 0.65)) / 2;
        const maxPanY = (MAP_HEIGHT * (clampedK - 0.65)) / 2;
        return {
            x: Math.max(-maxPanX, Math.min(maxPanX, x)),
            y: Math.max(-maxPanY, Math.min(maxPanY, y)),
            k: clampedK
        };
    }, []);

    const handleZoomBy = useCallback(
        (factor: number) => {
            setTransform((prev) => clampTransform(prev.x * factor, prev.y * factor, prev.k * factor));
        },
        [clampTransform]
    );

    const handleResetView = useCallback(() => {
        setTransform({ x: 0, y: 0, k: 1.15 });
    }, []);

    const handleWheel = useCallback(
        (e: React.WheelEvent<HTMLDivElement>) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.18 : 0.85;
            setTransform((prev) => clampTransform(prev.x, prev.y, prev.k * factor));
        },
        [clampTransform]
    );

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointersRef.current.size === 1) {
            isDraggingRef.current = true;
            dragDistanceRef.current = 0;
            lastPointerRef.current = { x: e.clientX, y: e.clientY };
            lastPinchDistRef.current = null;
        } else if (activePointersRef.current.size === 2) {
            isDraggingRef.current = false;
            const pts = Array.from(activePointersRef.current.values());
            lastPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!activePointersRef.current.has(e.pointerId)) return;
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Pinch-to-zoom with 2 fingers on touch devices
        if (activePointersRef.current.size === 2) {
            const pts = Array.from(activePointersRef.current.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (lastPinchDistRef.current && lastPinchDistRef.current > 0) {
                const factor = dist / lastPinchDistRef.current;
                setTransform((prev) => clampTransform(prev.x, prev.y, prev.k * factor));
            }
            lastPinchDistRef.current = dist;
            return;
        }

        if (!isDraggingRef.current) return;

        const rect = containerRef.current?.getBoundingClientRect();
        const scaleX = rect ? MAP_WIDTH / rect.width : 1;
        const scaleY = rect ? MAP_HEIGHT / rect.height : 1;

        const dx = (e.clientX - lastPointerRef.current.x) * scaleX;
        const dy = (e.clientY - lastPointerRef.current.y) * scaleY;

        dragDistanceRef.current += Math.hypot(
            e.clientX - lastPointerRef.current.x,
            e.clientY - lastPointerRef.current.y
        );
        lastPointerRef.current = { x: e.clientX, y: e.clientY };

        setTransform((prev) => clampTransform(prev.x + dx, prev.y + dy, prev.k));
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        activePointersRef.current.delete(e.pointerId);
        if (activePointersRef.current.size < 2) {
            lastPinchDistRef.current = null;
        }
        if (activePointersRef.current.size === 0) {
            isDraggingRef.current = false;
        }
    };

    const handleHubTap = (hub: GlobalHub, e: React.MouseEvent) => {
        e.stopPropagation();
        if (dragDistanceRef.current > 10) return; // Ignore taps after panning
        onSelectHub(hub);
    };

    const hoveredStatus = hoveredHub ? getExchangeStatus(hoveredHub) : null;

    return (
        <div
            ref={containerRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full h-full overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
            style={{
                background:
                    'radial-gradient(ellipse at 50% 48%, #071226 0%, #030612 64%, #010308 100%)'
            }}
        >
            {/* Orbital Night-Earth SVG Canvas */}
            <svg
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full block"
            >
                <defs>
                    {/* Deep Ocean Sphere Fill */}
                    <radialGradient id="atlasOceanGrad" cx="50%" cy="46%" r="58%">
                        <stop offset="0%" stopColor="#09152B" />
                        <stop offset="55%" stopColor="#040A18" />
                        <stop offset="100%" stopColor="#02050D" />
                    </radialGradient>

                    {/* Satin Midnight Slate Continents */}
                    <linearGradient id="atlasLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1E293B" />
                        <stop offset="50%" stopColor="#152033" />
                        <stop offset="100%" stopColor="#111827" />
                    </linearGradient>

                    {/* Atmospheric Orbital Horizon Rim Glow */}
                    <filter id="atlasAtmoGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Warm Golden-Yellow City Lights Glow (#FACC15) */}
                    <radialGradient id="cityGoldHalo" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
                        <stop offset="35%" stopColor="#FACC15" stopOpacity="0.65" />
                        <stop offset="70%" stopColor="#EAB308" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="citySelectedHalo" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#6EE7B7" stopOpacity="1" />
                        <stop offset="45%" stopColor="#10B981" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Deep Space Subtle Starfield */}
                <g className="pointer-events-none">
                    {orbitalStars.map((st) => (
                        <circle
                            key={st.id}
                            cx={st.x}
                            cy={st.y}
                            r={st.r}
                            fill="#CBD5E1"
                            opacity={st.opacity}
                        />
                    ))}
                </g>

                {/* Pan & Zoom Transformed Orbital Globe Group */}
                <g
                    transform={`translate(${MAP_WIDTH / 2 + transform.x}, ${
                        MAP_HEIGHT / 2 + transform.y
                    }) scale(${transform.k}) translate(${-MAP_WIDTH / 2}, ${-MAP_HEIGHT / 2})`}
                >
                    {/* Atmospheric Rim Aura around Earth */}
                    <path
                        d={spherePath}
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.28)"
                        strokeWidth={3.2 / Math.sqrt(transform.k)}
                        filter="url(#atlasAtmoGlow)"
                    />

                    {/* Abyssal Ocean Base */}
                    <path
                        d={spherePath}
                        fill="url(#atlasOceanGrad)"
                        stroke="rgba(16, 185, 129, 0.22)"
                        strokeWidth={1.1 / Math.sqrt(transform.k)}
                    />

                    {/* Subtle Latitude / Longitude Graticule */}
                    <path
                        d={graticulePath}
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.06)"
                        strokeWidth={0.6 / Math.sqrt(transform.k)}
                    />

                    {/* Landmasses (Clearly Visible Satin Slate #111827 / #1E293B) */}
                    <g>
                        {landFeatures.map((land) => (
                            <path
                                key={land.id}
                                d={land.d}
                                fill="url(#atlasLandGrad)"
                                stroke="rgba(148, 163, 184, 0.22)"
                                strokeWidth={0.55 / Math.sqrt(transform.k)}
                            />
                        ))}
                    </g>

                    {/* Crisp Internal National Borders */}
                    <path
                        d={borderMeshPath}
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.28)"
                        strokeWidth={0.5 / Math.sqrt(transform.k)}
                        strokeLinejoin="round"
                    />

                    {/* 115 Glowing Golden-Yellow Metropolis City Lights (#FACC15) */}
                    <g>
                        {projectedHubs.map(({ hub, x, y }) => {
                            const isSelected = hub.id === selectedHubId;
                            const isHovered = hoveredHub?.id === hub.id;
                            const invSqrtK = 1 / Math.sqrt(transform.k);
                            const coreR = (isSelected ? 4.2 : hub.isFlagship ? 3.1 : 2.1) * invSqrtK;
                            const haloR = (isSelected ? 15 : hub.isFlagship ? 10.5 : 7.2) * invSqrtK;
                            const hitR = Math.max(8, 11 * invSqrtK);

                            return (
                                <g
                                    key={hub.id}
                                    transform={`translate(${x}, ${y})`}
                                    className="cursor-pointer"
                                    onClick={(e) => handleHubTap(hub, e)}
                                    onMouseEnter={() => setHoveredHub(hub)}
                                    onMouseLeave={() =>
                                        setHoveredHub((prev) => (prev?.id === hub.id ? null : prev))
                                    }
                                >
                                    {/* Outer Warm Golden Glow Halo */}
                                    <circle
                                        r={haloR}
                                        fill={
                                            isSelected
                                                ? 'url(#citySelectedHalo)'
                                                : 'url(#cityGoldHalo)'
                                        }
                                        className={hub.isFlagship || isSelected ? 'animate-pulse' : ''}
                                        style={{
                                            animationDuration: hub.isFlagship ? '3.4s' : '4.5s'
                                        }}
                                    />

                                    {/* Subtle Pulse Ring on Flagship or Hovered Hubs */}
                                    {(isHovered || isSelected) && (
                                        <circle
                                            r={(isSelected ? 9 : 7.5) * invSqrtK}
                                            fill="none"
                                            stroke={isSelected ? '#10B981' : '#FDE047'}
                                            strokeWidth={0.9 * invSqrtK}
                                            opacity={0.85}
                                        />
                                    )}

                                    {/* Bright Warm City Core */}
                                    <circle
                                        r={coreR}
                                        fill={isSelected ? '#10B981' : '#FACC15'}
                                        stroke={isSelected ? '#ECFDF5' : '#FEF9C3'}
                                        strokeWidth={0.6 * invSqrtK}
                                    />

                                    {/* City label visible when zoomed in or flagship hovered */}
                                    {(transform.k >= 2.6 || isHovered || isSelected) && (
                                        <text
                                            x={coreR + 3.2 * invSqrtK}
                                            y={2.5 * invSqrtK}
                                            fill={isSelected ? '#6EE7B7' : '#FEF08A'}
                                            fontSize={7.8 * invSqrtK}
                                            fontFamily="JetBrains Mono, monospace"
                                            fontWeight={700}
                                            className="pointer-events-none"
                                            style={{
                                                textShadow: '0 1px 4px rgba(0,0,0,0.95)'
                                            }}
                                        >
                                            {hub.city}
                                        </text>
                                    )}

                                    {/* Generous Invisible Touch Hit Area */}
                                    <circle r={hitR} fill="transparent" />
                                </g>
                            );
                        })}
                    </g>
                </g>
            </svg>

            {/* Desktop Hover Preview Tooltip (Hidden when country drawer is open) */}
            {!hideFloatingControls && hoveredHub && hoveredStatus && (
                <div className="hidden sm:flex pointer-events-none absolute bottom-24 left-4 z-30 items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#08090C]/90 border border-[#FACC15]/35 backdrop-blur-xl shadow-2xl">
                    <span className="text-xl">{hoveredHub.flag}</span>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">
                                {hoveredHub.countryName}
                            </span>
                            <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                                    hoveredStatus.isOpen
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                            >
                                {hoveredStatus.label} • {hoveredStatus.localTimeStr}
                            </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 flex items-center gap-2">
                            <span>{hoveredHub.city}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[#FACC15] font-bold">
                                {hoveredHub.primaryIndex.symbol}{' '}
                                {hoveredHub.primaryIndex.basePrice.toLocaleString('it-IT')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Map Zoom & Reset Controls (Auto-hidden when country drawer is open) */}
            {!hideFloatingControls && (
                <div className="absolute right-3.5 bottom-24 sm:bottom-24 z-30 flex flex-col gap-1.5">
                    <button
                        type="button"
                        onClick={() => handleZoomBy(1.35)}
                        className="w-10 h-10 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.12] hover:border-[#10B981]/60 text-slate-200 hover:text-[#10B981] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                        title="Zoom avanti"
                        aria-label="Zoom avanti"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleZoomBy(0.74)}
                        className="w-10 h-10 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.12] hover:border-[#10B981]/60 text-slate-200 hover:text-[#10B981] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                        title="Zoom indietro"
                        aria-label="Zoom indietro"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleResetView}
                        className="w-10 h-10 rounded-xl bg-[#08090C]/85 hover:bg-[#111827] border border-white/[0.12] hover:border-[#FACC15]/60 text-slate-300 hover:text-[#FACC15] flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition cursor-pointer"
                        title="Ripristina vista orbitale"
                        aria-label="Ripristina vista orbitale"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Bottom-Left Subtle Legend (Auto-hidden when country drawer is open) */}
            {!hideFloatingControls && (
                <div className="absolute left-3.5 bottom-24 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#08090C]/80 border border-white/[0.08] backdrop-blur-md text-[10px] font-mono text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-[#FACC15] shadow-[0_0_8px_#FACC15]" />
                    <span>Tocca una luce città ({hubs.length} hub)</span>
                    <Crosshair className="w-3 h-3 text-slate-500 hidden sm:inline" />
                </div>
            )}
        </div>
    );
};

export default NightEarthMap;
