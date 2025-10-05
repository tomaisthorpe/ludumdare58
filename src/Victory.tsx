import { useGameContext, useUIContext } from "@tedengine/ted";
import styled from "styled-components";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: white;
  font-size: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

export function Victory() {
  const { state } = useGameContext();
  const { scaling } = useUIContext();
  if (state !== "win") return null;

  return (
    <Container
      style={{ transform: `scale(${scaling})`, transformOrigin: "center" }}
    >
      <h1>You win!</h1>
      <p>You have collected the treasure.<br />Thank you for playing!</p>
    </Container>
  );
}
