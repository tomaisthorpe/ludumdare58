import styled from "styled-components";
import { useGameContext, useUIContext } from "@tedengine/ted";

const Container = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 0;
  width: 100%;
  text-align: center;
  color: white;
  font-size: 2rem;
`;

export function StartNextDay() {
  const { state } = useGameContext();
  const { scaling } = useUIContext();
  if (state !== "start") return null;

  return (
    <Container
      style={{
        transform: `scale(${scaling})`,
        transformOrigin: "bottom center",
      }}
    >
      Press space to start the day.
    </Container>
  );
}
