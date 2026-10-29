import { useFormik } from "formik";
import { LoaderCircle, Pencil, Save, X } from "lucide-react";
import { updateUserProfileSchema } from "@/modules/users/schemas/updateUserProfileSchema";
import type { UpdateUserProfileFormValues } from "@/modules/users/schemas/updateUserProfileSchema";
import { useEffect } from "react";

interface UserProfileFormProps {
  initialName: string;
  isSaving: boolean;
  onSave: (values: UpdateUserProfileFormValues) => Promise<void>;
}

export function UserProfileForm({
  initialName,
  isSaving,
  onSave,
}: UserProfileFormProps) {
  const formik = useFormik<UpdateUserProfileFormValues>({
    initialValues: {
      name: initialName,
    },
    enableReinitialize: true,
    validationSchema: updateUserProfileSchema,
    onSubmit: async (values) => {
      await onSave({
        name: values.name.trim(),
      });
    },
  });

  useEffect(() => {
    if (!isSaving && formik.isSubmitting) {
      void formik.setSubmitting(false);
    }
  }, [isSaving, formik]);

  const isEditing = formik.dirty;

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <div>
        <label
          htmlFor="name"
          className="text-sm font-semibold text-dark"
        >
          Nome completo
        </label>

        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
          aria-describedby={
            formik.touched.name && formik.errors.name
              ? "profile-name-error"
              : undefined
          }
          className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />

        {formik.touched.name && formik.errors.name && (
          <p
            id="profile-name-error"
            className="mt-2 text-sm text-danger"
          >
            {formik.errors.name}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!isEditing || isSaving || !formik.isValid}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <LoaderCircle
                size={17}
                className="animate-spin"
                aria-hidden="true"
              />
              Salvando...
            </>
          ) : (
            <>
              <Save size={17} aria-hidden="true" />
              Salvar alterações
            </>
          )}
        </button>

        {isEditing && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => formik.resetForm()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50"
          >
            <X size={17} aria-hidden="true" />
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}