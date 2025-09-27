import localFont from 'next/font/local';

const AritaBuriLocalFont = localFont({
  src: "./AritaBuriKR-Medium.ttf",
  variable: '--font-aritaburi',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export { AritaBuriLocalFont };