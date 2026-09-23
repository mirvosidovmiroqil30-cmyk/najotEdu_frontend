"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { apiPatch } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, LoadingState, PageHeader, SuccessSnackbar } from "@/components/ui";
import type { User } from "@/lib/types";

export default function FrozenUsersPage() {
  const { hasRole } = useAuth();
  const { data: allUsers, loading, error, reload } = useApiList<User>("/users");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  const frozenUsers = allUsers.filter((u) => u.status === "FREEZE");

  async function activate(id: number) {
    setErrorMsg("");
    try {
      await apiPatch(`/users/${id}`, { status: "ACTIVE" });
      setSuccessMsg("Foydalanuvchi faollaştirildi!");
      setConfirmId(null);
      await reload();
    } catch (err) {
      setErrorMsg(formatApiError(err));
      setConfirmId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Muzlatilganlar"
        subtitle={`Jami muzlatilgan foydalanuvchilar: ${frozenUsers.length}`}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={frozenUsers}
          columns={[
            { key: "name", label: "F.I.Sh", render: (u) => `${u.firstName} ${u.lastName}` },
            { key: "phone", label: "Telefon" },
            { key: "email", label: "Email" },
            {
              key: "role", label: "Rol",
              render: (u) => (
                <Chip
                  label={u.role} size="small"
                  color={u.role === "STUDENT" ? "default" : u.role === "TEACHER" ? "info" : "warning"}
                />
              ),
            },
            {
              key: "status", label: "Holat",
              render: () => <Chip label="FREEZE" size="small" color="warning" />,
            },
          ]}
          actions={
            canManage
              ? (row) => (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => setConfirmId(row.id)}
                  >
                    Faollashtirish
                  </Button>
                )
              : undefined
          }
        />
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircleRounded color="success" />
          Faollashtirishni tasdiqlang
        </DialogTitle>
        <DialogContent>
          <Typography>
            Haqiqatan ham bu foydalanuvchini faollashtirmoqchimisiz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Bekor qilish</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => confirmId !== null && activate(confirmId)}
          >
            Ha, faollashtirish
          </Button>
        </DialogActions>
      </Dialog>
      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
    </div>
  );
}
