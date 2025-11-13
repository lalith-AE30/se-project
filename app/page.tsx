import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 py-16">
      <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6">
        <section className="rounded-3xl bg-white p-12 shadow-xl shadow-zinc-200/60">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Insurance Self-Service
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
              Submit your claim online in minutes.
            </h1>
            <p className="max-w-2xl text-lg text-zinc-600">
              Provide your claim details, upload supporting documents, and receive a reference ID
              instantly. No branch visits, no waiting—just a streamlined claims experience from any
              device.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/claims/submit"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                File a claim now
              </Link>
              <div className="flex flex-col text-sm text-zinc-500">
                <span>Secure upload • Accessible forms • Instant confirmation</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Guided form",
              description: "Step-by-step prompts ensure we capture the details needed to start your claim quickly.",
            },
            {
              title: "Document uploads",
              description:
                "Attach photos, invoices, or reports with real-time progress feedback and validation.",
            },
            {
              title: "Status tracking",
              description: "Receive a confirmation ID immediately and track updates as your claim progresses.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-zinc-900">{card.title}</h2>
              <p className="mt-3 text-sm text-zinc-600">{card.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
