export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span>© {new Date().getFullYear()} TimeToLearn</span>
        <span>Aprender. Ensinar. Evoluir.</span>
      </div>
    </footer>
  );
}