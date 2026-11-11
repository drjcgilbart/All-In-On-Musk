import Image from "next/image";

export function DropImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src.startsWith("https://")) {
    // Drop mockups can be any https URL the publisher stored. Don't send those through the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={src} alt={alt} width={width} height={height} />;
  }
  return <Image className={className} src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} unoptimized={src.endsWith(".svg")} />;
}
