"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import ArchiveRounded from "@mui/icons-material/ArchiveRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import CardActionArea from "@mui/material/CardActionArea";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LoadingState } from "@/components/ui";
import type { Group, Lesson, User } from "@/lib/types";

type Stats = {
  activeStudents: number;
  groups: number;
  currentPayments: number;
  debtors: number;
  expiring: number;
  archived: number;
};

const WEEK_DAYS_UZ: Record<string, string> = {
  MONDAY: "Du", TUESDAY: "Se", WEDNESDAY: "Ch",
  THURSDAY: "Pa", FRIDAY: "Ju", SATURDAY: "Sha", SUNDAY: "Ya",
};

function CollapseSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Paper className="overflow-hidden">
      <Box
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setOpen(!open)}
        sx={{ "&:hover": { bgcolor: "#F9FAFB" } }}
      >
        <Box className="flex items-center gap-2">
          {icon}
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <IconButton size="small">
          {open ? <ExpandLessRounded fontSize="small" /> : <ExpandMoreRounded fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Divider />
        <Box className="p-4">{children}</Box>
      </Collapse>
    </Paper>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    activeStudents: 0,
    groups: 0,
    currentPayments: 0,
    debtors: 0,
    expiring: 0,
    archived: 0,
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, groupsData, lessonsData, archivedData] = await Promise.all([
          apiGet<User[]>("/users"),
          apiGet<Group[]>("/groups"),
          apiGet<Lesson[]>("/lessons"),
          Promise.all([
            apiGet<{ id: number }[]>("/archive/users"),
            apiGet<{ id: number }[]>("/archive/courses"),
            apiGet<{ id: number }[]>("/archive/rooms"),
            apiGet<{ id: number }[]>("/archive/groups"),
            apiGet<{ id: number }[]>("/archive/lessons"),
            apiGet<{ id: number }[]>("/archive/homeworks"),
            apiGet<{ id: number }[]>("/archive/attendances"),
          ]).then((results) => results.reduce((sum, arr) => sum + arr.length, 0)),
        ]);

        const activeStudents = users.filter(
          (u) => u.role === "STUDENT" && u.status === "ACTIVE",
        ).length;

        const activeGroups = groupsData.filter((g) => g.status === "ACTIVE").length;
        const frozenUsers = users.filter((u) => u.status === "FREEZE").length;

        setStats({
          activeStudents,
          groups: activeGroups,
          currentPayments: 0,
          debtors: 0,
          expiring: frozenUsers,
          archived: archivedData,
        });
        setGroups(groupsData);
        setLessons(lessonsData);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingState />;

  const statCards = [
    {
      label: "Faol talabalar",
      value: stats.activeStudents,
      icon: <SchoolRounded sx={{ color: "#6366f1", fontSize: 28 }} />,
      bg: "#EEF2FF",
      href: "/active-students",
    },
    {
      label: "Guruhlar",
      value: stats.groups,
      icon: <GroupsRounded sx={{ color: "#0ea5e9", fontSize: 28 }} />,
      bg: "#E0F2FE",
      href: "/groups",
    },
    {
      label: "Joriy oy to'lovlar",
      value: stats.currentPayments,
      icon: <CreditCardRounded sx={{ color: "#10b981", fontSize: 28 }} />,
      bg: "#D1FAE5",
      href: "/coins",
    },
    {
      label: "Qarzdorlar",
      value: stats.debtors,
      icon: <WarningAmberRounded sx={{ color: "#f59e0b", fontSize: 28 }} />,
      bg: "#FEF3C7",
      href: "/coins",
    },
    {
      label: "Muzlatilganlar",
      value: stats.expiring,
      icon: <AccessTimeRounded sx={{ color: "#ef4444", fontSize: 28 }} />,
      bg: "#FEE2E2",
      href: "/frozen",
    },
    {
      label: "Arxivdagilar",
      value: stats.archived,
      icon: <ArchiveRounded sx={{ color: "#8b5cf6", fontSize: 28 }} />,
      bg: "#EDE9FE",
      href: "/archive",
    },
  ];

  // Dars jadvali — faol guruhlar
  const activeGroupsForSchedule = groups.filter((g) => g.status === "ACTIVE");

  return (
    <div className="space-y-5">
      {/* Salomlashuv */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Salom, {user?.firstName} {user?.lastName}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          NajotEdu platformasiga xush kelibsiz!
        </Typography>
      </Box>

      {/* Stat kartalar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card
            key={card.label}
            elevation={0}
            sx={{
              border: "1px solid #E5E7EB",
              cursor: "pointer",
              transition: "box-shadow 0.2s, transform 0.2s",
              "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.10)", transform: "translateY(-2px)" },
            }}
            onClick={() => router.push(card.href)}
          >
            <CardContent className="flex flex-col items-center gap-2 !pb-3 !pt-3 text-center">
              <Box className="flex h-12 w-12 items-center justify-center rounded-xl" sx={{ bgcolor: card.bg }}>
                {card.icon}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Joriy oy uchun to'lovlar */}
      <CollapseSection
        title="Joriy oy uchun to'lovlar"
        icon={<CreditCardRounded fontSize="small" color="action" />}
      >
        <Typography color="text.secondary" variant="body2">
          To'lov tizimi tez orada ishga tushiriladi.
        </Typography>
      </CollapseSection>

      {/* Yillik Foyda */}
      <CollapseSection
        title="Yillik Foyda"
        icon={<TrendingUpRounded fontSize="small" color="action" />}
      >
        <Typography color="text.secondary" variant="body2">
          Moliyaviy hisobot tez orada ishga tushiriladi.
        </Typography>
      </CollapseSection>

      {/* Dars jadvali */}
      <CollapseSection
        title="Dars jadvali"
        icon={<CalendarMonthRounded fontSize="small" color="action" />}
        defaultOpen
      >
        {activeGroupsForSchedule.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Faol guruhlar topilmadi
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold">Guruh</TableCell>
                <TableCell className="!font-semibold">O'qituvchi</TableCell>
                <TableCell className="!font-semibold">Kunlar</TableCell>
                <TableCell className="!font-semibold">Vaqt</TableCell>
                <TableCell className="!font-semibold">Xona</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeGroupsForSchedule.map((g) => (
                <TableRow key={g.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} color="primary">
                      {g.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {g.groupTeachers && g.groupTeachers.length > 0 ? (
                      <Typography variant="body2">
                        {g.groupTeachers[0].teacher.firstName}{" "}
                        {g.groupTeachers[0].teacher.lastName}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box className="flex flex-wrap gap-1">
                      {g.weekDays.map((d) => (
                        <Box
                          key={d}
                          component="span"
                          sx={{
                            px: 0.8, py: 0.2,
                            borderRadius: 1,
                            bgcolor: "#F3F4F6",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {WEEK_DAYS_UZ[d] ?? d}
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{g.startTime}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{g.room?.name ?? "—"}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CollapseSection>
    </div>
  );
}
