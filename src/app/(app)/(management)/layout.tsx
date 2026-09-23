"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

const TABS = [
  { href: "/courses", label: "Kurslar" },
  { href: "/rooms", label: "Xonalar" },
  { href: "/users", label: "Hodimlar" },
];

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentTab = TABS.findIndex(
    (t) => pathname === t.href || pathname.startsWith(t.href + "/"),
  );

  return (
    <div className="space-y-4">
      <Typography variant="h5" fontWeight={700}>Boshqarish</Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={currentTab === -1 ? false : currentTab}>
          {TABS.map((tab) => (
            <Tab
              key={tab.href}
              label={tab.label}
              component={Link}
              href={tab.href}
            />
          ))}
        </Tabs>
      </Box>

      {children}
    </div>
  );
}
