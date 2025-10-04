import "./App.css";

import { TGame } from "@tedengine/ted";
import game from "./game/game?worker";
import Stats from "./Stats";
import MagnetMonitor from "./MagnetMonitor";

function App() {
  return (
    <>
      <div>
        <TGame
          config={{
            renderWidth: 800,
            renderHeight: 600,
            imageRendering: "pixelated",
            showFullscreenToggle: false,
            showAudioToggle: false,
          }}
          game={new game()}
        >
          <Stats />
          <MagnetMonitor />
        </TGame>
      </div>
    </>
  );
}

export default App;
