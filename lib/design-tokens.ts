/**
 * ChecklyTool Design System Tokens
 *
 * Единая система дизайна, вдохновленная Apple HIG и Google Material Design 3
 * Все компоненты приложения должны использовать только эти токены
 */

// ============================================================================
// ICON SIZES (только 3 размера)
// ============================================================================

export const iconSizes = {
	sm: 16, // w-4 h-4
	md: 24, // w-6 h-6
	lg: 32, // w-8 h-8
} as const

export type IconSize = keyof typeof iconSizes

// ============================================================================
// SPACING SYSTEM (8pt grid)
// ============================================================================

export const spacing = {
	0: 0,
	1: 4,
	2: 8,
	3: 12,
	4: 16,
	6: 24,
	8: 32,
	12: 48,
	16: 64,
	20: 80,
	24: 96,
} as const

export type Spacing = keyof typeof spacing

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const typography = {
	display: {
		size: 32,
		lineHeight: 40,
		weight: 800,
		letterSpacing: -0.5,
	},
	headline: {
		size: 24,
		lineHeight: 32,
		weight: 700,
		letterSpacing: -0.25,
	},
	title: {
		size: 20,
		lineHeight: 28,
		weight: 600,
		letterSpacing: 0,
	},
	body: {
		size: 16,
		lineHeight: 24,
		weight: 400,
		letterSpacing: 0,
	},
	bodyMedium: {
		size: 16,
		lineHeight: 24,
		weight: 500,
		letterSpacing: 0,
	},
	caption: {
		size: 14,
		lineHeight: 20,
		weight: 400,
		letterSpacing: 0,
	},
	label: {
		size: 12,
		lineHeight: 16,
		weight: 500,
		letterSpacing: 0.5,
	},
} as const

export type TypographyVariant = keyof typeof typography

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	'2xl': 28,
	full: 9999,
} as const

export type BorderRadius = keyof typeof borderRadius

// ============================================================================
// ELEVATION (SHADOWS)
// ============================================================================

export const elevation = {
	none: 'none',
	sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
	xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
	'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const

export type Elevation = keyof typeof elevation

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
	// Primary (Blue)
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
		500: '#096ff5', // Main
		600: '#0757c7',
		700: '#054199',
		800: '#032b6b',
		900: '#02153d',
	},

	// Success (Green)
	success: {
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#22c55e', // Main
		600: '#16a34a',
		700: '#15803d',
		800: '#166534',
		900: '#14532d',
	},

	// Warning (Orange)
	warning: {
		50: '#fff7ed',
		100: '#ffedd5',
		200: '#fed7aa',
		300: '#fdba74',
		400: '#fb923c',
		500: '#f97316', // Main
		600: '#ea580c',
		700: '#c2410c',
		800: '#9a3412',
		900: '#7c2d12',
	},

	// Error (Red)
	error: {
		50: '#fef2f2',
		100: '#fee2e2',
		200: '#fecaca',
		300: '#fca5a5',
		400: '#f87171',
		500: '#ef4444', // Main
		600: '#dc2626',
		700: '#b91c1c',
		800: '#991b1b',
		900: '#7f1d1d',
	},

	// Neutral (Slate)
	neutral: {
		0: '#ffffff',
		50: '#f8fafc',
		100: '#f1f5f9',
		200: '#e2e8f0',
		300: '#cbd5e1',
		400: '#94a3b8',
		500: '#64748b',
		600: '#475569',
		700: '#334155',
		800: '#1e293b',
		900: '#0f172a',
		950: '#020617',
	},
} as const

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const componentSizes = {
	button: {
		sm: {
			height: 40,
			paddingX: 16,
			fontSize: typography.caption.size,
		},
		md: {
			height: 48,
			paddingX: 24,
			fontSize: typography.body.size,
		},
		lg: {
			height: 56,
			paddingX: 32,
			fontSize: typography.bodyMedium.size,
		},
	},
	input: {
		sm: {
			height: 40,
			paddingX: 12,
			fontSize: typography.caption.size,
		},
		md: {
			height: 48,
			paddingX: 16,
			fontSize: typography.body.size,
		},
		lg: {
			height: 56,
			paddingX: 20,
			fontSize: typography.bodyMedium.size,
		},
	},
} as const

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const animation = {
	fast: 150,
	normal: 200,
	slow: 300,
	slower: 400,
} as const

export type AnimationDuration = keyof typeof animation

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить размер иконки в пикселях
 */
export function getIconSize(size: IconSize): number {
	return iconSizes[size]
}

/**
 * Получить размер spacing в пикселях
 */
export function getSpacing(size: Spacing): number {
	return spacing[size]
}

/**
 * Получить Tailwind класс для иконки
 */
export function getIconClass(size: IconSize): string {
	const sizeMap = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
	}
	return sizeMap[size]
}

/**
 * Получить Tailwind класс для border-radius
 */
export function getRadiusClass(radius: BorderRadius): string {
	const radiusMap = {
		sm: 'rounded-lg',
		md: 'rounded-xl',
		lg: 'rounded-2xl',
		xl: 'rounded-3xl',
		'2xl': 'rounded-[28px]',
		full: 'rounded-full',
	}
	return radiusMap[radius]
}

/**
 * Получить Tailwind класс для elevation (shadow)
 */
export function getElevationClass(level: Elevation): string {
	const elevationMap = {
		none: 'shadow-none',
		sm: 'shadow-sm',
		md: 'shadow-md',
		lg: 'shadow-lg',
		xl: 'shadow-xl',
		'2xl': 'shadow-2xl',
	}
	return elevationMap[level]
}
