import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import 'xterm/css/xterm.css'
import { Terminal as TerminalIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function ConsolePage() {
  usePageTitle('Konzole')

  const terminalRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    if (!terminalRef.current) return

    const token = localStorage.getItem('jwt_token')
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#09090b',
        foreground: '#f4f4f5',
        cursor: '#06b6d4',
        selectionBackground: '#27272a',
      },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      rows: 30,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)

    if (!token) {
      setStatus('disconnected')
      term.write('\r\n\x1b[31m[Chyba] Uživatel není přihlášen (chybí autorizační token).\x1b[0m\r\n')
      return () => {
        term.dispose()
      }
    }

    const timeoutId = setTimeout(() => {
      try {
        fitAddon.fit()
      } catch (e) {}
    }, 50)

    const handleResize = () => {
      try {
        fitAddon.fit()
      } catch (e) {}
    }
    window.addEventListener('resize', handleResize)

    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = isLocal
      ? `${window.location.hostname}:8025`
      : window.location.hostname.includes('metaport.aznoh.cz')
      ? 'api-metaport.aznoh.cz'
      : `${window.location.hostname}:8025`
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/system/ws/console?token=${token}`

    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setStatus('connected')
        term.focus()
      }

      ws.onmessage = (event) => {
        term.write(event.data)
      }

      ws.onclose = () => {
        setStatus('disconnected')
        term.write('\r\n\x1b[31m[Spojení s terminálem bylo ukončeno]\x1b[0m\r\n')
      }

      ws.onerror = () => {
        setStatus('disconnected')
      }

      term.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })
    } catch (err: any) {
      setStatus('disconnected')
      term.write(`\r\n\x1b[31m[Chyba připojení WebSocket]: ${err?.message || err}\x1b[0m\r\n`)
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close()
      }
      term.dispose()
    }
  }, [])

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Konzole</h1>
          <Badge variant="purple">Root CLI</Badge>
        </div>

        <div className="flex items-center gap-2">
          {status === 'connecting' && (
            <Badge variant="amber" pulse dot size="md">
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              Připojování...
            </Badge>
          )}
          {status === 'connected' && (
            <Badge variant="emerald" pulse dot size="md">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Aktivní
            </Badge>
          )}
          {status === 'disconnected' && (
            <Badge variant="rose" dot size="md">
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Odpojeno
            </Badge>
          )}
        </div>
      </div>

      {/* Terminal Window */}
      <Card
        variant="bento"
        className="flex-1 overflow-hidden shadow-2xl flex flex-col relative !p-0 border-zinc-800"
      >
        {/* Terminal Header */}
        <div className="bg-[#121215] px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <TerminalIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-300 text-xs font-mono">root@metaport:~#</span>
          </div>
        </div>

        <div
          ref={terminalRef}
          className="flex-1 p-4 w-full h-full overflow-hidden bg-[#09090b]"
          style={{ minHeight: '400px' }}
        />
      </Card>
    </div>
  )
}