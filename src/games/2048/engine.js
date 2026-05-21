export function createBoard() {
  const board = Array.from({ length: 4 }, () => Array(4).fill(0));
  addRandomTile(board);
  addRandomTile(board);
  return board;
}

function addRandomTile(board) {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return false;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function slideRow(row) {
  let arr = row.filter((v) => v !== 0);
  let score = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter((v) => v !== 0);
  while (arr.length < 4) arr.push(0);
  return { row: arr, score };
}

export function move(board, direction) {
  // direction: 'up', 'down', 'left', 'right'
  let newBoard = board.map((row) => [...row]);
  let totalScore = 0;
  const rotated = direction === 'up' || direction === 'down';

  // For up/down, we transpose to treat as left/right
  if (rotated) newBoard = transpose(newBoard);

  // For right/down, we reverse rows to treat as left
  const reverse = direction === 'right' || direction === 'down';

  for (let r = 0; r < 4; r++) {
    let row = [...newBoard[r]];
    if (reverse) row.reverse();
    const result = slideRow(row);
    if (reverse) result.row.reverse();
    newBoard[r] = result.row;
    totalScore += result.score;
  }

  if (rotated) newBoard = transpose(newBoard);

  // Check if anything moved
  if (boardsEqual(board, newBoard)) return { board, score: 0, moved: false };

  addRandomTile(newBoard);
  return { board: newBoard, score: totalScore, moved: true };
}

function transpose(board) {
  return board[0].map((_, col) => board.map((row) => row[col]));
}

function boardsEqual(a, b) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

export function isGameOver(board) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false;
      if (c < 3 && board[r][c] === board[r][c + 1]) return false;
      if (r < 3 && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

export function hasWon(board) {
  return board.some((row) => row.some((cell) => cell >= 2048));
}
