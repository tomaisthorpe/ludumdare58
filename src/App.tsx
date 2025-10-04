import "./App.css";

import { TGame } from "@tedengine/ted";
import game from "./game/game?worker";

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
        />
      </div>
    </>
  );
}

export default App;
