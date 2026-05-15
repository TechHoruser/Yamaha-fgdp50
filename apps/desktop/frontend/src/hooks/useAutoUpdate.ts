import { useEffect, useState } from 'react'
import * as WailsApp from '../wailsjs/go/main/App'

export interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  currentVersion: string
  downloadURL: string
  releaseNotes: string
}

export function useAutoUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    WailsApp.CheckForUpdates()
      .then(info => {
        if (info?.hasUpdate) setUpdateInfo(info as UpdateInfo)
      })
      .catch(() => {
        // Ignore — update check is best-effort, never block the app.
      })
  }, [])

  const install = async () => {
    if (!updateInfo?.downloadURL) return
    setInstalling(true)
    try {
      await WailsApp.DownloadAndInstallUpdate(updateInfo.downloadURL)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al instalar la actualización')
      setInstalling(false)
    }
  }

  return { updateInfo, installing, error, install, dismiss: () => setUpdateInfo(null) }
}
