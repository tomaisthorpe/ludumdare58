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
`;

const Modal = styled.div`
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 2rem;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #999;
  max-width: 400px;

  h2 {
    font-size: 2rem;
    margin: 0;
    padding: 0;
  }

  p {
    font-size: 1rem;
    margin: 0;
    padding: 0;
  }

  button {
    font-size: 1rem;
    margin-top: 0.25rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    border: 1px solid white;
    background: none;
    color: white;

    &:hover {
      background: white;
      color: black;
    }
  }

  ul {
    padding: 0;
    margin-top: 1rem;
    margin-left: 1rem;
    margin-bottom: 1rem;
    text-align: left;
  }

  li {
    font-size: 1.25rem;
    margin: 0;
    padding: 0;
  }
`;

export function Instructions() {
  const { instructionsRead } = useGameContext();
  const { scaling } = useUIContext();

  if (instructionsRead) return null;

  return (
    <Container
      style={{ transform: `scale(${scaling})`, transformOrigin: "center" }}
    >
      <Modal>
        <h2>Underwater Salvage</h2>
        <p>
          Use your magnet to catch treasure.
          <br />
          Upgrade your boat to catch more treasure until you find the ultimate
          treasure chest.
        </p>
        <ul>
          <li>WASD/Arrows keys to move your magnet</li>
          <li>Space to start the day</li>
          <li>Bring items to the surface to collect them</li>
          <li>Upgrade your equpment at the end of the day</li>
        </ul>
      </Modal>
    </Container>
  );
}
