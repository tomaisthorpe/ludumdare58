import styled from "styled-components";

import { useGameContext, useUIContext } from "@tedengine/ted";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  color: white;
  font-size: 3rem;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const Day = styled.div`
  padding-left: 1rem;
`;

const Money = styled.div`
  padding-right: 4rem;
`;

export default function Stats() {
  const { money, day } = useGameContext();
  const { scaling } = useUIContext();

  if (money === undefined) return null;

  return (
    <Container>
      <Day
        style={{
          transform: `scale(${scaling})`,
          transformOrigin: "top left",
        }}
      >
        Day {day!.toString()}
      </Day>
      <Money
        style={{ transform: `scale(${scaling})`, transformOrigin: "top right" }}
      >
        ${money!.toString()}
      </Money>
    </Container>
  );
}
