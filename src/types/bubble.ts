// ============================================================================
// TRADYX TYPE DEFINITIONS - QUASAR BUBBLE (src/types/bubble.ts)
// ============================================================================

export interface BubbleConfig {
    primaryColor: string;     // Hex color (e.g. #00F0FF)
    secondaryColor: string;   // Hex color (e.g. #0047FF)
    speed: number;            // Animation speed multiplier (0.2 to 3.0)
    turbulence: number;       // 3D Noise deformation level (0.0 to 1.0)
    pulseRate: number;        // Pulsation frequency
    glowIntensity: number;    // Bloom / Glassmorphism intensity (0.1 to 2.0)
}

export type BubbleStateCategory = 'PROFESSIONAL_CALM' | 'EUFORIC_GREED' | 'CHAOTIC_LOSS' | 'NEUTRAL';
