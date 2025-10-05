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
import { overridePalette } from "./utils";

export class RopeLinksComponent extends TComponent {
  public anchorX?: number;
  public anchorY: number;
  public numSegments: number;
  public baseSegmentLength: number;
  public restLength?: number; // computed once when magnet is first found
  public nodes?: Float32Array; // [x0,y0, x1,y1, ...]
  public prevNodes?: Float32Array;
  public segmentEntities: number[] = [];
  public ropeThickness: number = 2;
  public ropeDepth: number = 8;

  constructor(anchorY: number, numSegments: number, baseSegmentLength: number) {
    super();
    this.anchorY = anchorY;
    this.numSegments = numSegments;
    this.baseSegmentLength = baseSegmentLength;
  }
}

export function createRopeLinks(world: TWorld) {
  const numSegments = 24;
  const baseSegmentLength = 10; // visual base height of each segment
  const ropeThickness = 2;
  const ropeDepth = 8;

  const anchorY = config.topLeftCorner.y - config.waterLevel + 110;

  // Controller entity that holds the rope data
  const controller = world.createEntity();
  world.addComponents(controller, [
    new RopeLinksComponent(anchorY, numSegments, baseSegmentLength),
  ]);

  // Create segment entities
  const segmentMesh = createBoxMesh(
    ropeThickness,
    baseSegmentLength,
    ropeDepth
  );
  segmentMesh.material.palette = overridePalette(
    segmentMesh.material.palette!,
    config.palette.rope as [number, number, number, number]
  );

  const comp = world.getComponent(controller, RopeLinksComponent)!;

  for (let i = 0; i < numSegments; i++) {
    const seg = world.createEntity();
    world.addComponents(seg, [
      TTransformBundle.with(
        new TTransformComponent(
          new TTransform(
            vec3.fromValues(0, anchorY - baseSegmentLength / 2, -60)
          )
        )
      ),
      new TMeshComponent({ source: "inline", geometry: segmentMesh.geometry }),
      new TMaterialComponent(segmentMesh.material),
      new TVisibilityComponent(),
    ]);
    comp.segmentEntities.push(seg);
  }
}

export class RopeLinksSystem extends TSystem {
  private ropeQuery: TEntityQuery;
  private magnetQuery: TEntityQuery;

  constructor(world: TWorld) {
    super();
    this.ropeQuery = world.createQuery([RopeLinksComponent]);
    this.magnetQuery = world.createQuery([
      PlayerMovementComponent,
      TTransformComponent,
    ]);
  }

