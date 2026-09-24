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
import type { Group, Lesson, Status } from "@/lib/types";

const empty = { groupId: 0, teacherId: 0, topic: "", description: "", status: "ACTIVE" as Status };

export default function LessonsPage() {
  const { user, hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<Lesson>("/lessons");
  const { data: groups } = useApiList<Group>((open && hasRole("SUPERADMIN", "ADMIN", "TEACHER")) ? "/groups" : null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = hasRole("SUPERADMIN", "ADMIN", "TEACHER");

  function openCreate() {
    setEditing(null);
    setForm({ ...empty, groupId: groups[0]?.id ?? 0, teacherId: user?.id ?? 0 });
    setFormError(""); setOpen(true);
  }
  function openEdit(row: Lesson) {
    setEditing(row);
    setForm({ groupId: row.groupId, teacherId: row.teacherId, topic: row.topic, description: row.description ?? "", status: row.status });
    setFormError(""); setOpen(true);
  }

  async function save() {
    setFormError(""); setSaving(true);
    try {
      const payload = { ...form, groupId: Number(form.groupId), teacherId: Number(form.teacherId) };
      if (editing) await apiPatch(`/lessons/${editing.id}`, payload);
      else await apiPost("/lessons", payload);
      setSuccessMsg(editing ? "Dars muvaffaqiyatli yangilandi!" : "Dars muvaffaqiyatli yaratildi!");
      setOpen(false);
      await reload();
    } catch (err) { setFormError(formatApiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader
        title="Darslar"
        action={canManage ? <Button variant="contained" onClick={openCreate}>Yangi dars</Button> : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "topic", label: "Mavzu" },
            { key: "group", label: "Guruh", render: (l) => l.group?.name ?? l.groupId },
            { key: "teacher", label: "O'qituvchi", render: (l) => l.teacher ? `${l.teacher.firstName} ${l.teacher.lastName}` : l.teacherId },
            { key: "status", label: "Holat" },
          ]}
          actions={canManage ? (row) => (
            <>
              <Button size="small" onClick={() => openEdit(row)}>Tahrirlash</Button>
              {hasRole("SUPERADMIN", "ADMIN") && (
                <DeleteButton onClick={async () => { await apiDelete(`/lessons/${row.id}`); await reload(); }} />
              )}
            </>
          ) : undefined}
        />
      )}

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Darsni tahrirlash" : "Yangi dars"}
        subtitle="Bu yerda dars ma'lumotlarini kiriting."
        onSave={save}
        saving={saving}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <TextField select label="Guruh" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: Number(e.target.value) })} fullWidth>
          {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
        </TextField>
        <TextField type="number" label="O'qituvchi ID" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: Number(e.target.value) })} fullWidth />
        <TextField label="Mavzu" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} fullWidth />
        <TextField label="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={3} />
      </SideDrawer>
    </div>
  );
}
