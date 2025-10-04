import styled from "styled-components";
import { useGameContext } from "@tedengine/ted";
import { useUIContext } from "@tedengine/ted";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`;

const Bubble = styled.div`
  position: absolute;
  color: white;
  font-size: 1.2rem;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  transition: opacity 0.2s ease-in-out, left 0.1s ease-in-out,
    top 0.1s ease-in-out;
  opacity: 0;
  &.visible {
    opacity: 1;
  }
`;

export default function MagnetMonitor() {
  const { magnetScreenPos, magnetValue } = useGameContext();
  const { scaling } = useUIContext();

  if (!magnetScreenPos) return null;

  const pos = magnetScreenPos as { x: number; y: number };
  if (Math.abs(pos.x) === Infinity || Math.abs(pos.y) === Infinity) return null;

  const screenPos = {
    x: pos.x + 10,
    y: pos.y - 20,
  };

  const value = magnetValue || 0;

  return (
    <Container
      style={{ transform: `scale(${scaling})`, transformOrigin: "top left" }}
    >
      <Bubble
        style={{ left: screenPos.x, top: screenPos.y }}
        className={typeof value === "number" && value > 0 ? "visible" : ""}
      >
        ${value.toString()}
      </Bubble>
    </Container>
  );
}
