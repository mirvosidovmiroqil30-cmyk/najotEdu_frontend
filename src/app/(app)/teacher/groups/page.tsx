"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import type { Group } from "@/lib/types";

type TeacherGroupRow = {
  id: number;
  status: string;
  group: Group & {
    course: { id: number; name: string; durationMonths: number };
    room: { id: number; name: string };
    groupTeachers: {
      teacher: { id: number; firstName: string; lastName: string };
    }[];
    _count: { studentGroups: number; lessons: number };
  };
};

const WEEK_DAYS_SHORT: Record<string, string> = {
  MONDAY: "Du", TUESDAY: "Se", WEDNESDAY: "Ch",
  THURSDAY: "Pa", FRIDAY: "Ju", SATURDAY: "Sha", SUNDAY: "Ya",
};

const STATUS_COLOR: Record<string, "success" | "warning" | "default" | "error"> = {
  ACTIVE: "success",
  PLANNED: "warning",
  COMPLETED: "default",
  INACTIVE: "error",
};

export default function TeacherGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<TeacherGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    apiGet<TeacherGroupRow[]>("/groups/teacher/my")
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Teacher groups xato:", err);
        setGroups([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const activeGroups = groups.filter(
    (g) => g.group.status === "ACTIVE" || g.group.status === "PLANNED",
  );
  const archivedGroups = groups.filter(
    (g) => g.group.status === "COMPLETED" || g.group.status === "INACTIVE",
  );
  const displayed = tab === 0 ? activeGroups : archivedGroups;

  function renderTable(rows: TeacherGroupRow[]) {
    if (rows.length === 0) {
      return (
        <Box className="py-10 text-center">
          <Typography color="text.secondary">Guruhlar topilmadi</Typography>
        </Box>
      );
    }

    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#F9FAFB" }}>
            <TableCell className="!font-semibold">Status</TableCell>
            <TableCell className="!font-semibold">Guruh nomi</TableCell>
            <TableCell className="!font-semibold">Kurs</TableCell>
            <TableCell className="!font-semibold">Davomiyligi</TableCell>
            <TableCell className="!font-semibold">Dars vaqti</TableCell>
            <TableCell className="!font-semibold">Xona</TableCell>
            <TableCell className="!font-semibold">O'qituvchi</TableCell>
            <TableCell className="!font-semibold" align="center">Talabalar</TableCell>
            <TableCell className="!font-semibold" align="center">Darslar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const g = row.group;
            const teachers = g.groupTeachers ?? [];
            return (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => router.push(`/teacher/groups/${g.id}`)}
              >
                <TableCell>
                  <Box className="flex items-center gap-1">
                    <Switch
                      size="small"
                      checked={g.status === "ACTIVE"}
                      onClick={(e) => e.stopPropagation()}
                      color="success"
                      readOnly
                    />
                    <Chip
                      label={g.status}
                      size="small"
                      color={STATUS_COLOR[g.status] ?? "default"}
                      sx={{ fontSize: 10 }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {g.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={g.course?.name ?? "—"}
                    size="small"
                    sx={{ bgcolor: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {g.course?.durationMonths ?? "—"} oy
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {g.startTime}
                    </Typography>
                    <Box className="flex flex-wrap gap-0.5 mt-0.5">
                      {g.weekDays?.map((d) => (
                        <Typography key={d} variant="caption" color="text.secondary">
                          {WEEK_DAYS_SHORT[d] ?? d}
                          {" "}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{g.room?.name ?? "—"}</Typography>
                </TableCell>
                <TableCell>
                  {teachers.length > 0 ? (
                    <Typography variant="body2">
                      {teachers[0].teacher.firstName} {teachers[0].teacher.lastName}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {g._count?.studentGroups ?? 0}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {g._count?.lessons ?? 0}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Guruhlar" subtitle="Sizga biriktirilgan guruhlar" />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Guruhlar (${activeGroups.length})`} />
          <Tab label={`Arxiv (${archivedGroups.length})`} />
        </Tabs>
      </Box>

      <Paper className="overflow-hidden">
        {renderTable(displayed)}
      </Paper>
    </div>
  );
}
