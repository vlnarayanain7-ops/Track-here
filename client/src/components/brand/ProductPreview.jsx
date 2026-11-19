export default function ProductPreview() {
  return <figure className="max-w-5xl mx-auto mt-12">
    <div className="rounded-2xl border border-[var(--line)] overflow-hidden shadow-lg bg-[var(--surface)]">
      <img src="/previews/today.png" alt="Track Here Today dashboard showing a study task, daily focus goal, and planning and review actions" width="1280" height="720" fetchPriority="high" className="w-full h-auto" />
    </div>
    <div className="grid sm:grid-cols-2 gap-4 mt-4">
      <div className="rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--surface)]"><img src="/previews/focus.png" alt="Focus workspace with subject selection and a 25-minute Pomodoro timer" loading="lazy" width="1280" height="720" className="w-full h-auto"/><p className="px-4 py-3 text-sm font-medium">One block of focused study</p></div>
      <div className="rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--surface)]"><img src="/previews/plan.png" alt="Weekly planning calendar with study blocks and planned versus completed minutes" loading="lazy" width="1280" height="720" className="w-full h-auto"/><p className="px-4 py-3 text-sm font-medium">A week with room to learn</p></div>
    </div>
    <figcaption className="text-center text-xs text-[var(--muted)] mt-4">Actual workspace screens with representative demo data.</figcaption>
  </figure>;
}
