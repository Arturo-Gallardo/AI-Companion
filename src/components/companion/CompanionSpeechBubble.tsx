interface CompanionSpeechBubbleProps {
  text: string;
  scale?: number;
}

export function CompanionSpeechBubble({
  text,
  scale = 1,
}: CompanionSpeechBubbleProps) {
  const fontSize = 12 * scale;
  const paddingX = 8 * scale;
  const paddingY = 4 * scale;
  const borderRadius = 6 * scale;
  const maxWidth = 112 * scale;

  return (
    <div
      className="pointer-events-none border border-neutral-500/80 bg-neutral-900/95 text-center text-neutral-100 shadow-sm"
      style={{
        fontSize,
        padding: `${paddingY}px ${paddingX}px`,
        borderRadius,
        maxWidth,
        lineHeight: 1.3,
      }}
    >
      {text}
    </div>
  );
}
