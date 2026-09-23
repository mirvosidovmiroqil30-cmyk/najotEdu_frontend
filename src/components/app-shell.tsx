"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import HomeRounded from "@mui/icons-material/HomeRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import CardGiftcardRounded from "@mui/icons-material/CardGiftcardRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PaymentRounded from "@mui/icons-material/PaymentRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import LibraryBooksRounded from "@mui/icons-material/LibraryBooksRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import Collapse from "@mui/material/Collapse";
import ExpandMoreRounded from "@mui/icons-material/ExpandMore";
import ExpandLessRounded from "@mui/icons-material/ExpandLess";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import MeetingRoomRounded from "@mui/icons-material/MeetingRoomRounded";
import BadgeRounded from "@mui/icons-material/BadgeRounded";
import MonetizationOnRounded from "@mui/icons-material/MonetizationOnRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";

import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED_WIDTH = 64;
const MANAGEMENT_WIDTH = 240;

const ADMIN_NAV = [
  { href: "/dashboard", label: "Asosiy", icon: HomeRounded, roles: ["SUPERADMIN", "ADMIN", "TEACHER"] as Role[] },
  { href: "/teachers", label: "O'qituvchilar", icon: PeopleAltRounded, roles: ["SUPERADMIN", "ADMIN"] as Role[] },
  { href: "/groups", label: "Guruhlar", icon: GroupsRounded, roles: ["SUPERADMIN", "ADMIN", "TEACHER"] as Role[] },
  { href: "/students", label: "Talabalar", icon: SchoolRounded, roles: ["SUPERADMIN", "ADMIN"] as Role[] },
  { href: "/gifts", label: "Sovg'alar", icon: CardGiftcardRounded, roles: ["SUPERADMIN", "ADMIN", "TEACHER"] as Role[] },
  { href: "/management", label: "Boshqarish", icon: SettingsRounded, roles: ["SUPERADMIN", "ADMIN", "TEACHER"] as Role[], hasSubmenu: true },
];

const MANAGEMENT_NAV: { href: string; label: string; icon: typeof MenuBookRounded; roles?: Role[] }[] = [
  { href: "/courses", label: "Kurslar", icon: MenuBookRounded },
  { href: "/rooms", label: "Xonalar", icon: MeetingRoomRounded },
  { href: "/users", label: "Hodimlar", icon: BadgeRounded },
  { href: "/coins", label: "Coin", icon: MonetizationOnRounded },
  { href: "/messages", label: "Xabar Yuborish", icon: SendRounded },
  { href: "/archive", label: "Arxiv", icon: Inventory2Rounded, roles: ["SUPERADMIN", "ADMIN"] },
];

const STUDENT_NAV = [
  { href: "/student/dashboard", label: "Bosh sahifa", icon: HomeRounded },
  { href: "/student/groups", label: "Guruhlarim", icon: GroupsRounded },
  { href: "/student/results", label: "Ko'rsatgichlarim", icon: BarChartRounded },
  { href: "/student/rating", label: "Reyting", icon: EmojiEventsRounded },
  { href: "/student/payments", label: "To'lovlarim", icon: PaymentRounded },
  { href: "/student/extra-lessons", label: "Qo'shimcha darslar", icon: LibraryBooksRounded },
  { href: "/student/settings", label: "Sozlamalar", icon: SettingsRounded },
];

