import os from "node:os";

export type LanAddress = {
  ip: string;
  iface: string;
  preferred: boolean;
};

function isPrivateV4(ip: string): boolean {
  return (
    /^192\.168\./.test(ip) ||
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

export function lanAddresses(): LanAddress[] {
  const nets = os.networkInterfaces();
  const out: LanAddress[] = [];

  for (const [iface, addrs] of Object.entries(nets)) {
    for (const a of addrs ?? []) {
      const isV4 = a.family === "IPv4" || (a.family as unknown as number) === 4;
      if (isV4 && !a.internal) {
        out.push({ ip: a.address, iface, preferred: isPrivateV4(a.address) });
      }
    }
  }

  return out.sort((x, y) => Number(y.preferred) - Number(x.preferred));
}

export function serverPort(): string {
  return process.env.PORT ?? "3000";
}

export function siteUrl(ip: string, port = serverPort()): string {
  return `http://${ip}:${port}`;
}
