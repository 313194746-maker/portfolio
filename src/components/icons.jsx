const ArrowUpRight = ({ className = "h-6 w-6" }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

const PlayIcon = ({ className = "h-6 w-6" }) => (
  <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const ClockIcon = ({ className = "h-7 w-7" }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlobeIcon = ({ className = "h-7 w-7" }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21M12 3C9.6 5.5 8.5 8.5 8.5 12S9.6 18.5 12 21" />
  </svg>
);

const MaterialIcon = ({ path }) => (
  <svg aria-hidden="true" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d={path} />
  </svg>
);

window.ArrowUpRight = ArrowUpRight;
window.PlayIcon = PlayIcon;
window.ClockIcon = ClockIcon;
window.GlobeIcon = GlobeIcon;
window.MaterialIcon = MaterialIcon;
