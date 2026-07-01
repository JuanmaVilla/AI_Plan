function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-elevated ${className}`}
    />
  );
}

export default function HoyLoading() {
  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
      {/* Timer skeleton */}
      <Bone className="h-14 w-full rounded-full" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-24" />
        <Bone className="h-10 w-32" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(4)].map((_, i) => (
          <Bone key={i} className="h-44 rounded-[26px]" />
        ))}
      </div>
    </div>
  );
}
