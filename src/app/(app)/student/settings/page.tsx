"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { apiPatch } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui";

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    address: user?.address ?? "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSuccess("");
    setError("");
    setSaving(true);
    try {
      await apiPatch(`/users/${user?.id}`, form);
      setSuccess("Ma'lumotlar muvaffaqiyatli yangilandi");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Sozlamalar" subtitle="Shaxsiy ma'lumotlaringizni tahrirlash" />

      <Paper className="max-w-lg p-6">
        <Typography variant="subtitle1" fontWeight={700} className="mb-4">
          Shaxsiy ma'lumotlar
        </Typography>

        {success && <Alert severity="success" className="mb-3">{success}</Alert>}
        {error && <Alert severity="error" className="mb-3">{error}</Alert>}

        <Box className="flex flex-col gap-4">
          <Box className="grid grid-cols-2 gap-3">
            <TextField
              label="Ism"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <TextField
              label="Familiya"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Box>
          <TextField
            label="Manzil"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <TextField
            label="Telefon"
            value={user?.phone ?? ""}
            disabled
            helperText="Telefon raqamini o'zgartirish uchun admin bilan bog'laning"
          />
          <TextField
            label="Email"
            value={user?.email ?? ""}
            disabled
            helperText="Emailni o'zgartirish uchun admin bilan bog'laning"
          />
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={{ alignSelf: "flex-start" }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}
