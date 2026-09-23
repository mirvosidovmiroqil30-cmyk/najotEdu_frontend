"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, PageHeader, SideDrawer, SuccessSnackbar } from "@/components/ui";
import type { Course, Status } from "@/lib/types";

const empty = { name: "", description: "", price: 0, durationHours: 1, durationMonths: 1, status: "ACTIVE" as Status };

export default function CoursesPage() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<Course>("/courses");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  function openCreate() { setEditing(null); setForm(empty); setFormError(""); setOpen(true); }
  function openEdit(row: Course) {
    setEditing(row);
    setForm({ name: row.name, description: row.description ?? "", price: Number(row.price), durationHours: row.durationHours, durationMonths: row.durationMonths, status: row.status });
    setFormError(""); setOpen(true);
  }

  async function save() {
    setFormError(""); setSaving(true);
    try {
      if (editing) await apiPatch(`/courses/${editing.id}`, form);
      else await apiPost("/courses", form);
      setSuccessMsg(editing ? "Kurs muvaffaqiyatli yangilandi!" : "Kurs muvaffaqiyatli yaratildi!");
      setOpen(false);
      await reload();
    } catch (err) { setFormError(formatApiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader
        title="Kurslar"
        action={canManage ? <Button variant="contained" onClick={openCreate}>Yangi kurs</Button> : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "name", label: "Nomi" },
            { key: "price", label: "Narx" },
            { key: "durationHours", label: "Soat" },
            { key: "durationMonths", label: "Oy" },
            { key: "status", label: "Holat" },
          ]}
          actions={canManage ? (row) => (
            <>
              <Button size="small" onClick={() => openEdit(row)}>Tahrirlash</Button>
              <DeleteButton onClick={async () => { await apiDelete(`/courses/${row.id}`); await reload(); }} />
            </>
          ) : undefined}
        />
      )}

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Kursni tahrirlash" : "Yangi kurs"}
        subtitle="Bu yerda siz yangi kurs qo'shishingiz mumkin."
        onSave={save}
        saving={saving}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <TextField label="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
        <TextField label="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={3} />
        <TextField type="number" label="Narx" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} fullWidth />
        <TextField type="number" label="Davomiyligi (soat)" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })} fullWidth />
        <TextField type="number" label="Davomiyligi (oy)" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })} fullWidth />
        <TextField select label="Holat" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} fullWidth>
          {["ACTIVE", "INACTIVE", "FREEZE"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </SideDrawer>
    </div>
  );
}
