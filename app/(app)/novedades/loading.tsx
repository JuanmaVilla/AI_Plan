function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-elevated ${className}`} />;
}

export default function NovedadesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-20" />
        <Bone className="h-10 w-36" />
      </div>
      <Bone className="h-16 w-full rounded-[20px]" />
      {[...Array(3)].map((_, i) => (
        <Bone key={i} className="h-32 rounded-[26px]" />
      ))}
    </div>
  );
}
