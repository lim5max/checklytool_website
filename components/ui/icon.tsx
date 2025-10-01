import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type IconSize, getIconClass } from '@/lib/design-tokens'

/**
 * Icon Component
 *
 * Унифицированный компонент для всех иконок в приложении.
 * Использует дизайн-систему и поддерживает только 3 размера: sm (16px), md (24px), lg (32px)
 *
 * @example
 * ```tsx
 * import { Plus } from 'lucide-react'
 * import { Icon } from '@/components/ui/icon'
 *
 * <Icon icon={Plus} size="md" />
 * <Icon icon={Plus} size="sm" className="text-blue-600" />
 * ```
 */

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
	/** Lucide иконка компонент */
	icon: LucideIcon
	/** Размер иконки: sm (16px), md (24px), lg (32px) */
	size?: IconSize
	/** Дополнительные CSS классы */
	className?: string
}

function Icon({ icon: IconComponent, size = 'md', className, ...props }: IconProps) {
	return (
		<IconComponent
			className={cn(getIconClass(size), className)}
			aria-hidden="true"
			{...props}
		/>
	)
}

/**
 * Встроенный Icon компонент с размером
 *
 * Используйте этот компонент для создания предустановленных иконок с фиксированным размером
 */
interface IconWithSizeProps extends Omit<IconProps, 'size' | 'icon'> {
	icon: LucideIcon
}

export function IconSm({ icon, className, ...props }: IconWithSizeProps) {
	return <Icon icon={icon} size="sm" className={className} {...props} />
}

export function IconMd({ icon, className, ...props }: IconWithSizeProps) {
	return <Icon icon={icon} size="md" className={className} {...props} />
}

export function IconLg({ icon, className, ...props }: IconWithSizeProps) {
	return <Icon icon={icon} size="lg" className={className} {...props} />
}

export { Icon, type IconProps, type IconSize }
