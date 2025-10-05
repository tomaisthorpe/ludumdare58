import {
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
  TOriginPoint,
  TSpriteComponent,
  TTexture,
  TTextureComponent,
  TTextureFilter,
  TAnimatedSpriteComponent,
  TSpriteLayer,
} from "@tedengine/ted";
import { vec3, vec4 } from "gl-matrix";
import config from "./config";
import eelTexture from "../assets/eel.png";
import { MagnetComponent } from "./magnet";

export const resources: TResourcePackConfig = {
  textures: [
    {
      url: eelTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
  ],
};

export class EelComponent extends TComponent {
  public pulseTimer: number = 0;
  public isPulsing: boolean = false;
  public pulseDuration: number = 0;

  constructor(public speed: number) {
    super();
    // Randomize initial pulse timer so eels don't all pulse at once
    this.pulseTimer = Math.random() * config.eel.pulseInterval;
  }
}

export class EelSystem extends TSystem {
  private query: TEntityQuery;
  private magnetQuery: TEntityQuery;
  private spawnTimer: number = 0;

  constructor(private engine: TEngine, private world: TWorld) {
    super();
    this.query = this.world.createQuery([EelComponent, TTransformComponent]);
    this.magnetQuery = this.world.createQuery([
      MagnetComponent,
      TTransformComponent,
    ]);
  }

  public async update(_engine: TEngine, world: TWorld, delta: number) {
    // Update spawn timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= config.eel.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEel();
    }

    // Get magnet position
    const magnetEntities = this.magnetQuery.execute();
    let magnetTransform: TTransformComponent | undefined;
    let magnetComponent: MagnetComponent | undefined;
    let magnetEntity: number | undefined;

    if (magnetEntities.length > 0) {
      magnetEntity = magnetEntities[0];
      magnetTransform = world.getComponent(magnetEntity, TTransformComponent);
      magnetComponent = world.getComponent(magnetEntity, MagnetComponent);
    }

    // Update existing eels
    const entities = this.query.execute();
    for (const entity of entities) {
      const eel = world.getComponents(entity)?.get(EelComponent);
      const transform = world.getComponents(entity)?.get(TTransformComponent);

      if (!eel || !transform) continue;

      const sprite = world.getComponent(entity, TSpriteComponent);

      eel.pulseTimer += delta;
      if (eel.pulseTimer >= config.eel.pulseInterval) {
        eel.pulseTimer = 0;
        eel.isPulsing = true;
        eel.pulseDuration = 0;
      }

      if (eel.isPulsing) {
        eel.pulseDuration += delta;

        if (sprite) {
          const pulseCycle = eel.pulseDuration / config.eel.pulseDuration;
          const pulseIntensity = Math.sin(pulseCycle * Math.PI) * 0.7;
          sprite.colorFilter = vec4.fromValues(
            1 + pulseIntensity,
            1 + pulseIntensity * 0.8,
            0.6,
            1
          );
        }

        if (eel.pulseDuration >= config.eel.pulseDuration) {
          eel.isPulsing = false;
          eel.pulseDuration = 0;

          // Clear color filter
          if (sprite) {
            sprite.colorFilter = vec4.fromValues(1, 1, 1, 1);
          }
        }
      }

      // Check collision with magnet (only consider x and y)
      if (magnetTransform && magnetComponent && !magnetComponent.electrocuted) {
        const dx =
          transform.transform.translation[0] -
          magnetTransform.transform.translation[0];
        const dy =
          transform.transform.translation[1] -
          magnetTransform.transform.translation[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.eel.collisionRadius) {
          magnetComponent.electrocuted = true;
          magnetComponent.electrocutionTimer = config.eel.electrocutionDuration;
          continue;
        }
      }

      // Move the eel horizontally (left to right)
      const movement = vec3.fromValues(eel.speed * delta, 0, 0);
      vec3.add(
        transform.transform.translation,
        transform.transform.translation,
        movement
      );

      // Remove eel if it goes out of bounds (right edge)
      const x = transform.transform.translation[0];
      const rightBound = config.topLeftCorner.x + config.waterWidth + 100;

      if (x > rightBound) {
        world.removeEntity(entity);
      }
    }
  }

  private spawnEel() {
    const texture = this.engine.resources.get<TTexture>(eelTexture);
    if (!texture) return;

    // Spawn from left edge
    const x = config.topLeftCorner.x - 50;

    // Random depth between minDepth and maxDepth
    const depthRange = config.eel.maxDepth - config.eel.minDepth;
    const depthBelowWater = config.eel.minDepth + Math.random() * depthRange;
    const y = config.topLeftCorner.y - config.waterLevel - depthBelowWater;

    const eel = this.world.createEntity();
    this.world.addComponents(eel, [
      TTransformBundle.with(
        new TTransformComponent(new TTransform(vec3.fromValues(x, y, -70)))
      ),
      new TSpriteComponent({
        width: config.eel.width,
        height: config.eel.height,
        origin: TOriginPoint.Center,
        layer: TSpriteLayer.Background_3,
      }),
      new TAnimatedSpriteComponent(config.eel.fps, config.eel.frameCount),
      new TTextureComponent(texture),
      new TVisibilityComponent(),
      new EelComponent(config.eel.speed),
    ]);
  }
}

export function createEelSystem(engine: TEngine, world: TWorld): EelSystem {
  const eelSystem = new EelSystem(engine, world);
  world.addSystem(eelSystem);
  return eelSystem;
}
