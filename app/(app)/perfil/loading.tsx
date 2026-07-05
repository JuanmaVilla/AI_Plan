function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-elevated ${className}`} />;
}

export default function PerfilLoading() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
      <Bone className="h-10 w-40" />
      <Bone className="h-80 rounded-3xl" />
    </div>
  );
}
