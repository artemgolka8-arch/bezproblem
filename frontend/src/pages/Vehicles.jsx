import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { Panel, Badge, Button } from "../components/ui.jsx";

const STATUS_LABELS = {
  AT_BRANCH: "На филиале",
  ISSUED_TO_CLIENT: "У клиента",
  IN_REPAIR: "В ремонте",
  IN_SERVICE: "На ТО",
  RESERVED: "Забронировано",
  UNAVAILABLE: "Недоступно",
  SOLD_OFF: "Продано",
};

const STATUS_TONE = {
  AT_BRANCH: "teal",
  ISSUED_TO_CLIENT: "primary",
  IN_REPAIR: "rose",
  IN_SERVICE: "rose",
  RESERVED: "neutral",
  UNAVAILABLE: "neutral",
  SOLD_OFF: "neutral",
};

const emptyForm = { regNumber: "", make: "", model: "", year: "", vin: "", type: "", branchId: "", mileage: "", condition: "", notes: "" };

export default function Vehicles() {
  const { token, hasPermission } = useAuth();
  const canManage = hasPermission("vehicles.manage");

  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [assignClientId, setAssignClientId] = useState("");

  function refresh() {
    api.vehicles
      .list(token, { q, ...(statusFilter ? { status: statusFilter } : {}), archived: "false" })
      .then((r) => setVehicles(r.vehicles))
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [token, statusFilter]);
  useEffect(() => {
    api.branches.list(token).then((r) => setBranches(r.branches)).catch(() => {});
    api.vehicles.statuses(token).then((r) => setStatuses(r.statuses)).catch(() => {});
    if (canManage) {
      api.clients.list(token, { archived: "false" }).then((r) => setClients(r.clients)).catch(() => {});
    }
  }, [token]);

  function onSearchSubmit(e) {
    e.preventDefault();
    refresh();
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(v) {
    setEditingId(v.id);
    setForm({
      regNumber: v.regNumber, make: v.make, model: v.model, year: v.year || "",
      vin: v.vin || "", type: v.type || "", branchId: v.branch?.id || "",
      mileage: v.mileage || "", condition: v.condition || "", notes: v.notes || "",
    });
    setShowForm(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.vehicles.update(token, editingId, form);
      } else {
        await api.vehicles.create(token, form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(v, status) {
    try {
      await api.vehicles.update(token, v.id, { status });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onAssign(v) {
    if (!assignClientId) return;
    try {
      await api.vehicles.assign(token, v.id, { clientId: assignClientId });
      setAssigningId(null);
      setAssignClientId("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onReturn(v) {
    try {
      await api.vehicles.returnVehicle(token, v.id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink font-display">Транспорт</h1>
          <p className="text-sm text-muted mt-0.5">Учет транспортных средств и их статусов</p>
        </div>
        {canManage && <Button onClick={startCreate}>+ Новое ТС</Button>}
      </div>

      {error && <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2">{error}</div>}

      <Panel>
        <form onSubmit={onSearchSubmit} className="flex flex-wrap gap-3 items-end">
          <label className="block flex-1 min-w-[220px]">
            <span className="block text-xs font-medium text-muted mb-1">Поиск</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Номер, марка, модель, VIN…" className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">Статус</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">Все</option>
              {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
          </label>
          <Button type="submit" variant="ghost">Найти</Button>
        </form>
      </Panel>

      {showForm && canManage && (
        <Panel title={editingId ? "Редактирование ТС" : "Новое ТС"}>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Гос. номер*"><input required value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} className="input" /></Field>
            <Field label="Марка*"><input required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="input" /></Field>
            <Field label="Модель*"><input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input" /></Field>
            <Field label="Год"><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input" /></Field>
            <Field label="VIN"><input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="input" /></Field>
            <Field label="Тип"><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input" /></Field>
            <Field label="Филиал">
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="input">
                <option value="">—</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Пробег (км)"><input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="input" /></Field>
            <Field label="Состояние"><input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="input" /></Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Заметки"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} /></Field>
            </div>
            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
              <Button type="submit">{editingId ? "Сохранить" : "Добавить"}</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Отмена</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title={`ТС (${vehicles.length})`}>
        <ul className="divide-y divide-line">
          {vehicles.map((v) => (
            <li key={v.id} className="py-3 text-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium mono">{v.regNumber} <span className="font-sans font-normal">— {v.make} {v.model}{v.year ? ` (${v.year})` : ""}</span></div>
                  <div className="text-xs text-muted">
                    {[v.branch?.name, v.mileage ? `${v.mileage} км` : null, v.currentClient ? `у клиента: ${v.currentClient.lastName} ${v.currentClient.firstName}` : null]
                      .filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canManage ? (
                    <select
                      value={v.status}
                      onChange={(e) => changeStatus(v, e.target.value)}
                      className="input !w-auto text-xs py-1"
                    >
                      {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                    </select>
                  ) : (
                    <Badge tone={STATUS_TONE[v.status] || "neutral"}>{STATUS_LABELS[v.status] || v.status}</Badge>
                  )}
                  {canManage && !v.currentClient && (
                    <button onClick={() => { setAssigningId(assigningId === v.id ? null : v.id); setAssignClientId(""); }} className="text-xs text-muted hover:text-ink">
                      Выдать
                    </button>
                  )}
                  {canManage && v.currentClient && (
                    <button onClick={() => onReturn(v)} className="text-xs text-muted hover:text-ink">Принять обратно</button>
                  )}
                  {canManage && (
                    <button onClick={() => startEdit(v)} className="text-xs text-muted hover:text-ink">Изменить</button>
                  )}
                </div>
              </div>

              {assigningId === v.id && (
                <div className="mt-2 flex items-center gap-2">
                  <select value={assignClientId} onChange={(e) => setAssignClientId(e.target.value)} className="input !w-64 text-xs">
                    <option value="">Выберите клиента…</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.lastName} {c.firstName}</option>)}
                  </select>
                  <Button variant="ghost" onClick={() => onAssign(v)}>Подтвердить</Button>
                </div>
              )}
            </li>
          ))}
          {vehicles.length === 0 && <li className="py-6 text-sm text-muted text-center">Ничего не найдено</li>}
        </ul>
      </Panel>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
