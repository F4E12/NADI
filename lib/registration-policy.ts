import type { DeviceRole } from "@/lib/device-role";
import type { HealthStatus } from "@/lib/data/households";

export function registrationHealthStatus(
  requested: HealthStatus,
  role: DeviceRole,
): HealthStatus {
  return role === "VOLUNTEER" ? requested : "WELL";
}
