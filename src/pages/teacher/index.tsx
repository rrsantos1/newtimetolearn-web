import { ArrowRight, BookOpen, ClipboardList, CreditCard, Plus, Search, Users } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

export default function TeacherPage() {
  const { t } = useTranslation();
  const features = [
    { id: "content", title: t("teacherHome.contentTitle"), description: t("teacherHome.contentDescription"), icon: BookOpen },
    { id: "activities", title: t("teacherHome.activitiesTitle"), description: t("teacherHome.activitiesDescription"), icon: ClipboardList },
    { id: "students", title: t("teacherHome.studentsTitle"), description: t("teacherHome.studentsDescription"), icon: Users },
    { id: "subscription", title: t("teacherHome.subscriptionTitle"), description: t("teacherHome.subscriptionDescription"), icon: CreditCard },
  ];

  return (
    <RoleBasedLayout
      area="teacher"
      allowedRoles={["TEACHER"]}
      title={t("teacherHome.title")}
      description={t("teacherHome.description")}
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map(({ id, title, description, icon: Icon }) => {
          if (id === "activities") {
            return (
              <article
                key={title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>

                <h2 className="mt-5 font-semibold text-dark">{title}</h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {description}
                </p>

                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href="/teacher/activities"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}
                  >
                    <ClipboardList size={16} aria-hidden="true" />
                    {t("teacherHome.viewActivities")}
                  </Link>

                  <Link
                    href="/teacher/activities/explore"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <Search size={16} aria-hidden="true" />
                    {t("teacherHome.exploreActivities")}
                  </Link>

                  <Link
                    href="/teacher/activities/new"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t("teacherHome.createActivity")}
                  </Link>
                </div>
              </article>
            );
          }

          if (id === "content") {
            return (
              <article key={title} className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-semibold text-dark">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {t("teacherHome.contentCardDescription")}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link href="/teacher/marketplace" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                    {t("teacherHome.manageContent")}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href="/marketplace" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dark transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    {t("teacherHome.exploreMarketplace")}
                  </Link>
                </div>
              </article>
            );
          }

          if (id === "subscription") {
            return (
              <article key={title} className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-semibold text-dark">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                <Link href="/teacher/subscription" className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" style={{ color: "var(--primary-foreground)" }}>
                  {t("teacherHome.manageSubscription")}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            );
          }

          if (id === "students") {
            return (
              <article
                key={title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>

                <h2 className="mt-5 font-semibold text-dark">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

                <Link
                  href="/teacher/students"
                  className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  {t("teacherHome.manageStudents")}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            );
          }

          return (
            <article
              key={title}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={22} aria-hidden="true" />
              </span>

              <h2 className="mt-5 font-semibold text-dark">{title}</h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                {description}
              </p>

              <span className="mt-4 inline-block text-xs font-medium text-muted">
                {t("teacherHome.comingSoon")}
              </span>
            </article>
          );
        })}
      </section>
    </RoleBasedLayout>
  );
}
