export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="h-page">{title}</h1>
      {subtitle && <p className="subtle text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
