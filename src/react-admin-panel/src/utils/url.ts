export const getBaseUrl = (resource: string) => {
    let base: string = '';
    if (import.meta.env.VITE_MODE === 'developtment') {
    base = 'http://localhost:5173';
  } else if ((window as any)?.wpApiSettings?.pluginUrl) {
    base = (window as any).wpApiSettings.pluginUrl;
  }
  console.log('Base URL:', base, import.meta.env.VITE_MODE);
  return base + resource;
};