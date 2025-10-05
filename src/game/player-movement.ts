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
import config from "./config";
import { MagnetComponent } from "./magnet";

export class PlayerMovementComponent extends TComponent {}

export class PlayerMovementSystem extends TSystem {
  public winchSpeed = config.equipment.winchSpeeds[0];

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
      const magnet = world.getComponent(entity, MagnetComponent);

      if (!input || !transform) continue;

      const force = vec3.fromValues(0, 0, 0);

      // Don't allow movement if magnet is electrocuted
      if (
        this.gameState.state === "fishing" &&
        (!magnet || !magnet.electrocuted)
      ) {
        force[0] += input.moveDirection[0] * this.winchSpeed;
        force[1] += input.moveDirection[1] * this.winchSpeed;
      }

      world.applyCentralForce(entity, force);
    }
  }
}
