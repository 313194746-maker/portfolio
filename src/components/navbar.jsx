const Navbar = () => {
  const links = ["Home", "Voyages", "Worlds", "Innovation", "Plan Launch"];

  return (
    <nav className="fixed left-0 right-0 top-4 z-50 flex items-center justify-between px-8 lg:px-16">
      <a
        href="#home"
        aria-label="Astera home"
        className="liquid-glass glass-interactive flex h-12 w-12 items-center justify-center rounded-full font-heading text-3xl italic text-white"
      >
        a
      </a>

      <div className="liquid-glass glass-interactive hidden items-center rounded-full px-1.5 py-1.5 md:flex">
        {links.map((link) => (
          <a
            key={link}
            href={link === "Home" ? "#home" : link === "Plan Launch" ? "#capabilities" : "#capabilities"}
            className="whitespace-nowrap px-3 py-2 font-body text-sm font-medium text-white/90"
          >
            {link}
          </a>
        ))}
        <a
          href="#capabilities"
          className="ml-1 flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black"
        >
          Claim a Spot
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="h-12 w-12" aria-hidden="true"></div>
    </nav>
  );
};

window.Navbar = Navbar;
