import "./App.css";

import { TGame } from "@tedengine/ted";
import game from "./game/game?worker";
import Stats from "./Stats";
import MagnetMonitor from "./MagnetMonitor";
import { UpdateModal } from "./UpdateModal";
import { StartNextDay } from "./StartNextDay";
import { Victory } from "./Victory";

function App() {
  return (
    <>
      <div>
        <TGame
          aspectRatio="4 / 3"
          config={{
            renderWidth: 800,
            renderHeight: 600,
            imageRendering: "pixelated",
            showFullscreenToggle: true,
            showAudioToggle: false,
          }}
          game={new game()}
        >
          <Stats />
          <MagnetMonitor />
          <UpdateModal />
          <StartNextDay />
          <Victory />
        </TGame>
      </div>
    </>
  );
}

export default App;
