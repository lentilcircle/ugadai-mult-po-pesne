import { useEffect, useState } from 'react';

const STEPS = ['3', '2', '1', 'ПОЕХАЛИ!'] as const;

interface CountdownProps {
  onComplete: () => void;
}

export function Countdown({ onComplete }: CountdownProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const delay = step === STEPS.length - 1 ? 900 : 750;
    const timer = window.setTimeout(() => {
      if (step >= STEPS.length - 1) {
        onComplete();
        return;
      }
      setStep((current) => current + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [onComplete, step]);

  const label = STEPS[step];

  return (
    <section className="screen countdown-screen" aria-live="assertive">
      <p className="kicker">Приготовьтесь</p>
      <p key={label} className={label.length > 2 ? 'countdown-value is-word' : 'countdown-value'}>
        {label}
      </p>
    </section>
  );
}
