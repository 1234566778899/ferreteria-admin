/** Marco centrado para las pantallas previas a la app (login, configuración, sin acceso). */
export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-surface-muted p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center gap-1">
          <img src="/favicon.svg" alt="" className="size-12" />
          <span className="mt-2 text-[17px] font-[650]">Inventario de ferretería</span>
        </div>
        <div className="rounded-[20px] bg-white p-6 shadow-card">{children}</div>
      </div>
    </div>
  );
}
