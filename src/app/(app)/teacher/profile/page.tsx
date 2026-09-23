"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PhotoCameraRounded from "@mui/icons-material/PhotoCameraRounded";
import { useRef } from "react";
import { apiPatch, apiUpload } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { PageHeader, SuccessSnackbar } from "@/components/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    address: user?.address ?? "",
    photo: user?.photo ?? "",
  });
  const [password, setPassword] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ url: string }>("/upload/image", fd);
      setForm((prev) => ({ ...prev, photo: res.url }));
      await apiPatch(`/users/${user?.id}`, { photo: res.url });
      setSuccessMsg("Profil rasmi yangilandi!");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    setError(""); setSaving(true);
    try {
      await apiPatch(`/users/${user?.id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        address: form.address,
      });
      setSuccessMsg("Profil muvaffaqiyatli yangilandi!");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (password.new !== password.confirm) {
      setError("Yangi parollar mos kelmaydi");
      return;
    }
    if (password.new.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setError(""); setSaving(true);
    try {
      await apiPatch(`/users/${user?.id}`, { password: password.new });
      setPassword({ current: "", new: "", confirm: "" });
      setSuccessMsg("Parol muvaffaqiyatli o'zgartirildi!");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profil" subtitle="Shaxsiy ma'lumotlaringizni boshqarish" />

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chap — Avatar */}
        <Paper className="flex flex-col items-center gap-4 p-6">
          <Avatar
            src={form.photo ? (form.photo.startsWith("http") ? form.photo : `${API_URL}${form.photo}`) : undefined}
            sx={{ width: 100, height: 100, bgcolor: "#F5C400", color: "#111827", fontSize: 36 }}
          >
            {user?.firstName?.[0]}
          </Avatar>

          <Box className="text-center">
            <Typography variant="h6" fontWeight={700}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip label="TEACHER" size="small" color="info" className="mt-1" />
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PhotoCameraRounded />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            fullWidth
          >
            {uploading ? "Yuklanmoqda..." : "Rasm o'zgartirish"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />

          <Box className="w-full space-y-1 text-sm" sx={{ borderTop: "1px solid #E5E7EB", pt: 2 }}>
            <Box className="flex justify-between">
              <Typography variant="caption" color="text.secondary">Telefon</Typography>
              <Typography variant="caption" fontWeight={600}>{user?.phone}</Typography>
            </Box>
            <Box className="flex justify-between">
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="caption" fontWeight={600}>{user?.email}</Typography>
            </Box>
            <Box className="flex justify-between">
              <Typography variant="caption" color="text.secondary">Holat</Typography>
              <Chip label={user?.status} size="small" color={user?.status === "ACTIVE" ? "success" : "error"} />
            </Box>
          </Box>
        </Paper>

        {/* O'ng — Ma'lumotlar va parol */}
        <Box className="space-y-4 lg:col-span-2">
          {/* Shaxsiy ma'lumotlar */}
          <Paper className="p-5">
            <Typography variant="subtitle1" fontWeight={700} className="mb-4">
              Shaxsiy ma'lumotlar
            </Typography>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                value={user?.phone ?? ""}
                disabled
                helperText="Admin orqali o'zgartiriladi"
                fullWidth
              />
              <TextField
                label="Email"
                value={user?.email ?? ""}
                disabled
                helperText="Admin orqali o'zgartiriladi"
                fullWidth
              />
              <TextField
                label="Manzil"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                fullWidth
                className="sm:col-span-2"
              />
            </div>
            <Box className="mt-4 flex justify-end">
              <Button variant="contained" onClick={saveProfile} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </Box>
          </Paper>

          {/* Parol o'zgartirish */}
          <Paper className="p-5">
            <Typography variant="subtitle1" fontWeight={700} className="mb-4">
              Parolni o'zgartirish
            </Typography>
            <div className="flex flex-col gap-3">
              <TextField
                label="Yangi parol"
                type="password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                fullWidth
              />
              <TextField
                label="Yangi parolni tasdiqlang"
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                fullWidth
              />
            </div>
            <Box className="mt-4 flex justify-end">
              <Button
                variant="contained"
                color="warning"
                onClick={changePassword}
                disabled={saving || !password.new}
              >
                Parolni o'zgartirish
              </Button>
            </Box>
          </Paper>
        </Box>
      </div>

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
    </div>
  );
}
