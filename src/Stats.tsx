import styled from "styled-components";

import { useGameContext } from "@tedengine/ted";

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
  padding-right: 1rem;
`;

export default function Stats() {
  const { money, day } = useGameContext();
  if (money === undefined) return null;

  return (
    <Container>
      <Day>Day {day!.toString()}</Day>
      <Money>${money!.toString()}</Money>
    </Container>
  );
}
