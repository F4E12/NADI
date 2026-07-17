export type QrDownload = {
  filename: string;
  href: string;
};

export function qrDownload(svg: string, householdId: string): QrDownload {
  return {
    filename: `dompet-gizi-${householdId}.svg`,
    href: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}
