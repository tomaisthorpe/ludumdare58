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
  TTextureWrap,
  TSound,
  TSpriteLayer,
} from "@tedengine/ted";
import { vec3, quat } from "gl-matrix";
import { PlayerMovementComponent } from "./player-movement";
import config, { LootType as ConfigLootType } from "./config";
import coinTexture from "../assets/coin.png";
import treasureTexture from "../assets/chest.png";
import canTexture from "../assets/can.png";
import gobletTexture from "../assets/goblet.png";
import daggerTexture from "../assets/dagger.png";
import pickUpAudio from "../assets/ping.wav";
import collectAudio from "../assets/collect.wav";

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
        wrapS: TTextureWrap.ClampToEdge,
        wrapT: TTextureWrap.ClampToEdge,
      },
    },
    {
      url: canTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
    {
      url: gobletTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
    {
      url: daggerTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
  ],
  sounds: [pickUpAudio, collectAudio],
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
  type: LootType,
  value: number
) {
  let texture: TTexture | undefined;
  let width = 16;
  let height = 16;
  let collider;

  switch (type) {
    case "treasure":
      texture = engine.resources.get<TTexture>(treasureTexture);
      width = 98;
      height = 64;
      collider = createBoxCollider(98, 64, 15);
      break;
    case "coin":
      texture = engine.resources.get<TTexture>(coinTexture);
      width = 16;
      height = 16;
      collider = createSphereCollider(8);
      break;
    case "can":
      texture = engine.resources.get<TTexture>(canTexture);
      width = 16;
      height = 24;
      collider = createBoxCollider(16, 24, 8);
      break;
    case "goblet":
      texture = engine.resources.get<TTexture>(gobletTexture);
      width = 16;
      height = 32;
      collider = createBoxCollider(16, 16, 8);
      break;
    case "dagger":
      texture = engine.resources.get<TTexture>(daggerTexture);
      width = 24;
      height = 64;
      collider = createBoxCollider(16, 16, 8);
      break;
  }

  if (!texture) return;

  // Create rotation - random for all items except treasure
  const rotation =
    type === "treasure"
      ? quat.fromEuler(quat.create(), 0, 0, -2)
      : quat.fromEuler(quat.create(), 0, 0, Math.random() * 360);

  const loot = world.createEntity();
  world.addComponents(loot, [
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(x, y, 0), rotation)
      )
    ),
    new TSpriteComponent({
      width,
      height,
      origin: TOriginPoint.Center,
      layer: TSpriteLayer.Foreground_3,
    }),
    new TTextureComponent(texture),
    new TVisibilityComponent(),
    new TRigidBodyComponent(
      {
        mass: 0.1,
        isTrigger: false,
        linearDamping: 0.95,
        angularDamping: 0.9,
      },
      collider
    ),
    new LootComponent(type, value),
  ]);
}

export type LootType = ConfigLootType | "treasure";
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

  private pickUpAudio: TSound;
  private collectAudio: TSound;
  private collectSoundQueue: number = 0;
  private lastCollectTime: number = 0;

  constructor(
    private engine: TEngine,
    private world: TWorld,
    private onCollect: (type: LootType, value: number) => void
  ) {
    super();
    this.query = this.world.createQuery([LootComponent]);
    this.playerQuery = this.world.createQuery([PlayerMovementComponent]);

    this.pickUpAudio = this.engine.resources.get<TSound>(pickUpAudio)!;
    this.pickUpAudio.loop = false;

    this.collectAudio = this.engine.resources.get<TSound>(collectAudio)!;
    this.collectAudio.loop = false;
  }

  public spawnLoot() {
    // Remove existing loot
    const existingLoot = this.world.createQuery([LootComponent]);
    for (const entity of existingLoot.execute()) {
      this.world.removeEntity(entity);
    }

    // Spawn loot based on configuration
    for (const lootConfig of config.loot) {
      // Calculate how many to spawn based on density
      const spawnRange = lootConfig.spawn.end - lootConfig.spawn.start;
      const count = Math.floor((spawnRange / 100) * lootConfig.density);

      for (let i = 0; i < count; i++) {
        // Random position within spawn range, keeping 50 units from edges
        const x = (Math.random() - 0.5) * (config.waterWidth - 100);
        const depthBelowWater =
          lootConfig.spawn.start + Math.random() * spawnRange;
        const y = config.topLeftCorner.y - config.waterLevel - depthBelowWater;

        spawnLoot(
          this.engine,
          this.world,
          x,
          y,
          lootConfig.type,
          lootConfig.value
        );
      }
    }

    // Always spawn treasure at the bottom, 60% across from the left
    const treasureX = -config.waterWidth / 2 + config.waterWidth * 0.6;
    const treasureY =
      config.topLeftCorner.y - config.waterLevel - config.waterDepth + 50;
    spawnLoot(
      this.engine,
      this.world,
      treasureX,
      treasureY,
      "treasure",
      Infinity
    );
  }

  public async update(_: TEngine, world: TWorld) {
    // Process collect sound queue with delays
    const now = performance.now();
    if (this.collectSoundQueue > 0 && now - this.lastCollectTime >= 100) {
      this.collectAudio.play();
      this.collectSoundQueue--;
      this.lastCollectTime = now;
    }

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

        if (!loot.magnetised) {
          this.pickUpAudio.play();
        }
        loot.magnetised = true;
      } else if (distance <= 20) {
        if (!loot.magnetised) {
          this.pickUpAudio.play();
        }
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
          config.topLeftCorner.y - config.waterLevel - 75
      ) {
        this.onCollect(loot.type, loot.value);
        this.collectSoundQueue++;
        world.removeEntity(entity);
      } else {
        world.applyCentralForce(entity, totalForce);
      }
    }
  }
}
