import { useState, useEffect } from 'react'
import { Folder, File, ArrowUp, HardDrive, Loader2, AlertCircle } from 'lucide-react'

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

  const fetchFiles = async (path: string) => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/system/files?path=${encodeURIComponent(path)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
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
    // Odstranění lomítka na konci, pokud tam je, a přidání nové složky
    const newPath = currentPath.replace(/\/$/, '') + '/' + folderName
    fetchFiles(newPath)
  }

  const handleGoUp = () => {
    if (currentPath === '/') return
    // Získání nadřazené složky
    const pathParts = currentPath.split('/').filter(Boolean)
    pathParts.pop()
    const newPath = '/' + pathParts.join('/')
    fetchFiles(newPath)
  }

  // Funkce na formátování velikosti (B, KB, MB)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Správce souborů</h1>
        <p className="text-slate-400">Procházení systému přes zabezpečené SFTP</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        {/* Navigační lišta */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-4">
          <button 
            onClick={handleGoUp}
            disabled={currentPath === '/' || isLoading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            title="O složku výš"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <HardDrive className="w-4 h-4 text-cyan-500" />
            <span className="text-slate-300 font-mono text-sm">{currentPath}</span>
          </div>

          {isLoading && <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />}
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span className="text-rose-400 text-sm">{error}</span>
          </div>
        )}

        {/* Výpis souborů */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-slate-500 text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Název</th>
                <th className="px-6 py-3 font-medium">Velikost</th>
                <th className="px-6 py-3 font-medium">Práva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {files.map((file) => (
                <tr 
                  key={file.name} 
                  className={`group transition-colors ${file.is_dir ? 'hover:bg-slate-800 cursor-pointer' : 'hover:bg-slate-800/50'}`}
                  onClick={() => file.is_dir ? handleNavigate(file.name) : null}
                >
                  <td className="px-6 py-3 flex items-center gap-3">
                    {file.is_dir ? (
                      <Folder className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
                    ) : (
                      <File className="w-5 h-5 text-slate-500" />
                    )}
                    <span className={`font-medium ${file.is_dir ? 'text-white' : 'text-slate-300'}`}>
                      {file.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs">
                    {file.is_dir ? '--' : formatBytes(file.size)}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">
                    {file.permissions}
                  </td>
                </tr>
              ))}
              {!isLoading && files.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    Složka je prázdná
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}