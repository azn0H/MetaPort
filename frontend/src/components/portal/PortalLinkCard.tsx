import {
  Globe,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react'
import { ICON_MAP, type PortalLink } from './portalTypes'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface PortalLinkCardProps {
  link: PortalLink
  index: number
  totalCount: number
  onEdit: (link: PortalLink) => void
  onDelete: (id: number, title: string) => void
  onToggleActive: (link: PortalLink) => void
  onMove: (index: number, direction: 'up' | 'down') => void
}

export function PortalLinkCard({
  link,
  index,
  totalCount,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
}: PortalLinkCardProps) {
  const IconComponent = ICON_MAP[link.icon] || Globe

  return (
    <Card
      variant="bento"
      hover
      className={`p-5 flex flex-col justify-between ${
        link.is_active ? '' : 'opacity-60 grayscale-[40%]'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${
                link.gradient || 'from-cyan-500 to-blue-600'
              } flex items-center justify-center shadow-md text-white shrink-0`}
            >
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{link.title}</h3>
                {!link.is_active && (
                  <Badge variant="zinc" size="sm">
                    Skrytý
                  </Badge>
                )}
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 mt-0.5 truncate"
              >
                <span className="truncate">{link.url}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          {/* Reordering Controls */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#18181b] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => onMove(index, 'up')}
              disabled={index === 0}
              className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
              title="Posunout nahoru"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMove(index, 'down')}
              disabled={index === totalCount - 1}
              className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
              title="Posunout dolů"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-4">
          {link.description}
        </p>
      </div>

      {/* Card Controls Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800/80 text-xs">
        <button
          onClick={() => onToggleActive(link)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            link.is_active
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20'
              : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/50'
          }`}
        >
          {link.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{link.is_active ? 'Aktivní' : 'Skrytý'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(link)}
            title="Upravit box"
          >
            <Edit2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(link.id, link.title)}
            title="Smazat box"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
