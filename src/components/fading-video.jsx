const { useEffect, useRef } = React;

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55;

const FadingVideo = ({ src, className = "", style = {}, ...videoProps }) => {
  const videoRef = useRef(null);
  const rafRef = useRef(0);
  const restartTimerRef = useRef(0);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const fadeTo = (target, duration = FADE_MS) => {
      cancelAnimationFrame(rafRef.current);

      const startOpacity = Number.parseFloat(video.style.opacity || "0");
      const startedAt = performance.now();

      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        video.style.opacity = String(startOpacity + (target - startOpacity) * eased);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    const handleLoadedData = () => {
      video.style.opacity = "0";
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
      fadeTo(1);
    };

    const handleTimeUpdate = () => {
      const timeLeft = video.duration - video.currentTime;
      if (!fadingOutRef.current && timeLeft <= FADE_OUT_LEAD && timeLeft > 0) {
        fadingOutRef.current = true;
        fadeTo(0);
      }
    };

    const handleEnded = () => {
      cancelAnimationFrame(rafRef.current);
      video.style.opacity = "0";
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = window.setTimeout(() => {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise?.catch) playPromise.catch(() => {});
        fadingOutRef.current = false;
        fadeTo(1);
      }, 100);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    if (video.readyState >= 2) handleLoadedData();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(restartTimerRef.current);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={{ ...style, opacity: 0 }}
      autoPlay
      muted
      playsInline
      preload="auto"
      {...videoProps}
    />
  );
};

window.FadingVideo = FadingVideo;
