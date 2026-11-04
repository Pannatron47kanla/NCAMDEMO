import type { CSSProperties } from 'react';

/**
 * Turns a CSS declaration string such as `left:10px;transform:rotateX(55deg)` into a React style object.
 * The mockup builds the 3D scene from such strings; keeping them as strings keeps the port line for line.
 */
export function css(text: string): CSSProperties {
  const style: Record<string, string> = {};
  text.split(';').forEach((decl) => {
    const i = decl.indexOf(':');
    if (i < 0) return;
    const name = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!name || !value) return;
    style[name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  });
  return style as CSSProperties;
}
