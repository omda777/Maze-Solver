import { startColor, endColor, wallColor, emptyCellColor , pathColor , visulColor } from "./helper/constants.js";
import { posKey } from "./helper/help.js";
import { dfs, bfs, dijkstra, astar } from "./Algrothims/index.js";
import { generateMaze as generateMazeAlgorithm } from "./MazeGeneration/generateMaze.js";

const algorithmSelect = document.getElementById("algorithm");
const cellInput = document.getElementById("size-cell");
const startBtn = document.querySelector(".start-control");
const endBtn = document.querySelector(".end-control");
const wallBtn = document.querySelector(".wall-control");
const generateBtn = document.querySelector(".generate-control");
const solveBtn = document.querySelector(".solve");
const resetBtn = document.querySelector(".reset");
const speedInput = document.getElementById("speed");
const gridContainer = document.querySelector(".grid-cont");


class MazeState {
  constructor() {
    this.numCells = 15;
    this.grid = [];
    this.wallCells = new Set();
    this.startPos = { row: 0, col: 0 };
    this.endPos = { row: 14, col: 14 };
    this.currentMode = null; // "start" | "end" | "wall" | null
    this.isMouseDown = false;
    this.visualSpeed = 70;
    this.isSolving = false;
    this.isGenerating = false;
    this.shouldStop = false; // Flag to stop running algorithms
  }

  initialize() {
    if (cellInput) {
      this.numCells = parseInt(cellInput.value || "15");
      this.endPos = { row: this.numCells - 1, col: this.numCells - 1 };
    }
    if (speedInput) {
      this.visualSpeed = parseInt(speedInput.value || "70");
    }
  }

  updateCellSize(newSize) {
    this.numCells = newSize;
    this.startPos = { row: 0, col: 0 };
    this.endPos = { row: this.numCells - 1, col: this.numCells - 1 };
  }

  updateSpeed(newSpeed) {
    this.visualSpeed = parseInt(newSpeed);
  }
}

const state = new MazeState();

// some utility func 
function isValid(r, c) {
  return r >= 0 && r < state.numCells && c >= 0 && c < state.numCells;
}

function clearActiveButtons() {
  [startBtn, endBtn, wallBtn, generateBtn, solveBtn, resetBtn]
    .forEach(btn => btn?.classList.remove("active-btn"));
}

function resetVisualization() {
  state.grid.flat().forEach(cell => {
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;
    const key = posKey(r, c);
    
    if (!state.wallCells.has(key) && 
        !(r === state.startPos.row && c === state.startPos.col) && 
        !(r === state.endPos.row && c === state.endPos.col)) {
      cell.style.backgroundColor = emptyCellColor;
    }
  });
}

function isVisualizationColor(color) {
  if (!color) return false;

  const lowerColor = color.toLowerCase().trim();
  const visul = visulColor.toLowerCase().trim();
  const path = pathColor.toLowerCase().trim();

  return (
    lowerColor === visul || lowerColor.includes(visul) ||
    lowerColor === path ||lowerColor.includes(path)
  );
}

function hasVisualizationColors() {
  for (let r = 0; r < state.numCells; r++) {
    for (let c = 0; c < state.numCells; c++) {
      const cell = state.grid[r][c];
      const bgColor = cell.style.backgroundColor || window.getComputedStyle(cell).backgroundColor;
      if (isVisualizationColor(bgColor)) {
        return true;
      }
    }
  }
  return false;
}

function clearVisualizationColors() {
  state.grid.flat().forEach(cell => {
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;
    const bgColor = cell.style.backgroundColor || window.getComputedStyle(cell).backgroundColor;
    
    if (isVisualizationColor(bgColor)) {
      const key = posKey(r, c);
      if (state.wallCells.has(key)) {
        cell.style.backgroundColor = wallColor;
      } else {
        cell.style.backgroundColor = emptyCellColor;
      }
    }
  });
}



function createGrid() {
  if (!gridContainer) {
    console.error("No container provided!");
    return;
  }

  gridContainer.innerHTML = "";
  gridContainer.style.display = "grid";
  gridContainer.style.gridTemplateColumns = `repeat(${state.numCells}, 1fr)`;
  
  state.grid = [];
  state.wallCells.clear();

  // Create cells
  for (let r = 0; r < state.numCells; r++) {
    const row = [];
    for (let c = 0; c < state.numCells; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.style.backgroundColor = emptyCellColor;
      
      cell.style.outline = "none";
      cell.style.verticalAlign = "top";

      cell.addEventListener("mousedown", handleCellClick);
      cell.addEventListener("mouseenter", handleCellDrag);

      row.push(cell);
      gridContainer.appendChild(cell);
    }
    state.grid.push(row);
  }

  document.addEventListener("mousedown", () => {
    state.isMouseDown = true;
  });
  document.addEventListener("mouseup", () => {
    state.isMouseDown = false;
  });

  // Render initial state
  renderNodes();

  gridContainer.style.display = "grid";
  gridContainer.style.visibility = "visible";
  gridContainer.style.opacity = "1";
  gridContainer.style.position = "relative";
}

