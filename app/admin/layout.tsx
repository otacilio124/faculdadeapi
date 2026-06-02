"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type User = { nome: string; email: string; perfil: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const raw = localStorage.getItem("admin_user");
    const isLoginPage = pathname === "/admin/login";
    if (!token && !isLoginPage) { router.replace("/admin/login"); return; }
    if (raw) { try { setUser(JSON.parse(raw)); } catch { /* noop */ } }
    setReady(true);
  }, [pathname, router]);

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.replace("/admin/login");
  }

  const isLoginPage = pathname === "/admin/login";
  if (!ready) return null;

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Marca */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm shadow-sm">
              🎓
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">Atestado Escolar</p>
              <p className="text-xs text-slate-400 mt-0.5">Painel Administrativo</p>
            </div>
          </div>

          {/* Nav central */}
          <nav className="flex items-center gap-1">
            <a
              href="/admin/keys"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith("/admin/keys")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              API Keys
            </a>
            <a
              href="/api/docs"
              target="_blank"
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Documentação ↗
            </a>
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-slate-900 leading-none">{user.nome}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user.perfil}</p>
              </div>
            )}
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
              {user?.nome?.[0]?.toUpperCase() ?? "A"}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
