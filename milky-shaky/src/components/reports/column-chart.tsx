export function ColumnChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium tabular-nums">{item.value}</span>
          <div className="flex h-40 w-full items-end">
            <div
              className="w-full rounded-t-md bg-primary/80"
              style={{
                height: `${(item.value / max) * 100}%`,
                minHeight: item.value > 0 ? "4px" : "0px",
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}