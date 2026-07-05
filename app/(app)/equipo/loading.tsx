function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-elevated ${className}`} />;
}

export default function EquipoLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-10">
      <Bone className="h-10 w-40" />
      <Bone className="h-28 rounded-[26px]" />
      {[...Array(3)].map((_, i) => (
        <Bone key={i} className="h-16 rounded-[22px]" />
      ))}
    </div>
  );
}
