import { useEventQueue, useGameContext, useUIContext } from "@tedengine/ted";
import styled from "styled-components";
import config from "./game/config";

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

  h2 {
    font-size: 2rem;
    margin: 0;
    padding: 0;
  }

  p {
    font-size: 1.25rem;
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
`;

const Upgrades = styled.ul`
  display: flex;
  align-items: flex-start;
  justify-content: center;
`;

const Upgrade = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #555;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem;
  width: 200px;
  background: rgba(0, 0, 0, 0.5);

  h3 {
    font-size: 1.25rem;
    margin: 0;
    padding: 0;
  }
  p {
    font-size: 0.9rem;
    margin: 0;
    padding: 0;
    color: #aaa;

    &.cost {
      color: #fff;
    }
  }

  button {
    background: none;
    color: white;
    border: 1px solid white;
    padding: 0.2rem 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.75rem;
    margin-top: 1rem;
  }
`;

export type UpgradeType = "winchSpeed" | "ropeLength";
export type Upgrade = {
  type: UpgradeType;
  cost: number;
  level: number;
};

export function UpdateModal() {
  const events = useEventQueue();
  const { state, equipment } = useGameContext();
  const { scaling } = useUIContext();

  if (state !== "upgrade") return null;
  if (equipment === undefined) return null;

  const equipmentLevels = equipment as {
    winchSpeed: number;
    ropeLength: number;
  };
  const potentialUpgrades = [
    {
      type: "winchSpeed",
      name: "Winch Speed",
      description: "Upgrade your winch speed.",
      cost: config.equipment.winchCosts[equipmentLevels!.winchSpeed - 1],
      maxLevel: config.equipment.maxWinchSpeed,
      currentLevel: equipmentLevels!.winchSpeed || 1,
    },
    {
      type: "ropeLength",
      name: "Rope Length",
      description: "Upgrade your rope length to reach deeper waters.",
      cost: config.equipment.ropeCosts[equipmentLevels!.ropeLength - 1],
      maxLevel: config.equipment.maxRopeLength,
      currentLevel: equipmentLevels!.ropeLength || 1,
    },
  ];

  const onUpgrade = (upgrade: Upgrade) => {
    events?.broadcast({
      type: "UPGRADE_EQUIPMENT",
      payload: upgrade,
    });
  };

  const onStartNextDay = () => {
    events?.broadcast({
      type: "START_NEXT_DAY",
    });
  };

  return (
    <Container
      style={{ transform: `scale(${scaling})`, transformOrigin: "center" }}
    >
      <Modal>
        <h2>Upgrade</h2>
        <p>
          You have reached the end of the day.
          <br /> Upgrade your boat to catch more treasure.
        </p>
        <Upgrades>
          {potentialUpgrades.map((upgrade) => (
            <Upgrade key={upgrade.name}>
              <h3>{upgrade.name}</h3>
              <p>{upgrade.description}</p>
              {upgrade.cost > 0 && <p className="cost">${upgrade.cost}</p>}
              <p>
                Level {upgrade.currentLevel}/{upgrade.maxLevel}
              </p>
              {upgrade.currentLevel < upgrade.maxLevel && (
                <button
                  onClick={() =>
                    onUpgrade({
                      type: upgrade.type as UpgradeType,
                      cost: upgrade.cost,
                      level: upgrade.currentLevel + 1,
                    })
                  }
                >
                  Upgrade
                </button>
              )}
              {upgrade.currentLevel >= upgrade.maxLevel && <p>Max Level</p>}
            </Upgrade>
          ))}
        </Upgrades>
        <button onClick={() => onStartNextDay()}>Start Next Day</button>
      </Modal>
    </Container>
  );
}
