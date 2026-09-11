import heroImage from '@/assets/hero.svg';

interface HeroProps {
  organisationName: string;
}

/** Cause-driven hero: headline, why, image, impact strip. Sits beside the form on desktop. */
export function Hero({ organisationName }: HeroProps) {
  return (
    <section className="reveal" aria-labelledby="hero-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Clean water, close to home</p>
      <h1 id="hero-heading" className="mt-3 text-4xl font-semibold text-ink sm:text-5xl lg:text-[3.4rem]">
        Every well we repair keeps a village drinking for a decade.
      </h1>
      <p className="mt-5 max-w-prose text-lg text-muted-foreground">
        {organisationName} trains local technicians to build, repair and maintain water points in the communities that
        need them most. Your gift pays for pumps, filters and the people who keep them running.
      </p>

      <figure className="mt-8 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-paper-deep/60">
        {/* Placeholder illustration — swap for a real photo of the cause (keep a meaningful alt). */}
        <img src={heroImage} alt="Illustration of a hand pump beside a river, with ripples spreading across the water" className="block h-auto w-full" width="960" height="640" loading="eager" />
      </figure>

      <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-ink/15 pt-6">
        {[
          ['412', 'water points restored'],
          ['96,000', 'people with safe water'],
          ['92%', 'of gifts spent in the field'],
        ].map(([value, label]) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-display text-2xl font-semibold text-ink sm:text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <blockquote className="mt-8 hidden border-l-2 border-clay pl-4 text-muted-foreground lg:block">
        “Before the pump, my daughters walked two hours for water. Now they walk to school.”
        <footer className="mt-2 text-sm">— Amina, village water committee</footer>
      </blockquote>
    </section>
  );
}
