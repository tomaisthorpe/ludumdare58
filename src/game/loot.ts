import {
  createBoxCollider,
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
  TResourcePackConfig,
  createSphereCollider,
  TOriginPoint,
  TSpriteComponent,
  TTexture,
  TTextureComponent,
  TTextureFilter,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import { PlayerMovementComponent } from "./player-movement";
import config from "./config";
import coinTexture from "../assets/coin.png";
import treasureTexture from "../assets/chest.png";

export const resources: TResourcePackConfig = {
  textures: [
    {
      url: coinTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
    {
      url: treasureTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
  ],
};

export function createLoot(
  engine: TEngine,
  world: TWorld,
  onCollect: (type: LootType, value: number) => void
): LootSystem {
  const lootSystem = new LootSystem(engine, world, onCollect);
  world.addSystem(lootSystem);

  return lootSystem;
}

export function spawnLoot(
  engine: TEngine,
  world: TWorld,
  x: number,
  y: number,
  type: LootType
) {
  if (type === "treasure") {
    const loot = world.createEntity();
    world.addComponents(loot, [
      TTransformBundle.with(
        new TTransformComponent(new TTransform(vec3.fromValues(x, y, 0)))
      ),
      new TSpriteComponent({
        width: 98,
        height: 64,
        origin: TOriginPoint.Center,
      }),
      new TTextureComponent(engine.resources.get<TTexture>(treasureTexture)!),
      new TVisibilityComponent(),
      new TRigidBodyComponent(
        {
          mass: 0.1,
          isTrigger: false,
          linearDamping: 0.95,
          angularDamping: 0.9,
        },
        createBoxCollider(98, 64, 15)
      ),
      new LootComponent(type, config.lootValues[type]),
    ]);
  }

  if (type === "low") {
    const loot = world.createEntity();
    world.addComponents(loot, [
      TTransformBundle.with(
        new TTransformComponent(new TTransform(vec3.fromValues(x, y, 0)))
      ),
      new TSpriteComponent({
        width: 16,
        height: 16,
        origin: TOriginPoint.Center,
      }),
      new TTextureComponent(engine.resources.get<TTexture>(coinTexture)!),
      new TVisibilityComponent(),
      new TRigidBodyComponent(
        {
          mass: 0.1,
          isTrigger: false,
          linearDamping: 0.95,
          angularDamping: 0.9,
        },
        createSphereCollider(8)
      ),
      new LootComponent(type, config.lootValues[type]),
    ]);
  }
}

export type LootType = "low" | "treasure";
export class LootComponent extends TComponent {
  public magnetised: boolean = false;

  constructor(public type: LootType, public value: number) {
    super();
  }
}

export class LootSystem extends TSystem {
  private query: TEntityQuery;
  private playerQuery: TEntityQuery;

  public currentValue: number = 0;

  constructor(
    private engine: TEngine,
    private world: TWorld,
    private onCollect: (type: LootType, value: number) => void
  ) {
    super();
    this.query = this.world.createQuery([LootComponent]);
    this.playerQuery = this.world.createQuery([PlayerMovementComponent]);
  }

  public spawnLoot() {
    // Remove existing loot
    const existingLoot = this.world.createQuery([LootComponent]);
    for (const entity of existingLoot.execute()) {
      this.world.removeEntity(entity);
    }

    spawnLoot(this.engine, this.world, 0, -400, "low");
    spawnLoot(this.engine, this.world, 100, -400, "low");
    spawnLoot(this.engine, this.world, -100, -400, "low");

    spawnLoot(this.engine, this.world, -100, -600, "treasure");
  }

  public async update(_: TEngine, world: TWorld) {
    const entities = this.query.execute();
    const players = this.playerQuery.execute();

    if (players.length === 0) return;
    const player = players[0];

    this.currentValue = 0;

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
        loot.magnetised = true;
      } else if (distance <= 20) {
        loot.magnetised = true;
      } else {
        loot.magnetised = false;
      }

      if (loot.magnetised) {
        this.currentValue += loot.value;
      }

      // If loot is magnitised and near the water level, then it should be removed
      if (
        loot.magnetised &&
        lootTransform.transform.translation[1] >
          config.topLeftCorner.y - config.waterLevel - 50
      ) {
        this.onCollect(loot.type, loot.value);
        world.removeEntity(entity);
      } else {
        world.applyCentralForce(entity, totalForce);
      }
    }
  }
}
