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
import type { Room, Status } from "@/lib/types";

const empty = { name: "", capacity: 10, status: "ACTIVE" as Status };

export default function RoomsPage() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<Room>("/rooms");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  function openCreate() { setEditing(null); setForm(empty); setFormError(""); setOpen(true); }
  function openEdit(row: Room) {
    setEditing(row);
    setForm({ name: row.name, capacity: row.capacity, status: row.status });
    setFormError(""); setOpen(true);
  }

  async function save() {
    setFormError(""); setSaving(true);
    try {
      if (editing) await apiPatch(`/rooms/${editing.id}`, form);
      else await apiPost("/rooms", form);
      setSuccessMsg(editing ? "Xona muvaffaqiyatli yangilandi!" : "Xona muvaffaqiyatli yaratildi!");
      setOpen(false);
      await reload();
    } catch (err) { setFormError(formatApiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader
        title="Xonalar"
        action={canManage ? <Button variant="contained" onClick={openCreate}>Yangi xona</Button> : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "name", label: "Nomi" },
            { key: "capacity", label: "Sig'im" },
            { key: "status", label: "Holat" },
          ]}
          actions={canManage ? (row) => (
            <>
              <Button size="small" onClick={() => openEdit(row)}>Tahrirlash</Button>
              <DeleteButton onClick={async () => { await apiDelete(`/rooms/${row.id}`); await reload(); }} />
            </>
          ) : undefined}
        />
      )}

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Xonani tahrirlash" : "Yangi xona"}
        subtitle="Bu yerda xona ma'lumotlarini kiriting."
        onSave={save}
        saving={saving}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <TextField label="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
        <TextField type="number" label="Sig'im" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} fullWidth />
        <TextField select label="Holat" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} fullWidth>
          {["ACTIVE", "INACTIVE", "FREEZE"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </SideDrawer>
    </div>
  );
}
