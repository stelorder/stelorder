import { useState } from "react"

export function useWpApiSettings() {
    const [integrationId] = useState((window as any)?.wpApiSettings?.integration?.integrationId)
    const [nonce] = useState((window as any)?.wpApiSettings?.nonce)
    const [rootUrl] = useState((window as any)?.wpApiSettings?.root)
    const [wpAdminUrl] = useState((window as any)?.wpApiSettings?.wpAdminUrl)
    const [stelServiceUrl] = useState((window as any)?.wpApiSettings?.stelServiceUrl)
    const [stelUrl] = useState((window as any)?.wpApiSettings?.stelUrl)
    return { nonce, wpAdminUrl, stelServiceUrl, rootUrl, stelUrl, integrationId }
}