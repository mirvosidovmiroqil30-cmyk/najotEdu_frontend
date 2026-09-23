"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import type { Group } from "@/lib/types";

type TeacherGroupRow = {
  id: number;
  status: string;
  group: Group & {
    course: { id: number; name: string; durationMonths: number };
    room: { id: number; name: string };
    _count: { studentGroups: number };
  };
};

const WEEK_DAYS_UZ: Record<string, string> = {
  MONDAY: "Du", TUESDAY: "Se", WEDNESDAY: "Ch",
  THURSDAY: "Pa", FRIDAY: "Ju", SATURDAY: "Sha", SUNDAY: "Ya",
};

export default function TeacherCollectingGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<TeacherGroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<TeacherGroupRow[]>("/groups/teacher/my")
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        // Faqat PLANNED statusdagilar — yig'ilayotgan guruhlar
        setGroups(all.filter((g) => g.group.status === "PLANNED"));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Yig'ilayotgan guruhlar"
        subtitle="PLANNED statusdagi — hali boshlanmagan guruhlar"
      />

      {groups.length === 0 ? (
        <Paper className="flex flex-col items-center gap-3 py-14 text-center">
          <GroupsRounded sx={{ fontSize: 56, color: "#D1D5DB" }} />
          <Typography color="text.secondary">
            Hozircha yig'ilayotgan guruhlar yo'q
          </Typography>
        </Paper>
      ) : (
        <Paper className="overflow-hidden">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold">Guruh nomi</TableCell>
                <TableCell className="!font-semibold">Kurs</TableCell>
                <TableCell className="!font-semibold">Davomiyligi</TableCell>
                <TableCell className="!font-semibold">Dars vaqti</TableCell>
                <TableCell className="!font-semibold">Xona</TableCell>
                <TableCell className="!font-semibold" align="center">Talabalar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((row) => {
                const g = row.group;
                return (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/teacher/groups/${g.id}`)}
                  >
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Chip label="PLANNED" size="small" color="warning" />
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {g.name}
                        </Typography>
                      </Box>
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
                      <Typography variant="body2" fontWeight={500}>
                        {g.startTime}
                      </Typography>
                      <Box className="flex gap-1">
                        {g.weekDays?.map((d) => (
                          <Typography key={d} variant="caption" color="text.secondary">
                            {WEEK_DAYS_UZ[d] ?? d}{" "}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{g.room?.name ?? "—"}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>
                        {g._count?.studentGroups ?? 0}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </div>
  );
}
