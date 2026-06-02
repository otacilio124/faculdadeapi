"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ── Tipos ──────────────────────────────────────────────────────────────────────

type ApiKey = {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: { nome: string; email: string };
};

type NewKeyResponse = ApiKey & { key: string };

// ── Escopos agrupados ──────────────────────────────────────────────────────────

const SCOPE_GROUPS = [
  { label: "Usuários",    scopes: ["usuarios:read","usuarios:write","usuarios:delete"] },
  { label: "Atestados",  scopes: ["atestados:read","atestados:write","atestados:delete"] },
  { label: "Turmas",     scopes: ["turmas:read","turmas:write","turmas:delete"] },
  { label: "Notificações",scopes: ["notificacoes:read","notificacoes:write"] },
  { label: "Cronograma", scopes: ["cronograma:read","cronograma:write"] },
  { label: "Relatórios", scopes: ["relatorios:read"] },
  { label: "Cursos",     scopes: ["cursos:read","cursos:write"] },
  { label: "Disciplinas",scopes: ["disciplinas:read","disciplinas:write"] },
];

// ── Helpers visuais ────────────────────────────────────────────────────────────

function scopePill(s: string) {
  if (s === "*") return "bg-violet-100 text-violet-700 font-semibold";
  if (s.endsWith(":read"))   return "bg-blue-100 text-blue-700";
  if (s.endsWith(":write"))  return "bg-amber-100 text-amber-800";
  if (s.endsWith(":delete")) return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function fmtDate(iso: string | null) {
  if (!iso) return <span className="text-slate-400">—</span>;
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
}

function authHeader(): HeadersInit {
  const t = localStorage.getItem("admin_token");
  return { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "revoked">("all");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [allAccess, setAllAccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // revelação
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/api-keys", { headers: authHeader() });
      if (r.ok) setKeys(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Ações ──────────────────────────────────────────────────────────────────

  async function createKey() {
    setFormError("");
    if (!name.trim()) { setFormError("Informe um nome para a chave."); return; }
    const sel = allAccess ? ["*"] : scopes;
    if (!sel.length) { setFormError("Selecione ao menos um escopo."); return; }
    setCreating(true);
    try {
      const r = await fetch("/api/api-keys", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ name: name.trim(), scopes: sel, ...(expiresAt && { expiresAt }) }),
      });
      const d = await r.json();
      if (!r.ok) { setFormError(d.error ?? "Erro ao criar."); return; }
      setNewKey(d); setShowCreate(false); resetForm(); fetchKeys();
    } finally { setCreating(false); }
  }

  async function revokeKey(id: number) {
    setOpenMenu(null);
    if (!confirm("Revogar esta API key permanentemente?")) return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE", headers: authHeader() });
    fetchKeys();
  }

  function resetForm() {
    setName(""); setScopes([]); setAllAccess(false); setExpiresAt(""); setFormError("");
  }

  function toggleScope(s: string) {
    setScopes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Dados filtrados ────────────────────────────────────────────────────────

  const displayed = keys.filter((k) =>
    filter === "all" ? true : filter === "active" ? k.isActive : !k.isActive
  );

  const stats = {
    total: keys.length,
    active: keys.filter((k) => k.isActive).length,
    revoked: keys.filter((k) => !k.isActive).length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total de keys", value: stats.total, icon: "🔑", color: "text-slate-700" },
          { label: "Ativas",        value: stats.active, icon: "✅", color: "text-emerald-700" },
          { label: "Revogadas",     value: stats.revoked, icon: "🚫", color: "text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Barra de controle ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        {/* Filtros */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
          {(["all","active","revoked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {{ all: "Todas", active: "Ativas", revoked: "Revogadas" }[f]}
            </button>
          ))}
        </div>

        {/* Botão criar */}
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Key
        </button>
      </div>

      {/* ── Tabela ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Carregando…
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <span className="text-5xl mb-3">🔑</span>
            <p className="font-medium">Nenhuma chave encontrada.</p>
            <p className="text-sm mt-1">Crie a primeira API key pelo botão acima.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prefixo</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Escopos</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Criada</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Último uso</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((k) => (
                <tr key={k.id} className={`hover:bg-slate-50/50 transition ${!k.isActive ? "opacity-50" : ""}`}>
                  {/* Nome */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{k.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{k.createdBy.nome}</p>
                  </td>

                  {/* Prefixo */}
                  <td className="px-4 py-4">
                    <code className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md font-mono">
                      {k.prefix}…
                    </code>
                  </td>

                  {/* Escopos */}
                  <td className="px-4 py-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.includes("*") ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${scopePill("*")}`}>
                          ★ Acesso total
                        </span>
                      ) : (
                        <>
                          {k.scopes.slice(0, 3).map((s) => (
                            <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${scopePill(s)}`}>
                              {s}
                            </span>
                          ))}
                          {k.scopes.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              +{k.scopes.length - 3}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    {k.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                        Revogada
                      </span>
                    )}
                  </td>

                  {/* Criada */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{fmtDate(k.createdAt)}</td>

                  {/* Último uso */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{fmtDate(k.lastUsedAt)}</td>

                  {/* Ações */}
                  <td className="px-4 py-4 relative">
                    {k.isActive && (
                      <>
                        <button
                          onClick={() => setOpenMenu(openMenu === k.id ? null : k.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>

                        {openMenu === k.id && (
                          <div ref={menuRef} className="absolute right-10 top-2 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-48">
                            <button
                              onClick={() => { window.open(`/api/docs/key/${k.id}`, "_blank"); setOpenMenu(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                            >
                              <span className="text-base">📋</span> Ver Documentação
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/api/docs/key/${k.id}`);
                                setOpenMenu(null);
                                alert("Link copiado para a área de transferência!");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                            >
                              <span className="text-base">🔗</span> Copiar link dos docs
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              onClick={() => revokeKey(k.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                              <span className="text-base">🚫</span> Revogar chave
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: Criar key ─────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header do modal */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Nova API Key</h2>
                <p className="text-sm text-slate-500 mt-0.5">Configure o acesso desta chave.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-xl leading-none">×</button>
            </div>

            {/* Corpo do modal */}
            <div className="px-6 py-5 overflow-y-auto space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da chave</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Front-end React, App Mobile, CI/CD…"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Toggle acesso total */}
              <label className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl cursor-pointer hover:bg-violet-100/70 transition">
                <input
                  type="checkbox"
                  checked={allAccess}
                  onChange={(e) => { setAllAccess(e.target.checked); setScopes([]); }}
                  className="w-4 h-4 accent-violet-600"
                />
                <div>
                  <p className="text-sm font-semibold text-violet-900">Acesso total</p>
                  <p className="text-xs text-violet-600">Escopo <code>*</code> — permissão irrestrita a todos os recursos</p>
                </div>
              </label>

              {/* Escopos granulares */}
              {!allAccess && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Escopos de acesso</p>
                  <div className="space-y-4">
                    {SCOPE_GROUPS.map((g) => (
                      <div key={g.label}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{g.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {g.scopes.map((s) => {
                            const on = scopes.includes(s);
                            const cls = on ? scopePill(s) + " ring-2 ring-offset-1 ring-current" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-400";
                            return (
                              <button key={s} type="button" onClick={() => toggleScope(s)}
                                className={`text-xs px-3 py-1.5 rounded-full transition font-medium ${cls}`}>
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiração */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expiração <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <span>⚠</span> {formError}
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end shrink-0">
              <button onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition">
                Cancelar
              </button>
              <button onClick={createKey} disabled={creating}
                className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm shadow-indigo-200 transition">
                {creating ? "Criando…" : "Criar Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Key revelada ──────────────────────────────────────────────── */}
      {newKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Topo colorido */}
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-0.5">⚠️</div>
                <div>
                  <h2 className="font-bold text-amber-900">Copie sua chave agora</h2>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Esta é a <strong>única vez</strong> que a chave completa aparece. Ela não pode ser recuperada depois.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Key */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Chave gerada</p>
                <div className="bg-slate-950 rounded-xl px-4 py-4 font-mono text-sm text-emerald-400 break-all leading-relaxed">
                  {newKey.key}
                </div>
                <button onClick={copyKey}
                  className={`mt-2.5 w-full h-10 rounded-xl text-sm font-medium border transition flex items-center justify-center gap-2 ${
                    copied
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}>
                  {copied ? "✓ Copiado!" : "📋 Copiar chave"}
                </button>
              </div>

              {/* Escopos */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Escopos concedidos</p>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 rounded-xl p-3">
                  {newKey.scopes.map((s) => (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${scopePill(s)}`}>
                      {s === "*" ? "★ Acesso total" : s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confirmação */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 shrink-0" />
                <span className="text-sm text-slate-700">
                  Confirmo que copiei a chave em local seguro.
                </span>
              </label>

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => window.open(`/api/docs/key/${newKey.id}`, "_blank")}
                  className="flex-1 h-11 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm font-medium transition">
                  📋 Ver Documentação
                </button>
                <button
                  onClick={() => { if (confirmed) { setNewKey(null); setConfirmed(false); } }}
                  disabled={!confirmed}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-sm shadow-indigo-200">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
