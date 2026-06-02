"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Credenciais inválidas."); return; }
      if (!["ADMIN", "DIRECAO"].includes(data.usuario?.perfil)) {
        setError("Acesso restrito a administradores."); return;
      }
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.usuario));
      router.replace("/admin/keys");
    } catch {
      setError("Erro de conexão. Verifique o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Painel esquerdo ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-slate-900 flex-col justify-between p-12 overflow-hidden">
        {/* Gradiente decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-violet-700/15 rounded-full blur-3xl" />

        {/* Conteúdo */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🎓</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Atestado Escolar
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Controle total
            <br />
            da sua API.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Gerencie acessos, crie chaves personalizadas e compartilhe documentação filtrada com cada desenvolvedor.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: "🔑", title: "API Keys com escopos", desc: "Controle granular por recurso e ação" },
            { icon: "📋", title: "Documentação por chave", desc: "Cada dev vê só o que pode usar" },
            { icon: "🛡️", title: "Revogação instantânea", desc: "Desative acessos em um clique" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0 text-base">
                {f.icon}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{f.title}</p>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé esquerdo */}
        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Sistema de Atestado Escolar
        </p>
      </div>

      {/* ── Painel direito ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-white">
        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-lg">🎓</span>
          </div>
          <span className="font-semibold text-gray-900">Atestado Escolar</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Entre com suas credenciais de administrador.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@escola.edu.br"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Acesso exclusivo para administradores e direção.
          </p>
        </div>
      </div>
    </div>
  );
}
