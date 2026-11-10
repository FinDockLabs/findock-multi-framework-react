/**
 * React wrapper around /shared/lightning-out/lightning-out-embed.js: renders a Salesforce component
 * (a FinDock flow) through Lightning Out 2.0, with the Canopy loading skeleton until it has rendered.
 */
import { useEffect, useRef, useState } from 'react';
import { embedLightningOut, type LightningOutConfig } from '../lightning-out/lightning-out-embed.js';

const SLOW_AFTER_MS = 15000;

interface LightningOutEmbedProps {
    config: LightningOutConfig;
    /** Component tag, e.g. "c-donation-flow". */
    component: string;
    /** Component attributes (kebab-case). Read once, when the embed starts. */
    attributes?: Record<string, string>;
    /** Accessible name of the loading state. */
    loadingLabel?: string;
}

export function LightningOutEmbed({ config, component, attributes, loadingLabel = 'Loading secure donation form…' }: LightningOutEmbedProps) {
    const container = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [slow, setSlow] = useState(false);

    useEffect(() => {
        if (!container.current) {
            return undefined;
        }
        const embed = embedLightningOut({
            container: container.current,
            config,
            component,
            attributes,
            onLoaded: () => setLoaded(true),
        });
        const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
        return () => {
            clearTimeout(timer);
            embed.destroy();
        };
        // Lightning Out reads the attributes once; restart only when the component or org changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.orgUrl, config.appId, component]);

    return (
        <div className="donate-embed" style={loaded ? { minHeight: 0 } : undefined}>
            <div ref={container} className="donate-embed-target" />
            <div className={loaded ? 'donate-loading done' : 'donate-loading'} role="status" aria-live="polite" hidden={loaded}>
                <span className="sk sk-steps" aria-hidden="true" />
                <span className="sk sk-title" aria-hidden="true" />
                <span className="sk sk-toggle" aria-hidden="true" />
                <span className="sk-grid" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <span className="sk sk-tile" key={i} />
                    ))}
                </span>
                <span className="sk sk-input" aria-hidden="true" />
                <span className="sk sk-button" aria-hidden="true" />
                <p className="loading-text">{slow ? 'Still connecting to Salesforce. This can take a moment the first time…' : loadingLabel}</p>
            </div>
        </div>
    );
}
