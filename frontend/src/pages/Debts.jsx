import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { Panel, Badge, Button } from "../components/ui.jsx";

const STATUS_LABELS = {
  NEW: "Новая",
  PARTIALLY_PAID: "Частично оплачена",
  PAID: "Погашена",
  OVERDUE: "Просрочена",
  IN_COLLECTION: "Взыскание",
};

const STATUS_TONE = {
  NEW: "neutral",
  PARTIALLY_PAID: "primary",
  PAID: "teal",
  OVERDUE: "rose",
  IN_COLLECTION: "rose",
};

const emptyForm = { clientId: "", amount: "", reason: "", dueDate: "", comment: "" };

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

export default function Debts() {
  const { token, hasPermission } = useAuth();
  const canManage = hasPermission("debts.manage");

  const [debts, setDebts] = useState([]);
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  function refresh() {
    api.debts
      .list(token, statusFilter ? { status: statusFilter } : {})
      .then((r) => setDebts(r.debts))
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [token, statusFilter]);
  useEffect(() => {
    api.debts.statuses(token).then((r) => setStatuses(r.statuses)).catch(() => {});
    if (canManage) {
      api.clients.list(token, { archived: "false" }).then((r) => setClients(r.clients)).catch(() => {});
    }
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.debts.create(token, form);
      setShowForm(false);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(d, status) {
    try {
      await api.debts.update(token, d.id, { status });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onPay(d) {
    if (!payAmount || Number(payAmount) <= 0) return;
    try {
      await api.debts.addPayment(token, d.id, { amount: payAmount });
      setPayingId(null);
      setPayAmount("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalOpen = debts
    .filter((d) => d.status !== "PAID")
    .reduce((s, d) => s + d.remaining, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink font-display">Должники</h1>
          <p className="text-sm text-muted mt-0.5">
            Открытых задолженностей на сумму: <span className="mono font-medium text-ink">{totalOpen.toFixed(2)} PLN</span>
          </p>
        </div>
        {canManage && <Button onClick={() => setShowForm((s) => !s)}>+ Новая задолженность</Button>}
      </div>

      {error && <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2">{error}</div>}

      <Panel>
        <label className="block w-64">
          <span className="block text-xs font-medium text-muted mb-1">Статус</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="">Все</option>
            {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
          </select>
        </label>
      </Panel>

      {showForm && canManage && (
        <Panel title="Новая задолженность">
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Клиент*">
              <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input">
                <option value="">Выберите клиента…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.lastName} {c.firstName}</option>)}
              </select>
            </Field>
            <Field label="Сумма*"><input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" /></Field>
            <Field label="Срок оплаты"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" /></Field>
            <Field label="Причина"><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input" /></Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Комментарий"><textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="input" rows={2} /></Field>
            </div>
            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
              <Button type="submit">Добавить</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title={`Задолженности (${debts.length})`}>
        <ul className="divide-y divide-line">
          {debts.map((d) => (
            <li key={d.id} className="py-3 text-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium">{d.client?.lastName} {d.client?.firstName} — {d.amount} PLN</div>
                  <div className="text-xs text-muted">
                    {d.reason ? `${d.reason} · ` : ""}Возникла: {fmtDate(d.incurredAt)}
                    {d.dueDate ? ` · Срок: ${fmtDate(d.dueDate)}` : ""}
                    {d.paid > 0 ? ` · Оплачено: ${d.paid.toFixed(2)} PLN` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canManage ? (
                    <select value={d.status} onChange={(e) => changeStatus(d, e.target.value)} className="input !w-auto text-xs py-1">
                      {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                    </select>
                  ) : (
                    <Badge tone={STATUS_TONE[d.status] || "neutral"}>{STATUS_LABELS[d.status] || d.status}</Badge>
                  )}
                  {canManage && d.status !== "PAID" && (
                    <button onClick={() => { setPayingId(payingId === d.id ? null : d.id); setPayAmount(""); }} className="text-xs text-muted hover:text-ink">
                      Платеж
                    </button>
                  )}
                </div>
              </div>
              {payingId === d.id && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Остаток: ${d.remaining.toFixed(2)}`}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="input !w-40 text-xs"
                  />
                  <Button variant="ghost" onClick={() => onPay(d)}>Внести</Button>
                </div>
              )}
            </li>
          ))}
          {debts.length === 0 && <li className="py-6 text-sm text-muted text-center">Задолженностей нет</li>}
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
