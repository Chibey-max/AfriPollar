export function AmbientBackground() {
  return (
    <div aria-hidden="true">
      <div className="bg-video">
        <video
          src="/media/pulse-demo.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <div className="bg-mesh" />
      <div className="bg-grid" />
      <div className="bg-spotlight" />
    </div>
  );
}
