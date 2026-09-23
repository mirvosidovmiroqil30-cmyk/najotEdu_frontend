"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, PageHeader } from "@/components/ui";
import type { Attendance, Group, GroupStudent } from "@/lib/types";

export default function AttendancePage() {
  const { hasRole } = useAuth();
  const canMark = hasRole("ADMIN", "SUPERADMIN", "TEACHER");
  const { data, loading, error, reload } = useApiList<Attendance>("/attendance");
  const { data: groups } = useApiList<Group>(canMark ? "/groups" : null);
  const [groupId, setGroupId] = useState<number>(0);
  const { data: students } = useApiList<GroupStudent>(groupId ? `/groups/${groupId}/students` : null);
  const [marks, setMarks] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState("");

  const selectedGroup = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);

  async function submit() {
    setMsg("");
    try {
      await apiPost("/attendance", {
        groupId,
        students: students.map((s) => ({
          studentId: s.studentId,
          isPresent: Boolean(marks[s.studentId]),
        })),
      });
      setMarks({});
      await reload();
    } catch (err) {
      setMsg(formatApiError(err));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Davomat" />
      {msg ? <Alert severity="error">{msg}</Alert> : null}
      {canMark ? (
        <Paper className="space-y-3 p-4">
          <TextField
            select
            label="Guruh"
            value={groupId || ""}
            onChange={(e) => { setGroupId(Number(e.target.value)); setMarks({}); }}
            className="max-w-sm"
          >
            {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
          </TextField>
          {selectedGroup && students.length ? (
            <div className="grid gap-1 sm:grid-cols-2">
              {students.map((s) => (
                <FormControlLabel
                  key={s.studentId}
                  control={
                    <Checkbox
                      checked={Boolean(marks[s.studentId])}
                      onChange={(e) => setMarks({ ...marks, [s.studentId]: e.target.checked })}
                    />
                  }
                  label={`${s.student.firstName} ${s.student.lastName}`}
                />
              ))}
            </div>
          ) : null}
          <Button variant="contained" disabled={!groupId || !students.length} onClick={submit}>
            Davomatni saqlash
          </Button>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "group", label: "Guruh", render: (a) => a.group?.name ?? a.groupId },
            { key: "student", label: "Talaba", render: (a) => a.student ? `${a.student.firstName} ${a.student.lastName}` : a.studentId },
            { key: "isPresent", label: "Holat", render: (a) => (a.isPresent ? "Bor" : "Yo‘q") },
            { key: "createdAt", label: "Sana", render: (a) => new Date(a.createdAt).toLocaleString() },
          ]}
          actions={canMark ? (row) => (
            <>
              <Button size="small" onClick={async () => { await apiPatch(`/attendance/${row.id}`, { isPresent: !row.isPresent }); await reload(); }}>
                Almashtirish
              </Button>
              {hasRole("ADMIN", "SUPERADMIN") ? (
                <DeleteButton onClick={async () => { await apiDelete(`/attendance/${row.id}`); await reload(); }} />
              ) : null}
            </>
          ) : undefined}
        />
      )}
    </div>
  );
}
