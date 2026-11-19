export function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{item.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <span className="text-right font-medium tabular-nums">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}