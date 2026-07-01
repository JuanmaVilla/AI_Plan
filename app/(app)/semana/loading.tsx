function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-elevated ${className}`} />;
}

export default function SemanaLoading() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <Bone className="h-8 w-40" />
      <div className="grid flex-1 grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <Bone key={i} className="rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
