import { useEffect } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/modules/auth/contexts/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  const { locale } = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale ?? "en";
  }, [locale]);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