// Teacher navigatsiyasi — collapsible Guruhlar
const TEACHER_NAV = [
  { href: "/teacher/groups", label: "Guruhlar", icon: GroupsRounded, children: [
    { href: "/teacher/groups", label: "Guruhlar" },
    { href: "/teacher/groups/collecting", label: "Yig'ilayotgan guruhlar" },
  ]},
  { href: "/teacher/profile", label: "Profil", icon: PeopleAltRounded },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [teacherGroupsOpen, setTeacherGroupsOpen] = useState(true);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const isTeacherGroupsSectionActive = pathname === "/teacher/groups" || pathname.startsWith("/teacher/groups/");

  useEffect(() => {
    if (isTeacherGroupsSectionActive) {
      setTeacherGroupsOpen(true);
    }
  }, [isTeacherGroupsSectionActive]);

  if (loading || !user) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-[#F6F7FB]">
        <CircularProgress />
      </Box>
    );
  }

  const isStudent = user.role === "STUDENT";
  const isTeacher = user.role === "TEACHER";
  const navItems = isStudent
    ? STUDENT_NAV
    : isTeacher
    ? TEACHER_NAV
    : ADMIN_NAV.filter((item) => hasRole(...item.roles));
  const managementNav = MANAGEMENT_NAV.filter(
    (item) => !item.roles || hasRole(...item.roles),
  );
  const teacherGroupsMenuOpen = teacherGroupsOpen;

  const drawerWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  // Boshqarish submenu ichidagi path da turibmizmi
  const isManagementPath = managementNav.some((i) =>
    pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  const drawer = (isMobile = false) => (
    <Box
      className="flex h-full flex-col bg-[#111827] text-white"
      sx={{ overflow: "hidden" }}
    >
      {/* Logo + collapse tugmasi */}
      <Box className="flex items-center justify-between px-2" sx={{ minHeight: 64 }}>
        {!collapsed && (
          <Box className="flex items-center gap-2 px-1">
            <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5C400] font-bold text-black text-sm">
              N
            </Box>
            <Typography className="!text-sm !font-bold tracking-wide">NajotEDU</Typography>
          </Box>
        )}
        {collapsed && (
          <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5C400] font-bold text-black text-sm mx-auto">
            N
          </Box>
        )}
        {!isMobile && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              color: "white",
              bgcolor: "#1F2937",
              borderRadius: 1.5,
              width: 28,
              height: 28,
              flexShrink: 0,
              ml: collapsed ? "auto" : 0,
              "&:hover": { bgcolor: "#374151" },
            }}
          >
            {collapsed ? <ChevronRightRounded fontSize="small" /> : <ChevronLeftRounded fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* Nav items */}
      <List className="flex-1 px-1 pt-1">
        {isTeacher ? (
          // Teacher uchun collapsible navigatsiya
          <>
            {TEACHER_NAV.map((item) => {
              const Icon = item.icon;
              const isParentActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const hasChildren = item.children && item.children.length > 0;

              return (
                <Box key={item.href}>
                  <Tooltip title={collapsed ? item.label : ""} placement="right" arrow>
                    <ListItemButton
                      onClick={() => {
                        if (hasChildren) {
                          setTeacherGroupsOpen((prev) => !prev);
                        } else {
                          router.push(item.href);
                          setMobileOpen(false);
                        }
                      }}
                      sx={{
                        mb: 0.5,
                        borderRadius: 2,
                        px: collapsed ? 1 : 2,
                        justifyContent: collapsed ? "center" : "flex-start",
                        minHeight: 42,
                        color: isParentActive ? "#F5C400" : "rgba(255,255,255,0.82)",
                        bgcolor: "transparent",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                        "& .MuiListItemText-primary": {
                          color: isParentActive ? "#F5C400" : "inherit",
                          fontWeight: isParentActive ? 700 : 400,
                          fontSize: 14,
                        },
                        "& .MuiListItemIcon-root": { color: isParentActive ? "#F5C400" : "inherit" },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "inherit", justifyContent: "center" }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      {!collapsed && (
                        <>
                          <ListItemText primary={item.label} />
                          {hasChildren && (
                            teacherGroupsOpen
                              ? <ExpandLessRounded fontSize="small" />
                              : <ExpandMoreRounded fontSize="small" />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>

                  {/* Children — submenu */}
                  {hasChildren && !collapsed && (
                    <Collapse in={teacherGroupsMenuOpen} timeout="auto" unmountOnExit>
                      <List disablePadding>
                        {item.children!.map((child, childIdx) => {
                          // Birinchi child (Guruhlar) — faqat exact match
                          // Qolgan childlar — startsWith ham
                          const childActive = childIdx === 0
                            ? pathname === child.href
                            : pathname === child.href || pathname.startsWith(child.href + "/");
                          return (
                            <ListItemButton
                              key={child.href}
                              onClick={() => { router.push(child.href); setMobileOpen(false); }}
                              selected={childActive}
                              sx={{
                                pl: 4,
                                py: 0.75,
                                borderRadius: 2,
                                mb: 0.5,
                                color: childActive ? "#111827" : "rgba(255,255,255,0.7)",
                                bgcolor: childActive ? "#F5C400" : "transparent",
                                "&.Mui-selected": { bgcolor: "#F5C400", color: "#111827" },
                                "&.Mui-selected:hover": { bgcolor: "#F5C400" },
                                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                                "& .MuiListItemText-primary": {
                                  color: "inherit",
                                  fontSize: 13,
                                  fontWeight: childActive ? 700 : 400,
                                },
                              }}
                            >
                              <ListItemText primary={child.label} />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </>
        ) : navItems.map((item) => {
          const basePath = item.href.split("?")[0];
          const isManagementItem = (item as any).hasSubmenu;

          // Management submenu ichidagi path da turganda faqat "Boshqarish" active bo'lsin
          const isInManagementPath = managementNav.some(
            (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
          );

          let active = false;
          if (isManagementItem) {
            active = managementOpen || isInManagementPath;
          } else if (isInManagementPath || managementOpen) {
            // Management ochiq yoki management path da — boshqa itemlar active bo'lmasin
            active = false;
          } else {
            active =
              pathname === basePath ||
              (basePath !== "/dashboard" &&
                basePath !== "/student/dashboard" &&
                pathname.startsWith(basePath + "/"));
          }

          const Icon = item.icon;

          return (
            <Tooltip key={item.href} title={collapsed ? item.label : ""} placement="right" arrow>
              <ListItemButton
                selected={active}
                onClick={() => {
                  if (isManagementItem) {
                    setManagementOpen((prev) => !prev);
                  } else {
                    setManagementOpen(false);
                    setMobileOpen(false);
                    router.push(item.href);
                  }
                }}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  px: collapsed ? 1 : 2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  minHeight: 42,
                  color: active ? "#111827" : "rgba(255,255,255,0.82)",
                  bgcolor: active ? "#F5C400" : "transparent",
                  "&.Mui-selected": { bgcolor: "#F5C400", color: "#111827" },
                  "&.Mui-selected:hover": { bgcolor: "#F5C400" },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  "& .MuiListItemText-primary": {
                    color: "inherit",
                    fontWeight: active ? 700 : 400,
                    fontSize: 14,
                  },
                  "& .MuiListItemIcon-root": { color: "inherit" },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "inherit", justifyContent: "center" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box className="flex min-h-screen bg-[#F6F7FB]">
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "white",
          color: "text.primary",
          borderBottom: "1px solid #E5E7EB",
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: "width 0.2s, margin-left 0.2s",
        }}
      >
        <Toolbar className="gap-3">
          <IconButton className="md:!hidden" onClick={() => setMobileOpen(true)}>
            <MenuRounded />
          </IconButton>
          <Typography className="flex-1 !font-semibold">
            {(() => {
              const mgmt = managementNav.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
              if (mgmt) return mgmt.label;
              return navItems.find((i) => {
                const base = i.href.split("?")[0];
                return pathname === base || pathname.startsWith(base + "/");
              })?.label ?? "NajotEDU";
            })()}
          </Typography>
          <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
            <Avatar sx={{ bgcolor: "#F5C400", color: "#111827", width: 36, height: 36 }}>
              {user.firstName[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem disabled>
              {user.firstName} {user.lastName} · {user.role}
            </MenuItem>
            <MenuItem onClick={() => { setAnchor(null); logout(); }}>
              <LogoutRounded fontSize="small" className="mr-2" /> Chiqish
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, transition: "width 0.2s" }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawer(true)}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              border: 0,
              overflowX: "hidden",
              transition: "width 0.2s",
              boxShadow: "4px 0 16px rgba(0,0,0,0.35)",
              borderRadius: "0 16px 16px 0",
            },
          }}
        >
          {drawer(false)}
        </Drawer>
      </Box>

      {/* Boshqarish flyout submenu */}
      {!isStudent && !isTeacher && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: { md: drawerWidth },
            height: "100vh",
            zIndex: 1200,
            transition: "left 0.2s",
            transform: managementOpen ? "translateX(0)" : "translateX(-100%)",
            opacity: managementOpen ? 1 : 0,
            pointerEvents: managementOpen ? "auto" : "none",
            transitionProperty: "transform, opacity",
            transitionDuration: "0.25s",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: MANAGEMENT_WIDTH,
              height: "100%",
              borderRadius: "0 16px 16px 0",
              display: "flex",
              flexDirection: "column",
              bgcolor: "#fff",
            }}
          >
            {/* Header */}
            <Box
              className="flex items-center gap-2 px-4 py-3"
              sx={{ borderBottom: "1px solid #E5E7EB", minHeight: 64 }}
            >
              <IconButton
                size="small"
                onClick={() => setManagementOpen(false)}
                sx={{
                  bgcolor: "#F5C400",
                  color: "#111827",
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  "&:hover": { bgcolor: "#e6b800" },
                }}
              >
                <ChevronLeftRounded fontSize="small" />
              </IconButton>
              <Typography fontWeight={700} fontSize={16}>
                Menu
              </Typography>
            </Box>

            {/* Items */}
            <List className="flex-1 px-2 pt-2">
              {managementNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <ListItemButton
                    key={item.href}
                    component={Link}
                    href={item.href}
                    selected={active}
                    onClick={() => setManagementOpen(false)}
                    sx={{
                      mb: 0.5,
                      borderRadius: 2,
                      color: active ? "#111827" : "#374151",
                      bgcolor: active ? "#F5C400" : "transparent",
                      "&.Mui-selected": { bgcolor: "#F5C400", color: "#111827" },
                      "&.Mui-selected:hover": { bgcolor: "#F5C400" },
                      "&:hover": { bgcolor: "#F3F4F6" },
                      "& .MuiListItemText-primary": {
                        color: "inherit",
                        fontWeight: active ? 600 : 400,
                        fontSize: 14,
                      },
                      "& .MuiListItemIcon-root": { color: "inherit", minWidth: 36 },
                    }}
                  >
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </Box>
      )}

      {/* Overlay */}
      <Box
        onClick={() => setManagementOpen(false)}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1199,
          bgcolor: "transparent",
          pointerEvents: managementOpen ? "auto" : "none",
        }}
      />

      {/* Main */}
      <Box
        component="main"
        className="flex-1 p-4 md:p-6"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: "width 0.2s",
          borderLeft: { md: "none" },
          boxShadow: { md: "none" },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
