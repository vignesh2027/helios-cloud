export default function Loading() {
  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-pulse">
      <div className="skeleton h-8 w-64 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 skeleton h-72 rounded-xl" />
        <div className="skeleton h-72 rounded-xl" />
      </div>
    </div>
  );
}
