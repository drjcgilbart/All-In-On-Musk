export function Chip({ chip }: { chip: string }) {
  const tone = chip.toLowerCase().replace(/\s+/g, "-");
  return <span className={`chip chip-${tone}`}>{chip}</span>;
}
