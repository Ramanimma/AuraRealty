import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const GOLD = "#C07A4A";

const HeroSection = () => {
  const navigate = useNavigate();

  const { data: videos = [] } = useQuery({
    queryKey: ["hero-videos"],
    queryFn: () => api.heroVideos.list(),
  });

  // Two video slots: A and B. activeSlot is the one currently visible.
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");
  const [slotAIdx, setSlotAIdx] = useState(0);
  const [slotBIdx, setSlotBIdx] = useState(1);
  const [dotIdx, setDotIdx] = useState(0);

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set initial video sources once data loads
  useEffect(() => {
    if (videos.length === 0) return;
    const va = videoARef.current;
    const vb = videoBRef.current;
    if (va && !va.src) {
      va.src = videos[0]?.cloudinary_url ?? "";
      va.load();
      va.play().catch(() => {});
    }
    if (vb && !vb.src && videos.length > 1) {
      vb.src = videos[1]?.cloudinary_url ?? "";
      vb.load();
      // B starts inactive — don't play yet, just preload
    }
  }, [videos.length]);

  // Play/pause based on active slot
  useEffect(() => {
    if (videos.length === 0) return;
    if (activeSlot === "a") {
      videoARef.current?.play().catch(() => {});
      videoARef.current && (videoARef.current.playbackRate = 1);
    } else {
      videoBRef.current?.play().catch(() => {});
      videoBRef.current && (videoBRef.current.playbackRate = 1);
    }
  }, [activeSlot, videos.length]);

  // Update slot A source when its index changes (happens after it becomes inactive)
  useEffect(() => {
    if (videos.length === 0) return;
    const v = videoARef.current;
    if (!v) return;
    const newSrc = videos[slotAIdx % videos.length]?.cloudinary_url;
    if (!newSrc) return;
    // Only reload if src actually changed
    const current = v.getAttribute("src");
    if (current !== newSrc) {
      v.src = newSrc;
      v.load();
      if (activeSlot === "a") v.play().catch(() => {});
    }
  }, [slotAIdx, videos.length]);

  // Update slot B source when its index changes
  useEffect(() => {
    if (videos.length === 0) return;
    const v = videoBRef.current;
    if (!v) return;
    const newSrc = videos[slotBIdx % videos.length]?.cloudinary_url;
    if (!newSrc) return;
    const current = v.getAttribute("src");
    if (current !== newSrc) {
      v.src = newSrc;
      v.load();
      if (activeSlot === "b") v.play().catch(() => {});
    }
  }, [slotBIdx, videos.length]);

  // Switch on onEnded or 15-second cap — whichever fires first
  const doSwitch = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (videoARef.current) videoARef.current.onended = null;
    if (videoBRef.current) videoBRef.current.onended = null;
    setActiveSlot((current) => {
      setSlotAIdx((a) => {
        setSlotBIdx((b) => {
          const next = (slot: "a" | "b") => {
            if (slot === "a") {
              const newDot = b % videos.length;
              setDotIdx(newDot);
              setTimeout(() => setSlotAIdx((newDot + 1) % videos.length), 1600);
            } else {
              const newDot = a % videos.length;
              setDotIdx(newDot);
              setTimeout(() => setSlotBIdx((newDot + 1) % videos.length), 1600);
            }
          };
          next(current);
          return b;
        });
        return a;
      });
      return current === "a" ? "b" : "a";
    });
  }, [videos.length]);

  useEffect(() => {
    if (videos.length <= 1) return;
    const activeVideoEl = activeSlot === "a" ? videoARef.current : videoBRef.current;
    if (!activeVideoEl) return;

    const switchNow = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      activeVideoEl.onended = null;
      if (activeSlot === "a") {
        const newDot = slotBIdx % videos.length;
        setDotIdx(newDot);
        setActiveSlot("b");
        setTimeout(() => setSlotAIdx((newDot + 1) % videos.length), 1600);
      } else {
        const newDot = slotAIdx % videos.length;
        setDotIdx(newDot);
        setActiveSlot("a");
        setTimeout(() => setSlotBIdx((newDot + 1) % videos.length), 1600);
      }
    };

    timerRef.current = setTimeout(switchNow, 8000);
    activeVideoEl.onended = switchNow;

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      activeVideoEl.onended = null;
    };
  }, [activeSlot, videos.length, slotAIdx, slotBIdx]);

  // Dot click — jump to a specific video
  const handleDotClick = (i: number) => {
    if (i === dotIdx) return;
    const inactive = activeSlot === "a" ? "b" : "a";
    // Put the target video in the inactive slot, then activate it
    if (inactive === "b") {
      // Update B to show video[i], then switch to B
      const v = videoBRef.current;
      if (v) {
        const newSrc = videos[i]?.cloudinary_url;
        if (newSrc && v.getAttribute("src") !== newSrc) {
          v.src = newSrc;
          v.load();
        }
      }
      setSlotBIdx(i);
    } else {
      const v = videoARef.current;
      if (v) {
        const newSrc = videos[i]?.cloudinary_url;
        if (newSrc && v.getAttribute("src") !== newSrc) {
          v.src = newSrc;
          v.load();
        }
      }
      setSlotAIdx(i);
    }
    setDotIdx(i);
    setActiveSlot(inactive);
    // After crossfade, set the now-inactive slot to preload the next video
    setTimeout(() => {
      const nextIdx = (i + 1) % videos.length;
      if (activeSlot === "a") setSlotAIdx(nextIdx);
      else setSlotBIdx(nextIdx);
    }, 1600);
  };

  const scrollToProperties = () => {
    document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" });
  };

  const hasVideos = videos.length > 0;

  return (
    <section
      style={{
        height: "100vh",
        minHeight: "600px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#1E2A44",
      }}
    >
      {/* Video slot A */}
      {hasVideos && (
        <video
          ref={videoARef}
          muted
          playsInline
          preload={activeSlot === "a" ? "auto" : "none"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: activeSlot === "a" ? 1 : 0,
            transition: "opacity 1.5s ease",
            zIndex: 1,
          }}
        />
      )}

      {/* Video slot B */}
      {hasVideos && videos.length > 1 && (
        <video
          ref={videoBRef}
          muted
          playsInline
          preload={activeSlot === "b" ? "auto" : "none"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: activeSlot === "b" ? 1 : 0,
            transition: "opacity 1.5s ease",
            zIndex: 1,
          }}
        />
      )}

      <style>{`
        @keyframes aura-hero-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes aura-hero-word {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aura-hero-rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-word { display: inline-block; }
        .hero-entrance { animation: aura-hero-fade 400ms ease-out 0ms both; }
        .hero-entrance .hero-eyebrow { animation: aura-hero-fade 300ms ease-out 300ms both; }
        .hero-entrance .hero-word {
          animation: aura-hero-word 500ms ease-out both;
          animation-delay: calc(450ms + var(--hero-word-index) * 120ms);
        }
        .hero-entrance .hero-subtitle { animation: aura-hero-rise 350ms ease-out 1050ms both; }
        .hero-entrance .hero-buttons { animation: aura-hero-rise 350ms ease-out 1200ms both; }
        .hero-entrance:focus-within,
        .hero-entrance:focus-within .hero-eyebrow,
        .hero-entrance:focus-within .hero-word,
        .hero-entrance:focus-within .hero-subtitle,
        .hero-entrance:focus-within .hero-buttons { animation: none; }
        @media (prefers-reduced-motion: reduce) {
          .hero-entrance,
          .hero-entrance .hero-eyebrow,
          .hero-entrance .hero-word,
          .hero-entrance .hero-subtitle,
          .hero-entrance .hero-buttons { animation: none; }
        }
        @media (max-width: 640px) {
          .hero-content-panel {
            padding: 20px 18px !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Centered content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <div
          className="hero-content-panel hero-entrance"
          style={{
            width: "100%",
            maxWidth: "640px",
            boxSizing: "border-box",
            background: "rgba(20,28,46,0.80)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "16px",
            padding: "32px 40px",
          }}
        >
        {/* Gold label */}
        <p
          className="hero-eyebrow"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 400,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#FFFFFF",
            textShadow: "0 2px 12px rgba(0,0,0,0.45)",
            marginBottom: "20px",
          }}
        >
          Austin &amp; Central Texas
        </p>

        {/* Headline */}
        <h1
          aria-label="Discover Your Perfect Home"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(38px, 6.3vw, 65px)",
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "#fff",
            textShadow: "0 2px 12px rgba(0,0,0,0.45)",
            margin: 0,
          }}
        >
          <span className="hero-word" aria-hidden="true" style={{ "--hero-word-index": 0 } as React.CSSProperties}>Discover</span>{" "}
          <span className="hero-word" aria-hidden="true" style={{ "--hero-word-index": 1 } as React.CSSProperties}>Your</span>{" "}
          <br />
          <span className="hero-word" aria-hidden="true" style={{ "--hero-word-index": 2 } as React.CSSProperties}>Perfect</span>{" "}
          <span className="hero-word" aria-hidden="true" style={{ "--hero-word-index": 3 } as React.CSSProperties}>
            <em style={{ color: "#FFFFFF", fontStyle: "italic" }}>Home</em>
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="hero-subtitle"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "#FFFFFF",
            textShadow: "0 2px 12px rgba(0,0,0,0.45)",
            letterSpacing: "0.06em",
            maxWidth: "380px",
            margin: "16px auto 40px",
          }}
        >
          Premium real estate in Austin &amp; Central Texas
        </p>

        {/* CTA Buttons */}
        <div
          className="hero-buttons"
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={scrollToProperties}
            data-testid="button-explore-properties"
            className="public-button-primary"
            style={{
              padding: "16px 32px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              backgroundColor: "#A8653A",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              borderRadius: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8F5530";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8653A";
            }}
          >
            Explore Properties
          </button>

          <button
            onClick={() => navigate("/home-valuation")}
            data-testid="button-free-home-valuation"
            className="public-button-secondary public-button-secondary-dark"
            style={{
              padding: "16px 32px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              backgroundColor: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "border-color 0.3s ease, color 0.3s ease",
              borderRadius: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD;
              (e.currentTarget as HTMLButtonElement).style.color = GOLD;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
          >
            Free Home Valuation
          </button>
        </div>
        </div>
      </div>

      {/* Video indicator dots */}
      {videos.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "52px",
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              data-testid={`button-hero-dot-${i}`}
              style={{
                height: "3px",
                width: i === dotIdx ? "24px" : "8px",
                backgroundColor: i === dotIdx ? GOLD : "rgba(255,255,255,0.30)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                borderRadius: 8,
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "32px",
            border: "1px solid rgba(255,255,255,0.40)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "4px",
          }}
        >
          <div
            style={{
              width: "3px",
              height: "8px",
              backgroundColor: "rgba(255,255,255,0.40)",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
