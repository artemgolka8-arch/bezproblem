import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { Panel, Badge, Button } from "../components/ui.jsx";

const emptyForm = {
  firstName: "", lastName: "", email: "", phone: "", city: "", drivingCity: "",
  pesel: "", documentNumber: "", department: "", bankAccount: "", notes: "",
};

export default function Clients() {
  const { token, hasPermission } = useAuth();
  const canManage = hasPermission("clients.manage");

  const [clients, setClients] = useState([]);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);

  function refresh() {
    api.clients
      .list(token, { q, archived: showArchived ? "true" : "false" })
      .then((r) => setClients(r.clients))
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [token, showArchived]);

  function onSearchSubmit(e) {
    e.preventDefault();
    refresh();
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      firstName: c.firstName || "", lastName: c.lastName || "", email: c.email || "",
      phone: c.phone || "", city: c.city || "", drivingCity: c.drivingCity || "",
      pesel: c.pesel || "", documentNumber: c.documentNumber || "", department: c.department || "",
      bankAccount: c.bankAccount || "", notes: c.notes || "",
    });
    setShowForm(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.clients.update(token, editingId, form);
      } else {
        await api.clients.create(token, form);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleArchive(c) {
    await api.clients.update(token, c.id, { isArchived: !c.isArchived });
    refresh();
  }

  async function toggleExpand(c) {
    if (expandedId === c.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(c.id);
    const r = await api.clients.get(token, c.id);
    setDetail(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink font-display">Клиенты</h1>
          <p className="text-sm text-muted mt-0.5">База клиентов компании</p>
        </div>
        {canManage && (
          <Button onClick={startCreate}>+ Новый клиент</Button>
        )}
      </div>

      {error && <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2">{error}</div>}

      <Panel>
        <form onSubmit={onSearchSubmit} className="flex flex-wrap gap-3 items-end">
          <label className="block flex-1 min-w-[220px]">
            <span className="block text-xs font-medium text-muted mb-1">Поиск</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Имя, фамилия, телефон, email, PESEL…"
              className="input"
            />
          </label>
          <Button type="submit" variant="ghost">Найти</Button>
          <label className="flex items-center gap-2 text-sm text-muted pb-2">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Показать архив
          </label>
        </form>
      </Panel>

      {showForm && canManage && (
        <Panel title={editingId ? "Редактирование клиента" : "Новый клиент"}>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Имя*"><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" /></Field>
            <Field label="Фамилия*"><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" /></Field>
            <Field label="Телефон"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></Field>
            <Field label="Город"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" /></Field>
            <Field label="Город вождения"><input value={form.drivingCity} onChange={(e) => setForm({ ...form, drivingCity: e.target.value })} className="input" /></Field>
            <Field label="PESEL"><input value={form.pesel} onChange={(e) => setForm({ ...form, pesel: e.target.value })} className="input" /></Field>
            <Field label="Номер документа"><input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} className="input" /></Field>
            <Field label="Отдел"><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input" /></Field>
            <Field label="Банковский счет"><input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className="input" /></Field>
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

      <Panel title={`Клиенты (${clients.length})`}>
        <ul className="divide-y divide-line">
          {clients.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                <button onClick={() => toggleExpand(c)} className="text-left">
                  <div className="font-medium">{c.lastName} {c.firstName}</div>
                  <div className="text-xs text-muted">
                    {[c.phone, c.email, c.city].filter(Boolean).join(" · ") || "Нет контактных данных"}
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  {c.debtCount > 0 && <Badge tone="rose">{c.debtCount} долг(ов)</Badge>}
                  {c.vehicleCount > 0 && <Badge tone="primary">{c.vehicleCount} ТС</Badge>}
                  {c.isArchived ? <Badge tone="rose">В архиве</Badge> : <Badge tone="teal">Активен</Badge>}
                  {canManage && (
                    <>
                      <button onClick={() => startEdit(c)} className="text-xs text-muted hover:text-ink">Изменить</button>
                      <button onClick={() => toggleArchive(c)} className="text-xs text-muted hover:text-ink">
                        {c.isArchived ? "Восстановить" : "В архив"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedId === c.id && detail && (
                <div className="mt-3 bg-surface rounded-sm p-3 text-xs space-y-3">
                  <div>
                    <div className="font-medium text-muted mb-1">Транспорт</div>
                    {detail.vehicleAssignments.length === 0 && <div className="text-muted">Нет записей</div>}
                    {detail.vehicleAssignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-1">
                        <span>{a.vehicle.regNumber} — {a.vehicle.make} {a.vehicle.model}</span>
                        <span className="text-muted">{a.returnedAt ? "возвращено" : "на руках"}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-medium text-muted mb-1">Задолженности</div>
                    {detail.debts.length === 0 && <div className="text-muted">Нет записей</div>}
                    {detail.debts.map((d) => (
                      <div key={d.id} className="flex items-center justify-between py-1">
                        <span>{d.reason || "Без причины"} — {d.amount} PLN</span>
                        <Badge tone={d.status === "PAID" ? "teal" : "rose"}>{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                  {c.notes && (
                    <div>
                      <div className="font-medium text-muted mb-1">Заметки</div>
                      <div>{c.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
          {clients.length === 0 && <li className="py-6 text-sm text-muted text-center">Ничего не найдено</li>}
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
