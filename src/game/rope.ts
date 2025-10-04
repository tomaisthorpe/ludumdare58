import {
  TComponent,
  TEngine,
  TEntityQuery,
  TMaterialComponent,
  TMeshComponent,
  TSystem,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  TWorld,
  createBoxMesh,
} from "@tedengine/ted";
import { vec3, quat } from "gl-matrix";
import config from "./config";
import { PlayerMovementComponent } from "./player-movement";

export class RopeComponent extends TComponent {
  public anchorX?: number;
  public anchorY: number;

  constructor(anchorY: number) {
    super();
    this.anchorY = anchorY;
  }
}

export function createRope(world: TWorld) {
  const ropeThickness = 2;
  const ropeDepth = 10;
  const initialLength = 50;

  const mesh = createBoxMesh(ropeThickness, initialLength, ropeDepth);
  const anchorY = config.topLeftCorner.y - config.waterLevel + 150;

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(0, anchorY - initialLength / 2, -60))
      )
    ),
    new TMeshComponent({ source: "inline", geometry: mesh.geometry }),
    new TMaterialComponent(mesh.material),
    new TVisibilityComponent(),
    new RopeComponent(anchorY),
  ]);
}

export class RopeSystem extends TSystem {
  private ropeQuery: TEntityQuery;
  private magnetQuery: TEntityQuery;

  constructor(world: TWorld) {
    super();
    this.ropeQuery = world.createQuery([RopeComponent, TTransformComponent]);
    // Find the magnet using PlayerMovementComponent as a tag and transform
    this.magnetQuery = world.createQuery([
      PlayerMovementComponent,
      TTransformComponent,
    ]);
  }

  public async update(_: TEngine, world: TWorld): Promise<void> {
    const ropes = this.ropeQuery.execute();
    if (ropes.length === 0) return;

    const magnets = this.magnetQuery.execute();
    if (magnets.length === 0) return;

    const magnet = magnets[0];
    const magnetTransform = world.getComponent(magnet, TTransformComponent);
    if (!magnetTransform) return;

    for (const rope of ropes) {
      const ropeTransform = world.getComponent(rope, TTransformComponent);
      const ropeComp = world.getComponent(rope, RopeComponent);
      if (!ropeTransform || !ropeComp) continue;

      const magnetPos = magnetTransform.transform.translation;
      if (ropeComp.anchorX === undefined) {
        // Lock the rope to the magnet's initial X position
        ropeComp.anchorX = magnetPos[0];
      }

      const anchorX = ropeComp.anchorX;
      const magnetY = magnetPos[1];

      const dx = magnetPos[0] - anchorX;
      const dy = magnetY - ropeComp.anchorY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const midX = anchorX + dx * 0.5;
      const midY = ropeComp.anchorY + dy * 0.5;

      // Update position to midpoint
      ropeTransform.transform.translation[0] = midX;
      ropeTransform.transform.translation[1] = midY;
      // keep existing z

      // Scale in Y to match length; X is rope thickness scale (1)
      const baseLength = 50; // must match initialLength used to build the mesh
      ropeTransform.transform.scale[0] = 1;
      ropeTransform.transform.scale[1] =
        baseLength > 0 ? length / baseLength : 1;

      // Rotate rope so its local +Y axis points from anchor to magnet
      const angleFromX = Math.atan2(dy, dx);
      const angleRad = angleFromX - Math.PI / 2; // convert from X-based to Y-based
      const angleDeg = (angleRad * 180) / Math.PI;
      ropeTransform.transform.rotation = quat.fromEuler(
        quat.create(),
        0,
        0,
        angleDeg
      );
    }
  }
}
