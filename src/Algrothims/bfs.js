import { posKey , dirs } from "../helper/help.js";
import { pathColor , visulColor } from "../helper/constants.js";

export async function bfs(startPos, endPos, grid, numCells, wallCells, getSpeed, shouldStop = () => false) {
  const getDelay = () => {
    const visualSpeed = typeof getSpeed === 'function' ? getSpeed() : getSpeed;
    return Math.max(5, 100 - visualSpeed);
  };

  const queue = [[startPos.row, startPos.col]];
  const visited = new Set([posKey(startPos.row, startPos.col)]);
  const parent = {};

  let found = false;

  while (queue.length) {
    if (shouldStop()) {
      throw new Error("Algorithm stopped");
    }

    const [r, c] = queue.shift();
    if (r === endPos.row && c === endPos.col) {
      found = true;
      break;
    }

    for (const [dr, dc] of dirs) {
      if (shouldStop()) {
        throw new Error("Algorithm stopped");
      }

      const nr = r + dr;
      const nc = c + dc;
      const key = posKey(nr, nc);
      if (nr < 0 || nr >= numCells || nc < 0 || nc >= numCells) continue;
      if (wallCells.has(key) || visited.has(key)) continue;

      visited.add(key);
      parent[key] = posKey(r, c);
      queue.push([nr, nc]);

      const cell = grid[nr][nc];
      if (!(nr === startPos.row && nc === startPos.col) && 
          !(nr === endPos.row && nc === endPos.col)) {
        cell.style.backgroundColor = visulColor;
        await new Promise(res => setTimeout(res, getDelay()));
      }
    }
  }

  if (!found) {
    if (shouldStop()) {
      throw new Error("Algorithm stopped");
    }
    alert("No path found 😢");
    return false;
  }

  let key = posKey(endPos.row, endPos.col);
  const path = [];

  while (key !== posKey(startPos.row, startPos.col)) {
    path.push(key);
    key = parent[key];
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
