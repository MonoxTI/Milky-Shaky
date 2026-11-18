import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const STORE_TIME_ZONE = "Africa/Johannesburg";

/** Parses a datetime-local value (South African wall-clock time) into a UTC Date. */
export function parseLocalPickup(value: string): Date | null {
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const date = fromZonedTime(withSeconds, STORE_TIME_ZONE);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface PickupWindow {
  opensAt: string; // "HH:mm"
  closesAt: string; // "HH:mm"
  leadMinutes: number;
}

/** Returns an error message, or null if the pickup time is acceptable. */
export function validatePickupTime(pickupAt: Date, now: Date, window: PickupWindow): string | null {
  const earliest = new Date(now.getTime() + window.leadMinutes * 60_000);
  if (pickupAt < earliest) {
    return `Pickup must be at least ${window.leadMinutes} minutes from now.`;
  }

  const localTime = formatInTimeZone(pickupAt, STORE_TIME_ZONE, "HH:mm");
  if (localTime < window.opensAt || localTime > window.closesAt) {
    return `This store collects orders between ${window.opensAt} and ${window.closesAt}.`;
  }
  return null;
}