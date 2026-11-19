import { formatInTimeZone } from "date-fns-tz";
import { formatZAR } from "@/lib/money";

export const STORE_TIME_ZONE = "Africa/Johannesburg";

export function formatPickup(date: Date): string {
  return formatInTimeZone(date, STORE_TIME_ZONE, "EEEE d MMMM yyyy, HH:mm");
}

export { formatZAR };