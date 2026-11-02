"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icon";

const DEFAULT_TRACKS = [
  {
    title: "Lofi Hip Hop Radio",
    url: "https://www.youtube.com/embed/jfKfPfyJRdk",
  },
  {
    title: "Coffee Shop ambience",
    url: "https://www.youtube.com/embed/DpLg3aSBOGw",
  },
];

type Track = { title: string; url: string };

/**
 * Trình phát nhạc nền.
 *
 * Hỗ trợ nhạc nền mặc định (YouTube embed) và các bản nhạc tuỳ chỉnh
 * mà người dùng tự thêm (đường dẫn audio trực tiếp).
 */
export function MusicPlayer({
  customTracks,
}: {
  customTracks: Track[];
}) {
  const tracks = [...DEFAULT_TRACKS, ...customTracks];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const track = tracks[index];

  // Điều khiển player YouTube qua postMessage
  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;

    const isYoutube = track.url.includes("youtube.com");

    if (isYoutube) {
      frame.postMessage(
        JSON.stringify({
          event: "command",
          func: playing ? "playVideo" : "pauseVideo",
          args: [],
        }),
        "*",
      );
    }
  }, [playing, track.url]);

  function next() {
    setIndex((i) => (i + 1) % tracks.length);
    setPlaying(true);
  }

  function prev() {
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
    setPlaying(true);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={prev}
        aria-label="Bài trước"
        className="w-10 h-10 grid place-items-center rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95"
      >
        <Icon name="prev" size={18} />
      </button>

      <button
        type="button"
        onClick={() => setPlaying((v) => !v)}
        aria-label={playing ? "Tạm dừng" : "Phát nhạc"}
        className="w-12 h-12 grid place-items-center rounded-full bg-[var(--p-primary)] text-[var(--p-on-primary)] hover:brightness-105 shrink-0"
      >
        <Icon name={playing ? "pause" : "play"} size={22} />
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Bài tiếp theo"
        className="w-10 h-10 grid place-items-center rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95"
      >
        <Icon name="next" size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-[var(--p-ink)] truncate">
          {track.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Icon name={playing ? "sound" : "mute"} size={14} className="text-[var(--p-muted)] shrink-0" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label="Âm lượng"
            className="flex-1 min-w-0 h-1 accent-[var(--p-primary)]"
          />
        </div>
      </div>

      {track.url.includes("youtube.com") ? (
        <iframe
          ref={iframeRef}
          src={`${track.url}?autoplay=1&loop=1&playlist=${encodeURIComponent(
            track.url,
          )}`}
          width="0"
          height="0"
          allow="autoplay"
          className="pointer-events-none absolute w-0 h-0 opacity-0"
          title={track.title}
        />
      ) : (
        <audio
          src={track.url}
          autoPlay={playing}
          loop
          ref={(el) => {
            if (el) el.volume = volume;
          }}
        />
      )}
    </div>
  );
}
