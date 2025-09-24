import type { ReactNode } from "react";

export function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
        {title}
      </p>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      {description && (
        <p className="mt-3 text-xs text-indigo-100/70">{description}</p>
      )}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-200/70">
          {title}
        </h2>
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
      <table className="w-full min-w-[480px] text-left text-sm text-indigo-100/80">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-indigo-200/70">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-6 py-4">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-white/10">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-6 py-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

