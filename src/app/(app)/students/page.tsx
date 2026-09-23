"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, PageHeader, SideDrawer, SuccessSnackbar } from "@/components/ui";
import type { Status, User } from "@/lib/types";

const empty = {
  firstName: "", lastName: "", phone: "", email: "",
  password: "", address: "", status: "ACTIVE" as Status,
};

export default function StudentsPage() {
  const { hasRole } = useAuth();
  const { data: allUsers, loading, error, reload } = useApiList<User>("/users");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  const students = allUsers.filter((u) => u.role === "STUDENT");

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFormError("");
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      password: "",
      address: user.address ?? "",
      status: user.status,
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    setFormError("");
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { ...form };
        if (!payload.password) delete payload.password;
        await apiPatch(`/users/${editing.id}`, payload);
        setSuccessMsg("Talaba muvaffaqiyatli yangilandi!");
      } else {
        await apiPost("/users", { ...form, role: "STUDENT" });
        setSuccessMsg("Talaba muvaffaqiyatli yaratildi!");
      }
      setOpen(false);
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
        title="Talabalar"
        subtitle="Barcha talabalar ro'yxati"
        action={canManage ? <Button variant="contained" onClick={openCreate}>Yangi talaba</Button> : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={students}
          columns={[
            { key: "name", label: "F.I.Sh", render: (u) => `${u.firstName} ${u.lastName}` },
            { key: "phone", label: "Telefon" },
            { key: "email", label: "Email" },
            { key: "status", label: "Holat", render: (u) => (
              <Chip
                label={u.status} size="small"
                color={u.status === "ACTIVE" ? "success" : u.status === "FREEZE" ? "warning" : "error"}
              />
            )},
          ]}
          actions={canManage ? (row) => (
            <>
              <Button size="small" onClick={() => openEdit(row)}>Tahrirlash</Button>
              <DeleteButton
                message="Haqiqatan ham bu talabani o'chirmoqchimisiz?"
                onClick={async () => {
                  try { await apiDelete(`/users/${row.id}`); await reload(); }
                  catch (err) { alert(formatApiError(err)); }
                }}
              />
            </>
          ) : undefined}
        />
      )}

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Talabani tahrirlash" : "Yangi talaba"}
        subtitle={editing ? "Talaba ma'lumotlarini yangilang." : "Bu yerda yangi talaba yaratishingiz mumkin."}
        onSave={save}
        saving={saving}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <TextField label="Ism" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} fullWidth />
        <TextField label="Familiya" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} fullWidth />
        <TextField label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
        <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
        <TextField
          label={editing ? "Yangi parol (o'zgartirmasangiz bo'sh qoldiring)" : "Parol"}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          fullWidth
        />
        <TextField label="Manzil" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
        <TextField select label="Holat" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} fullWidth>
          {["ACTIVE", "INACTIVE", "FREEZE"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </SideDrawer>
    </div>
  );
}
