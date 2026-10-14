interface PublicPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image?: string | null;
  className?: string;
}

export default function PublicPageHeader({ title, subtitle, eyebrow, image, className = "" }: PublicPageHeaderProps) {
  return (
    <header
      className={`relative flex h-[220px] min-h-[220px] items-center justify-center overflow-hidden px-5 text-center md:h-[320px] ${className}`}
      style={{
        backgroundColor: "#1E2A44",
        backgroundImage: image ? `linear-gradient(90deg, rgba(20,28,46,.34), rgba(20,28,46,.10)), url("${image}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className={image ? "rounded-xl border border-white/35 bg-white/90 px-7 py-6 shadow-[0_12px_38px_rgba(20,28,46,.16)] backdrop-blur-md sm:px-12 sm:py-8" : "max-w-3xl px-4"}>
        {eyebrow && <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[.22em] text-[#C07A4A]">{eyebrow}</p>}
        <h1 className={`font-serif text-4xl font-medium leading-tight tracking-[-.02em] sm:text-5xl ${image ? "text-[#1E2A44]" : "text-white"}`}>{title}</h1>
        <div className="mx-auto my-3 h-px w-10 bg-[#C07A4A]" />
        {subtitle && <p className={`mx-auto max-w-2xl font-sans text-sm leading-relaxed sm:text-base ${image ? "text-[#4B5563]" : "text-white/75"}`}>{subtitle}</p>}
      </div>
    </header>
  );
}
