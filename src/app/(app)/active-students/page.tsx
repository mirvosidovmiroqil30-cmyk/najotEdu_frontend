"use client";

import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, LoadingState, PageHeader } from "@/components/ui";
import type { User } from "@/lib/types";

export default function ActiveStudentsPage() {
  const { data: allUsers, loading, error } = useApiList<User>("/users");

  const activeStudents = allUsers.filter(
    (u) => u.role === "STUDENT" && u.status === "ACTIVE",
  );

  return (
    <div>
      <PageHeader
        title="Faol talabalar"
        subtitle={`Jami faol talabalar: ${activeStudents.length}`}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={activeStudents}
          columns={[
            { key: "name", label: "F.I.Sh", render: (u) => `${u.firstName} ${u.lastName}` },
            { key: "phone", label: "Telefon" },
            { key: "email", label: "Email" },
            {
              key: "status", label: "Holat",
              render: () => <Chip label="ACTIVE" size="small" color="success" />,
            },
          ]}
        />
      )}
    </div>
  );
}
