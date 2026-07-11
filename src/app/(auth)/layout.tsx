export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 overflow-hidden bg-background py-16">
      {/* Decorative premium ambient glow backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-secondary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-accent/15 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">{children}</div>
    </div>
  );
}
