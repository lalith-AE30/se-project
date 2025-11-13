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
              Manage claims and renewals without visiting a branch.
            </h1>
            <p className="max-w-2xl text-lg text-zinc-600">
              Start a new claim, upload supporting documents, and keep coverage active with automated
              renewal reminders—all from a single, secure portal.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/claims/submit"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                File a claim
              </Link>
              <Link
                href="/renewals"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                Schedule renewals
              </Link>
              <div className="flex flex-col text-sm text-zinc-500">
                <span>Secure uploads • Automated reminders • Instant confirmations</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Guided claim form",
              description:
                "Capture the policy, incident, and claimant details required to kick-start investigation quickly.",
            },
            {
              title: "Document uploads",
              description:
                "Attach photos, invoices, or reports with instant validation, upload progress, and secure storage.",
            },
            {
              title: "Renewal automation",
              description:
                "Configure lead times and track reminder status so renewals go out before coverage lapses.",
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
