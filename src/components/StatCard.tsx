type StatCardProps = {
  title: string;
  value: string;
  description?: string;
};

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <article className="flex min-h-[120px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-medium leading-tight text-slate-600">{title}</h3>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-4xl font-semibold text-slate-700">{value}</p>
      </div>
      {description ? <p className="text-2xl font-normal text-slate-500">{description}</p> : null}
    </article>
  );
}
