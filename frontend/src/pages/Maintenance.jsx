import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { Panel, Badge, Button } from "../components/ui.jsx";

const emptyForm = {
  vehicleId: "", workType: "", performedAt: "", mileageAtService: "",
  nextMileageDue: "", nextServiceDue: "", cost: "", workshop: "", description: "",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

export default function Maintenance() {
  const { token, hasPermission } = useAuth();
  const canManage = hasPermission("maintenance.manage");

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [due, setDue] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function refresh() {
    api.maintenance
      .list(token, { ...(due ? { due } : {}), ...(vehicleFilter ? { vehicleId: vehicleFilter } : {}) })
      .then((r) => setRecords(r.records))
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [token, due, vehicleFilter]);
  useEffect(() => {
    api.vehicles.list(token, { archived: "false" }).then((r) => setVehicles(r.vehicles)).catch(() => {});
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.maintenance.create(token, form);
      setShowForm(false);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function isOverdue(r) {
    return r.nextServiceDue && new Date(r.nextServiceDue) < new Date();
  }
  function isUpcoming(r) {
    if (!r.nextServiceDue) return false;
    const days = (new Date(r.nextServiceDue) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink font-display">Регламентные работы</h1>
          <p className="text-sm text-muted mt-0.5">История ТО и напоминания по срокам</p>
        </div>
        {canManage && <Button onClick={() => setShowForm((s) => !s)}>+ Новая запись</Button>}
      </div>

      {error && <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2">{error}</div>}

      <Panel>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">ТС</span>
            <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="input">
              <option value="">Все</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.make} {v.model}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">Сроки</span>
            <select value={due} onChange={(e) => setDue(e.target.value)} className="input">
              <option value="">Все записи</option>
              <option value="upcoming">Ближайшие 7 дней</option>
              <option value="overdue">Просроченные</option>
            </select>
          </label>
        </div>
      </Panel>

      {showForm && canManage && (
        <Panel title="Новая запись о работах">
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="ТС*">
              <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="input">
                <option value="">Выберите ТС…</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.make} {v.model}</option>)}
              </select>
            </Field>
            <Field label="Вид работ*"><input required value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })} className="input" placeholder="Замена масла, ТО-1…" /></Field>
            <Field label="Дата выполнения*"><input required type="date" value={form.performedAt} onChange={(e) => setForm({ ...form, performedAt: e.target.value })} className="input" /></Field>
            <Field label="Пробег на момент ТО"><input type="number" value={form.mileageAtService} onChange={(e) => setForm({ ...form, mileageAtService: e.target.value })} className="input" /></Field>
            <Field label="Следующее ТО (пробег)"><input type="number" value={form.nextMileageDue} onChange={(e) => setForm({ ...form, nextMileageDue: e.target.value })} className="input" /></Field>
            <Field label="Следующее ТО (дата)"><input type="date" value={form.nextServiceDue} onChange={(e) => setForm({ ...form, nextServiceDue: e.target.value })} className="input" /></Field>
            <Field label="Стоимость"><input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input" /></Field>
            <Field label="Мастерская"><input value={form.workshop} onChange={(e) => setForm({ ...form, workshop: e.target.value })} className="input" /></Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Описание"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} /></Field>
            </div>
            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
              <Button type="submit">Сохранить</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title={`Записи (${records.length})`}>
        <ul className="divide-y divide-line">
          {records.map((r) => (
            <li key={r.id} className="py-3 text-sm flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium">
                  {r.vehicle?.regNumber} — {r.workType}
                </div>
                <div className="text-xs text-muted">
                  Выполнено: {fmtDate(r.performedAt)}
                  {r.workshop ? ` · ${r.workshop}` : ""}
                  {r.cost ? ` · ${r.cost} PLN` : ""}
                  {r.nextServiceDue ? ` · Следующее ТО: ${fmtDate(r.nextServiceDue)}` : ""}
                </div>
              </div>
              <div>
                {isOverdue(r) && <Badge tone="rose">Просрочено</Badge>}
                {!isOverdue(r) && isUpcoming(r) && <Badge tone="primary">Скоро</Badge>}
              </div>
            </li>
          ))}
          {records.length === 0 && <li className="py-6 text-sm text-muted text-center">Записей нет</li>}
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
