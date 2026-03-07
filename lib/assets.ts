export const getAssetPath = (src: string) => {
  if (src.startsWith("http")) return src;
  const cleanSrc = src.startsWith("/") ? src : `/${src}`;
  return cleanSrc;
};

export const BRAND_LOGO_WHITE = "/catalogues/brand/logo-white.png";
export const FALLBACK_IMAGE = "/placeholder.webp";

export const SVG_LOGO_FALLBACK = `
<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="24" fill="white">ELIE</text>
  <text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="8" fill="white" opacity="0.6">PARFUM</text>
</svg>
`;

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  // Prevent infinite loop if placeholder itself is missing
  if (e.currentTarget.src.includes("/placeholder.webp")) return;
  e.currentTarget.src = FALLBACK_IMAGE;
};
