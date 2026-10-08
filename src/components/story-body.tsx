import type { StoryImage } from "@/lib/studio/types";

export function coverOf(images: StoryImage[], featuredImageId?: string) {
  return images.find((image) => image.id === featuredImageId) || images[0] || null;
}

export function youtubeThumb(id?: string) {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

export function storyDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function StoryBody({ body, images }: { body: string; images: StoryImage[] }) {
  const byId = new Map(images.map((image) => [image.id, image]));
  const used = new Set<string>();
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="story">
      {blocks.map((block, index) => {
        const token = block.match(/^\[\[photo:([a-zA-Z0-9_-]+)\]\]$/);
        if (token) {
          const image = byId.get(token[1]);
          if (!image) return null;
          used.add(image.id);
          return (
            <figure key={`${image.id}-${index}`}>
              {/* Local studio uploads and Blob URLs are not in the Next image allow-list. */}
              <img src={image.url} alt={image.caption || ""} />
              {image.caption ? <figcaption>{image.caption}</figcaption> : null}
            </figure>
          );
        }
        return <p key={index}>{block}</p>;
      })}
      {images.filter((image) => !used.has(image.id)).map((image) => (
        <figure key={image.id}>
          <img src={image.url} alt={image.caption || ""} />
          {image.caption ? <figcaption>{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
