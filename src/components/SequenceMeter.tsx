interface SequenceMeterProps {
  current: number;
  minimumSlots?: number;
  total: number;
}

export default function SequenceMeter({
  current,
  minimumSlots = 6,
  total,
}: SequenceMeterProps) {
  const slotCount = Math.max(total, minimumSlots);

  return (
    <div className="sequence-meter" aria-label="progresso da rodada">
      {Array.from({ length: slotCount }, (_, index) => {
        const armed = total > 0 && index < total;
        const complete = armed && index < current;

        return (
          <span
            key={`meter-${index}`}
            className={`sequence-meter__dot ${armed ? 'is-armed' : ''} ${complete ? 'is-complete' : ''}`}
          />
        );
      })}
    </div>
  );
}
