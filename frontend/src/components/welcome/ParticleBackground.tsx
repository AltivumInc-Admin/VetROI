import React from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

const ParticleBackground: React.FC = () => {
  const particlesInit = async (engine: Engine) => {
    await loadSlim(engine);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100vh', 
      pointerEvents: 'none',
      zIndex: 0 
    }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
        fullScreen: {
          enable: false,
        },
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
            resize: false,
            onDiv: {
              enable: false,
            },
            onClick: {
              enable: false,
            },
          },
          detectsOn: "window",
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
              default: "out",
            },
            random: false,
            speed: 0.5,
            straight: false,
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
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};

export default ParticleBackground;