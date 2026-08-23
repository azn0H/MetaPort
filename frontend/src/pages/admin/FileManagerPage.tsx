import { useState, useEffect, useRef } from 'react'
import {
  Folder,
  File,
  ArrowUp,
  HardDrive,
  Loader2,
  AlertCircle,
  Download,
  UploadCloud,
} from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

interface FileItem {
  name: string
  is_dir: boolean
  size: number
  permissions: string
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('/home/aznoh')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  usePageTitle('Správce souborů')

  const fetchFiles = async (path: string) => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(
        `https://api-metaport.aznoh.cz/api/v1/system/files?path=${encodeURIComponent(path)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Nelze načíst složku')
      }

      const data = await response.json()
      setFiles(data)
      setCurrentPath(path)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles(currentPath)
  }, [])

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath.replace(/\/$/, '') + '/' + folderName
    fetchFiles(newPath)
  }

  const handleGoUp = () => {
    if (currentPath === '/') return
    const pathParts = currentPath.split('/').filter(Boolean)
    pathParts.pop()
    const newPath = '/' + pathParts.join('/')
    fetchFiles(newPath)
  }

  const handleDownload = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation()
    const filePath = currentPath.replace(/\/$/, '') + '/' + fileName
    const token = localStorage.getItem('jwt_token')

    try {
      const response = await fetch(
        `https://api-metaport.aznoh.cz/api/v1/system/download?path=${encodeURIComponent(filePath)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Chyba při stahování')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Nepodařilo se stáhnout soubor')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setIsLoading(true)
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(
        `https://api-metaport.aznoh.cz/api/v1/system/upload?path=${encodeURIComponent(currentPath)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (!response.ok) throw new Error('Nepodařilo se nahrát soubor')

      fetchFiles(currentPath)
    } catch (err) {
      setError('Nepodařilo se nahrát soubor')
      setIsLoading(false)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Soubory</h1>
            <Badge variant="zinc">{files.length}</Badge>
          </div>
        </div>
      </div>

      <Card variant="bento" className="overflow-hidden !p-0 shadow-2xl">
        {/* Navigation & Upload Bar */}
        <div className="bg-[#121215] px-4 py-3 border-b border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="dark"
              size="sm"
              onClick={handleGoUp}
              disabled={currentPath === '/' || isLoading}
              title="O úroveň výše"
            >
              <ArrowUp className="w-4 h-4 text-zinc-300" />
            </Button>

            <div className="flex-1 flex items-center gap-2 bg-[#09090b] px-3.5 py-1.5 rounded-xl border border-zinc-800/80 min-w-0">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-zinc-300 font-mono text-xs truncate">{currentPath}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="magic"
              size="sm"
              onClick={handleUploadClick}
              disabled={isLoading}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Nahrát soubor
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-rose-400 text-xs">{error}</span>
          </div>
        )}

        {/* File Table */}
        <div className="overflow-x-auto min-h-[380px] bg-[#0d0d10]">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-[#121215] text-zinc-500 text-[11px] uppercase tracking-wider font-semibold border-b border-zinc-800/80">
              <tr>
                <th className="px-6 py-3">Název položky</th>
                <th className="px-6 py-3">Velikost</th>
                <th className="px-6 py-3">Oprávnění</th>
                <th className="px-6 py-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <>
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                </>
              ) : (
                files.map((file) => (
                  <tr
                    key={file.name}
                    className={`group transition-colors ${
                      file.is_dir
                        ? 'hover:bg-zinc-800/50 cursor-pointer'
                        : 'hover:bg-zinc-800/30'
                    }`}
                    onClick={() => (file.is_dir ? handleNavigate(file.name) : undefined)}
                  >
                  <td className="px-6 py-3 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${
                        file.is_dir
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                      } flex items-center justify-center shrink-0`}
                    >
                      {file.is_dir ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                    </div>
                    <span
                      className={`font-semibold ${
                        file.is_dir ? 'text-white group-hover:text-cyan-300' : 'text-zinc-300'
                      }`}
                    >
                      {file.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-[11px] text-zinc-400">
                    {file.is_dir ? '—' : formatBytes(file.size)}
                  </td>
                  <td className="px-6 py-3 font-mono text-[11px] text-zinc-500">
                    {file.permissions}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {!file.is_dir && (
                      <button
                        onClick={(e) => handleDownload(e, file.name)}
                        className="p-1.5 text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Stáhnout soubor"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
              {!isLoading && files.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-zinc-500">
                    Tato složka je prázdná
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}