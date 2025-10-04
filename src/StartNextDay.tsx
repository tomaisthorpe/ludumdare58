import styled from "styled-components";
import { useGameContext } from "@tedengine/ted";

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
  if (state !== "start") return null;

  return <Container>Press space to start the day.</Container>;
}
