import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { BookOpen, Mail, RefreshCw, Search, UserMinus, Users } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import {
  cancelInvitation,
  endTeacherStudentRelationship,
  inviteStudent,
  listTeacherRelationships,
} from "@/modules/teacher-students/services/teacherStudentService";
import type {
  TeacherStudentRelationship,
  TeacherStudentStatus,
} from "@/modules/teacher-students/types/teacherStudent.types";

const statusLabels: Record<TeacherStudentStatus, string> = {
  PENDING: "Aguardando aceite",
  ACTIVE: "Vínculo ativo",
  REJECTED: "Recusado",
  CANCELLED: "Encerrado",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data.error?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}

export default function TeacherStudentsPage() {
  const [relationships, setRelationships] = useState<TeacherStudentRelationship[]>([]);
  const [email, setEmail] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState("");

  const loadRelationships = useCallback(async () => {
    setIsLoading(true);
    setNotice("");
    try {
      const data = await listTeacherRelationships();
      setRelationships(data);
    } catch (error: unknown) {
      setNotice(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchRelationships(): Promise<void> {
      try {
        const data = await listTeacherRelationships();
        if (isMounted) setRelationships(data);
      } catch (error: unknown) {
        if (isMounted) setNotice(getErrorMessage(error));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void fetchRelationships();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const invitation = await inviteStudent(email.trim().toLowerCase());
      setSuccess(`Convite enviado para ${invitation.student.name}.`);
      setEmail("");
      await loadRelationships();
    } catch (error: unknown) {
      setNotice(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(relationship: TeacherStudentRelationship) {
    setNotice("");
    setSuccess("");
    try {
      await cancelInvitation(relationship.id, "teacher");
      setSuccess("Convite cancelado.");
      await loadRelationships();
    } catch (error: unknown) {
      setNotice(getErrorMessage(error));
    }
  }

  async function handleEnd(relationship: TeacherStudentRelationship) {
    const confirmed = window.confirm(`Deseja encerrar o vínculo com ${relationship.student.name}?`);
    if (!confirmed) return;

    setNotice("");
    setSuccess("");
    try {
      await endTeacherStudentRelationship(relationship.id);
      setSuccess("Vínculo encerrado.");
      await loadRelationships();
    } catch (error: unknown) {
      setNotice(getErrorMessage(error));
    }
  }

  const active = relationships.filter((item) => item.status === "ACTIVE");
  const normalizedSearch = studentSearch.trim().toLocaleLowerCase("pt-BR");
  const filteredActive = active.filter((item) =>
    `${item.student.name} ${item.student.email}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
  );
  const pending = relationships.filter((item) => item.status === "PENDING");
  const history = relationships.filter((item) => item.status === "REJECTED" || item.status === "CANCELLED");

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title="Meus alunos"
      description="Convide alunos para acompanhar sua aprendizagem e organizar o caderno virtual."
      backLinkPlacement="title"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users size={21} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-dark">Alunos vinculados</h2>
                <p className="text-sm text-muted">Gerencie convites e vínculos ativos.</p>
              </div>
            </div>

            {notice && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{notice}</p>}
            {success && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{success}</p>}

            {isLoading ? (
              <p className="mt-6 text-sm text-muted">Carregando alunos...</p>
            ) : active.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center">
                <Users className="mx-auto text-muted" size={28} aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-dark">Você ainda não possui alunos vinculados.</p>
                <p className="mt-1 text-sm text-muted">Envie um convite para começar.</p>
              </div>
            ) : (
              <>
                <div className="relative mt-5">
                  <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <label htmlFor="search-linked-students" className="sr-only">Pesquisar alunos vinculados</label>
                  <input
                    id="search-linked-students"
                    type="search"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Pesquisar por nome ou e-mail..."
                    className="min-h-11 w-full rounded-xl border border-border bg-white py-2 pl-10 pr-3 text-sm text-dark outline-none transition placeholder:text-muted focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                </div>
                {filteredActive.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">
                    Nenhum aluno encontrado para essa pesquisa.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {filteredActive.map((relationship) => (
                      <article key={relationship.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border p-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words font-semibold text-dark">{relationship.student.name}</h3>
                          <p className="mt-1 break-all text-sm text-muted">{relationship.student.email}</p>
                          <span className="mt-3 inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">{statusLabels[relationship.status]}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/teacher/students/${relationship.id}/notebook`}
                            aria-label={`Abrir caderno de ${relationship.student.name}`}
                            title="Abrir caderno"
                            className="inline-flex size-11 items-center justify-center rounded-lg bg-primary text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            style={{ color: "var(--primary-foreground)" }}
                          >
                            <BookOpen size={19} aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleEnd(relationship)}
                            aria-label={`Encerrar vínculo com ${relationship.student.name}`}
                            title="Encerrar vínculo"
                            className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                          >
                            <UserMinus size={19} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-semibold text-dark">Convites enviados</h2>
            {pending.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nenhum convite pendente.</p>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {pending.map((relationship) => (
                  <article key={relationship.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium text-dark">{relationship.student.name}</h3>
                      <p className="text-sm text-muted">{relationship.student.email}</p>
                      <span className="mt-1 inline-block text-xs text-amber-700">{statusLabels[relationship.status]}</span>
                    </div>
                    <button type="button" onClick={() => void handleCancel(relationship)} className="min-h-10 rounded-lg border border-border px-3 text-sm font-semibold text-dark hover:bg-background">
                      Cancelar convite
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-semibold text-dark">Histórico</h2>
              <div className="mt-3 divide-y divide-border">
                {history.map((relationship) => (
                  <div key={relationship.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-dark">{relationship.student.name}</p>
                      <p className="text-xs text-muted">{relationship.student.email}</p>
                    </div>
                    <span className="text-xs text-muted">{statusLabels[relationship.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <span className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Mail size={21} aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-semibold text-dark">Convidar aluno</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Informe o e-mail utilizado no cadastro do aluno. Ele precisará aceitar o convite para ativar o vínculo.
          </p>
          <form className="mt-5 space-y-3" onSubmit={(event) => void handleInvite(event)}>
            <label htmlFor="student-email" className="block text-sm font-medium text-dark">E-mail do aluno</label>
            <input
              id="student-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="aluno@exemplo.com"
              className="min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
            <button type="submit" disabled={isSubmitting || !email.trim()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" style={{ color: "var(--primary-foreground)" }}>
              {isSubmitting ? "Enviando..." : <><Search size={16} aria-hidden="true" /> Enviar convite</>}
            </button>
          </form>
          <button type="button" onClick={() => void loadRelationships()} disabled={isLoading} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 text-sm font-medium text-muted hover:text-dark">
            <RefreshCw size={15} aria-hidden="true" /> Atualizar lista
          </button>
          <p className="mt-4 text-xs leading-5 text-muted">
            O vínculo só será estabelecido após a confirmação do aluno.
          </p>
        </aside>
      </div>
    </RoleBasedLayout>
  );
}
