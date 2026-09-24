"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CloseRounded from "@mui/icons-material/CloseRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { useState } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}

export function LoadingState() {
  return (
    <Box className="flex justify-center py-16">
      <CircularProgress />
    </Box>
  );
}

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: number }>({
  columns,
  rows,
  actions,
}: {
  columns: Column<T>[];
  rows: T[];
  actions?: (row: T) => React.ReactNode;
}) {
  if (!rows.length) {
    return <Alert severity="info">Ma'lumot topilmadi</Alert>;
  }

  return (
    <Paper className="overflow-hidden">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#F3F4F6" }}>
            {columns.map((col) => (
              <TableCell key={col.key} className="!font-semibold">
                {col.label}
              </TableCell>
            ))}
            {actions ? <TableCell align="right">Amallar</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                </TableCell>
              ))}
              {actions ? <TableCell align="right">{actions(row)}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export function DeleteButton({
  onClick,
  message = "Ushbu yozuvni o'chirishni tasdiqlaysizmi?",
}: {
  onClick: () => void;
  message?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="error" size="small" onClick={() => setOpen(true)}>
        O'chirish
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center gap-2">
          <WarningAmberRounded color="warning" />
          Tasdiqlash
        </DialogTitle>
        <DialogContent>
          <Typography>{message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor qilish</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setOpen(false);
              onClick();
            }}
          >
            Ha, o'chirish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function SuccessSnackbar({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity="success" variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  onSave,
  saveLabel = "Saqlash",
  saving = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSave: () => void;
  saveLabel?: string;
  saving?: boolean;
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 420 },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Header */}
      <Box className="flex items-start justify-between p-5">
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" className="mt-0.5">
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {/* Content */}
      <Box className="flex-1 overflow-y-auto p-5">
        <Box className="flex flex-col gap-4">{children}</Box>
      </Box>

      <Divider />

      {/* Footer */}
      <Box className="flex justify-end gap-2 p-4">
        <Button onClick={onClose} disabled={saving}>
          Bekor qilish
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
          sx={{ minWidth: 100 }}
        >
          {saving ? "Saqlanmoqda..." : saveLabel}
        </Button>
      </Box>
    </Drawer>
  );
}
