/**
 * Simple waypoint-based pathfinding for the COVENANT map.
 * Enemies pick the nearest waypoint to their destination and
 * follow the graph path instead of walking straight into walls.
 */

// Each waypoint: [id, x, z]
// Layout mirrors the map corridors so enemies always have a clear path.
const WP = [
  // Spawn zone (north)
  [  0,   0,  42], [  1, -24,  42], [  2,  24,  42],

  // A corridor (left lane X~-26)
  [  3, -26,  34], [  4, -26,  22], [  5, -26,  10],
  [  6, -26,  -2], [  7, -26, -12],

  // B corridor (right lane X~+26)
  [  8,  26,  34], [  9,  26,  22], [ 10,  26,  10],
  [ 11,  26,  -2], [ 12,  26, -12],

  // Mid lane (X~0)
  [ 13,   0,  34], [ 14,   0,  22], [ 15,   0,  10],
  [ 16,   0,  -2], [ 17,   0, -12],

  // Junction / cross area (Z ~ -20)
  [ 18, -26, -20], [ 19,  -9, -20], [ 20,   0, -20],
  [ 21,   9, -20], [ 22,  26, -20],

  // Approach to heart chamber (Z ~ -27)
  [ 23, -38, -27], [ 24, -14, -27], [ 25,   0, -27],
  [ 26,  14, -27], [ 27,  38, -27],

  // Heart chamber (Z ~ -35 .. -50)
  [ 28, -38, -36], [ 29, -20, -36], [ 30,   0, -36],
  [ 31,  20, -36], [ 32,  38, -36],
  [ 33, -38, -44], [ 34, -20, -44], [ 35,   0, -44],
  [ 36,  20, -44], [ 37,  38, -44],

  // Site A (left vascular node)
  [ 38, -38, -50],
  // Site B (right vascular node)
  [ 39,  38, -50],
];

// Adjacency list: [from, to] pairs (undirected)
const EDGES = [
  // Spawn
  [0,1],[0,2],[0,13],[1,3],[2,8],
  // A corridor
  [3,4],[4,5],[5,6],[6,7],[7,18],
  // B corridor
  [8,9],[9,10],[10,11],[11,12],[12,22],
  // Mid
  [13,14],[14,15],[15,16],[16,17],[17,20],
  // Junction
  [18,19],[19,20],[20,21],[21,22],
  [7,19],[12,21],
  // Approach
  [18,23],[19,24],[20,25],[21,26],[22,27],
  [23,24],[24,25],[25,26],[26,27],
  // Into heart chamber
  [23,28],[24,29],[25,30],[26,31],[27,32],
  // Chamber rows
  [28,29],[29,30],[30,31],[31,32],
  [28,33],[29,34],[30,35],[31,36],[32,37],
  [33,34],[34,35],[35,36],[36,37],
  // Sites
  [33,38],[38,34],
  [37,39],[39,36],
];

// Build graph once
const POSITIONS = new Map(WP.map(([id,x,z]) => [id, {x,z}]));
const GRAPH = new Map(WP.map(([id]) => [id, []]));
for (const [a,b] of EDGES) {
  GRAPH.get(a).push(b);
  GRAPH.get(b).push(a);
}

function dist2(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z;
  return dx*dx + dz*dz;
}

function nearestNode(x, z) {
  let best = 0, bestD = Infinity;
  for (const [id, pos] of POSITIONS) {
    const d = dist2({x,z}, pos);
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

// BFS shortest path
function bfs(startId, goalId) {
  if (startId === goalId) return [startId];
  const visited = new Set([startId]);
  const queue = [[startId, [startId]]];
  while (queue.length) {
    const [cur, path] = queue.shift();
    for (const nb of GRAPH.get(cur)) {
      if (nb === goalId) return [...path, nb];
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push([nb, [...path, nb]]);
      }
    }
  }
  return [startId];
}

/**
 * Call each frame for a single enemy.
 * Returns the {x, z} of the next waypoint to walk toward.
 * @param {number} ex - enemy x
 * @param {number} ez - enemy z
 * @param {number} tx - target x (player or objective)
 * @param {number} tz - target z
 * @param {object} state - persistent per-enemy state {path:[], pathGoal:null}
 * @param {number} arrivalRadius - how close before advancing to next wp
 */
export function getNextWaypoint(ex, ez, tx, tz, state, arrivalRadius = 2.5) {
  const goalNode = nearestNode(tx, tz);

  // Recompute path if goal changed or path empty
  if (state.pathGoal !== goalNode || !state.path || state.path.length === 0) {
    const startNode = nearestNode(ex, ez);
    state.path = bfs(startNode, goalNode);
    state.pathGoal = goalNode;
    state.pathIdx = 0;
  }

  // Advance along path when close enough to current waypoint
  while (state.pathIdx < state.path.length - 1) {
    const wpId = state.path[state.pathIdx];
    const wp   = POSITIONS.get(wpId);
    if (dist2({x:ex, z:ez}, wp) < arrivalRadius * arrivalRadius) {
      state.pathIdx++;
    } else break;
  }

  const wpId = state.path[Math.min(state.pathIdx, state.path.length-1)];
  return POSITIONS.get(wpId); // {x, z}
}

export const WAYPOINTS_DEBUG = WP; // expose for potential debug overlay
