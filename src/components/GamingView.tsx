import React, { useState, useMemo, useEffect } from 'react';
import {
  Gamepad2,
  Users,
  Trophy,
  Play,
  Plus,
  X,
  RotateCcw,
  Send,
  Crown,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Zap,
  Bot,
  Brain,
} from 'lucide-react';
import { useApp } from '../context/AppContext';


// --- GAME 6: CYBER MEMORY MATCH DUEL (সাইবার মেমোরি কার্ড এআই ডুয়েল) ---
interface MemoryCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy?: 'player' | 'ai';
}

const MEMORY_SYMBOLS = ['⚡', '🚀', '🤖', '🎮', '💎', '🔥', '🧠', '🌟'];

const createShuffledMemoryCards = (): MemoryCard[] => {
  const deck: MemoryCard[] = [];
  let id = 0;
  for (const sym of MEMORY_SYMBOLS) {
    deck.push({ id: id++, symbol: sym, isFlipped: false, isMatched: false });
    deck.push({ id: id++, symbol: sym, isFlipped: false, isMatched: false });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};



type MiniGameType = 'tictactoe' | 'chess' | 'connect4' | 'snake' | 'ludo' | 'memory';

interface Playroom {
  id: string;
  name: string;
  nameBn: string;
  game: MiniGameType;
  hostName: string;
  hostAvatar: string;
  playersCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
}

const INITIAL_CHESS_BOARD: (string | null)[][] = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
];

const WHITE_PIECES = ['♙', '♖', '♘', '♗', '♕', '♔'];
const BLACK_PIECES = ['♟', '♜', '♞', '♝', '♛', '♚'];

const PIECE_VALUES: Record<string, number> = {
  '♙': 10,
  '♟': 10,
  '♘': 30,
  '♞': 30,
  '♗': 32,
  '♝': 32,
  '♖': 50,
  '♜': 50,
  '♕': 90,
  '♛': 90,
  '♔': 900,
  '♚': 900,
};

function isWhite(piece: string | null): boolean {
  return Boolean(piece && WHITE_PIECES.includes(piece));
}

function isBlack(piece: string | null): boolean {
  return Boolean(piece && BLACK_PIECES.includes(piece));
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

/**
 * Computes 100% legal chess moves for the piece at (r, c) on the given 8x8 board.
 */
function getLegalChessMoves(board: (string | null)[][], r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];

  const white = isWhite(piece);
  const moves: [number, number][] = [];

  const canLandOn = (tr: number, tc: number) => {
    const target = board[tr][tc];
    if (!target) return true;
    return white ? isBlack(target) : isWhite(target);
  };

  const isEnemy = (tr: number, tc: number) => {
    const target = board[tr][tc];
    if (!target) return false;
    return white ? isBlack(target) : isWhite(target);
  };

  // 1. PAWNS
  if (piece === '♙') {
    // White pawn moves UP (row decreases)
    if (inBounds(r - 1, c) && !board[r - 1][c]) {
      moves.push([r - 1, c]);
      if (r === 6 && inBounds(r - 2, c) && !board[r - 2][c]) {
        moves.push([r - 2, c]);
      }
    }
    if (inBounds(r - 1, c - 1) && isEnemy(r - 1, c - 1)) moves.push([r - 1, c - 1]);
    if (inBounds(r - 1, c + 1) && isEnemy(r - 1, c + 1)) moves.push([r - 1, c + 1]);
    return moves;
  }

  if (piece === '♟') {
    // Black pawn moves DOWN (row increases)
    if (inBounds(r + 1, c) && !board[r + 1][c]) {
      moves.push([r + 1, c]);
      if (r === 1 && inBounds(r + 2, c) && !board[r + 2][c]) {
        moves.push([r + 2, c]);
      }
    }
    if (inBounds(r + 1, c - 1) && isEnemy(r + 1, c - 1)) moves.push([r + 1, c - 1]);
    if (inBounds(r + 1, c + 1) && isEnemy(r + 1, c + 1)) moves.push([r + 1, c + 1]);
    return moves;
  }

  // 2. KNIGHTS
  if (piece === '♘' || piece === '♞') {
    const jumps = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    for (const [dr, dc] of jumps) {
      const tr = r + dr;
      const tc = c + dc;
      if (inBounds(tr, tc) && canLandOn(tr, tc)) {
        moves.push([tr, tc]);
      }
    }
    return moves;
  }

  // 3. KINGS
  if (piece === '♔' || piece === '♚') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const tr = r + dr;
        const tc = c + dc;
        if (inBounds(tr, tc) && canLandOn(tr, tc)) {
          moves.push([tr, tc]);
        }
      }
    }
    return moves;
  }

  // 4. SLIDING PIECES: ROOK, BISHOP, QUEEN
  const directions: [number, number][] = [];
  if (piece === '♖' || piece === '♜' || piece === '♕' || piece === '♛') {
    directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
  }
  if (piece === '♗' || piece === '♝' || piece === '♕' || piece === '♛') {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  }

  for (const [dr, dc] of directions) {
    let tr = r + dr;
    let tc = c + dc;
    while (inBounds(tr, tc)) {
      const target = board[tr][tc];
      if (!target) {
        moves.push([tr, tc]);
      } else {
        if (isEnemy(tr, tc)) {
          moves.push([tr, tc]);
        }
        break; // blocked by piece
      }
      tr += dr;
      tc += dc;
    }
  }

  return moves;
}

