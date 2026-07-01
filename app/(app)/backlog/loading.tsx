function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-elevated ${className}`} />;
}

export default function BacklogLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-10">
      <Bone className="h-10 w-28" />
      {[...Array(5)].map((_, i) => (
        <Bone key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}
