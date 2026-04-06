/**
 * Converte uma cor Hexadecimal (#RRGGBB) para valores HSL (Hue, Saturation, Lightness).
 * Útil para injetar variáveis que o Tailwind utiliza com hsl(var(--primary)).
 */
export function hexToHsl(hex: string): string {
  // Remover o # se existir
  hex = hex.replace(/^#/, '');

  // Converter para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Injeta variáveis de tema no :root do documento.
 */
export function applyTheme(primaryHex: string, fontHeading?: string, fontBody?: string) {
  const root = document.documentElement;
  
  if (primaryHex) {
    const hsl = hexToHsl(primaryHex);
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--accent', hsl);
    root.style.setProperty('--ring', hsl);
    root.style.setProperty('--accent-color', primaryHex);
  }

  if (fontHeading) {
    root.style.setProperty('--font-heading', `"${fontHeading}", sans-serif`);
  }

  if (fontBody) {
    root.style.setProperty('--font-body', `"${fontBody}", sans-serif`);
  }
}
