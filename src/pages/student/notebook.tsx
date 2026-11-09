import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { NotebookWorkspace } from "@/modules/notebooks/components/NotebookWorkspace";
import { listStudentRelationships } from "@/modules/teacher-students/services/teacherStudentService";
import type { TeacherStudentRelationship } from "@/modules/teacher-students/types/teacherStudent.types";
import { useTranslation } from "@/hooks/useTranslation";

export default function StudentNotebookPage() {
  const { t } = useTranslation();
  const [relationship, setRelationship] = useState<TeacherStudentRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRelationship(): Promise<void> {
      try {
        const relationships = await listStudentRelationships();
        const active = relationships.find((item) => item.status === "ACTIVE") ?? null;
        if (isMounted) setRelationship(active);
      } catch {
        if (isMounted) setError(t("notebook.student.relationshipError"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadRelationship();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <RoleBasedLayout
      area="student"
      allowedRoles={["STUDENT"]}
      title="Meu caderno virtual"
      title={t("notebook.student.title")}
      description={t("notebook.student.description")}
      backLinkPlacement="title"
    >
      {isLoading ? (
        <p className="text-sm text-muted">{t("notebook.student.loadingRelationship")}</p>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : relationship ? (
        <NotebookWorkspace relationshipId={relationship.id} mode="student" />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <h2 className="font-semibold text-dark">{t("notebook.student.noTeacher")}</h2>
          <p className="mt-2 text-sm text-muted">{t("notebook.student.inviteHelp")}</p>
          <Link href="/student/teachers" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white" style={{ color: "var(--primary-foreground)" }}>
            {t("notebook.student.viewInvitations")}
          </Link>
        </div>
      )}
    </RoleBasedLayout>
  );
}
