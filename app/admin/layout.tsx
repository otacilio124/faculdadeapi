"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const isLoginPage = pathname === "/admin/login";
    if (!token && !isLoginPage) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  function logout() {
    localStorage.removeItem("admin_token");
    router.replace("/admin/login");
  }

  const isLoginPage = pathname === "/admin/login";

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {!isLoginPage && (
        <header className="bg-indigo-700 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div>
                <p className="font-semibold text-lg leading-tight">Atestado Escolar</p>
                <p className="text-indigo-300 text-xs">Painel Administrativo</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-sm text-indigo-200 hover:text-white border border-indigo-500 hover:border-white px-3 py-1.5 rounded-md transition"
            >
              Sair
            </button>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
