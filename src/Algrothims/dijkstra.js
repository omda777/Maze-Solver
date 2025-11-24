import { posKey , dirs } from "../helper/help.js";
import { pathColor , visulColor } from "../helper/constants.js";


export async function dijkstra(startPos, endPos, grid, numCells, wallCells, getSpeed, shouldStop = () => false) {
  const getDelay = () => {
    const visualSpeed = typeof getSpeed === 'function' ? getSpeed() : getSpeed;
    return Math.max(5, 100 - visualSpeed);
  };
  
  const pq = [[0, startPos.row, startPos.col]];
  const distances = new Map();
  const visited = new Set();
  const parent = {};

  distances.set(posKey(startPos.row, startPos.col), 0);

  while (pq.length > 0) {
  
    if (shouldStop()) {
      throw new Error("Algorithm stopped");
    }

    pq.sort((a, b) => a[0] - b[0]);
    const [dist, r, c] = pq.shift();
    const key = posKey(r, c);
    if (visited.has(key)) continue;

    visited.add(key);

    
    if (!(r === startPos.row && c === startPos.col) && !(r === endPos.row && c === endPos.col)) {
      const cell = grid[r][c];
      cell.style.backgroundColor = visulColor;
      await new Promise(res => setTimeout(res, getDelay()));
    }

    if (r === endPos.row && c === endPos.col) {
      break;
    }

    for (const [dr, dc] of dirs) {
      if (shouldStop()) {
        throw new Error("Algorithm stopped");
      }

      const nr = r + dr;
      const nc = c + dc;
      const nKey = posKey(nr, nc);

      if (nr < 0 || nr >= numCells || nc < 0 || nc >= numCells) continue;
      if (wallCells.has(nKey)) continue;
      if (visited.has(nKey)) continue;
      const newDist = dist + 1;
      const currentDist = distances.get(nKey);
      if (currentDist === undefined || newDist < currentDist) {
        distances.set(nKey, newDist);
        parent[nKey] = key;
        pq.push([newDist, nr, nc]);
      }
    }
  }

  const endKey = posKey(endPos.row, endPos.col);
  if (!visited.has(endKey)) {
    if (shouldStop()) {
      throw new Error("Algorithm stopped");
    }
    alert("No path found 😢");
    return false;
  }

  // Reconstruct path
  let key = endKey;
  const path = [];

  while (key !== posKey(startPos.row, startPos.col)) {
    path.push(key);
    key = parent[key];
    if (!key) break;
  }

  path.reverse();

  // Visualize path
  for (let k of path) {
    if (shouldStop()) {
      throw new Error("Algorithm stopped");
    }

    const [r, c] = k.split(",").map(Number);
    if (r === startPos.row && c === startPos.col) continue;
    if (r === endPos.row && c === endPos.col) continue;
    grid[r][c].style.backgroundColor = pathColor;
    await new Promise(res => setTimeout(res, getDelay()));
  }
  return true;
}