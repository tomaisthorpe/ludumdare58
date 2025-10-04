import {
  createBoxMesh,
  createBoxCollider,
  TMaterialComponent,
  TMeshComponent,
  TRigidBodyComponent,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  TWorld,
  TComponent,
  TSystem,
  TEntityQuery,
  TEngine,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import { PlayerMovementComponent } from "./player-movement";
import config from "./config";
import { overridePalette } from "./utils";

export function createLoot(world: TWorld) {
  world.addSystem(new LootSystem(world));

  spawnLoot(world, 0, -400);
  spawnLoot(world, 100, -400);
  spawnLoot(world, -100, -400);
}

export function spawnLoot(world: TWorld, x: number, y: number) {
  const boxMesh = createBoxMesh(15, 15, 15);

  boxMesh.material.palette = overridePalette(
    boxMesh.material.palette!,
    config.palette.loot as [number, number, number, number]
  );

  const loot = world.createEntity();
  world.addComponents(loot, [
    TTransformBundle.with(
      new TTransformComponent(new TTransform(vec3.fromValues(x, y, 0)))
    ),
    new TMeshComponent({ source: "inline", geometry: boxMesh.geometry }),
    new TMaterialComponent(boxMesh.material),
    new TVisibilityComponent(),
    new TRigidBodyComponent(
      { mass: 0.1, isTrigger: false, linearDamping: 0.95, angularDamping: 0.9 },
      createBoxCollider(15, 15, 15)
    ),
    new LootComponent(),
  ]);
}

export class LootComponent extends TComponent {}

export class LootSystem extends TSystem {
  private query: TEntityQuery;
  private playerQuery: TEntityQuery;

  constructor(private world: TWorld) {
    super();
    this.query = this.world.createQuery([LootComponent]);
    this.playerQuery = this.world.createQuery([PlayerMovementComponent]);
  }

  public async update(_: TEngine, world: TWorld) {
    const entities = this.query.execute();
    const players = this.playerQuery.execute();

    if (players.length === 0) return;
    const player = players[0];

    for (const entity of entities) {
      const loot = world.getComponents(entity)?.get(LootComponent);
      if (!loot) continue;

      const lootTransform = world
        .getComponents(entity)
        ?.get(TTransformComponent);
      if (!lootTransform) continue;

      const playerTransform = world
        .getComponents(player)
        ?.get(TTransformComponent);
      if (!playerTransform) continue;

      const rb = world.getComponents(entity)?.get(TRigidBodyComponent);
      if (!rb) continue;
      const mass = rb.physicsOptions.mass || 1;
      const antiGravity = vec3.scale(
        vec3.create(),
        vec3.fromValues(0, -9.81, 0),
        -mass
      );
      let totalForce = antiGravity;

      // Calculate distance between loot and player
      const distance = vec3.distance(
        lootTransform.transform.translation,
        playerTransform.transform.translation
      );
      if (distance < 100 && distance > 20) {
        // Loot should be 'magnetised' to the player
        const force = vec3.subtract(
          vec3.create(),
          playerTransform.transform.translation,
          lootTransform.transform.translation
        );
        vec3.normalize(force, force);
        vec3.scale(force, force, 20);
        totalForce = vec3.add(totalForce, totalForce, force);
      }
      world.applyCentralForce(entity, totalForce);
    }
  }
}
