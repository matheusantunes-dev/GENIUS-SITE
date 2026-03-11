interface StatCardProps {
  label: string;
  tone: 'cool' | 'neutral' | 'signal' | 'warm';
  value: number | string;
}

export default function StatCard({ label, tone, value }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
