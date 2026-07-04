interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, icon = '🔍', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm text-sm leading-relaxed mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
