import styled from "styled-components";
import { useGameContext, useUIContext } from "@tedengine/ted";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 5rem;
`;

const BarBackground = styled.div`
  width: 80%;
  max-width: 600px;
  height: 25px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  transition: width 0.1s linear, background-color 0.3s ease;
`;

function getColorForProgress(progress: number): string {
  if (progress > 0.6) {
    // Green zone
    return "#4caf50";
  } else if (progress > 0.4) {
    // Yellow zone
    return "#ffeb3b";
  } else if (progress > 0.2) {
    // Orange zone
    return "#ff9800";
  } else {
    // Red zone
    return "#f44336";
  }
}

export default function DayProgressBar() {
  const { timeLeft, dayLength, state } = useGameContext();
  const { scaling } = useUIContext();

  if (
    state !== "fishing" ||
    timeLeft === undefined ||
    timeLeft === null ||
    dayLength === undefined ||
    dayLength === null
  )
    return null;

  const progress = Math.max(
    0,
    Math.min(1, (timeLeft as number) / (dayLength as number))
  );
  const color = getColorForProgress(progress);

  return (
    <Container
      style={{
        transform: `scale(${scaling})`,
        transformOrigin: "top center",
      }}
    >
      <BarBackground>
        <BarFill
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
          }}
        />
      </BarBackground>
    </Container>
  );
}
