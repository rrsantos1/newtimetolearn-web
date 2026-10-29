import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, KeyRound, Mail, UserRound } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import type {
  ApiErrorResponse,
  UserProfile,
} from "@/modules/auth/types/auth.types";
import { UserProfileDetails } from "@/modules/users/components/UserProfileDetails";
import { UserProfileForm } from "@/modules/users/components/UserProfileForm";
import type { UpdateUserProfileFormValues } from "@/modules/users/schemas/updateUserProfileSchema";
import { userProfileService } from "@/modules/users/services/userProfileService";
import { EmailChangeRequestForm } from "@/modules/auth/components/EmailChangeRequestForm";
import { ChangePasswordForm } from "@/modules/auth/components/ChangePasswordForm";

export default function ProfilePage() {
  const { refreshProfile } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailChangeMessage, setEmailChangeMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await userProfileService.getProfile();
      setProfile(data);
    } catch {
      setErrorMessage(
        "Não foi possível carregar seu perfil. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async (values: UpdateUserProfileFormValues) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedProfile = await userProfileService.updateProfile(values);

      setProfile(updatedProfile);
      await refreshProfile();

      setSuccessMessage("Seu perfil foi atualizado com sucesso.");
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const response = error.response?.data;

        if (response?.success === false) {
          setErrorMessage(response.error.message);
        } else {
          setErrorMessage(
            error.response
              ? "Não foi possível atualizar seu perfil."
              : "Falha de conexão. Verifique sua internet e tente novamente.",
          );
        }
      } else {
        setErrorMessage("Ocorreu um erro inesperado ao atualizar o perfil.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthenticatedLayout title="Meu perfil">
      {isLoading ? (
        <LoadingState label="Carregando seu perfil..." />
      ) : (
        <div className="space-y-6">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            >
              {errorMessage}
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="ml-2 font-semibold underline underline-offset-2"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
            >
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              {successMessage}
            </div>
          )}

          {profile && (
            <>
              <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <UserRound size={23} aria-hidden="true" />
                  </span>

                  <div>
                    <h2 className="text-lg font-bold text-dark">
                      Dados pessoais
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Atualize o nome associado à sua conta.
                    </p>
                  </div>
                </div>

                <UserProfileForm
                  key={profile.id}
                  initialName={profile.name}
                  isSaving={isSaving}
                  onSave={handleSave}
                />
              </section>

              <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <h2 className="mb-5 text-lg font-bold text-dark">
                  Informações da conta
                </h2>

                <UserProfileDetails profile={profile} />
              </section>
              
              <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Mail size={23} aria-hidden="true" />
                    </span>

                    <div>
                    <h2 className="text-lg font-bold text-dark">
                        Alterar e-mail
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        E-mail atual: {profile.email}
                    </p>
                    </div>
                </div>

                {emailChangeMessage && (
                    <div
                    role="status"
                    className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
                    >
                    {emailChangeMessage}
                    </div>
                )}

                <p className="mb-5 text-sm leading-6 text-muted">
                    Após solicitar a alteração, confira sua caixa de entrada e siga as
                    instruções da mensagem de confirmação.
                </p>

                <EmailChangeRequestForm
                    currentEmail={profile.email}
                    onSuccess={setEmailChangeMessage}
                />
              </section>

              <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <KeyRound size={23} aria-hidden="true" />
                    </span>

                    <div>
                    <h2 className="text-lg font-bold text-dark">
                        Alterar senha
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Mantenha sua conta protegida utilizando uma senha segura.
                    </p>
                    </div>
                </div>

                <ChangePasswordForm />
              </section>
            </>
          )}
        </div>
      )}
    </AuthenticatedLayout>
  );
}