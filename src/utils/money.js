// €1,234.50
export const eur = (n) =>
  `${Number(n) < 0 ? '-' : ''}€${Math.abs(Number(n) || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// €1.2k for chart axes
export const eurShort = (n) => {
  const v = Math.abs(Number(n) || 0);
  const sign = Number(n) < 0 ? '-' : '';
  if (v >= 1000000) return `${sign}€${+(v / 1000000).toFixed(1)}m`;
  if (v >= 1000) return `${sign}€${+(v / 1000).toFixed(1)}k`;
  return `${sign}€${Math.round(v)}`;
};