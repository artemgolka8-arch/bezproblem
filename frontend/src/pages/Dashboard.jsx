import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { StatCard, Panel, Badge } from "../components/ui.jsx";

function formatMoney(n) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "PLN" }).format(n || 0);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

export default function Dashboard() {
  const { token, employee } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .dashboard(token)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink font-display">Здравствуйте, {employee?.firstName}</h1>
        <p className="text-sm text-muted mt-0.5">Обзор текущего состояния системы</p>
      </div>

      {error && <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2">{error}</div>}

      {!data && !error && <div className="text-sm text-muted">Загрузка…</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Клиенты" value={data.clientsCount} />
            <StatCard label="Транспорт всего" value={data.vehiclesCount} />
            <StatCard label="На филиале" value={data.vehiclesAtBranch} tone="teal" />
            <StatCard label="Должники" value={data.debtsOpen} tone="rose" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Общая сумма задолженностей"
              value={formatMoney(data.debtSumTotal)}
              tone="rose"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Ближайшие регламентные работы (7 дней)">
              {data.upcomingMaintenance.length === 0 ? (
                <p className="text-sm text-muted">Ничего не запланировано на ближайшую неделю.</p>
              ) : (
                <ul className="space-y-2">
                  {data.upcomingMaintenance.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <span className="mono">{m.vehicle}</span>
                      <span className="text-muted">{m.workType}</span>
                      <Badge tone="primary">{formatDate(m.nextServiceDue)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Просроченные регламентные работы">
              {data.overdueMaintenance.length === 0 ? (
                <p className="text-sm text-muted">Просроченных работ нет.</p>
              ) : (
                <ul className="space-y-2">
                  {data.overdueMaintenance.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <span className="mono">{m.vehicle}</span>
                      <span className="text-muted">{m.workType}</span>
                      <Badge tone="rose">{formatDate(m.nextServiceDue)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Последние действия в системе">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted">Пока нет записей в журнале.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.recentActivity.map((l) => (
                  <li key={l.id} className="py-2 text-sm flex items-center justify-between">
                    <span>
                      <span className="font-medium">{l.by}</span>{" "}
                      <span className="text-muted">— {l.action} ({l.entityType})</span>
                    </span>
                    <span className="text-xs text-muted mono">
                      {new Date(l.at).toLocaleString("ru-RU")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
