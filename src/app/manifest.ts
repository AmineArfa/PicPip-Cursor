import { MetadataRoute } from 'next';

/**
 * Web App Manifest for PicPip
 * Enables PWA features and defines app appearance when installed
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PicPip - Bring Your Pictures to Life',
    short_name: 'PicPip',
    description: 'Transform your cherished photos into magical animated videos with AI.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffde7',
    theme_color: '#ff61d2',
    orientation: 'portrait',
    scope: '/',
    // Using actual brand logo assets
    icons: [
      {
        src: '/picpip_logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/picpip_logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/picpip_logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    categories: ['photo', 'entertainment', 'lifestyle'],
    screenshots: [
      {
        src: '/picpip_logo.png',
        sizes: '800x800',
        type: 'image/png',
      },
    ],
  };
}

