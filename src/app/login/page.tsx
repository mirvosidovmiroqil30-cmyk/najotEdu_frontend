"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { formatApiError, useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, loading, user } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Faqat initial auth loading paytida yashirish
  if (loading) return null;
  // User allaqachon login bo'lgan — redirect useEffect qiladi
  if (user) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(phone, password);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box className="flex min-h-screen items-center justify-center bg-[#111827] p-4">
      <Paper className="w-full max-w-md p-8">
        <Box className="mb-6 flex items-center gap-3">
          <Box className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C400] text-xl font-bold">
            N
          </Box>
          <Box>
            <Typography variant="h5">NajotEDU</Typography>
            <Typography variant="body2" color="text.secondary">
              O‘quv markazi ERP tizimi
            </Typography>
          </Box>
        </Box>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Telefon raqam"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Parol"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
