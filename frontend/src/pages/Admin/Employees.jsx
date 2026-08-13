import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../api/client.js";
import { Panel, Badge } from "../../components/ui.jsx";

const emptyForm = { firstName: "", lastName: "", email: "", password: "", roleId: "", branchId: "" };

export default function Employees() {
  const { token, employee: me, hasPermission } = useAuth();
  const canManage = hasPermission("employees.manage");

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [empRes, roleRes, branchRes] = await Promise.all([
      api.employees.list(token),
      api.employees.roles(token),
      api.branches.list(token),
    ]);
    setEmployees(empRes.employees);
    setRoles(roleRes.roles);
    setBranches(branchRes.branches);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [token]);

  function startEdit(emp) {
    setEditingId(emp.id);
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      password: "",
      roleId: emp.role?.id || "",
      branchId: emp.branch?.id || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editingId) {
        await api.employees.update(token, editingId, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          roleId: form.roleId,
          branchId: form.branchId,
        });
      } else {
        await api.employees.create(token, form);
      }
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(emp) {
    try {
      await api.employees.setActive(token, emp.id, !emp.isActive);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeEmployee(emp) {
    if (!confirm(`Удалить сотрудника ${emp.firstName} ${emp.lastName}?`)) return;
    try {
      await api.employees.remove(token, emp.id);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(emp) {
    const newPassword = prompt(`Новый пароль для ${emp.email} (мин. 8 символов):`);
    if (!newPassword) return;
    try {
      await api.employees.resetPassword(token, emp.id, newPassword);
      alert("Пароль обновлен.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink font-display">Сотрудники</h1>
        <p className="text-sm text-muted mt-0.5">Управление учетными записями и правами доступа</p>
      </div>

      {error && <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2">{error}</div>}

      {canManage && (
        <Panel title={editingId ? "Редактировать сотрудника" : "Новый сотрудник"}>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Имя">
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" />
            </Field>
            <Field label="Фамилия">
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" />
            </Field>
            <Field label="Email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </Field>
            {!editingId && (
              <Field label="Пароль">
                <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
              </Field>
            )}
            <Field label="Роль">
              <select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="input">
                <option value="">Выберите роль</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Филиал">
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="input">
                <option value="">Без привязки</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2 flex gap-2 pt-1">
              <button disabled={busy} type="submit" className="bg-brand-gradient text-white text-sm font-medium rounded-sm px-4 py-2 hover:brightness-110 transition-all shadow-glow disabled:opacity-50">
                {editingId ? "Сохранить" : "Создать сотрудника"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="text-sm text-muted px-4 py-2 hover:text-ink">
                  Отмена
                </button>
              )}
            </div>
          </form>
        </Panel>
      )}

      <Panel title={`Все сотрудники (${employees.length})`}>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                <th className="px-5 py-2 font-medium">Имя</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Роль</th>
                <th className="px-5 py-2 font-medium">Филиал</th>
                <th className="px-5 py-2 font-medium">Статус</th>
                <th className="px-5 py-2 font-medium">Последний вход</th>
                {canManage && <th className="px-5 py-2 font-medium">Действия</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="px-5 py-2.5">{emp.firstName} {emp.lastName}</td>
                  <td className="px-5 py-2.5 text-muted">{emp.email}</td>
                  <td className="px-5 py-2.5">{emp.role?.label}</td>
                  <td className="px-5 py-2.5 text-muted">{emp.branch?.name || "—"}</td>
                  <td className="px-5 py-2.5">
                    {emp.isActive ? <Badge tone="teal">Активен</Badge> : <Badge tone="rose">Заблокирован</Badge>}
                  </td>
                  <td className="px-5 py-2.5 text-muted text-xs mono">
                    {emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleString("ru-RU") : "никогда"}
                  </td>
                  {canManage && (
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      <div className="flex gap-3 text-xs">
                        <button onClick={() => startEdit(emp)} className="text-muted hover:text-ink">Изменить</button>
                        <button onClick={() => toggleActive(emp)} className="text-muted hover:text-ink">
                          {emp.isActive ? "Заблокировать" : "Разблокировать"}
                        </button>
                        <button onClick={() => resetPassword(emp)} className="text-muted hover:text-ink">Сбросить пароль</button>
                        {emp.id !== me.id && (
                          <button onClick={() => removeEmployee(emp)} className="text-rose hover:text-rose">Удалить</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
