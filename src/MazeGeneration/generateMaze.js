import { posKey , dirs } from "../helper/help.js";
import { wallColor, emptyCellColor  } from "../helper/constants.js";

export async function generateMaze({
  numCells,
  startPos,
  endPos,
  grid,
  wallCells,
  getSpeed,
  isValid,
  shouldStop = () => false
}) {
  
  const getDelay = () => {
    const visualSpeed = typeof getSpeed === 'function' ? getSpeed() : getSpeed;
    return Math.max(5, 100 - visualSpeed);
  };

  const visited = Array.from({ length: numCells }, () => Array(numCells).fill(false) );


  // Shuffle array helper (Fisher-Yates)
  function shuffleArray(arr) { 
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Recursive backtracking algorithm
  async function carvePath(r, c) {
    if (shouldStop()) {
      throw new Error("Generation stopped");
    }

    visited[r][c] = true;
    wallCells.delete(posKey(r, c));
    
    // Visual update
    const cell = grid[r][c];
    if (!(r === startPos.row && c === startPos.col) && !(r === endPos.row && c === endPos.col)) {
      cell.style.backgroundColor = emptyCellColor;
      await new Promise(resolve => setTimeout(resolve, getDelay()));
    }

    const shuffledDirs = shuffleArray(dirs);

    for (const [dr, dc] of shuffledDirs) {
      if (shouldStop()) {
        throw new Error("Generation stopped");
      }

      const nextR = r + dr * 2;  // Move 2 steps (skip wall)
      const nextC = c + dc * 2;

      // Check if next cell is valid and unvisited
      if (isValid(nextR, nextC) && !visited[nextR][nextC]) {
        // Remove wall between current and next cell
        const wallR = r + dr;
        const wallC = c + dc;
        wallCells.delete(posKey(wallR, wallC));
        
        // Visual update for wall removal
        const wallCell = grid[wallR][wallC];
        if (!(wallR === startPos.row && wallC === startPos.col) && !(wallR === endPos.row && wallC === endPos.col)) {
          wallCell.style.backgroundColor = emptyCellColor;
          await new Promise(resolve => setTimeout(resolve, getDelay()));
        }
        await carvePath(nextR, nextC);
      }
    }
  }

  // Start from a random position
  // For recursive backtracking, we want to start from an odd position (1, 3, 5, etc.)
  // to ensure we can move 2 steps in any direction for proper maze generation
  let startR, startC;
 const oddPositions = [];
 for (let i = 1; i < numCells - 1; i += 2) 
  oddPositions.push(i);
 startR = oddPositions[Math.floor(Math.random() * oddPositions.length)];
 startC = oddPositions[Math.floor(Math.random() * oddPositions.length)];

 if (!startR) startR = 1;
 if (!startC) startC = 1;
  
  // console.log(`Starting(${startR}, ${startC})`);
  await carvePath(startR, startC)


  wallCells.delete(posKey(startPos.row, startPos.col));
  wallCells.delete(posKey(endPos.row, endPos.col));
  for (const [dr, dc] of dirs) {
    let nr = startPos.row + dr;
    let nc = startPos.col + dc;
    if (isValid(nr, nc)) {
      wallCells.delete(posKey(nr, nc));
    }

    nr = endPos.row + dr;
    nc = endPos.col + dc;
    if (isValid(nr, nc)) {
      wallCells.delete(posKey(nr, nc));
    }
  }
  
}
