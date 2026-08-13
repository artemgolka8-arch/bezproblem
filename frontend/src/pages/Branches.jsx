import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { Panel, Badge } from "../components/ui.jsx";

export default function Branches() {
  const { token, hasPermission } = useAuth();
  const canManage = hasPermission("branches.manage");
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    api.branches.list(token).then((r) => setBranches(r.branches)).catch((e) => setError(e.message));
  }

  useEffect(refresh, [token]);

  async function onCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.branches.create(token, { name, address });
      setName("");
      setAddress("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleArchive(b) {
    await api.branches.update(token, b.id, { isArchived: !b.isArchived });
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink font-display">Филиалы</h1>
        <p className="text-sm text-muted mt-0.5">Учет филиалов компании</p>
      </div>

      {error && <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2">{error}</div>}

      {canManage && (
        <Panel title="Новый филиал">
          <form onSubmit={onCreate} className="flex flex-wrap gap-3 items-end">
            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1">Название</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input w-56" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1">Адрес</span>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input w-72" />
            </label>
            <button type="submit" className="bg-brand-gradient text-white text-sm font-medium rounded-sm px-4 py-2 hover:brightness-110 transition-all shadow-glow">
              Добавить
            </button>
          </form>
        </Panel>
      )}

      <Panel title={`Все филиалы (${branches.length})`}>
        <ul className="divide-y divide-line">
          {branches.map((b) => (
            <li key={b.id} className="py-2.5 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{b.name}</div>
                {b.address && <div className="text-xs text-muted">{b.address}</div>}
              </div>
              <div className="flex items-center gap-3">
                {b.isArchived ? <Badge tone="rose">В архиве</Badge> : <Badge tone="teal">Активен</Badge>}
                {canManage && (
                  <button onClick={() => toggleArchive(b)} className="text-xs text-muted hover:text-ink">
                    {b.isArchived ? "Восстановить" : "В архив"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
