import {
  Globe,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react'
import { ICON_MAP, type PortalLink } from './portalTypes'

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
  onMove
}: PortalLinkCardProps) {
  const IconComponent = ICON_MAP[link.icon] || Globe

  return (
    <div
      className={`relative rounded-xl p-5 border transition-all flex flex-col justify-between ${
        link.is_active
          ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          : 'bg-slate-900/20 border-slate-800/40 opacity-60'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base truncate">{link.title}</h3>
                {!link.is_active && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    Skrytý
                  </span>
                )}
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-0.5 truncate"
              >
                <span className="truncate">{link.url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 flex-shrink-0">
            <button
              onClick={() => onMove(index, 'up')}
              disabled={index === 0}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
              title="Posunout nahoru"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMove(index, 'down')}
              disabled={index === totalCount - 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
              title="Posunout dolů"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
          {link.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
        <button
          onClick={() => onToggleActive(link)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            link.is_active
              ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
              : 'text-slate-400 bg-slate-800/50 hover:bg-slate-800'
          }`}
        >
          {link.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{link.is_active ? 'Aktivní' : 'Skrytý'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(link)}
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
            title="Upravit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(link.id, link.title)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            title="Smazat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
