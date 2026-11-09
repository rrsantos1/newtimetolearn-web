import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BookOpen, GraduationCap, UserRound, Users } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import Link from "next/link";
import { TeacherAdSlot } from "@/components/ads/TeacherAdSlot";
import { teacherSubscriptionService } from "@/modules/subscriptions/services/teacherSubscriptionService";
import type { TeacherEntitlements } from "@/modules/subscriptions/types/teacherSubscription.types";
import { useTranslation } from "@/hooks/useTranslation";

interface LoadedTeacherEntitlements {
  teacherId: string;
  entitlements: TeacherEntitlements;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, sessionError } = useAuth();
  const [loadedEntitlements, setLoadedEntitlements] = useState<LoadedTeacherEntitlements | null>(null);
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const isAdmin = user?.roles.includes("ADMIN") ?? false;

  useEffect(() => {
    if (!isLoading && !sessionError && !isAuthenticated) {
      void router.replace("/login");
    }
  }, [isLoading, sessionError, isAuthenticated, router]);

  useEffect(() => {
    if (!isTeacher || isAdmin || !user?.id) return;

    let active = true;
    teacherSubscriptionService.getEntitlements()
      .then((entitlements) => {
        if (active) setLoadedEntitlements({ teacherId: user.id, entitlements });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [isTeacher, isAdmin, user?.id]);

  const shouldShowTeacherAd =
    isTeacher &&
    !isAdmin &&
    loadedEntitlements?.teacherId === user?.id &&
    loadedEntitlements?.entitlements.removesAds === false;

  if (isLoading || sessionError || !isAuthenticated || !user) {
    return null;
  }

  return (
    <AuthenticatedLayout title={t("dashboard.title")}>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <GraduationCap size={25} aria-hidden="true" />
          </span>

          <div>
            <p className="text-sm font-medium text-muted">
              {t("dashboard.welcome")}
            </p>

            <h2 className="mt-1 text-xl font-bold text-dark sm:text-2xl">
              {t("dashboard.hello")} {user.name}!
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {t("dashboard.description")}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-dark">{t("dashboard.quickAccess")}</h2>

        <div className={`mt-4 grid gap-4 ${isTeacher && !isAdmin ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}>
          {isTeacher && !isAdmin ? (
            <>
              <Link
                href="/teacher/activities"
                className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <BookOpen size={23} className="text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-dark">{t("dashboard.activities")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {t("dashboard.createOrganize")}
                </p>
                <span className="mt-4 inline-block text-xs font-semibold text-accent">
                  {t("dashboard.manageActivities")}
                </span>
              </Link>

              <Link
                href="/teacher/students"
                className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Users size={23} className="text-accent" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-dark">{t("dashboard.students")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {t("dashboard.studentDescription")}
                </p>
                <span className="mt-4 inline-block text-xs font-semibold text-accent">
                  {t("dashboard.accessStudents")}
                </span>
              </Link>
            </>
          ) : user.roles.includes("STUDENT") ? (
            <Link
              href="/student/activities"
              className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <BookOpen size={23} className="text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-dark">Atividades</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("dashboard.activityStudentDescription")}
              </p>
              <span className="mt-4 inline-block text-xs font-semibold text-accent">
                {t("dashboard.exploreActivities")}
              </span>
            </Link>
          ) : (
            <article className="rounded-2xl border border-border bg-surface p-5">
              <BookOpen size={23} className="text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-dark">{t("dashboard.myStudies")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("dashboard.studiesDescription")}
              </p>
              <span className="mt-4 inline-block text-xs font-medium text-muted">
                {t("dashboard.preparing")}
              </span>
            </article>
          )}

          <Link
            href="/profile"
            className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <UserRound size={23} className="text-accent" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-dark">{t("dashboard.myAccount")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t("dashboard.accountDescription")}
            </p>
            <span className="mt-4 inline-block text-xs font-semibold text-accent">
              {t("dashboard.accessProfile")}
            </span>
          </Link>
        </div>
      </section>
      {shouldShowTeacherAd && <TeacherAdSlot placement="teacher-bottom" />}
    </AuthenticatedLayout>
  );
}