/* ==================== RENDERING ==================== */
function renderNodes() {
  // Check if grid is initialized
  if (!state.grid || state.grid.length === 0) {
    console.error("Grid not initialized yet!");
    return;
  }

  state.grid.flat().forEach(cell => {
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;
    const key = posKey(r, c);

    if (!state.wallCells.has(key)) {
      cell.style.backgroundColor = emptyCellColor;
      cell.innerHTML = "";
    }
  });

  
  renderWalls();

  // Render start node
  if (state.grid[state.startPos.row] && state.grid[state.startPos.row][state.startPos.col]) {
    const startCell = state.grid[state.startPos.row][state.startPos.col];
    startCell.style.backgroundColor = startColor;
    startCell.innerHTML = `<img src="assets/start_node.png" alt="Start" />`;
    state.wallCells.delete(posKey(state.startPos.row, state.startPos.col));
  }

  // Render end node
  if (state.grid[state.endPos.row] && state.grid[state.endPos.row][state.endPos.col]) {
    const endCell = state.grid[state.endPos.row][state.endPos.col];
    endCell.style.backgroundColor = endColor;
    endCell.innerHTML = `<img src="assets/end_node.png" alt="End" />`;
    state.wallCells.delete(posKey(state.endPos.row, state.endPos.col));
  }
}

function renderWalls() {
  for (let r = 0; r < state.numCells; r++) {
    for (let c = 0; c < state.numCells; c++) {
      const key = posKey(r, c);
      const cell = state.grid[r][c];

      if ((r === state.startPos.row && c === state.startPos.col) ||(r === state.endPos.row && c === state.endPos.col)) {
        continue;
      }

      if (state.wallCells.has(key)) {
        cell.style.backgroundColor = wallColor;
        cell.innerHTML = "";
      } else {
        cell.style.backgroundColor = emptyCellColor;
      }
    }
  }
}


// cell interaction ......................
function handleCellClick(e) {
  if (state.isSolving || state.isGenerating) return;
  
  const cell = e.target.closest(".cell");
  if (!cell) return;

  const r = +cell.dataset.row;
  const c = +cell.dataset.col;
  const key = posKey(r, c);

  if (r === state.startPos.row && c === state.startPos.col) return;
  if (r === state.endPos.row && c === state.endPos.col) return;

  if (state.currentMode === "start") {
    state.startPos = { row: r, col: c };
    state.wallCells.delete(key);
    clearActiveButtons();
    state.currentMode = null;
    renderNodes();

  } else if (state.currentMode === "end") {
    state.endPos = { row: r, col: c };
    state.wallCells.delete(key);
    clearActiveButtons();
    state.currentMode = null;
    renderNodes();

  } else if (state.currentMode === "wall") {
    toggleWall(r, c);
  }
}

function handleCellDrag(e) {
  if (state.isSolving || state.isGenerating) return;
  if (!state.isMouseDown || state.currentMode !== "wall") return;

  const cell = e.target.closest(".cell");
  if (!cell) return;

  const r = +cell.dataset.row;
  const c = +cell.dataset.col;

  if (r === state.startPos.row && c === state.startPos.col) return;
  if (r === state.endPos.row && c === state.endPos.col) return;

  toggleWall(r, c);
}

function toggleWall(r, c) {
  const key = posKey(r, c);
  const cell = state.grid[r][c];

  if (state.wallCells.has(key)) {
    state.wallCells.delete(key);
    cell.style.backgroundColor = emptyCellColor;
  } else {
    state.wallCells.add(key);
    cell.style.backgroundColor = wallColor;
    cell.innerHTML = "";
  }
}


