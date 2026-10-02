import { useEffect, useRef, useState } from 'react';

export function Canvas() {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let game: import('phaser').Game | undefined;
    void import('phaser').then(({ default: Phaser }) => {
      if (cancelled || !container.current) return;
      class Probe extends Phaser.Scene {
        create() {
          this.add.rectangle(480, 270, 760, 350, 0xfff9fa).setStrokeStyle(3, 0x9bbbd0);
          this.add.text(480, 240, 'Paw & Us', { fontSize: '48px', color: '#342E39', fontFamily: 'sans-serif' }).setOrigin(0.5);
          this.add.text(480, 310, 'Phaser canvas ready · Phase 0', { fontSize: '24px', color: '#342E39', fontFamily: 'sans-serif' }).setOrigin(0.5);
        }
      }
      game = new Phaser.Game({
        type: Phaser.AUTO, parent: container.current,
        backgroundColor: '#F8F0F2', width: 960, height: 540,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: Probe, audio: { noAudio: true },
      });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; game?.destroy(true); };
  }, []);
  return <div className="canvas" ref={container} role="img" aria-label="Paw & Us Phaser test canvas">
    {error && <p role="alert">Canvas could not load. Reload to try again.</p>}
  </div>;
}
