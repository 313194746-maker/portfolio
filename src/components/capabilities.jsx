const { motion: capabilityMotion } = Motion;

const capabilities = [
  {
    title: "AI Scenery",
    description:
      "AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.",
    iconPath:
      "M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z",
    tags: ["Natural Context", "Photo Realism", "Infinite Settings", "Eco-Vibe"]
  },
  {
    title: "Batch Production",
    description:
      "Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.",
    iconPath:
      "M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z",
    tags: ["Scale Fast", "Visual Consistency", "Time Saver", "Ready to Post"]
  },
  {
    title: "Smart Lighting",
    description:
      "Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.",
    iconPath:
      "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z",
    tags: ["Ray Tracing", "Physical Shadows", "Studio Quality", "Sunlight Sync"]
  }
];

const CapabilityCard = ({ item, index }) => (
  <capabilityMotion.article
    initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
    whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.7, delay: index * 0.12, ease: "easeOut" }}
    className="liquid-glass flex min-h-[360px] flex-col rounded-[1.25rem] p-6"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="liquid-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.75rem]">
        <MaterialIcon path={item.iconPath} />
      </div>
      <div className="flex max-w-[70%] flex-wrap justify-end gap-1.5">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="liquid-glass whitespace-nowrap rounded-full px-3 py-1 font-body text-[11px] text-white/90"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>

    <div className="flex-1"></div>

    <div className="mt-6">
      <h3 className="font-heading text-3xl italic leading-none tracking-[-1px] text-white md:text-4xl">
        {item.title}
      </h3>
      <p className="mt-3 max-w-[32ch] font-body text-sm font-light leading-snug text-white/90">
        {item.description}
      </p>
    </div>
  </capabilityMotion.article>
);

const Capabilities = () => (
  <section id="capabilities" className="relative min-h-screen overflow-hidden bg-black">
    <FadingVideo
      src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
      className="absolute inset-0 z-0 h-full w-full object-cover"
    />

    <div className="relative z-10 flex min-h-screen flex-col px-8 pb-10 pt-24 md:px-16 lg:px-20">
      <capabilityMotion.header
        initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
        whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mb-auto"
      >
        <p className="mb-6 font-body text-sm text-white/80">// Capabilities</p>
        <h2 className="font-heading text-6xl italic leading-[0.9] tracking-[-3px] text-white md:text-7xl lg:text-[6rem]">
          Production
          <br />
          evolved
        </h2>
      </capabilityMotion.header>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {capabilities.map((item, index) => (
          <CapabilityCard key={item.title} item={item} index={index} />
        ))}
      </div>
    </div>
  </section>
);

window.Capabilities = Capabilities;
