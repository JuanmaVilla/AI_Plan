function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-elevated ${className}`} />;
}

export default function TiemposLoading() {
  return (
    <div className="flex w-full flex-col gap-4 px-6 py-10">
      <Bone className="h-10 w-40" />
      <Bone className="h-[420px] rounded-[26px]" />
    </div>
  );
}
