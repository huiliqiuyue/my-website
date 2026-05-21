export const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export function createBoard(rows, cols, mineCount) {
  // Initialize empty board
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  );

  // Place mines randomly
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      forEachNeighbor(rows, cols, r, c, (nr, nc) => {
        if (board[nr][nc].mine) count++;
      });
      board[r][c].adjacent = count;
    }
  }

  return board;
}

function forEachNeighbor(rows, cols, r, c, fn) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        fn(nr, nc);
      }
    }
  }
}

export function revealCell(board, r, c) {
  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return { board, hitMine: false };

  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  newBoard[r][c].revealed = true;

  if (newBoard[r][c].mine) {
    // Reveal all mines on game over
    for (let rr = 0; rr < board.length; rr++) {
      for (let cc = 0; cc < board[0].length; cc++) {
        if (newBoard[rr][cc].mine) newBoard[rr][cc].revealed = true;
      }
    }
    return { board: newBoard, hitMine: true };
  }

  // Flood fill if zero adjacent
  if (newBoard[r][c].adjacent === 0) {
    floodFill(newBoard, r, c);
  }

  return { board: newBoard, hitMine: false };
}

function floodFill(board, r, c) {
  const rows = board.length;
  const cols = board[0].length;
  const stack = [[r, c]];

  while (stack.length > 0) {
    const [cr, cc] = stack.pop();
    forEachNeighbor(rows, cols, cr, cc, (nr, nc) => {
      const cell = board[nr][nc];
      if (!cell.revealed && !cell.mine && !cell.flagged) {
        cell.revealed = true;
        if (cell.adjacent === 0) {
          stack.push([nr, nc]);
        }
      }
    });
  }
}

export function toggleFlag(board, r, c) {
  const cell = board[r][c];
  if (cell.revealed) return board;

  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  newBoard[r][c].flagged = !newBoard[r][c].flagged;
  return newBoard;
}

export function checkWin(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (!cell.mine && !cell.revealed) return false;
    }
  }
  return true;
}

export function countFlags(board) {
  let count = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c].flagged) count++;
    }
  }
  return count;
}
