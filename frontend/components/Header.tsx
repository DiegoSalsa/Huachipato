interface HeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 md:px-8 md:py-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{title}</h2>
        <p className="text-slate-500 text-xs md:text-sm mt-1">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-3 w-full md:w-auto">{children}</div>}
    </header>
  );
}
