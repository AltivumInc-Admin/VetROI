import React from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

const ParticleBackground: React.FC = React.memo(() => {
  const particlesInit = React.useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100vh', 
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
      transform: 'translateZ(0)', // Force GPU acceleration
      backfaceVisibility: 'hidden', // Prevent flicker
      perspective: 1000 // Enable 3D acceleration
    }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
        fullScreen: {
          enable: false,
          zIndex: -1,
        },
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        pauseOnBlur: false,
        pauseOnOutsideViewport: false,
        interactivity: {
          events: {
            onHover: {
              enable: false,
              mode: "grab",
            },
            resize: true,
            onDiv: {
              enable: false,
            },
            onClick: {
              enable: false,
            },
          },
          detectsOn: "canvas",
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.5,
                color: "#00d4ff", // VetROI cyan accent
              }
            },
          },
        },
        particles: {
          color: {
            value: "#6A6D73",
          },
          links: {
            color: "#6A6D73",
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 0.5,
            straight: false,
            bounce: true,
          },
          number: {
            density: {
              enable: true,
              area: 1000,
            },
            value: 60,
            limit: 100,
          },
          opacity: {
            value: 0.4,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      }}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

ParticleBackground.displayName = 'ParticleBackground';

export default ParticleBackground;