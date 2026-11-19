import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        MS
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">Milky Shaky</span>
    </Link>
  );
}