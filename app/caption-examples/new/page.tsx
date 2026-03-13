import CaptionExampleForm from '../CaptionExampleForm'

export default function NewCaptionExamplePage() {
  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Caption Examples</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">New Caption Example</h1>
      </div>
      <CaptionExampleForm />
    </div>
  )
}
