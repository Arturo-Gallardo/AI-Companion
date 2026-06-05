import { useTomojis } from "../../hooks/useTomojis";
import { AddTomojiCard } from "./AddTomojiCard";
import { TomojiCard } from "./TomojiCard";

export function TomojisView() {
  const { tomojis, addTomoji, deleteTomoji, toggleTomoji } = useTomojis();

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-12 py-12">
      <div className="flex flex-wrap gap-6">
        {tomojis.map((tomoji) => (
          <TomojiCard
            key={tomoji.id}
            tomoji={tomoji}
            onDelete={deleteTomoji}
            onToggle={toggleTomoji}
          />
        ))}

        <AddTomojiCard onAdd={addTomoji} />
      </div>
    </section>
  );
}
