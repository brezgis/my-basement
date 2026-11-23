// Cross sections in plan feet, from the courtyard towards each destination.
// Each stone tread shares its two corners with the next riser.
export const lookout = { X: 21.2, Y: 7.2, r: 6.5 };
export const westWalk = [
  [38, 9.5, 15.98, 0], [36.4, 9.1, 15.4, 0.48], [35, 8.5, 14.8, 0.96],
  [33.5, 7.6, 14, 1.44], [32, 6.9, 13.4, 1.92], [30.1, 6.7, 13.4, 2.4],
  [28.8, 7, 13.6, 2.88], [27.7, 7.2, 13.9, 3.36], [14.7, 7.2, 14.6, 3.36],
  [13.7, 7.2, 14.6, 3.36],
];
export const eastWalk = [
  [82, 9.5, 15.98, 0], [84, 9.1, 15.4, 0.48], [85.7, 8.2, 14.6, 0.96],
  [87.2, 7.2, 13.6, 1.44], [88.8, 6.5, 12.8, 1.92], [90.5, 6, 12.6, 2.4],
  [94.3, 5.9, 13, 2.4], [96.1, 6.2, 13, 2.88], [98, 6.8, 13.4, 3.36],
  [100, 7.5, 14.1, 3.84], [102, 8.2, 14.8, 4.32], [104.3, 9, 15.5, 4.8],
  [106.2, 9.5, 15.98, 5.28], [108.2, 9.5, 15.98, 5.28],
];

// Rock under the paths follows their outer edge, including the projecting lookout.
export function cliffFootY(x, initial) {
  if (Math.abs(x - lookout.X) <= lookout.r) {
    return Math.min(initial, lookout.Y - Math.sqrt(lookout.r ** 2 - (x - lookout.X) ** 2) - 0.8);
  }
  const route = x < westWalk[0][0] ? westWalk : eastWalk;
  for (let i = 1; i < route.length; i++) {
    const [ax, ay] = route[i - 1], [bx, by] = route[i];
    if (x >= Math.min(ax, bx) && x <= Math.max(ax, bx)) {
      return Math.min(initial, ay + (by - ay) * (x - ax) / (bx - ax) - 0.6);
    }
  }
  return initial;
}
