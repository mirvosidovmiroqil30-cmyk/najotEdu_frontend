"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import type { Group } from "@/lib/types";

type StudentGroup = {
  id: number;
  groupId: number;
  status: string;
  group: Group & {
    course: { id: number; name: string };
    room: { id: number; name: string };
    groupTeachers: {
      teacher: { id: number; firstName: string; lastName: string; photo?: string | null };
    }[];
  };
};

export default function StudentGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    apiGet<StudentGroup[]>("/groups/my")
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const active = groups.filter((g) => g.status === "ACTIVE");
  const finished = groups.filter((g) => g.status !== "ACTIVE");
  const displayed = tab === 0 ? active : finished;

  return (
    <div className="space-y-4">
      <PageHeader title="Guruhlarim" />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Faol" />
          <Tab label="Tugagan" />
        </Tabs>
      </Box>

      <Paper className="overflow-hidden">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              <TableCell className="!font-semibold" width={48}>#</TableCell>
              <TableCell className="!font-semibold">Guruh nomi</TableCell>
              <TableCell className="!font-semibold">Yo'nalishi</TableCell>
              <TableCell className="!font-semibold">O'qituvchi</TableCell>
              <TableCell className="!font-semibold">Boshlash vaqti</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Guruhlar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((sg, index) => {
                const teachers = sg.group.groupTeachers ?? [];
                return (
                  <TableRow
                    key={sg.id}
                    hover
                    onClick={() => router.push(`/student/groups/${sg.groupId}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="primary">
                        {sg.group.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {sg.group.course?.name ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {teachers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      ) : (
                        <Box className="flex items-center gap-1">
                          {teachers.slice(0, 3).map((gt) => (
                            <Avatar
                              key={gt.teacher.id}
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: "#F5C400",
                                color: "#111827",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {gt.teacher.firstName[0]}
                            </Avatar>
                          ))}
                          {teachers.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{teachers.length - 3}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(sg.group.startDate).toLocaleDateString("uz-UZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}
