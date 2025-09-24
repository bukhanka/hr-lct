import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] text-white">
      {children}
    </div>
  );
}

