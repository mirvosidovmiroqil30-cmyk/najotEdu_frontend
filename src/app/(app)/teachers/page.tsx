"use client";

import { useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PhotoCameraRounded from "@mui/icons-material/PhotoCameraRounded";
import { apiDelete, apiPatch, apiPost, apiUpload } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import {
  DataTable,
  DeleteButton,
  LoadingState,
  PageHeader,
  SideDrawer,
  SuccessSnackbar,
} from "@/components/ui";
import type { Group, Status, User } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const empty = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  address: "",
  status: "ACTIVE" as Status,
  photo: "",
  groupIds: [] as number[],
};

export default function TeachersPage() {
  const { hasRole } = useAuth();
  const { data: allUsers, loading, error, reload } = useApiList<User>("/users");
  const { data: groups } = useApiList<Group>("/groups");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  const teachers = allUsers.filter((u) => u.role === "TEACHER");

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
      photo: user.photo ?? "",
      groupIds: [],
    });
    setFormError("");
    setOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ url: string }>("/upload/image", fd);
      setForm((prev) => ({ ...prev, photo: res.url }));
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setUploading(false);
    }
  }

  function toggleGroup(id: number) {
    setForm((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(id)
        ? prev.groupIds.filter((g) => g !== id)
        : [...prev.groupIds, id],
    }));
  }

  async function save() {
    setFormError("");
    setSaving(true);
    try {
      if (editing) {
        const payload: any = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          status: form.status,
          photo: form.photo || undefined,
        };
        if (form.password) payload.password = form.password;
        await apiPatch(`/users/${editing.id}`, payload);
        setSuccessMsg("O'qituvchi muvaffaqiyatli yangilandi!");
      } else {
        await apiPost("/users", {
          ...form,
          role: "TEACHER",
          photo: form.photo || undefined,
          groupIds: form.groupIds.length > 0 ? form.groupIds : undefined,
        });
        setSuccessMsg("O'qituvchi muvaffaqiyatli yaratildi!");
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
        title="O'qituvchilar"
        subtitle="Barcha o'qituvchilar ro'yxati"
        action={
          canManage ? (
            <Button variant="contained" onClick={openCreate}>
              Yangi o'qituvchi
            </Button>
          ) : null
        }
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? (
        <LoadingState />
      ) : (
        <DataTable
          rows={teachers}
          columns={[
            {
              key: "photo",
              label: "",
              render: (u) => (
                <Avatar
                  src={u.photo ? `${API_URL}${u.photo}` : undefined}
                  sx={{ width: 32, height: 32, bgcolor: "#F5C400", color: "#111827" }}
                >
                  {u.firstName[0]}
                </Avatar>
              ),
            },
            { key: "name", label: "F.I.Sh", render: (u) => `${u.firstName} ${u.lastName}` },
            { key: "phone", label: "Telefon" },
            { key: "email", label: "Email" },
            {
              key: "status",
              label: "Holat",
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
            canManage
              ? (row) => (
                  <>
                    <Button size="small" onClick={() => openEdit(row)}>
                      Tahrirlash
                    </Button>
                    <DeleteButton
                      message="Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?"
                      onClick={async () => {
                        try {
                          await apiDelete(`/users/${row.id}`);
                          await reload();
                        } catch (err) {
                          alert(formatApiError(err));
                        }
                      }}
                    />
                  </>
                )
              : undefined
          }
        />
      )}

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}
        subtitle={
          editing
            ? "O'qituvchi ma'lumotlarini yangilang."
            : "Bu yerda yangi o'qituvchi yaratishingiz mumkin."
        }
        onSave={save}
        saving={saving || uploading}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}

        {/* Rasm yuklash */}
        <Box className="flex flex-col items-center gap-2">
          <Avatar
            src={
              form.photo
                ? form.photo.startsWith("http")
                  ? form.photo
                  : `${API_URL}${form.photo}`
                : undefined
            }
            sx={{ width: 80, height: 80, bgcolor: "#F5C400", color: "#111827", fontSize: 28 }}
          >
            {form.firstName?.[0] ?? "?"}
          </Avatar>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PhotoCameraRounded />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
          {form.photo && (
            <Typography variant="caption" color="success.main">
              Rasm yuklandi ✓
            </Typography>
          )}
        </Box>

        <TextField
          label="Ism"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          fullWidth
        />
        <TextField
          label="Familiya"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          fullWidth
        />
        <TextField
          label="Telefon"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          fullWidth
        />
        <TextField
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          fullWidth
        />
        <TextField
          label={editing ? "Yangi parol (bo'sh qoldiring — o'zgarmaydi)" : "Parol"}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          fullWidth
        />
        <TextField
          label="Manzil"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          fullWidth
        />
        <TextField
          select
          label="Holat"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
          fullWidth
        >
          {["ACTIVE", "INACTIVE", "FREEZE"].map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>

        {/* Guruhga biriktirish — faqat yangi yaratishda */}
        {!editing && groups.length > 0 && (
          <Box>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: "text.primary" }}>
              Guruhlarga biriktirish (ixtiyoriy)
            </FormLabel>
            <FormGroup>
              {groups.map((g) => (
                <FormControlLabel
                  key={g.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.groupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {g.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {g.course?.name} · {g.startTime}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        )}
      </SideDrawer>
    </div>
  );
}
