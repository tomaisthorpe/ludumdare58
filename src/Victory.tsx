import { useGameContext } from "@tedengine/ted";
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
  if (state !== "win") return null;

  return (
    <Container>
      <h1>You win!</h1>
      <p>You have collected the treasure.</p>
    </Container>
  );
}