async function generateMaze() {
  if (state.isGenerating || state.isSolving) return;
  
  state.isGenerating = true;
  state.shouldStop = false; // Reset stop flag
  clearActiveButtons();
  generateBtn.classList.add("active-btn");

  state.wallCells.clear();
  
  // Fill entire grid with walls
  for (let r = 0; r < state.numCells; r++) {
    for (let c = 0; c < state.numCells; c++) {
      state.wallCells.add(posKey(r, c));
      const cell = state.grid[r][c];
      if (!(r === state.startPos.row && c === state.startPos.col) &&
          !(r === state.endPos.row && c === state.endPos.col)) {
        cell.style.backgroundColor = wallColor;
      }
    }
  }

  try {
    const shouldStop = () => state.shouldStop;
    
    await generateMazeAlgorithm({
      numCells: state.numCells,
      startPos: state.startPos,
      endPos: state.endPos,
      grid: state.grid,
      wallCells: state.wallCells,
      getSpeed: () => state.visualSpeed, // Dynamic speed getter
      isValid: isValid,
      shouldStop: shouldStop
    });
    renderNodes();
  } catch (error) {
    if (error.message === "Generation stopped") {
      console.log("Maze generation stopped by user");
    } else {
      console.error("Error generating maze:", error);
      alert("An error occurred while generating the maze");
    }
  } finally {
    state.isGenerating = false;
    state.shouldStop = false;
    clearActiveButtons();
  }
}

// solve by algo.......
async function solveMaze() {
  if (state.isSolving || state.isGenerating) return;
  
  state.isSolving = true;
  state.shouldStop = false; 
  clearActiveButtons();
  solveBtn.classList.add("active-btn");

  resetVisualization();

  const selectedAlgorithm = algorithmSelect?.value || "BFS";

  try {
    
    const shouldStop = () => state.shouldStop;
    const getSpeed = () => state.visualSpeed;
    
    switch (selectedAlgorithm) {
      case "BFS":
        await bfs(state.startPos, state.endPos, state.grid, state.numCells, state.wallCells, getSpeed, shouldStop);
        break;
      case "DFS":
        await dfs(state.startPos, state.endPos, state.grid, state.numCells, state.wallCells, getSpeed, shouldStop);
        break;
      case "dijkstra":
        await dijkstra(state.startPos, state.endPos, state.grid, state.numCells, state.wallCells, getSpeed, shouldStop);
        break;
      case "astar":
        await astar(state.startPos, state.endPos, state.grid, state.numCells, state.wallCells, getSpeed, shouldStop);
        break;
      default:
        await bfs(state.startPos, state.endPos, state.grid, state.numCells, state.wallCells, getSpeed, shouldStop);
    }
  } catch (error) {
    if (error.message === "Algorithm stopped") {
      clearVisualizationColors();
    } else {
      console.error("Error solving maze:", error);
      alert("An error occurred while solving the maze");
    }
  } finally {
    state.isSolving = false;
    state.shouldStop = false;
    clearActiveButtons();
  }
}

function resetGrid() {
  if (state.isSolving) {
    state.shouldStop = true;
    setTimeout(() => {
      clearVisualizationColors();
      state.isSolving = false;
      clearActiveButtons();
    }, 100);
    return;
  }
  
  if (state.isGenerating) {
    state.shouldStop = true;
    state.isGenerating = false;
    clearActiveButtons();
    return;
  }
  
  if (hasVisualizationColors()) 
  { 
    clearVisualizationColors();
  }
  else {
    state.wallCells.clear();
    resetVisualization();
    renderNodes();
  }
}


startBtn?.addEventListener("click", () => {
  if (state.isSolving || state.isGenerating) return;
  clearActiveButtons();
  state.currentMode = "start";
  startBtn.classList.add("active-btn");
});

endBtn?.addEventListener("click", () => {
  if (state.isSolving || state.isGenerating) return;
  clearActiveButtons();
  state.currentMode = "end";
  endBtn.classList.add("active-btn");
});

wallBtn?.addEventListener("click", () => {
  if (state.isSolving || state.isGenerating) return;
  clearActiveButtons();
  state.currentMode = "wall";
  wallBtn.classList.add("active-btn");
});

// Action buttons
generateBtn?.addEventListener("click", () => {
  generateMaze();
});

solveBtn?.addEventListener("click", () => {
  solveMaze();
});

resetBtn?.addEventListener("click", () => {
  clearActiveButtons();
  resetBtn.classList.add("active-btn");
  resetGrid();
});


speedInput?.addEventListener("input", (e) => {
  state.updateSpeed(e.target.value);
});

cellInput?.addEventListener("change", (e) => {
  const newSize = parseInt(e.target.value);
  if (newSize >= 5 && newSize <= 30) {
    state.updateCellSize(newSize);
    createGrid();
  }
});


function init() {
  if (!gridContainer) { return; }
  state.initialize();
  createGrid();
}
init();
