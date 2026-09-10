export function Avatar({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  const style = { width: size, height: size, minWidth: size };

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- avatar URLs are user-uploaded, arbitrary Supabase Storage objects
    return <img src={url} alt={name} style={style} className="rounded-full object-cover shrink-0" />;
  }

  return (
    <div
      style={{ ...style, backgroundColor: "#26364A", fontSize: size * 0.42 }}
      className="rounded-full flex items-center justify-center shrink-0 font-semibold text-white select-none"
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}
