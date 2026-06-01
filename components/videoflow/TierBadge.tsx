interface TierBadgeProps {
  tier: 'hard' | 'medium' | 'easy'
  size?: 'sm' | 'md'
}

const tierConfig = {
  hard: { color: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', label: 'Hard' },
  medium: { color: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', label: 'Medium' },
  easy: { color: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', label: 'Easy' }
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = tierConfig[tier]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2'

  return (
    <div className={`${config.color} ${config.border} ${config.text} ${sizeClass} rounded border font-semibold inline-block`}>
      {config.label}
    </div>
  )
}
