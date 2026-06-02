"use client";

import { useEffect, useState, useCallback } from "react";

// ── tipos ──────────────────────────────────────────────────────────────────────

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

// ── escopos agrupados ──────────────────────────────────────────────────────────

const SCOPE_GROUPS = [
  {
    label: "Usuários",
    scopes: ["usuarios:read", "usuarios:write", "usuarios:delete"],
  },
  {
    label: "Atestados",
    scopes: ["atestados:read", "atestados:write", "atestados:delete"],
  },
  {
    label: "Turmas",
    scopes: ["turmas:read", "turmas:write", "turmas:delete"],
  },
  {
    label: "Notificações",
    scopes: ["notificacoes:read", "notificacoes:write"],
  },
  {
    label: "Cronograma",
    scopes: ["cronograma:read", "cronograma:write"],
  },
  {
    label: "Relatórios",
    scopes: ["relatorios:read"],
  },
  {
    label: "Cursos",
    scopes: ["cursos:read", "cursos:write"],
  },
  {
    label: "Disciplinas",
    scopes: ["disciplinas:read", "disciplinas:write"],
  },
];

// ── helpers ────────────────────────────────────────────────────────────────────

function authHeader() {
  const token = localStorage.getItem("admin_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function scopeLabel(s: string) {
  return s === "*" ? "Acesso total" : s;
}

// ── componente principal ───────────────────────────────────────────────────────

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [allAccess, setAllAccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys", { headers: authHeader() });
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function createKey() {
    setFormError("");
    if (!name.trim()) { setFormError("Informe um nome para a chave."); return; }
    const selectedScopes = allAccess ? ["*"] : scopes;
    if (selectedScopes.length === 0) { setFormError("Selecione ao menos um escopo."); return; }

    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          name: name.trim(),
          scopes: selectedScopes,
          ...(expiresAt && { expiresAt }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Erro ao criar chave."); return; }

      setNewKey(data);
      setShowCreate(false);
      resetForm();
      fetchKeys();
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: number) {
    if (!confirm("Revogar esta API key? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE", headers: authHeader() });
    fetchKeys();
  }

  function resetForm() {
    setName(""); setScopes([]); setAllAccess(false);
    setExpiresAt(""); setFormError("");
  }

  function toggleScope(s: string) {
    setScopes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openDocs(id: number) {
    window.open(`/api/docs/key/${id}`, "_blank");
  }

  function copyDocsLink(id: number) {
    navigator.clipboard.writeText(`${window.location.origin}/api/docs/key/${id}`);
    alert("Link copiado!");
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie as chaves de acesso à API e seus escopos de permissão.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition flex items-center gap-2"
        >
          <span className="text-base">+</span> Nova Key
        </button>
      </div>

      {/* Lista de keys */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔑</p>
          <p>Nenhuma API key criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((k) => (
            <div
              key={k.id}
              className={`bg-white border rounded-xl p-5 shadow-sm transition ${
                k.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{k.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        k.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {k.isActive ? "Ativa" : "Revogada"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mb-3">
                    <span>
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {k.prefix}...
                      </span>
                    </span>
                    <span>Criada {fmtDate(k.createdAt)} por {k.createdBy.nome}</span>
                    <span>Último uso: {fmtDate(k.lastUsedAt)}</span>
                    {k.expiresAt && <span>Expira: {fmtDate(k.expiresAt)}</span>}
                  </div>

                  {/* Escopos */}
                  <div className="flex flex-wrap gap-1.5">
                    {k.scopes.includes("*") ? (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        ★ Acesso total
                      </span>
                    ) : (
                      <>
                        {k.scopes.slice(0, 6).map((s) => (
                          <span
                            key={s}
                            className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                        {k.scopes.length > 6 && (
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                            +{k.scopes.length - 6} mais
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Ações */}
                {k.isActive && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openDocs(k.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                    >
                      📋 Ver Docs
                    </button>
                    <button
                      onClick={() => copyDocsLink(k.id)}
                      className="text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                    >
                      🔗 Copiar link
                    </button>
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                    >
                      🚫 Revogar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Criar key ──────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nova API Key</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome da chave
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Front-end React, App Mobile..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Acesso total */}
              <div className="flex items-center gap-3 bg-indigo-50 rounded-lg px-4 py-3">
                <input
                  type="checkbox"
                  id="all-access"
                  checked={allAccess}
                  onChange={(e) => { setAllAccess(e.target.checked); setScopes([]); }}
                  className="w-4 h-4 accent-indigo-600"
                />
                <label htmlFor="all-access" className="text-sm font-medium text-indigo-800 cursor-pointer">
                  Acesso total <span className="font-normal text-indigo-600">(escopo *)</span>
                </label>
              </div>

              {/* Escopos granulares */}
              {!allAccess && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Escopos de acesso</p>
                  <div className="space-y-4">
                    {SCOPE_GROUPS.map((group) => (
                      <div key={group.label}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.scopes.map((s) => {
                            const checked = scopes.includes(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => toggleScope(s)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                                  checked
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                                }`}
                              >
                                {scopeLabel(s)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expiração <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={createKey}
                disabled={creating}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
              >
                {creating ? "Criando..." : "Criar Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Key revelada ───────────────────────────────────────────────── */}
      {newKey && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">⚠️</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Guarde sua API Key</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Esta é a <strong>única vez</strong> que a chave completa será exibida.
                    Após fechar, não será possível recuperá-la.
                  </p>
                </div>
              </div>

              {/* Key */}
              <div className="bg-gray-950 rounded-xl p-4 mb-3">
                <p className="font-mono text-sm text-emerald-400 break-all">{newKey.key}</p>
              </div>

              <button
                onClick={copyKey}
                className={`w-full text-sm font-medium py-2 rounded-lg border transition mb-5 ${
                  copied
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                {copied ? "✓ Copiado!" : "📋 Copiar chave"}
              </button>

              {/* Confirmação */}
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-700">
                  Confirmo que já copiei a chave em local seguro.
                </span>
              </label>

              {/* Escopos concedidos */}
              <div className="bg-gray-50 rounded-lg p-3 mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Escopos concedidos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {newKey.scopes.map((s) => (
                    <span key={s} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {scopeLabel(s)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openDocs(newKey.id)}
                  className="flex-1 text-sm text-indigo-700 border border-indigo-300 hover:bg-indigo-50 py-2 rounded-lg transition"
                >
                  📋 Ver Documentação
                </button>
                <button
                  onClick={() => { if (confirmed) { setNewKey(null); setConfirmed(false); } }}
                  disabled={!confirmed}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition"
                >
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