  public async update(_: TEngine, world: TWorld): Promise<void> {
    const ropes = this.ropeQuery.execute();
    const magnets = this.magnetQuery.execute();
    if (ropes.length === 0 || magnets.length === 0) return;

    const ropeEntity = ropes[0];
    const rope = world.getComponent(ropeEntity, RopeLinksComponent)!;
    const magnet = magnets[0];
    const magnetTransform = world.getComponent(magnet, TTransformComponent);
    if (!magnetTransform) return;

    const magnetPos = magnetTransform.transform.translation;

    // Initialize anchorX and rope lengths/nodes on first run
    if (rope.anchorX === undefined) {
      rope.anchorX = magnetPos[0];
    }

    const numNodes = rope.numSegments + 1;
    // Recompute desired per-link rest length each frame from straight-line distance
    {
      const dx = magnetPos[0] - rope.anchorX!;
      const dy = magnetPos[1] - rope.anchorY;
      const total = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      rope.restLength = total / Math.max(1, rope.numSegments);
    }

    if (!rope.nodes || !rope.prevNodes) {
      rope.nodes = new Float32Array(numNodes * 2);
      rope.prevNodes = new Float32Array(numNodes * 2);

      // Initialize nodes along the straight line from anchor to magnet
      const ax = rope.anchorX!;
      const ay = rope.anchorY;
      const dx = (magnetPos[0] - ax) / rope.numSegments;
      const dy = (magnetPos[1] - ay) / rope.numSegments;
      for (let i = 0; i < numNodes; i++) {
        const idx = i * 2;
        rope.nodes[idx] = ax + dx * i;
        rope.nodes[idx + 1] = ay + dy * i;
        rope.prevNodes[idx] = rope.nodes[idx];
        rope.prevNodes[idx + 1] = rope.nodes[idx + 1];
      }
    }

    // Simulation parameters (tension + weight feel)
    const damping = 0.985; // higher = less wobble
    const baseGravity = 0.3; // visual-only sag; scaled by node depth for weight at magnet
    const iterations = Math.min(
      20,
      Math.max(8, Math.ceil(rope.numSegments / 3))
    );

    // Dynamically adjust number of segments to match current rope length
    {
      const dx = magnetPos[0] - rope.anchorX!;
      const dy = magnetPos[1] - rope.anchorY;
      const total = Math.sqrt(dx * dx + dy * dy);
      const minSeg = 8;
      const maxSeg = 128;
      const desiredSegments = Math.max(
        minSeg,
        Math.min(maxSeg, Math.ceil(total / rope.baseSegmentLength))
      );

      if (desiredSegments !== rope.numSegments) {
        // Preserve current rope curve: resample existing nodes by arc length
        const oldSegs = rope.numSegments;
        const oldNodes = rope.nodes!;
        const oldNumNodes = oldSegs + 1;

        // Compute cumulative lengths along current polyline
        const cum: number[] = new Array(oldNumNodes).fill(0);
        let totalLen = 0;
        for (let i = 0; i < oldSegs; i++) {
          const a = i * 2;
          const b = (i + 1) * 2;
          const dxs = oldNodes[b] - oldNodes[a];
          const dys = oldNodes[b + 1] - oldNodes[a + 1];
          const seg = Math.hypot(dxs, dys);
          totalLen += seg;
          cum[i + 1] = totalLen;
        }
        // Fallback if degenerate
        if (totalLen === 0) {
          totalLen = Math.max(total, oldSegs * rope.baseSegmentLength);
          for (let i = 0; i < oldNumNodes; i++)
            cum[i] = (totalLen * i) / oldSegs;
        }

        // Adjust visual segments first (add/remove entities)
        if (desiredSegments < rope.numSegments) {
          for (let i = rope.numSegments - 1; i >= desiredSegments; i--) {
            const segEntity = rope.segmentEntities[i];
            world.removeEntity(segEntity);
            rope.segmentEntities.pop();
          }
        } else if (desiredSegments > rope.numSegments) {
          const toAdd = desiredSegments - rope.numSegments;
          for (let i = 0; i < toAdd; i++) {
            const mesh = createBoxMesh(2, rope.baseSegmentLength, 8);
            mesh.material.palette = overridePalette(
              mesh.material.palette!,
              config.palette.rope as [number, number, number, number]
            );
            const seg = world.createEntity();
            world.addComponents(seg, [
              TTransformBundle.with(
                new TTransformComponent(
                  new TTransform(
                    vec3.fromValues(rope.anchorX!, rope.anchorY, -60)
                  )
                )
              ),
              new TMeshComponent({ source: "inline", geometry: mesh.geometry }),
              new TMaterialComponent(mesh.material),
              new TVisibilityComponent(),
            ]);
            rope.segmentEntities.push(seg);
          }
        }

        // Resample nodes to new segment count using arc-length parameterization
        const newNumNodes = desiredSegments + 1;
        const newNodes = new Float32Array(newNumNodes * 2);
        const newPrev = new Float32Array(newNumNodes * 2);

        for (let i = 0; i < newNumNodes; i++) {
          const tLen = (totalLen * i) / (newNumNodes - 1);
          // Find segment k where cum[k] <= tLen <= cum[k+1]
          let k = 0;
          while (k < oldSegs - 1 && cum[k + 1] < tLen) k++;
          const a = k * 2;
          const b = (k + 1) * 2;
          const segLen = Math.max(1e-6, cum[k + 1] - cum[k]);
          const r = (tLen - cum[k]) / segLen;
          const x = oldNodes[a] + (oldNodes[b] - oldNodes[a]) * r;
          const y = oldNodes[a + 1] + (oldNodes[b + 1] - oldNodes[a + 1]) * r;
          const idx = i * 2;
          newNodes[idx] = x;
          newNodes[idx + 1] = y;
          newPrev[idx] = x;
          newPrev[idx + 1] = y;
        }

        rope.numSegments = desiredSegments;
        rope.nodes = newNodes;
        rope.prevNodes = newPrev;
        // Set rest length to match current straight-line distance so rope can shorten
        rope.restLength =
          (Math.sqrt(
            (magnetPos[0] - rope.anchorX!) * (magnetPos[0] - rope.anchorX!) +
              (magnetPos[1] - rope.anchorY) * (magnetPos[1] - rope.anchorY)
          ) || 1e-6) / Math.max(1, rope.numSegments);
      }
    }

    // Pin endpoints to anchor and magnet
    rope.nodes[0] = rope.anchorX!;
    rope.nodes[1] = rope.anchorY;
    rope.nodes[rope.numSegments * 2] = magnetPos[0];
    rope.nodes[rope.numSegments * 2 + 1] = magnetPos[1];

    // Verlet integration for internal nodes
    for (let i = 1; i < rope.numSegments; i++) {
      const idx = i * 2;
      const x = rope.nodes[idx];
      const y = rope.nodes[idx + 1];
      const px = rope.prevNodes![idx];
      const py = rope.prevNodes![idx + 1];

      // Slightly higher damping near the anchor to reduce float
      const localDamping = Math.min(
        0.999,
        damping + (1 - i / rope.numSegments) * 0.01
      );
      const vx = (x - px) * localDamping;
      // Heavier near the magnet end to suggest weight
      const weightScale = 0.5 + 0.5 * (i / rope.numSegments);
      const vy = (y - py) * localDamping + baseGravity * weightScale;

      rope.prevNodes![idx] = x;
      rope.prevNodes![idx + 1] = y;
      rope.nodes[idx] = x + vx;
      rope.nodes[idx + 1] = y + vy;
    }

    // Constraint relaxation
    for (let k = 0; k < iterations; k++) {
      const anchorTightness = 2.0; // extra stiffness for first constraint
      for (let i = 0; i < rope.numSegments; i++) {
        const a = i * 2;
        const b = (i + 1) * 2;
        const ax = rope.nodes[a];
        const ay = rope.nodes[a + 1];
        const bx = rope.nodes[b];
        const by = rope.nodes[b + 1];
        let dx = bx - ax;
        let dy = by - ay;
        const dist = Math.hypot(dx, dy) || 1e-6;
        const diff = (rope.restLength! - dist) / dist;
        dx *= diff;
        dy *= diff;

        // Determine pinned ends
        const aPinned = i === 0;
        const bPinned = i + 1 === rope.numSegments;

        if (aPinned && bPinned) {
          // both pinned (should not happen except degenerate small N)
        } else if (aPinned) {
          // move only B toward desired distance
          const mult = i === 0 ? anchorTightness : 1;
          rope.nodes[b] += dx * mult;
          rope.nodes[b + 1] += dy * mult;
        } else if (bPinned) {
          // move only A
          rope.nodes[a] -= dx;
          rope.nodes[a + 1] -= dy;
        } else {
          // split
          rope.nodes[a] -= dx * 0.5;
          rope.nodes[a + 1] -= dy * 0.5;
          rope.nodes[b] += dx * 0.5;
          rope.nodes[b + 1] += dy * 0.5;
        }
      }

      // Re-pin after each iteration to reduce drift
      rope.nodes[0] = rope.anchorX!;
      rope.nodes[1] = rope.anchorY;
      rope.nodes[rope.numSegments * 2] = magnetPos[0];
      rope.nodes[rope.numSegments * 2 + 1] = magnetPos[1];
    }

    // Light feed clamp: keep first free node closer to feed x to reduce float
    if (rope.numSegments >= 1) {
      const clamp = 0.15;
      rope.nodes[2] = rope.nodes[2] * (1 - clamp) + rope.anchorX! * clamp;
    }

    // Update segment transforms
    for (let i = 0; i < rope.numSegments; i++) {
      const a = i * 2;
      const b = (i + 1) * 2;
      const x1 = rope.nodes[a];
      const y1 = rope.nodes[a + 1];
      const x2 = rope.nodes[b];
      const y2 = rope.nodes[b + 1];

      const midX = (x1 + x2) * 0.5;
      const midY = (y1 + y2) * 0.5;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const segLen = Math.hypot(dx, dy) || rope.restLength!;
      const angleFromX = Math.atan2(dy, dx);
      const angleDeg = ((angleFromX - Math.PI / 2) * 180) / Math.PI;

      const segEntity = rope.segmentEntities[i];
      const t = world.getComponent(segEntity, TTransformComponent);
      if (!t) continue;
      t.transform.translation[0] = midX;
      t.transform.translation[1] = midY;
      // keep z
      t.transform.scale[0] = 1;
      t.transform.scale[1] = segLen / rope.baseSegmentLength;
      t.transform.rotation = quat.fromEuler(quat.create(), 0, 0, angleDeg);
    }
  }
}
