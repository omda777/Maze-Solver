import { posKey , dirs } from "../helper/help.js";
import { pathColor , visulColor } from "../helper/constants.js";

// Heuristic function
function heuristic(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

export async function astar(startPos, endPos, grid, numCells, wallCells, getSpeed, shouldStop = () => false) {
  const getDelay = () => {
    const visualSpeed = typeof getSpeed === 'function' ? getSpeed() : getSpeed;
    return Math.max(5, 100 - visualSpeed);
  };
  
  const pq = [[0, 0, startPos.row, startPos.col]];
  const gScore = new Map(); // Distance from start
  const fScore = new Map(); // g(n) + h(n)
  const visited = new Set();
  const parent = {};

  const startKey = posKey(startPos.row, startPos.col);
  const endKey = posKey(endPos.row, endPos.col);


  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startPos.row, startPos.col, endPos.row, endPos.col));

  while (pq.length > 0) {
    if (shouldStop()) {
      throw new Error("Algorithm stopped");
    }
    pq.sort((a, b) => a[0] - b[0]);
    const [f, g, r, c] = pq.shift();
    const key = posKey(r, c);

    if (visited.has(key)) continue;

    visited.add(key);

    if (!(r === startPos.row && c === startPos.col) && 
        !(r === endPos.row && c === endPos.col)) {
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

      // Calculate tentative g-score (each step costs 1)
      const tentativeG = g + 1;
      const currentG = gScore.get(nKey);

      // If we found a better path, update it
      if (currentG === undefined || tentativeG < currentG) {
        gScore.set(nKey, tentativeG);
        const h = heuristic(nr, nc, endPos.row, endPos.col);
        const newF = tentativeG + h;
        fScore.set(nKey, newF);
        parent[nKey] = key;
        pq.push([newF, tentativeG, nr, nc]);
      }
    }
  }

 
  if (!visited.has(endKey)) {
    if (shouldStop()) {
      throw new Error("Algorithm stopped");
    }
    alert("No path found 😢");
    return false;
  }

  let key = endKey;
  const path = [];

  while (key !== startKey) {
    path.push(key);
    key = parent[key];
    if (!key) break; 
  }

  path.reverse();

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

