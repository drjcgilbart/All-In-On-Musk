import { Chip } from "@/components/chip";
import { LetterVideo } from "@/components/letter-video";
import { parseMarkdown, type Inline } from "@/lib/letter";

function Inlines({ items }: { items: Inline[] }) {
  return items.map((item, index) => {
    const key = `${item.type}-${index}`;
    if (item.type === "text") return <span key={key}>{item.text}</span>;
    if (item.type === "strong") return <strong key={key}>{item.text}</strong>;
    if (item.type === "em") return <em key={key}>{item.text}</em>;
    if (item.type === "code") return <code key={key}>{item.text}</code>;
    if (item.type === "chip") return <Chip key={key} chip={item.chip} />;
    const external = item.href.startsWith("http");
    return (
      <a key={key} href={item.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {item.text}
      </a>
    );
  });
}

export function LetterMarkdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  if (!blocks.length) return null;
  return (
    <div className="letter-body">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
          return (
            <Tag key={index}>
              <Inlines items={block.inlines} />
            </Tag>
          );
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inlines items={item} />
                </li>
              ))}
            </Tag>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index} className="note">
              <Inlines items={block.inlines} />
            </blockquote>
          );
        }
        if (block.type === "rule") return <hr key={index} className="letter-rule" />;
        if (block.type === "video") return <LetterVideo key={index} id={block.id} title={block.title} />;
        return (
          <p key={index}>
            <Inlines items={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}
