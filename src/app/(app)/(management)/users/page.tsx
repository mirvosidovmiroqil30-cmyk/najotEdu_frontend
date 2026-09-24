"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { apiDelete, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, PageHeader, SideDrawer, SuccessSnackbar } from "@/components/ui";
import type { Role, Status, User } from "@/lib/types";

const empty = {
  firstName: "", lastName: "", phone: "", email: "",
  password: "", role: "ADMIN" as Role, address: "", status: "ACTIVE" as Status,
};

export default function UsersPage() {
  const { hasRole } = useAuth();
  const { data: staff, loading, error, reload } = useApiList<User>("/users?roles=ADMIN,TEACHER,SUPERADMIN");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  async function createUser() {
    setFormError("");
    setSaving(true);
    try {
      await apiPost("/users", form);
      setSuccessMsg("Xodim muvaffaqiyatli yaratildi!");
      setOpen(false);
      setForm(empty);
      await reload();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Xodimlar"
        subtitle="Admin va o'qituvchilar ro'yxati"
        action={
          canManage ? (
            <Button variant="contained" onClick={() => { setForm(empty); setFormError(""); setOpen(true); }}>
              Yangi xodim
            </Button>
          ) : null
        }
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={staff}
          columns={[
            { key: "name", label: "F.I.Sh", render: (u) => `${u.firstName} ${u.lastName}` },
            { key: "phone", label: "Telefon" },
            { key: "email", label: "Email" },
            {
              key: "role", label: "Rol",
              render: (u) => (
                <Chip
                  label={u.role}
                  size="small"
                  color={u.role === "SUPERADMIN" ? "error" : u.role === "ADMIN" ? "warning" : "info"}
                />
              ),
            },
            {
              key: "status", label: "Holat",
              render: (u) => (
                <Chip
                  label={u.status}
                  size="small"
                  color={u.status === "ACTIVE" ? "success" : "error"}
                />
              ),
            },
          ]}
          actions={
            canManage ? (row) => (
              <DeleteButton
                message="Haqiqatan ham bu xodimni o'chirmoqchimisiz?"
                onClick={async () => {
                  try { await apiDelete(`/users/${row.id}`); await reload(); }
                  catch (err) { alert(formatApiError(err)); }
                }}
              />
            ) : undefined
          }
        />
      )}

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Yangi xodim"
        subtitle="Admin yoki o'qituvchi qo'shish."
        onSave={createUser}
        saving={saving}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <TextField label="Ism" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} fullWidth />
        <TextField label="Familiya" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} fullWidth />
        <TextField label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
        <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
        <TextField label="Parol" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} fullWidth />
        <TextField select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} fullWidth>
          {["ADMIN", "TEACHER"].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <TextField label="Manzil" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
      </SideDrawer>
    </div>
  );
}
