export function FlashMessage({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;
  const isError = Boolean(error);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {error ?? notice}
    </div>
  );
}