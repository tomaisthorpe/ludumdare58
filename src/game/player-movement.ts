import {
  TComponent,
  TSystem,
  TPlayerInputComponent,
  TTransformComponent,
  TEngine,
  TWorld,
  TEntityQuery,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import GameState from "./game";

export class PlayerMovementComponent extends TComponent {}

export class PlayerMovementSystem extends TSystem {
  private query: TEntityQuery;
  constructor(world: TWorld, private gameState: GameState) {
    super();

    this.query = world.createQuery([
      TPlayerInputComponent,
      PlayerMovementComponent,
      TTransformComponent,
    ]);
  }

  public async update(_: TEngine, world: TWorld): Promise<void> {
    const entities = this.query.execute();

    for (const entity of entities) {
      const input = world.getComponent(entity, TPlayerInputComponent);
      const transform = world.getComponent(entity, TTransformComponent);

      if (!input || !transform) continue;

      const force = vec3.fromValues(0, 0, 0);

      if (this.gameState.state === "fishing") {
        force[0] += input.moveDirection[0] * 150;
        force[1] += input.moveDirection[1] * 150;
      }

      world.applyCentralForce(entity, force);
    }
  }
}