export const GamingView: React.FC = () => {
  const { currentUser, contacts, language, showToast } = useApp();

  const [soundEnabled, setSoundEnabled] = useState(true);

  const playGameSound = (type: 'move' | 'capture' | 'win') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === 'win' ? 'triangle' : 'sine';
      osc.frequency.value = type === 'win' ? 660 : type === 'capture' ? 320 : 520;
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close().catch(() => {});
      }, type === 'win' ? 260 : 90);
    } catch {
      // ignore
    }
  };

  const [playrooms, setPlayrooms] = useState<Playroom[]>([
    {
      id: 'ROOM-104',
      name: 'Dhaka Tic-Tac-Toe Arena',
      nameBn: 'ঢাকা কাটাকুটি আড্ডা রুম',
      game: 'tictactoe',
      hostName: contacts[0]?.name || 'Arafat Hossain',
      hostAvatar: contacts[0]?.avatar || currentUser.avatar,
      playersCount: 1,
      maxPlayers: 2,
      status: 'waiting',
    },
    {
      id: 'ROOM-209',
      name: 'Grandmaster Royal Chess',
      nameBn: 'গ্র্যান্ডমাস্টার রয়্যাল দাবা রুম',
      game: 'chess',
      hostName: contacts[1]?.name || 'Nusrat Jahan',
      hostAvatar: contacts[1]?.avatar || currentUser.avatar,
      playersCount: 1,
      maxPlayers: 2,
      status: 'waiting',
    },
    {
      id: 'ROOM-412',
      name: 'Connect 4 Championship',
      nameBn: 'ফোর-ইন-এ-রো চ্যাম্পিয়নশিপ',
      game: 'connect4',
      hostName: contacts[2]?.name || 'Tanvir Ahmed',
      hostAvatar: contacts[2]?.avatar || currentUser.avatar,
      playersCount: 1,
      maxPlayers: 2,
      status: 'waiting',
    },
    {
      id: 'ROOM-505',
      name: 'Cyber Memory Match AI Battle',
      nameBn: 'সাইবার মেমোরি কার্ড এআই ডুয়েল',
      game: 'memory',
      hostName: contacts[3]?.name || 'Sarah Rahman',
      hostAvatar: contacts[3]?.avatar || currentUser.avatar,
      playersCount: 1,
      maxPlayers: 2,
      status: 'waiting',
    },
  ]);

  const [activeLobbyRoom, setActiveLobbyRoom] = useState<Playroom | null>(null);
  const [opponentMode, setOpponentMode] = useState<'ai' | 'pass_and_play'>('ai');

  // --- TIC-TAC-TOE STATE ---
  const [tttBoard, setTttBoard] = useState<('X' | 'O' | null)[]>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttScore, setTttScore] = useState<{ X: number; O: number }>({ X: 0, O: 0 });

  // --- CHESS STATE ---
  const [chessBoard, setChessBoard] = useState<(string | null)[][]>(() =>
    INITIAL_CHESS_BOARD.map((row) => [...row]),
  );
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [chessTurn, setChessTurn] = useState<'white' | 'black'>('white');
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [chessWinner, setChessWinner] = useState<'white' | 'black' | null>(null);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(
    null,
  );
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'master'>('medium');
  const [aiHintMove, setAiHintMove] = useState<{ from: [number, number]; to: [number, number]; piece: string } | null>(null);
  const [aiCommentary, setAiCommentary] = useState<string>(() =>
    language === 'bn' ? 'এআই মাস্টার প্রস্তুত! আপনার প্রথম চাল দিন।' : 'AI Grandmaster ready! Make your move.'
  );

  const chessEvaluation = useMemo(() => {
    let whiteVal = 0;
    let blackVal = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = chessBoard[r][c];
        if (p) {
          const val = PIECE_VALUES[p] || 0;
          if (isWhite(p)) whiteVal += val;
          else blackVal += val;
        }
      }
    }
    return ((whiteVal - blackVal) / 10).toFixed(1);
  }, [chessBoard]);

  const handleAskAiHint = () => {
    if (chessWinner || (opponentMode === 'ai' && chessTurn !== 'white')) return;
    const allWhiteMoves: { from: [number, number]; to: [number, number]; piece: string; score: number }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = chessBoard[r][c];
        if (piece && isWhite(piece)) {
          const legal = getLegalChessMoves(chessBoard, r, c);
          for (const [tr, tc] of legal) {
            const target = chessBoard[tr][tc];
            let score = 2;
            if (target) score += (PIECE_VALUES[target] || 10) * 1.5;
            if (tr >= 3 && tr <= 4 && tc >= 2 && tc <= 5) score += 3;
            allWhiteMoves.push({ from: [r, c], to: [tr, tc], piece, score });
          }
        }
      }
    }
    if (allWhiteMoves.length === 0) return;
    allWhiteMoves.sort((a, b) => b.score - a.score);
    const best = allWhiteMoves[0];
    setAiHintMove({ from: best.from, to: best.to, piece: best.piece });
    showToast(
      language === 'bn'
        ? `💡 এআই পরামর্শ: ${best.piece} ঘুঁটিটিকে নির্দেশিত ঘরে চাল দিন!`
        : `💡 AI Move Hint: Move ${best.piece} to the highlighted square!`
    );
  };

  // --- CONNECT 4 STATE (6 rows x 7 cols) ---
  const [c4Board, setC4Board] = useState<('R' | 'Y' | null)[][]>(() =>
    Array.from({ length: 6 }, () => Array(7).fill(null)),
  );
  const [c4Turn, setC4Turn] = useState<'R' | 'Y'>('R');
  const [c4Winner, setC4Winner] = useState<'R' | 'Y' | 'DRAW' | null>(null);

  // --- LOBBY CHAT STATE ---
  const [lobbyChat, setLobbyChat] = useState<{ sender: string; text: string }[]>([
    {
      sender: 'System',
      text:
        language === 'bn'
          ? 'প্লে-রুমে স্বাগতম! আপনার চাল দিন।'
          : 'Welcome to the live playroom! Make your move.',
    },
  ]);
  const [chatDraft, setChatDraft] = useState('');

  // Check Tic-Tac-Toe Winner
  const checkTttWinner = (squares: ('X' | 'O' | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as 'X' | 'O', line: [a, b, c] };
      }
    }
    if (squares.every((s) => s !== null)) {
      return { winner: 'DRAW' as const, line: [] };
    }
    return null;
  };

  const tttResult = checkTttWinner(tttBoard);

  // Minimax Unbeatable Tic-Tac-Toe AI
  const minimaxTtt = (
    board: ('X' | 'O' | null)[],
    isMaximizing: boolean,
    depth: number
  ): { score: number; move?: number } => {
    const result = checkTttWinner(board);
    if (result) {
      if (result.winner === 'O') return { score: 10 - depth };
      if (result.winner === 'X') return { score: depth - 10 };
      if (result.winner === 'DRAW') return { score: 0 };
    }

    const empty = board
      .map((v, i) => (v === null ? i : null))
      .filter((v): v is number => v !== null);

    if (empty.length === 0) return { score: 0 };

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove = empty[0];
      for (const idx of empty) {
        board[idx] = 'O';
        const res = minimaxTtt(board, false, depth + 1);
        board[idx] = null;
        if (res.score > bestScore) {
          bestScore = res.score;
          bestMove = idx;
        }
      }
      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove = empty[0];
      for (const idx of empty) {
        board[idx] = 'X';
        const res = minimaxTtt(board, true, depth + 1);
        board[idx] = null;
        if (res.score < bestScore) {
          bestScore = res.score;
          bestMove = idx;
        }
      }
      return { score: bestScore, move: bestMove };
    }
  };

  const findSmartTttMove = (board: ('X' | 'O' | null)[]): number => {
    const copy = [...board];
    const best = minimaxTtt(copy, true, 0);
    if (best.move !== undefined) return best.move;
    const empty = board
      .map((v, i) => (v === null ? i : null))
      .filter((v): v is number => v !== null);
    return empty[0];
  };

  const _legacyFindSmartTttMove = (board: ('X' | 'O' | null)[]): number => {
    const empty = board
      .map((v, i) => (v === null ? i : null))
      .filter((v): v is number => v !== null);
    // 1. Try to win as O
    for (const idx of empty) {
      const copy = [...board];
      copy[idx] = 'O';
      if (checkTttWinner(copy)?.winner === 'O') return idx;
    }
    // 2. Block X from winning
    for (const idx of empty) {
      const copy = [...board];
      copy[idx] = 'X';
      if (checkTttWinner(copy)?.winner === 'X') return idx;
    }
    // 3. Take center
    if (empty.includes(4)) return 4;
    // 4. Take a corner
    const corners = [0, 2, 6, 8].filter((c) => empty.includes(c));
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    return empty[Math.floor(Math.random() * empty.length)];
  };

  const handleTttClick = (idx: number) => {
    if (tttBoard[idx] || tttResult) return;
    // Prevent clicking during AI's turn!
    if (opponentMode === 'ai' && tttTurn !== 'X') return;

    const nextBoard = [...tttBoard];
    nextBoard[idx] = tttTurn;
    setTttBoard(nextBoard);
    playGameSound('move');

    const res = checkTttWinner(nextBoard);
    if (res) {
      if (res.winner === 'X' || res.winner === 'O') {
        playGameSound('win');
        setTttScore((prev) => ({ ...prev, [res.winner]: prev[res.winner as 'X' | 'O'] + 1 }));
      }
      return;
    }

    if (opponentMode === 'pass_and_play') {
      setTttTurn(tttTurn === 'X' ? 'O' : 'X');
    } else {
      setTttTurn('O');
      setTimeout(() => {
        const chosen = findSmartTttMove(nextBoard);
        if (chosen === undefined) return;
        const aiBoard = [...nextBoard];
        aiBoard[chosen] = 'O';
        setTttBoard(aiBoard);
        playGameSound('move');
        const aiRes = checkTttWinner(aiBoard);
        if (aiRes && (aiRes.winner === 'X' || aiRes.winner === 'O')) {
          playGameSound('win');
          setTttScore((prev) => ({
            ...prev,
            [aiRes.winner]: prev[aiRes.winner as 'X' | 'O'] + 1,
          }));
        }
        setTttTurn('X');
      }, 420);
    }
  };

  const resetTtt = () => {
    setTttBoard(Array(9).fill(null));
    setTttTurn('X');
  };

  // --- LEGAL CHESS MOVES FOR CURRENTLY SELECTED PIECE ---
  const validChessMoves = useMemo(() => {
    if (!selectedSquare || chessWinner) return [];
    return getLegalChessMoves(chessBoard, selectedSquare[0], selectedSquare[1]);
  }, [chessBoard, selectedSquare, chessWinner]);

  const handleChessSquareClick = (r: number, c: number) => {
    if (chessWinner) return;
    // Prevent player from clicking while AI (Black) is thinking!
    if (opponentMode === 'ai' && chessTurn === 'black') return;

    const clickedPiece = chessBoard[r][c];

    // If no piece selected yet, select own piece
    if (!selectedSquare) {
      if (!clickedPiece) return;
      if (chessTurn === 'white' && !isWhite(clickedPiece)) return;
      if (chessTurn === 'black' && !isBlack(clickedPiece)) return;
      setSelectedSquare([r, c]);
      return;
    }

    const [sr, sc] = selectedSquare;
    if (sr === r && sc === c) {
      setSelectedSquare(null);
      return;
    }

    // If clicking another of own pieces, switch selection to that piece
    if (clickedPiece) {
      if (
        (chessTurn === 'white' && isWhite(clickedPiece)) ||
        (chessTurn === 'black' && isBlack(clickedPiece))
      ) {
        setSelectedSquare([r, c]);
        return;
      }
    }

    // Verify that (r, c) is a legal move for the selected piece!
    const isLegal = validChessMoves.some(([vr, vc]) => vr === r && vc === c);
    if (!isLegal) {
      showToast(
        language === 'bn'
          ? '⚠️ এটি বৈধ দাবার চাল নয়! সবুজ চিহ্নিত ঘরে চাল দিন।'
          : '⚠️ Illegal chess move! Click a highlighted green square.',
      );
      return;
    }

    const movingPiece = chessBoard[sr][sc];
    if (!movingPiece) {
      setSelectedSquare(null);
      return;
    }

    // Execute legal move
    const nextBoard = chessBoard.map((row) => [...row]);
    if (clickedPiece) {
      playGameSound('capture');
      if (isWhite(movingPiece)) {
        setCapturedByWhite((prev) => [...prev, clickedPiece]);
      } else {
        setCapturedByBlack((prev) => [...prev, clickedPiece]);
      }
    } else {
      playGameSound('move');
    }

    // Pawn promotion to Queen
    let finalPiece = movingPiece;
    if (movingPiece === '♙' && r === 0) finalPiece = '♕';
    if (movingPiece === '♟' && r === 7) finalPiece = '♛';

    nextBoard[r][c] = finalPiece;
    nextBoard[sr][sc] = null;
    setChessBoard(nextBoard);
    setSelectedSquare(null);
    setAiHintMove(null);
    setLastMove({ from: [sr, sc], to: [r, c] });

    // Check if King was captured
    if (clickedPiece === '♚') {
      playGameSound('win');
      setChessWinner('white');
      setAiCommentary(language === 'bn' ? '🎉 আপনি কিস্তিমাত করে জিতেছেন!' : '🎉 You won by Checkmate!');
      return;
    }
    if (clickedPiece === '♔') {
      playGameSound('win');
      setChessWinner('black');
      setAiCommentary(language === 'bn' ? '🤖 এআই আপনাকে কিস্তিমাত করেছে!' : '🤖 AI won by Checkmate!');
      return;
    }

    if (clickedPiece) {
      setAiCommentary(
        language === 'bn'
          ? `সাদা চমৎকার চালে ${clickedPiece} ঘুঁটিটি কেটে নিয়েছে!`
          : `White captured ${clickedPiece}! Great move!`
      );
    } else {
      setAiCommentary(
        language === 'bn'
          ? 'সাদা চাল দিয়েছে। এখন এআই চাল ভাবছে...'
          : 'White moved. AI is evaluating...'
      );
    }

    if (opponentMode === 'pass_and_play') {
      setChessTurn(chessTurn === 'white' ? 'black' : 'white');
    } else {
      // Smart Legal AI Move for Black according to selected difficulty
      setChessTurn('black');
      setTimeout(() => {
        const allBlackMoves: {
          from: [number, number];
          to: [number, number];
          score: number;
        }[] = [];

        for (let br = 0; br < 8; br++) {
          for (let bc = 0; bc < 8; bc++) {
            const p = nextBoard[br][bc];
            if (p && isBlack(p)) {
              const legalTargets = getLegalChessMoves(nextBoard, br, bc);
              for (const [tr, tc] of legalTargets) {
                const targetCell = nextBoard[tr][tc];
                let moveScore = 1;
                if (targetCell) {
                  moveScore += (PIECE_VALUES[targetCell] || 15) * 1.5;
                }
                // Center control & forward development bonus
                if (tr >= 3 && tr <= 4 && tc >= 2 && tc <= 5) {
                  moveScore += 4;
                }
                // Defend and attack bonus
                if (targetCell === '♔') moveScore += 999;
                allBlackMoves.push({
                  from: [br, bc],
                  to: [tr, tc],
                  score: moveScore + (aiDifficulty === 'master' ? 0 : Math.random() * 2),
                });
              }
            }
          }
        }

        if (allBlackMoves.length === 0) {
          setChessWinner('white');
          return;
        }

        allBlackMoves.sort((a, b) => b.score - a.score);
        let chosen = allBlackMoves[0];
        if (aiDifficulty === 'easy') {
          const pool = allBlackMoves.slice(0, Math.min(6, allBlackMoves.length));
          chosen = pool[Math.floor(Math.random() * pool.length)];
        } else if (aiDifficulty === 'medium') {
          const pool = allBlackMoves.slice(0, Math.min(2, allBlackMoves.length));
          chosen = pool[Math.floor(Math.random() * pool.length)];
        } else {
          chosen = allBlackMoves[0];
        }

        const aiBoard = nextBoard.map((row) => [...row]);
        const targetCaptured = aiBoard[chosen.to[0]][chosen.to[1]];

        if (targetCaptured) {
          playGameSound('capture');
          setCapturedByBlack((prev) => [...prev, targetCaptured]);
          setAiCommentary(
            language === 'bn'
              ? `কালো এআই আপনার ${targetCaptured} দখল করেছে!`
              : `Black captured your ${targetCaptured}!`
          );
        } else {
          playGameSound('move');
          setAiCommentary(
            language === 'bn'
              ? 'কালো এআই চাল সম্পন্ন করেছে। এখন আপনার চাল!'
              : 'Black completed their move. Your turn!'
          );
        }

        let aiPiece = aiBoard[chosen.from[0]][chosen.from[1]];
        if (aiPiece === '♟' && chosen.to[0] === 7) {
          aiPiece = '♛';
        }

        aiBoard[chosen.to[0]][chosen.to[1]] = aiPiece;
        aiBoard[chosen.from[0]][chosen.from[1]] = null;
        setChessBoard(aiBoard);
        setLastMove({ from: chosen.from, to: chosen.to });

        if (targetCaptured === '♔') {
          playGameSound('win');
          setChessWinner('black');
          setAiCommentary(language === 'bn' ? '🤖 এআই আপনাকে কিস্তিমাত করেছে!' : '🤖 AI checkmated you!');
          return;
        }

        setChessTurn('white');
      }, aiDifficulty === 'master' ? 650 : 450);
    }
  };

  const resetChess = () => {
    setChessBoard(INITIAL_CHESS_BOARD.map((row) => [...row]));
    setSelectedSquare(null);
    setChessTurn('white');
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setChessWinner(null);
    setLastMove(null);
  };

  // --- CONNECT 4 HANDLERS ---
  const checkC4Winner = (grid: ('R' | 'Y' | null)[][]): 'R' | 'Y' | 'DRAW' | null => {
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const player = grid[r][c];
        if (!player) continue;
        for (const [dr, dc] of dirs) {
          let count = 1;
          for (let step = 1; step < 4; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && grid[nr][nc] === player) {
              count++;
            } else {
              break;
            }
          }
          if (count === 4) return player;
        }
      }
    }
    if (grid[0].every((cell) => cell !== null)) return 'DRAW';
    return null;
  };

  const handleDropC4Column = (col: number) => {
    if (c4Winner) return;
    if (opponentMode === 'ai' && c4Turn !== 'R') return;

    // Find lowest empty row in column
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (c4Board[r][col] === null) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) return;

    const nextGrid = c4Board.map((row) => [...row]);
    nextGrid[targetRow][col] = c4Turn;
    setC4Board(nextGrid);
    playGameSound('move');

    const win = checkC4Winner(nextGrid);
    if (win) {
      playGameSound('win');
      setC4Winner(win);
      return;
    }

    if (opponentMode === 'pass_and_play') {
      setC4Turn(c4Turn === 'R' ? 'Y' : 'R');
    } else {
      setC4Turn('Y');
      setTimeout(() => {
        const availableCols = [0, 1, 2, 3, 4, 5, 6].filter((c) => nextGrid[0][c] === null);
        if (availableCols.length === 0) return;

        // 1. Try to win as Y
        let chosenCol: number | undefined;
        for (const colIdx of availableCols) {
          let rTest = -1;
          for (let r = 5; r >= 0; r--) {
            if (nextGrid[r][colIdx] === null) {
              rTest = r;
              break;
            }
          }
          if (rTest !== -1) {
            const testGrid = nextGrid.map((row) => [...row]);
            testGrid[rTest][colIdx] = 'Y';
            if (checkC4Winner(testGrid) === 'Y') {
              chosenCol = colIdx;
              break;
            }
          }
        }
        // 2. Block R from winning
        if (chosenCol === undefined) {
          for (const colIdx of availableCols) {
            let rTest = -1;
            for (let r = 5; r >= 0; r--) {
              if (nextGrid[r][colIdx] === null) {
                rTest = r;
                break;
              }
            }
            if (rTest !== -1) {
              const testGrid = nextGrid.map((row) => [...row]);
              testGrid[rTest][colIdx] = 'R';
              if (checkC4Winner(testGrid) === 'R') {
                chosenCol = colIdx;
                break;
              }
            }
          }
        }
        // 3. Prefer center columns
        if (chosenCol === undefined) {
          availableCols.sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
          chosenCol =
            Math.random() < 0.75
              ? availableCols[0]
              : availableCols[Math.floor(Math.random() * availableCols.length)];
        }

        let aiRow = -1;
        for (let r = 5; r >= 0; r--) {
          if (nextGrid[r][chosenCol] === null) {
            aiRow = r;
            break;
          }
        }
        if (aiRow !== -1) {
          const aiGrid = nextGrid.map((row) => [...row]);
          aiGrid[aiRow][chosenCol] = 'Y';
          setC4Board(aiGrid);
          playGameSound('move');
          const aiWin = checkC4Winner(aiGrid);
          if (aiWin) {
            playGameSound('win');
            setC4Winner(aiWin);
          }
        }
        setC4Turn('R');
      }, 450);
    }
  };

  const resetC4 = () => {
    setC4Board(Array.from({ length: 6 }, () => Array(7).fill(null)));
    setC4Turn('R');
    setC4Winner(null);
  };

  // --- GAME 4: CYBER SNAKE ARCADE (Mobile Touch D-Pad + Keyboard) ---
  const SNAKE_GRID = 15;
  const [snakeBody, setSnakeBody] = useState<[number, number][]>([
    [7, 7],
    [7, 6],
    [7, 5],
  ]);
  const [snakeDir, setSnakeDir] = useState<[number, number]>([0, 1]);
  const [snakeFood, setSnakeFood] = useState<[number, number]>([4, 10]);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeHighScore, setSnakeHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('bandhan_snake_high') || '0', 10) || 0;
  });
  const [snakeGameOver, setSnakeGameOver] = useState(false);
  const [snakeRunning, setSnakeRunning] = useState(false);

  // --- GAME 5: LUDO DICE DUEL (লুডু ডাইস চ্যালেঞ্জ - Race to 30) ---
  const [ludoPlayerPos, setLudoPlayerPos] = useState(0);
  const [ludoAiPos, setLudoAiPos] = useState(0);
  const [ludoLastDice, setLudoLastDice] = useState<{ player: number | null; ai: number | null }>({
    player: null,
    ai: null,
  });
  const [ludoWinner, setLudoWinner] = useState<'player' | 'ai' | null>(null);
  const [ludoRolling, setLudoRolling] = useState(false);

  // --- MEMORY MATCH STATE ---
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(createShuffledMemoryCards);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memoryTurn, setMemoryTurn] = useState<'player' | 'ai'>('player');
  const [memoryScore, setMemoryScore] = useState<{ player: number; ai: number }>({ player: 0, ai: 0 });
  const [memoryWinner, setMemoryWinner] = useState<'player' | 'ai' | 'DRAW' | null>(null);
  const [memoryAiBrain, setMemoryAiBrain] = useState<Record<number, string>>({});
  const [memoryAiThinking, setMemoryAiThinking] = useState(false);
  const [dailyCoins, setDailyCoins] = useState<number>(() => {
    return parseInt(localStorage.getItem('bandhan_game_coins') || '1250', 10) || 1250;
  });
  const [claimedDailyBonus, setClaimedDailyBonus] = useState(false);

  const resetLudo = () => {
    setLudoPlayerPos(0);
    setLudoAiPos(0);
    setLudoLastDice({ player: null, ai: null });
    setLudoWinner(null);
    setLudoRolling(false);
  };

  const rollLudoDice = () => {
    if (ludoWinner || ludoRolling) return;
    setLudoRolling(true);
    playGameSound('move');
    const pRoll = Math.floor(Math.random() * 6) + 1;
    const nextP = Math.min(30, ludoPlayerPos + pRoll);
    setLudoPlayerPos(nextP);
    setLudoLastDice((prev) => ({ ...prev, player: pRoll }));

    if (nextP >= 30) {
      playGameSound('win');
      setLudoWinner('player');
      setLudoRolling(false);
      setDailyCoins((c) => {
        const nextC = c + 100;
        localStorage.setItem('bandhan_game_coins', String(nextC));
        return nextC;
      });
      return;
    }

    setTimeout(() => {
      const aRoll = Math.floor(Math.random() * 6) + 1;
      setLudoAiPos((prevAi) => {
        const nextA = Math.min(30, prevAi + aRoll);
        if (nextA >= 30) {
          setLudoWinner('ai');
        }
        return nextA;
      });
      setLudoLastDice({ player: pRoll, ai: aRoll });
      playGameSound('move');
      setLudoRolling(false);
    }, 420);
  };

  const resetSnake = () => {
    setSnakeBody([
      [7, 7],
      [7, 6],
      [7, 5],
    ]);
    setSnakeDir([0, 1]);
    setSnakeFood([3, 11]);
    setSnakeScore(0);
    setSnakeGameOver(false);
    setSnakeRunning(true);
  };

  useEffect(() => {
    if (!activeLobbyRoom || activeLobbyRoom.game !== 'snake' || !snakeRunning || snakeGameOver) {
      return;
    }
    const timer = setInterval(() => {
      setSnakeBody((prev) => {
        const head = prev[0];
        const nextR = (head[0] + snakeDir[0] + SNAKE_GRID) % SNAKE_GRID;
        const nextC = (head[1] + snakeDir[1] + SNAKE_GRID) % SNAKE_GRID;

        // Check self collision
        if (prev.some(([r, c]) => r === nextR && c === nextC)) {
          setSnakeGameOver(true);
          setSnakeRunning(false);
          return prev;
        }

        const ateFood = nextR === snakeFood[0] && nextC === snakeFood[1];
        const nextSnake: [number, number][] = [[nextR, nextC], ...prev];
        if (!ateFood) {
          nextSnake.pop();
        } else {
          playGameSound('capture');
          setSnakeScore((s) => {
            const nextS = s + 10;
            if (nextS > snakeHighScore) {
              setSnakeHighScore(nextS);
              try {
                localStorage.setItem('bandhan_snake_high', String(nextS));
              } catch {
                // ignore
              }
            }
            return nextS;
          });
          setSnakeFood([
            Math.floor(Math.random() * SNAKE_GRID),
            Math.floor(Math.random() * SNAKE_GRID),
          ]);
        }
        return nextSnake;
      });
    }, 170);

    return () => clearInterval(timer);
  }, [activeLobbyRoom, snakeRunning, snakeGameOver, snakeDir, snakeFood, snakeHighScore]);

  useEffect(() => {
    if (!activeLobbyRoom || activeLobbyRoom.game !== 'snake') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && snakeDir[0] !== 1) {
        e.preventDefault();
        setSnakeDir([-1, 0]);
        setSnakeRunning(true);
      } else if (e.key === 'ArrowDown' && snakeDir[0] !== -1) {
        e.preventDefault();
        setSnakeDir([1, 0]);
        setSnakeRunning(true);
      } else if (e.key === 'ArrowLeft' && snakeDir[1] !== 1) {
        e.preventDefault();
        setSnakeDir([0, -1]);
        setSnakeRunning(true);
      } else if (e.key === 'ArrowRight' && snakeDir[1] !== -1) {
        e.preventDefault();
        setSnakeDir([0, 1]);
        setSnakeRunning(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLobbyRoom, snakeDir]);

  const resetMemoryGame = () => {
    setMemoryCards(createShuffledMemoryCards());
    setMemoryFlipped([]);
    setMemoryTurn('player');
    setMemoryScore({ player: 0, ai: 0 });
    setMemoryWinner(null);
    setMemoryAiBrain({});
    setMemoryAiThinking(false);
  };

  const handleMemoryCardClick = (cardIdx: number) => {
    if (
      memoryWinner ||
      memoryAiThinking ||
      (opponentMode === 'ai' && memoryTurn !== 'player') ||
      memoryCards[cardIdx].isMatched ||
      memoryCards[cardIdx].isFlipped ||
      memoryFlipped.length >= 2
    ) {
      return;
    }

    playGameSound('move');
    const newCards = [...memoryCards];
    newCards[cardIdx] = { ...newCards[cardIdx], isFlipped: true };
    setMemoryCards(newCards);

    // AI learns card location
    setMemoryAiBrain((prev) => ({ ...prev, [cardIdx]: newCards[cardIdx].symbol }));

    const nextFlipped = [...memoryFlipped, cardIdx];
    setMemoryFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstIdx, secondIdx] = nextFlipped;
      const card1 = newCards[firstIdx];
      const card2 = newCards[secondIdx];

      if (card1.symbol === card2.symbol) {
        // MATCH FOUND
        playGameSound('capture');
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[firstIdx] = { ...updated[firstIdx], isMatched: true, matchedBy: 'player' };
            updated[secondIdx] = { ...updated[secondIdx], isMatched: true, matchedBy: 'player' };
            return updated;
          });
          setMemoryScore((prev) => {
            const nextScore = { ...prev, player: prev.player + 1 };
            if (nextScore.player + nextScore.ai === 8) {
              playGameSound('win');
              setMemoryWinner(nextScore.player > nextScore.ai ? 'player' : nextScore.player < nextScore.ai ? 'ai' : 'DRAW');
            }
            return nextScore;
          });
          setMemoryFlipped([]);
        }, 450);
      } else {
        // NO MATCH -> Flip back & switch
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[firstIdx] = { ...updated[firstIdx], isFlipped: false };
            updated[secondIdx] = { ...updated[secondIdx], isFlipped: false };
            return updated;
          });
          setMemoryFlipped([]);
          if (opponentMode === 'ai') {
            setMemoryTurn('ai');
            triggerAiMemoryTurn();
          } else {
            setMemoryTurn((prev) => (prev === 'player' ? 'ai' : 'player'));
          }
        }, 850);
      }
    }
  };

  const triggerAiMemoryTurn = () => {
    setMemoryAiThinking(true);
    setTimeout(() => {
      setMemoryCards((currentCards) => {
        const unmatchedIndices = currentCards
          .map((c, i) => (!c.isMatched ? i : null))
          .filter((i): i is number => i !== null);

        if (unmatchedIndices.length < 2) {
          setMemoryAiThinking(false);
          return currentCards;
        }

        let choice1 = -1;
        let choice2 = -1;

        // Check if AI remembers any pair
        const symbolToIndices: Record<string, number[]> = {};
        for (const [idxStr, sym] of Object.entries(memoryAiBrain)) {
          const idx = parseInt(idxStr, 10);
          if (!currentCards[idx]?.isMatched) {
            if (!symbolToIndices[sym]) symbolToIndices[sym] = [];
            symbolToIndices[sym].push(idx);
          }
        }

        for (const [, indices] of Object.entries(symbolToIndices)) {
          if (indices.length >= 2) {
            choice1 = indices[0];
            choice2 = indices[1];
            break;
          }
        }

        if (choice1 === -1) {
          // AI picks a random card it hasn't matched yet
          choice1 = unmatchedIndices[Math.floor(Math.random() * unmatchedIndices.length)];
          const sym1 = currentCards[choice1].symbol;

          // Check if AI knows where the partner is
          const knownPartner = Object.entries(memoryAiBrain).find(
            ([idxStr, sym]) => parseInt(idxStr, 10) !== choice1 && sym === sym1 && !currentCards[parseInt(idxStr, 10)]?.isMatched
          );

          if (knownPartner && Math.random() < 0.85) {
            choice2 = parseInt(knownPartner[0], 10);
          } else {
            const remaining = unmatchedIndices.filter((i) => i !== choice1);
            choice2 = remaining[Math.floor(Math.random() * remaining.length)];
          }
        }

        playGameSound('move');
        const step1 = [...currentCards];
        step1[choice1] = { ...step1[choice1], isFlipped: true };

        setTimeout(() => {
          playGameSound('move');
          setMemoryCards((midCards) => {
            const step2 = [...midCards];
            step2[choice2] = { ...step2[choice2], isFlipped: true };
            return step2;
          });

          setMemoryAiBrain((prev) => ({
            ...prev,
            [choice1]: currentCards[choice1].symbol,
            [choice2]: currentCards[choice2].symbol,
          }));

          const match = currentCards[choice1].symbol === currentCards[choice2].symbol;

          setTimeout(() => {
            if (match) {
              playGameSound('capture');
              setMemoryCards((prevCards) => {
                const matched = [...prevCards];
                matched[choice1] = { ...matched[choice1], isMatched: true, matchedBy: 'ai' };
                matched[choice2] = { ...matched[choice2], isMatched: true, matchedBy: 'ai' };
                return matched;
              });
              setMemoryScore((prevScore) => {
                const nextScore = { ...prevScore, ai: prevScore.ai + 1 };
                if (nextScore.player + nextScore.ai === 8) {
                  playGameSound('win');
                  setMemoryWinner(nextScore.player > nextScore.ai ? 'player' : nextScore.player < nextScore.ai ? 'ai' : 'DRAW');
                }
                return nextScore;
              });
            } else {
              setMemoryCards((prevCards) => {
                const flippedBack = [...prevCards];
                flippedBack[choice1] = { ...flippedBack[choice1], isFlipped: false };
                flippedBack[choice2] = { ...flippedBack[choice2], isFlipped: false };
                return flippedBack;
              });
            }
            setMemoryTurn('player');
            setMemoryAiThinking(false);
          }, 800);
        }, 500);

        return step1;
      });
    }, 600);
  };

  const handleOpenLobby = (room: Playroom) => {
    setActiveLobbyRoom(room);
    resetTtt();
    resetChess();
    resetC4();
    resetMemoryGame();
  };

  const handleCreateQuickRoom = (game: MiniGameType) => {
    const newRoom: Playroom = {
      id: `ROOM-${Math.floor(100 + Math.random() * 899)}`,
      name:
        game === 'tictactoe'
          ? `${currentUser.name.split(' ')[0]}'s Tic-Tac-Toe Room`
          : game === 'chess'
          ? `${currentUser.name.split(' ')[0]}'s Chess Table`
          : game === 'connect4'
          ? `${currentUser.name.split(' ')[0]}'s Connect 4 Arena`
          : game === 'ludo'
          ? `${currentUser.name.split(' ')[0]}'s Ludo Dice Arena`
          : game === 'memory' ? `${currentUser.name.split(' ')[0]}'s Cyber Memory Match` : `${currentUser.name.split(' ')[0]}'s Cyber Snake Arcade`,
      nameBn:
        game === 'tictactoe'
          ? `${currentUser.nameBn || currentUser.name}-এর কাটাকুটি রুম`
          : game === 'chess'
          ? `${currentUser.nameBn || currentUser.name}-এর দাবা টেবিল`
          : game === 'connect4'
          ? `${currentUser.nameBn || currentUser.name}-এর ফোর-ইন-এ-রো রুম`
          : game === 'ludo'
          ? `${currentUser.nameBn || currentUser.name}-এর লুডু ডাইস চ্যালেঞ্জ`
          : game === 'memory' ? `${currentUser.nameBn || currentUser.name}-এর সাইবার মেমোরি কার্ড ডুয়েল` : `${currentUser.nameBn || currentUser.name}-এর সাইবার স্নেক আর্কেড`,
      game,
      hostName: currentUser.name,
      hostAvatar: currentUser.avatar,
      playersCount: 2,
      maxPlayers: 2,
      status: 'playing',
    };
    setPlayrooms((prev) => [newRoom, ...prev]);
    setActiveLobbyRoom(newRoom);
    resetTtt();
    resetChess();
    resetC4();
    resetLudo();
    resetMemoryGame();
    showToast(
      language === 'bn'
        ? `নতুন প্লে-রুম (${newRoom.id}) তৈরি হয়েছে!`
        : `Created temporary playroom ${newRoom.id}!`,
    );
  };

  const handleSendLobbyChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatDraft.trim()) return;
    const text = chatDraft.trim();
    setLobbyChat((prev) => [...prev, { sender: currentUser.name.split(' ')[0], text }]);
    setChatDraft('');

    setTimeout(() => {
      const replies =
        language === 'bn'
          ? ['দারুণ চাল! 👏', 'দেখা যাক কে জেতে! 🔥', 'বুদ্ধিদীপ্ত খেলা হচ্ছে! 🏆']
          : ['Great move! 👏', 'Good game! 🔥', 'Tactical match! 🏆'];
      setLobbyChat((prev) => [
        ...prev,
        {
          sender: activeLobbyRoom?.hostName.split(' ')[0] || 'Opponent',
          text: replies[Math.floor(Math.random() * replies.length)],
        },
      ]);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold mb-2">
            <Gamepad2 className="w-4 h-4 text-amber-300" />
            <span>{language === 'bn' ? 'বন্ধন গেম জোন ও লাইভ লবি' : 'Bandhan Game Zone & Lobby'}</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {language === 'bn'
              ? 'নির্ভুল নিয়মে দাবা, কাটাকুটি ও ফোর-ইন-এ-রো খেলুন!'
              : 'Play Rule-Accurate Chess, Tic-Tac-Toe & Connect 4!'}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            {language === 'bn'
              ? 'সবুজ বৈধ চালের নির্দেশনাসহ আসল দাবা (Chess), স্মার্ট কাটাকুটি (Tic-Tac-Toe) এবং Connect 4 খেলুন।'
              : 'Play legal-move highlighted Chess, smart AI Tic-Tac-Toe, and Connect 4 inside interactive playrooms.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('tictactoe')}
            className="px-3.5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold rounded-2xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'কাটাকুটি রুম' : 'Tic-Tac-Toe'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('chess')}
            className="px-3.5 py-2.5 bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-bold rounded-2xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
          >
            <Crown className="w-4 h-4" />
            <span>{language === 'bn' ? 'দাবা রুম' : 'Chess Lobby'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('connect4')}
            className="px-3.5 py-2.5 bg-emerald-400 text-slate-950 hover:bg-emerald-300 text-xs font-bold rounded-2xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'bn' ? 'ফোর-ইন-এ-রো' : 'Connect 4'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleCreateQuickRoom('snake');
              resetSnake();
            }}
            className="px-3.5 py-2.5 bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold rounded-2xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
          >
            <Zap className="w-4 h-4" />
            <span>{language === 'bn' ? 'সাইবার স্নেক' : 'Cyber Snake'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleCreateQuickRoom('memory');
              resetMemoryGame();
            }}
            className="px-3.5 py-2.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-bold rounded-2xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
          >
            <Brain className="w-4 h-4" />
            <span>{language === 'bn' ? 'মেমোরি কার্ড' : 'Memory Match'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('ludo')}
            className="px-3.5 py-2.5 bg-fuchsia-500 text-white hover:bg-fuchsia-600 text-xs font-bold rounded-2xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
          >
            <Trophy className="w-4 h-4" />
            <span>{language === 'bn' ? 'লুডু ডাইস' : 'Ludo Dice'}</span>
          </button>
        </div>
      </div>

      {/* Updated Game Zone Daily Rewards & Coin Wallet Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-black">
            🪙
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              {language === 'bn'
                ? `আপনার গেমিং কয়েন: ${dailyCoins.toLocaleString()} XP Coins`
                : `Your Gaming Wallet: ${dailyCoins.toLocaleString()} XP Coins`}
            </p>
            <p className="text-[11px] text-slate-500">
              {language === 'bn'
                ? 'দাবা, কাটাকুটি, লুডু ডাইস ও স্নেক জিতে কয়েন অর্জন করুন!'
                : 'Win matches in Chess, Ludo Dice, Connect 4 & Snake to earn coins!'}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={claimedDailyBonus}
          onClick={() => {
            setClaimedDailyBonus(true);
            setDailyCoins((c) => {
              const nextC = c + 250;
              localStorage.setItem('bandhan_game_coins', String(nextC));
              return nextC;
            });
            showToast(
              language === 'bn'
                ? '🎁 +২৫০ ডেইলি গেম বোনাস কয়েন যুক্ত হয়েছে!'
                : '🎁 Claimed +250 Daily Game Bonus Coins!',
            );
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            claimedDailyBonus
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
          }`}
        >
          {claimedDailyBonus
            ? language === 'bn'
              ? '✓ আজকের বোনাস নেওয়া হয়েছে'
              : '✓ Daily Bonus Claimed'
            : language === 'bn'
            ? '🎁 +২৫০ ফ্রি বোনাস নিন'
            : '🎁 Claim +250 Coins'}
        </button>
      </div>

      {/* Featured Games Cards (5 Games) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Game 1: Tic-Tac-Toe */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">
                Smart AI 3x3
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'টিক-ট্যাক-টো (কাটাকুটি)' : 'Tic-Tac-Toe Pro'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'স্মার্ট এআই বা বন্ধুর সাথে দ্রুতগতির কাটাকুটি ম্যাচ খেলুন।'
                  : 'Tactical 3x3 showdown against smart blocking AI or a friend.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-md">
              ❌⭕
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('tictactoe')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'bn' ? 'এখনই খেলুন' : 'Play Now'}</span>
          </button>
        </div>

        {/* Game 2: Royal Chess */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full">
                Legal Moves 8x8
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'রয়্যাল দাবা (Royal Chess)' : 'Royal Chess'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'সঠিক দাবার নিয়ম ও সবুজ চাল নির্দেশনাসহ ৮x৮ দাবা বোর্ড।'
                  : 'True chess piece rules with green legal-move indicators.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
              ♟️👑
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('chess')}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'bn' ? 'দাবা খেলুন' : 'Play Chess'}</span>
          </button>
        </div>

        {/* Game 3: Connect 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
                Arcade 6x7
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'ফোর-ইন-এ-রো (Connect 4)' : 'Connect 4'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'পরপর ৪টি ডিস্ক মিলিয়ে প্রতিপক্ষকে হারিয়ে দিন!'
                  : 'Drop discs and connect 4 in a row horizontally, vertically, or diagonally.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
              🔴🟡
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('connect4')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'bn' ? 'এখনই খেলুন' : 'Play Connect 4'}</span>
          </button>
        </div>

        {/* Game 4: Cyber Snake Arcade */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full">
                Mobile + PC
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'সাইবার স্নেক (Cyber Snake)' : 'Cyber Snake 2077'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'মোবাইল টাচ বাটন ও কিবোর্ড দিয়ে দ্রুতগতির স্নেক গেম খেলুন!'
                  : 'Fast-paced arcade snake with mobile touch D-pad & high scores.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
              🐍⚡
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleCreateQuickRoom('snake');
              resetSnake();
            }}
            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'bn' ? 'স্নেক খেলুন' : 'Play Snake'}</span>
          </button>
        </div>

        {/* Game 6: Cyber Memory Match AI Battle */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 rounded-full">
                AI Mind Battle
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'সাইবার মেমোরি কার্ড ডুয়েল' : 'Cyber Memory Match Duel'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? '১৬টি কার্ডের জোড়া খুঁজে বের করে শক্তিশালী এআই-কে স্মৃতিশক্তিতে টেক্কা দিন!'
                  : 'Flip cards, match pairs, and test your memory against high-IQ AI!'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
              🧠⚡
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleCreateQuickRoom('memory');
              resetMemoryGame();
            }}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'bn' ? 'মেমোরি গেম খেলুন' : 'Play Memory Match'}</span>
          </button>
        </div>

        {/* Game 5: Ludo Dice Duel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-600 dark:text-fuchsia-400 rounded-full">
                New 2026
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'লুডু ডাইস চ্যালেঞ্জ' : 'Ludo Dice Duel'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'ছক্কা চালুন এবং ৩০ ঘরে আগে পৌঁছে বিজয়ী হোন!'
                  : 'Roll the dice and race to tile 30 before your opponent!'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
              🎲🏆
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCreateQuickRoom('ludo')}
            className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'bn' ? 'লুডু খেলুন' : 'Play Ludo Dice'}</span>
          </button>
        </div>
      </div>

      {/* Live Temporary Playrooms List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>
                {language === 'bn'
                  ? 'সক্রিয় গেম লবি ও অস্থায়ী প্লে-রুমসমূহ'
                  : 'Active Game Lobby & Temporary Playrooms'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'যেকোনো রুমে ক্লিক করে সরাসরি খেলায় যোগ দিন'
                : 'Click Join Lobby to enter the interactive Game Lobby modal'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            {playrooms.length} {language === 'bn' ? 'টি রুম অনলাইন' : 'Rooms Live'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playrooms.map((room) => (
            <div
              key={room.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    #{room.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      room.game === 'tictactoe'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        : room.game === 'chess'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                        : room.game === 'snake'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {room.game === 'tictactoe'
                      ? 'Tic-Tac-Toe'
                      : room.game === 'chess'
                      ? 'Chess'
                      : room.game === 'snake'
                      ? 'Cyber Snake'
                      : 'Connect 4'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {language === 'bn' ? room.nameBn : room.name}
                </h4>

                <div className="flex items-center gap-2 mt-2.5">
                  <img
                    src={room.hostAvatar}
                    alt={room.hostName}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Host: <strong>{room.hostName}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700">
                <span className="text-xs text-slate-500">
                  👥 {room.playersCount}/{room.maxPlayers} Players
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenLobby(room)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'bn' ? 'রুমে যোগ দিন' : 'Join Lobby'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INTERACTIVE GAME LOBBY MODAL */}
      {activeLobbyRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col lg:flex-row max-h-[92vh]">
            {/* Left / Main Game Arena */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
              {/* Top Lobby Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded">
                      #{activeLobbyRoom.id}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {language === 'bn' ? activeLobbyRoom.nameBn : activeLobbyRoom.name}
                    </h3>
                  </div>
                </div>

                {/* Switch Game, Opponent Mode & Sound inside Lobby */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={activeLobbyRoom.game}
                    onChange={(e) => {
                      const nextGame = e.target.value as MiniGameType;
                      setActiveLobbyRoom({
                        ...activeLobbyRoom,
                        game: nextGame,
                      });
                      if (nextGame === 'snake') {
                        resetSnake();
                      }
                    }}
                    className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border-0 cursor-pointer"
                  >
                    <option value="tictactoe">❌⭕ Tic-Tac-Toe</option>
                    <option value="chess">♟️ Royal Chess (দাবা)</option>
                    <option value="connect4">🔴🟡 Connect 4</option>\n                    <option value="memory">🧠 Cyber Memory Match</option>
                    <option value="snake">🐍⚡ Cyber Snake</option>
                  </select>

                  <select
                    value={opponentMode}
                    onChange={(e) => setOpponentMode(e.target.value as 'ai' | 'pass_and_play')}
                    className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border-0 cursor-pointer"
                  >
                    <option value="ai">
                      🤖 {language === 'bn' ? 'বনাম স্মার্ট এআই' : 'vs Smart AI'}
                    </option>
                    <option value="pass_and_play">
                      👥 {language === 'bn' ? '২ প্লেয়ার (লোকাল)' : '2-Player Pass & Play'}
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Toggle Game Sound"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveLobbyRoom(null)}
                    className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* GAME BOARD AREA */}
              <div className="my-4 flex flex-col items-center justify-center">
                {activeLobbyRoom.game === 'tictactoe' ? (
                  /* TIC-TAC-TOE ARENA */
                  <div className="w-full max-w-xs flex flex-col items-center">
                    <div className="w-full grid grid-cols-2 gap-3 mb-4">
                      <div
                        className={`p-2.5 rounded-xl border text-center ${
                          tttTurn === 'X'
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <p className="text-xs font-bold text-blue-600">
                          ❌ {currentUser.name.split(' ')[0]} (X)
                        </p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">
                          {tttScore.X}
                        </p>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border text-center ${
                          tttTurn === 'O'
                            ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <p className="text-xs font-bold text-rose-500">
                          ⭕ {activeLobbyRoom.hostName.split(' ')[0]} (O)
                        </p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">
                          {tttScore.O}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 w-64 h-64 bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl shadow-inner">
                      {tttBoard.map((cell, i) => {
                        const isWinningSquare = (tttResult?.line as number[] | undefined)?.includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleTttClick(i)}
                            className={`rounded-xl text-3xl font-black flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                              isWinningSquare
                                ? 'bg-emerald-500 text-white scale-105'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/90'
                            } ${cell === 'X' ? 'text-blue-600' : 'text-rose-500'}`}
                          >
                            {cell}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {tttResult
                          ? tttResult.winner === 'DRAW'
                            ? language === 'bn'
                              ? 'ম্যাচ ড্র হয়েছে! 🤝'
                              : "It's a Draw! 🤝"
                            : language === 'bn'
                            ? `বিজয়ী: ${tttResult.winner}! 🏆`
                            : `Winner: Player ${tttResult.winner}! 🏆`
                          : language === 'bn'
                          ? `এখন চাল: ${tttTurn}`
                          : `Current Turn: ${tttTurn}`}
                      </span>

                      <button
                        type="button"
                        onClick={resetTtt}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'নতুন গেম' : 'Rematch'}</span>
                      </button>
                    </div>
                  </div>
                ) : activeLobbyRoom.game === 'chess' ? (
                  /* RULE-ACCURATE CHESS ARENA WITH VALID MOVE INDICATORS */
                  <div className="flex flex-col items-center w-full max-w-md">
                    {/* Top Game Controls & Turn Status */}
                    <div className="flex items-center justify-between w-full mb-2 text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {chessWinner
                          ? language === 'bn'
                            ? `🏆 কিস্তিমাত! ${chessWinner === 'white' ? 'সাদা (আপনি)' : 'কালো'} জিতেছেন!`
                            : `🏆 Checkmate! ${chessWinner === 'white' ? 'White' : 'Black'} wins!`
                          : chessTurn === 'white'
                          ? language === 'bn'
                            ? '⚪ সাদা ঘুঁটির চাল (সবুজ ঘরে চাল দিন)'
                            : '⚪ White to move (Select piece → click green dot)'
                          : language === 'bn'
                          ? '⚫ কালো ঘুঁটি চিন্তা করছে...'
                          : '⚫ Black is thinking...'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                          {Number(chessEvaluation) > 0 ? `+${chessEvaluation}` : chessEvaluation}
                        </span>
                        <button
                          type="button"
                          onClick={resetChess}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Grandmaster Assistant Toolbar */}
                    {opponentMode === 'ai' && (
                      <div className="w-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-2.5 mb-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>{language === 'bn' ? 'বন্ধন এআই সহকারী' : 'Bandhan Chess AI'}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* AI Difficulty Selector */}
                            <select
                              value={aiDifficulty}
                              onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'master')}
                              className="text-[11px] font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2 py-0.5 text-indigo-900 dark:text-indigo-200 cursor-pointer"
                            >
                              <option value="easy">{language === 'bn' ? '🟢 সহজ (Easy)' : '🟢 Easy'}</option>
                              <option value="medium">{language === 'bn' ? '🟡 ট্যাকটিকাল' : '🟡 Medium'}</option>
                              <option value="master">{language === 'bn' ? '🔴 মাস্টার এআই' : '🔴 Grandmaster'}</option>
                            </select>

                            {/* Ask AI Hint Button */}
                            <button
                              type="button"
                              onClick={handleAskAiHint}
                              disabled={chessTurn !== 'white' || Boolean(chessWinner)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{language === 'bn' ? 'চাল পরামর্শ' : 'AI Hint'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Real-time AI Tactical Commentary */}
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 italic flex items-center gap-1 leading-snug">
                          <span className="shrink-0 text-xs">💬</span>
                          <span>{aiCommentary}</span>
                        </p>
                      </div>
                    )}

                    {/* Captured pieces */}
                    <div className="flex items-center justify-between w-full max-w-sm text-sm mb-1.5 min-h-[22px] px-1">
                      <div className="flex flex-wrap gap-0.5" title="Captured by White">
                        {capturedByWhite.join(' ')}
                      </div>
                      <div className="flex flex-wrap gap-0.5" title="Captured by Black">
                        {capturedByBlack.join(' ')}
                      </div>
                    </div>

                    {/* 8x8 Chess Board */}
                    <div className="grid grid-cols-8 border-4 border-slate-800 rounded-xl overflow-hidden shadow-xl">
                      {chessBoard.map((row, rIdx) =>
                        row.map((piece, cIdx) => {
                          const isDark = (rIdx + cIdx) % 2 === 1;
                          const isSelected =
                            selectedSquare?.[0] === rIdx && selectedSquare?.[1] === cIdx;
                          const isValidTarget = validChessMoves.some(
                            ([vr, vc]) => vr === rIdx && vc === cIdx,
                          );
                          const isLastMoveSquare =
                            (lastMove?.from[0] === rIdx && lastMove?.from[1] === cIdx) ||
                            (lastMove?.to[0] === rIdx && lastMove?.to[1] === cIdx);
                          const isHintSquare =
                            (aiHintMove?.from[0] === rIdx && aiHintMove?.from[1] === cIdx) ||
                            (aiHintMove?.to[0] === rIdx && aiHintMove?.to[1] === cIdx);

                          return (
                            <button
                              key={`${rIdx}-${cIdx}`}
                              type="button"
                              onClick={() => handleChessSquareClick(rIdx, cIdx)}
                              className={`relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-2xl sm:text-3xl select-none cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-yellow-400 dark:bg-yellow-500'
                                  : isHintSquare
                                  ? 'bg-purple-400 ring-2 ring-purple-600 animate-pulse'
                                  : isLastMoveSquare
                                  ? isDark
                                    ? 'bg-amber-600'
                                    : 'bg-amber-200'
                                  : isDark
                                  ? 'bg-amber-700'
                                  : 'bg-amber-100'
                              }`}
                            >
                              {/* Valid Move Indicator Dot or Capture Ring */}
                              {isValidTarget && !piece && (
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/85 shadow-sm ring-2 ring-white/60 pointer-events-none" />
                              )}
                              {isValidTarget && piece && (
                                <span className="absolute inset-0.5 rounded-lg border-3 border-red-500 pointer-events-none animate-pulse" />
                              )}
                              <span
                                className={`relative z-10 leading-none ${
                                  isWhite(piece)
                                    ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                                    : 'text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
                                }`}
                              >
                                {piece}
                              </span>
                            </button>
                          );
                        }),
                      )}
                    </div>
                  </div>
                ) : activeLobbyRoom.game === 'connect4' ? (
                  /* CONNECT 4 ARENA */
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-between w-full max-w-sm mb-3 text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {c4Winner
                          ? c4Winner === 'DRAW'
                            ? language === 'bn'
                              ? 'ম্যাচ ড্র হয়েছে! 🤝'
                              : "It's a Draw! 🤝"
                            : language === 'bn'
                            ? `🏆 বিজয়ী: ${c4Winner === 'R' ? 'লাল (আপনি)' : 'হলুদ'}!`
                            : `🏆 Winner: ${c4Winner === 'R' ? 'Red (You)' : 'Yellow'}!`
                          : c4Turn === 'R'
                          ? language === 'bn'
                            ? '🔴 আপনার চাল (যেকোনো কলামে ক্লিক করুন)'
                            : '🔴 Your Turn (Click any column to drop disc)'
                          : language === 'bn'
                          ? '🟡 প্রতিপক্ষের চাল...'
                          : '🟡 Opponent thinking...'}
                      </span>
                      <button
                        type="button"
                        onClick={resetC4}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div className="bg-blue-700 p-3 rounded-2xl shadow-xl border-4 border-blue-800 grid grid-cols-7 gap-2">
                      {c4Board.map((row, rIdx) =>
                        row.map((cell, cIdx) => (
                          <button
                            key={`${rIdx}-${cIdx}`}
                            type="button"
                            onClick={() => handleDropC4Column(cIdx)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all cursor-pointer shadow-inner ${
                              cell === 'R'
                                ? 'bg-red-500 ring-2 ring-red-300'
                                : cell === 'Y'
                                ? 'bg-amber-400 ring-2 ring-amber-200'
                                : 'bg-slate-900/80 hover:bg-slate-800'
                            }`}
                          />
                        )),
                      )}
                    </div>
                  </div>
                ) : activeLobbyRoom.game === 'snake' ? (
                  /* CYBER SNAKE ARCADE ARENA (MOBILE D-PAD + KEYBOARD) */
                  <div className="flex flex-col items-center w-full max-w-sm">
                    <div className="flex items-center justify-between w-full mb-2 text-xs font-bold">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          🍎 Score: {snakeScore}
                        </span>
                        <span className="text-amber-500">🏆 Best: {snakeHighScore}</span>
                      </div>
                      <button
                        type="button"
                        onClick={resetSnake}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{snakeRunning ? 'Restart' : 'Start Game'}</span>
                      </button>
                    </div>

                    <div
                      className="relative bg-slate-950 p-1.5 rounded-2xl border-2 border-emerald-500/50 shadow-xl grid"
                      style={{
                        gridTemplateColumns: `repeat(${SNAKE_GRID}, minmax(0, 1fr))`,
                        width: '270px',
                        height: '270px',
                      }}
                    >
                      {Array.from({ length: SNAKE_GRID * SNAKE_GRID }).map((_, idx) => {
                        const r = Math.floor(idx / SNAKE_GRID);
                        const c = idx % SNAKE_GRID;
                        const isHead = snakeBody[0][0] === r && snakeBody[0][1] === c;
                        const isBody =
                          !isHead && snakeBody.some(([br, bc]) => br === r && bc === c);
                        const isFood = snakeFood[0] === r && snakeFood[1] === c;

                        return (
                          <div
                            key={idx}
                            className={`rounded-xs ${
                              isHead
                                ? 'bg-emerald-400 shadow-xs shadow-emerald-300'
                                : isBody
                                ? 'bg-emerald-600/85'
                                : isFood
                                ? 'bg-rose-500 rounded-full animate-pulse'
                                : 'bg-slate-900/50'
                            }`}
                          />
                        );
                      })}

                      {snakeGameOver && (
                        <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center text-white p-4 text-center">
                          <p className="text-lg font-black text-rose-400">GAME OVER!</p>
                          <p className="text-xs text-slate-300 mt-1">
                            Score: {snakeScore} • Best: {snakeHighScore}
                          </p>
                          <button
                            type="button"
                            onClick={resetSnake}
                            className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs cursor-pointer"
                          >
                            {language === 'bn' ? 'আবার খেলুন' : 'Play Again'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Responsive Touch D-Pad for Mobile & Tablet */}
                    <div className="mt-3 grid grid-cols-3 gap-2 w-36">
                      <div />
                      <button
                        type="button"
                        onClick={() => {
                          if (snakeDir[0] !== 1) setSnakeDir([-1, 0]);
                          setSnakeRunning(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 active:bg-emerald-500 active:text-white flex items-center justify-center cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <div />
                      <button
                        type="button"
                        onClick={() => {
                          if (snakeDir[1] !== 1) setSnakeDir([0, -1]);
                          setSnakeRunning(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 active:bg-emerald-500 active:text-white flex items-center justify-center cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (snakeDir[0] !== -1) setSnakeDir([1, 0]);
                          setSnakeRunning(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 active:bg-emerald-500 active:text-white flex items-center justify-center cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (snakeDir[1] !== -1) setSnakeDir([0, 1]);
                          setSnakeRunning(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 active:bg-emerald-500 active:text-white flex items-center justify-center cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : activeLobbyRoom.game === 'ludo' ? (
                  /* GAME 5: LUDO DICE DUEL */
                  <div className="flex flex-col items-center w-full max-w-md space-y-4">
                    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-fuchsia-600 dark:text-fuchsia-400">
                          🎲 {currentUser.name.split(' ')[0]}: {ludoPlayerPos} / 30
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          🤖 AI Opponent: {ludoAiPos} / 30
                        </span>
                      </div>

                      {/* Progress Track for Player */}
                      <div className="space-y-1">
                        <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, (ludoPlayerPos / 30) * 100)}%` }}
                          />
                        </div>
                        <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, (ludoAiPos / 30) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Dice Display */}
                      <div className="grid grid-cols-2 gap-3 py-3 text-center">
                        <div className="p-3 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-800">
                          <p className="text-[11px] font-bold text-slate-500">
                            {language === 'bn' ? 'আপনার ছক্কা' : 'Your Roll'}
                          </p>
                          <p className="text-3xl font-black text-fuchsia-600 mt-1">
                            {ludoLastDice.player ? `🎲 ${ludoLastDice.player}` : '🎲 -'}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                          <p className="text-[11px] font-bold text-slate-500">
                            {language === 'bn' ? 'প্রতিপক্ষের ছক্কা' : 'Opponent Roll'}
                          </p>
                          <p className="text-3xl font-black text-indigo-600 mt-1">
                            {ludoLastDice.ai ? `🎲 ${ludoLastDice.ai}` : '🎲 -'}
                          </p>
                        </div>
                      </div>

                      {ludoWinner ? (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-center space-y-2">
                          <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                            {ludoWinner === 'player'
                              ? language === 'bn'
                                ? '🏆 অভিনন্দন! আপনি লুডু ডাইস চ্যালেঞ্জ জিতেছেন (+১০০ কয়েন)!'
                                : '🏆 You won the Ludo Dice Duel (+100 Coins)!'
                              : language === 'bn'
                              ? '🤖 প্রতিপক্ষ জিতেছে! আবার চেষ্টা করুন।'
                              : '🤖 Opponent reached 30 first! Try again.'}
                          </p>
                          <button
                            type="button"
                            onClick={resetLudo}
                            className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white text-xs font-bold cursor-pointer"
                          >
                            {language === 'bn' ? 'আবার খেলুন' : 'Play Again'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={ludoRolling}
                          onClick={rollLudoDice}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md cursor-pointer disabled:opacity-50"
                        >
                          {ludoRolling
                            ? language === 'bn'
                              ? '🎲 ছক্কা ঘুরছে...'
                              : '🎲 Rolling Dice...'
                            : language === 'bn'
                            ? '🎲 ছক্কা চালুন (Roll Dice)'
                            : '🎲 Roll Ludo Dice'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : activeLobbyRoom.game === 'memory' ? (
                  /* MEMORY MATCH ARENA */
                  <div className="flex flex-col items-center max-w-lg mx-auto w-full space-y-4">
                    {/* Score Bar */}
                    <div className="w-full bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-cyan-500" />
                        <span className="text-slate-800 dark:text-slate-200">
                          {currentUser.name.split(' ')[0]}: {memoryScore.player} Pairs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          {memoryAiThinking
                            ? language === 'bn'
                              ? '🤖 এআই ভাবছে...'
                              : '🤖 AI thinking...'
                            : memoryTurn === 'player'
                            ? language === 'bn'
                              ? '👉 আপনার চাল'
                              : '👉 Your Turn'
                            : language === 'bn'
                            ? '🤖 এআই চাল'
                            : "🤖 AI's Turn"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 dark:text-slate-200">
                          AI: {memoryScore.ai} Pairs
                        </span>
                        <span className="w-3 h-3 rounded-full bg-indigo-500" />
                      </div>
                    </div>

                    {/* 4x4 Grid of Cards */}
                    <div className="grid grid-cols-4 gap-3 w-full max-w-md p-3 bg-slate-100 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800">
                      {memoryCards.map((card, idx) => {
                        const isRevealed = card.isFlipped || card.isMatched;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            disabled={card.isMatched || memoryAiThinking}
                            onClick={() => handleMemoryCardClick(idx)}
                            className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-300 transform select-none shadow-sm ${
                              card.isMatched
                                ? card.matchedBy === 'player'
                                  ? 'bg-cyan-500/20 text-cyan-500 border-2 border-cyan-500 scale-95'
                                  : 'bg-indigo-500/20 text-indigo-400 border-2 border-indigo-500 scale-95'
                                : isRevealed
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-cyan-400 rotate-0 shadow-md scale-100'
                                : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-transparent hover:brightness-110 hover:scale-105 border border-indigo-400/40 shadow-xs'
                            }`}
                          >
                            {isRevealed ? card.symbol : '❓'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Winner or Reset */}
                    {memoryWinner && (
                      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-center w-full max-w-md animate-bounce">
                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                          {memoryWinner === 'player'
                            ? language === 'bn'
                              ? '🎉 অভিনন্দন! আপনি এআই কে মেমোরিতে হারিয়েছেন!'
                              : '🎉 Victory! You outsmarted the AI!'
                            : memoryWinner === 'ai'
                            ? language === 'bn'
                              ? '🤖 এআই দুর্দান্ত মেমোরিতে জিতে গিয়েছে!'
                              : '🤖 AI won with superior memory!'
                            : language === 'bn'
                            ? '🤝 ড্র হয়েছে!'
                            : "🤝 It's a Tie!"}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={resetMemoryGame}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'নতুন করে শুরু করুন' : 'Restart Memory Game'}</span>
                    </button>
                  </div>
                ) : (
                  /* CONNECT 4 FALLBACK */
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={resetC4}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs"
                    >
                      Start Connect 4
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Players Strip */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>
                    {activeLobbyRoom.game === 'chess'
                      ? language === 'bn'
                        ? 'টিপস: ঘুঁটিতে ক্লিক করলে সবুজ বিন্দু দিয়ে বৈধ চাল দেখাবে'
                        : 'Tip: Click any white piece to see highlighted green legal moves'
                      : language === 'bn'
                      ? 'টিপস: যেকোনো ঘরে ক্লিক করে আপনার চাল দিন'
                      : 'Tip: Click any tile to make your move'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLobbyRoom(null)}
                  className="text-red-500 font-bold hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'রুম ত্যাগ করুন' : 'Leave Playroom'}
                </button>
              </div>
            </div>

            {/* Right Sidebar: Live Playroom Chat */}
            <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col h-60 lg:h-auto">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{language === 'bn' ? 'প্লে-রুম লাইভ চ্যাট' : 'Playroom Live Chat'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {lobbyChat.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800"
                  >
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                      {m.sender}:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{m.text}</span>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendLobbyChat}
                className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder={language === 'bn' ? 'বার্তা লিখুন...' : 'Say GG...'}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
