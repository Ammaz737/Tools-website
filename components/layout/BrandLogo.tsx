import Image from "next/image";

export function BrandLogo({ preload = false }: { preload?: boolean }) {
  return (
    <span className="brand-logo">
      <Image
        src="/branding/aletool-logo.png"
        alt="ALETOOL"
        width={2172}
        height={724}
        sizes="(max-width: 640px) 180px, 240px"
        preload={preload}
        className="brand-logo-image"
      />
    </span>
  );
}
