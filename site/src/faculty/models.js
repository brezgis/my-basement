// What the faculty's bodies are made with now lives in robokit/ (shared with Anna's House and Vesper Street: the
// same files in all three places, see robokit/README.md). This file passes on what the rest of faculty/ takes from
// it. The lab's faces keep their own look: the screen's corners cut round, and a rounded slot of a mouth when they
// speak.
//   draw(expr, look, blink, mouth, lookY): blink false/0 open, true/1 shut, between: the lids part way down;
//   mouth 0..1 while it speaks; lookY -1..1 up (+) and down (robokit/face.js has the full list)
import { makeFace as robokitFace } from '../robokit/face.js';
export { useThree, paint, xform, merge, mesh, sph, cyl, solid, visor } from '../robokit/parts.js';
export const makeFace = spec => robokitFace({ round: 26, mouth: 'slot', ...spec });
