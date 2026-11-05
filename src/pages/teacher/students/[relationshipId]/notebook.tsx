import { useRouter } from "next/router";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { NotebookWorkspace } from "@/modules/notebooks/components/NotebookWorkspace";

export default function TeacherNotebookPage() {
  const router = useRouter();
  const relationshipId = typeof router.query.relationshipId === "string"
    ? router.query.relationshipId
    : "";

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Caderno virtual"
      description="Organize os conteúdos e acompanhe as dúvidas e observações do aluno."
    >
      {router.isReady && relationshipId ? (
        <NotebookWorkspace relationshipId={relationshipId} mode="teacher" />
      ) : (
        <p className="text-sm text-muted">Carregando caderno...</p>
      )}
    </RoleBasedLayout>
  );
}
