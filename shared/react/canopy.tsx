/**
 * Canopy Gibbon Trust page sections for the React examples.
 *
 * Same markup and class names as the plain-HTML donation example, styled by /shared/canopy/site.css
 * (import /shared/canopy/tokens.css first). The donation form itself is not here: each example brings its own
 * (a React form against the FinDock API, or the Salesforce flow via Lightning Out) and passes it as `children`.
 */
import type { ReactNode } from 'react';
import logoLight from '../canopy/assets/logo-light.svg';
import gibbonsPhoto from '../canopy/assets/gibbons.jpg';
import iconRescue from '../canopy/assets/icon-rescue.svg';
import iconForest from '../canopy/assets/icon-forest.svg';
import iconRelease from '../canopy/assets/icon-release.svg';

export const ORGANISATION_NAME = 'Canopy Gibbon Trust';

interface SiteHeaderProps {
    /** Which kind of site this is, shown as a pill next to the logo, e.g. "React · FinDock API". */
    surface: string;
    surfaceTitle?: string;
    homeHref?: string;
    donateHref?: string;
}

export function SiteHeader({ surface, surfaceTitle, homeHref = './', donateHref = '#donate' }: SiteHeaderProps) {
    return (
        <header className="site-header">
            <div className="container">
                <a className="brand" href={homeHref}>
                    <span className="mark">
                        <img src={logoLight} alt="" width={44} height={44} />
                    </span>
                    {ORGANISATION_NAME}
                </a>
                <span className="surface" title={surfaceTitle}>
                    {surface}
                </span>
                <nav className="nav" aria-label="Main">
                    <a href="#work">Our work</a>
                    <a href="#work">Meet the gibbons</a>
                    <a href="#faq">Questions</a>
                    <a href="#about">About us</a>
                    <a className="button sun" href={donateHref}>
                        Donate
                    </a>
                </nav>
            </div>
        </header>
    );
}

interface HeroSectionProps {
    /** The donation form card. */
    children: ReactNode;
    tag?: string;
    title?: string;
    intro?: string;
}

export function HeroSection({
    children,
    tag = 'Winter appeal 2026',
    title = 'Keep their song in the forest.',
    intro = 'Every morning, gibbon families sing to mark their home. Your gift protects that home, and cares for the gibbons who lost theirs.',
}: HeroSectionProps) {
    return (
        <section className="hero" id="donate" aria-labelledby="hero-title">
            <div className="container">
                <div className="hero-copy">
                    <span className="tag">{tag}</span>
                    <h1 id="hero-title">{title}</h1>
                    <p>{intro}</p>
                    <img className="hero-photo" src={gibbonsPhoto} alt="Three gibbons resting in a tree" width={1329} height={1400} />
                </div>
                <div className="donate-card">{children}</div>
            </div>
            <svg className="wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 80 L0 46 C120 10 220 60 340 34 C470 6 560 58 700 36 C840 14 930 62 1070 34 C1200 8 1320 52 1440 30 L1440 80 Z" fill="#FFFFFF" />
            </svg>
        </section>
    );
}

const WORK = [
    { icon: iconRescue, colour: 'var(--canopy-sun)', title: 'Rescue and care', text: 'Gibbons taken from the pet trade get vet care, good food and time to recover at our rescue centre.' },
    { icon: iconForest, colour: 'var(--canopy-leaf)', title: 'Forest protection', text: 'Ranger patrols and replanted corridors keep wild families connected and safe from logging.' },
    { icon: iconRelease, colour: 'var(--canopy-forest)', title: 'Back to the wild', text: "When they're ready, gibbons are released in protected forest and followed by our field team." },
];

export function WorkSection() {
    return (
        <section className="section" id="work" aria-labelledby="work-title">
            <div className="container">
                <div className="section-head">
                    <span className="eyebrow">Where your gift goes</span>
                    <h2 id="work-title">From rescue to release.</h2>
                </div>
                <div className="cards">
                    {WORK.map((item) => (
                        <article className="card" key={item.title}>
                            <div className="leaf-icon" style={{ background: item.colour }}>
                                <img src={item.icon} alt="" width={28} height={28} />
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function QuoteBand({ ctaHref = '#donate' }: { ctaHref?: string }) {
    return (
        <section className="quote" aria-label="A supporter's story">
            <div className="container">
                <blockquote>
                    <p>"I give a little every month. It's the easiest good thing I do."</p>
                    <cite>[Supporter name], monthly donor</cite>
                </blockquote>
                <a className="button" href={ctaHref}>
                    Give monthly
                </a>
            </div>
        </section>
    );
}

export function FaqSection() {
    return (
        <section className="faq" id="faq" aria-labelledby="faq-title">
            <h2 id="faq-title">Questions about giving</h2>
            <details open>
                <summary>Can I change or stop my monthly gift?</summary>
                <p>Yes, at any time. Email us or use the link in your confirmation email.</p>
            </details>
            <details>
                <summary>Is my donation tax-deductible?</summary>
                <p>[Tax status and registration details.]</p>
            </details>
            <details>
                <summary>How is my payment handled?</summary>
                <p>Payments are encrypted and processed by FinDock in our Salesforce. We never see or store your card details.</p>
            </details>
        </section>
    );
}

interface SiteFooterProps {
    /** How the donation form on this site works, e.g. "React form, FinDock Payment API". */
    surfaceNote: string;
    supportEmail?: string;
    donateHref?: string;
}

export function SiteFooter({ surfaceNote, supportEmail = 'hello@canopygibbons.example', donateHref = '#donate' }: SiteFooterProps) {
    return (
        <footer className="site-footer" id="about">
            <div className="container">
                <div className="footer-cols">
                    <div>
                        <span className="footer-name">{ORGANISATION_NAME}</span>
                        <span>
                            Registered charity [number]
                            <br />
                            [Street address, city]
                        </span>
                    </div>
                    <div>
                        <strong>Give</strong>
                        <a href={donateHref}>Donate once</a>
                        <a href={donateHref}>Give monthly</a>
                        <a href={`mailto:${supportEmail}?subject=Cancel%20my%20monthly%20gift`}>Cancel a monthly gift</a>
                    </div>
                    <div>
                        <strong>Help</strong>
                        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                        <a href="#about">Privacy</a>
                        <a href="#about">Terms</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>© 2026 {ORGANISATION_NAME} · A fictional charity for a FinDock demo. Please don't donate real money.</span>
                    <span>Donation form: {surfaceNote} · processed by FinDock</span>
                </div>
            </div>
        </footer>
    );
}

interface ResultPageProps {
    variant: 'success' | 'failed';
    title: string;
    children: ReactNode;
    /** Buttons, links. */
    actions: ReactNode;
}

/** Thank-you and payment-failed pages. */
export function ResultPage({ variant, title, children, actions }: ResultPageProps) {
    return (
        <main className="result">
            <div className="container">
                <div className={variant === 'success' ? 'result-icon' : 'result-icon failed'} aria-hidden="true">
                    {variant === 'success' ? (
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1E2A22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                    ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1E4634" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 7v6" />
                            <path d="M12 17h.01" />
                        </svg>
                    )}
                </div>
                <h1>{title}</h1>
                {children}
                <div className="result-actions">{actions}</div>
            </div>
        </main>
    );
}
