import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { NotebookWorkspace } from "@/modules/notebooks/components/NotebookWorkspace";
import { listTeacherRelationships } from "@/modules/teacher-students/services/teacherStudentService";

export default function TeacherNotebookPage() {
  const router = useRouter();
  const relationshipId = typeof router.query.relationshipId === "string"
    ? router.query.relationshipId
    : "";
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    if (!router.isReady || !relationshipId) return;
    let isMounted = true;

    async function loadStudentName(): Promise<void> {
      try {
        const relationships = await listTeacherRelationships("ACTIVE");
        const relationship = relationships.find((item) => item.id === relationshipId);
        if (isMounted && relationship) setStudentName(relationship.student.name);
      } catch {
        // O caderno continua acessível mesmo se a consulta do nome falhar.
      }
    }

    void loadStudentName();
    return () => {
      isMounted = false;
    };
  }, [router.isReady, relationshipId]);

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title={studentName || "Caderno virtual"}
      description="Acompanhe os conteúdos, atividades e observações deste aluno."
      backLinkPlacement="title"
    >
      {router.isReady && relationshipId ? (
        <NotebookWorkspace relationshipId={relationshipId} mode="teacher" />
      ) : (
        <p className="text-sm text-muted">Carregando caderno...</p>
      )}
    </RoleBasedLayout>
  );
}
