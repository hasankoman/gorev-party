"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

const GRID_SIZE = 4;
const CELL_SIZE = 6;
const CELL_GAP = 0.5;

type Tile = {
  value: number;
  id: string;
  mergedFrom?: Tile[];
  justMerged?: boolean;
  isNew?: boolean;
  row: number;
  col: number;
};

export default function Game2048() {
  const [board, setBoard] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeGame();
    const storedBestScore = localStorage.getItem("bestScore");
    if (storedBestScore) setBestScore(Number.parseInt(storedBestScore));

    setShowHelp(true);

    const hasSeenHelp = localStorage.getItem("hasSeenHelp");
    if (hasSeenHelp) {
      setShowHelp(false);
    }

    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("bestScore", score.toString());
    }
  }, [score, bestScore]);

  const initializeGame = () => {
    const newBoard: Tile[] = [];
    addNewTile(newBoard);
    addNewTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
    setIsGameOver(false);
  };

  const addNewTile = (board: Tile[]) => {
    const emptyTiles = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!board.some((tile) => tile.row === row && tile.col === col)) {
          emptyTiles.push({ row, col });
        }
      }
    }
    if (emptyTiles.length > 0) {
      const { row, col } =
        emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
      board.push({
        value: Math.random() < 0.9 ? 2 : 4,
        id: `${row}-${col}-${Date.now()}`,
        row,
        col,
        isNew: true,
      });
    }
  };

  const move = (direction: "up" | "down" | "left" | "right") => {
    if (isGameOver) return;

    let newBoard = board.map((tile) => ({
      ...tile,
      justMerged: false,
      isNew: false,
    }));
    let changed = false;
    let newScore = score;

    const sortedTiles = [...newBoard].sort((a, b) => {
      if (direction === "up" || direction === "down") {
        return direction === "up" ? a.row - b.row : b.row - a.row;
      } else {
        return direction === "left" ? a.col - b.col : b.col - a.col;
      }
    });

    for (const tile of sortedTiles) {
      const { row, col } = tile;
      let newRow = row;
      let newCol = col;

      while (true) {
        newRow += direction === "up" ? -1 : direction === "down" ? 1 : 0;
        newCol += direction === "left" ? -1 : direction === "right" ? 1 : 0;

        if (
          newRow < 0 ||
          newRow >= GRID_SIZE ||
          newCol < 0 ||
          newCol >= GRID_SIZE
        ) {
          newRow -= direction === "up" ? -1 : direction === "down" ? 1 : 0;
          newCol -= direction === "left" ? -1 : direction === "right" ? 1 : 0;
          break;
        }

        const targetTile = newBoard.find(
          (t) => t.row === newRow && t.col === newCol
        );
        if (targetTile) {
          if (targetTile.value === tile.value && !targetTile.justMerged) {
            newBoard = newBoard.filter((t) => t !== targetTile && t !== tile);
            newBoard.push({
              value: tile.value * 2,
              id: tile.id,
              row: newRow,
              col: newCol,
              justMerged: true,
              isNew: false,
            });
            newScore += tile.value * 2;
            changed = true;
          } else {
            newRow -= direction === "up" ? -1 : direction === "down" ? 1 : 0;
            newCol -= direction === "left" ? -1 : direction === "right" ? 1 : 0;
          }
          break;
        }
      }

      if (newRow !== row || newCol !== col) {
        changed = true;
        tile.row = newRow;
        tile.col = newCol;
      }
    }

    if (changed) {
      addNewTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      if (isGameOverState(newBoard)) {
        setIsGameOver(true);
      }
    } else if (isGameOverState(newBoard)) {
      setIsGameOver(true);
    }
  };

  const isGameOverState = (board: Tile[]) => {
    if (board.length < GRID_SIZE * GRID_SIZE) return false;

    for (const tile of board) {
      const { row, col, value } = tile;
      if (
        (row > 0 &&
          board.some(
            (t) => t.row === row - 1 && t.col === col && t.value === value
          )) ||
        (row < GRID_SIZE - 1 &&
          board.some(
            (t) => t.row === row + 1 && t.col === col && t.value === value
          )) ||
        (col > 0 &&
          board.some(
            (t) => t.row === row && t.col === col - 1 && t.value === value
          )) ||
        (col < GRID_SIZE - 1 &&
          board.some(
            (t) => t.row === row && t.col === col + 1 && t.value === value
          ))
      ) {
        return false;
      }
    }

    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowUp":
        move("up");
        break;
      case "ArrowDown":
        move("down");
        break;
      case "ArrowLeft":
        move("left");
        break;
      case "ArrowRight":
        move("right");
        break;
    }
  };

  const cellColor = (value: number) => {
    switch (value) {
      case 2:
        return "bg-gradient-to-br from-[#eee6da] to-[#eee4da] text-[#776e65]";
      case 4:
        return "bg-gradient-to-br from-[#ede2c8] to-[#ede0c8] text-[#776e65]";
      case 8:
        return "bg-gradient-to-br from-[#f3b27a] to-[#f2b179] text-white";
      case 16:
        return "bg-gradient-to-br from-[#f69764] to-[#f59563] text-white";
      case 32:
        return "bg-gradient-to-br from-[#f77e60] to-[#f67c5f] text-white";
      case 64:
        return "bg-gradient-to-br from-[#f75f3c] to-[#f65e3b] text-white";
      case 128:
        return "bg-gradient-to-br from-[#edd073] to-[#edcf72] text-white";
      case 256:
        return "bg-gradient-to-br from-[#edcc62] to-[#edcc61] text-white";
      case 512:
        return "bg-gradient-to-br from-[#edc950] to-[#edc850] text-white";
      case 1024:
        return "bg-gradient-to-br from-[#edc53f] to-[#edc53f] text-white";
      case 2048:
        return "bg-gradient-to-br from-[#edc22e] to-[#edc22e] text-white";
      default:
        return "bg-gradient-to-br from-[#edc22e] to-[#edc22e] text-white";
    }
  };

  const tileSize = (value: number) => {
    if (value >= 1024) return "text-xl sm:text-2xl";
    if (value >= 100) return "text-2xl sm:text-3xl";
    return "text-3xl sm:text-4xl";
  };

  const tileVariants = {
    initial: { scale: 0 },
    enter: {
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    merged: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.4, times: [0, 0.5, 1] },
    },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
  };

  const restoreFocus = () => {
    if (gameContainerRef.current) {
      setTimeout(() => {
        gameContainerRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#faf8ef] to-[#f5f0e5] text-[#776e65]"
      ref={gameContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="2048 Game Board"
    >
      <div className="w-full max-w-md p-4 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6 w-full">
          <h1 className="text-6xl font-bold mb-4 drop-shadow-sm">2048</h1>
          <div className="flex gap-4 justify-center">
            <div className="bg-gradient-to-br from-[#bbada0] to-[#a8998d] p-2 h-16 w-24 rounded-lg text-white flex flex-col items-center justify-center shadow-md">
              <div className="text-xs font-medium">SCORE</div>
              <div className="font-bold text-xl">{score}</div>
            </div>
            <div className="bg-gradient-to-br from-[#bbada0] to-[#a8998d] h-16 w-24 rounded-lg p-2 text-white flex flex-col items-center justify-center shadow-md">
              <div className="text-xs font-medium">BEST</div>
              <div className="font-bold text-xl">{bestScore}</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#bbada0] to-[#a89a8e] p-3 rounded-xl w-fit shadow-xl mb-5">
          <div
            className="relative"
            style={{
              width: `${CELL_SIZE * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1)}rem`,
              height: `${
                CELL_SIZE * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1)
              }rem`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => (
              <div
                key={`cell-${index}`}
                className="absolute bg-[#cdc1b4]/60 rounded-md shadow-inner"
                style={{
                  width: `${CELL_SIZE}rem`,
                  height: `${CELL_SIZE}rem`,
                  left: `${(index % GRID_SIZE) * (CELL_SIZE + CELL_GAP)}rem`,
                  top: `${
                    Math.floor(index / GRID_SIZE) * (CELL_SIZE + CELL_GAP)
                  }rem`,
                }}
              />
            ))}
            <AnimatePresence>
              {board.map((tile) => (
                <motion.div
                  key={tile.id}
                  initial={
                    tile.isNew
                      ? {
                          scale: 0,
                          x: tile.col * (CELL_SIZE + CELL_GAP) + "rem",
                          y: tile.row * (CELL_SIZE + CELL_GAP) + "rem",
                        }
                      : { scale: 0 }
                  }
                  animate={{
                    scale: 1,
                    x: tile.col * (CELL_SIZE + CELL_GAP) + "rem",
                    y: tile.row * (CELL_SIZE + CELL_GAP) + "rem",
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={
                    tile.isNew
                      ? {
                          duration: 0.2,
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }
                      : {
                          x: {
                            duration: 0.15,
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          },
                          y: {
                            duration: 0.15,
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          },
                        }
                  }
                  className={`absolute rounded-md flex items-center justify-center font-bold shadow-lg ${cellColor(
                    tile.value
                  )}`}
                  style={{
                    width: `${CELL_SIZE}rem`,
                    height: `${CELL_SIZE}rem`,
                  }}
                >
                  <motion.div
                    variants={tileVariants}
                    animate={tile.justMerged ? "merged" : "enter"}
                    className={`w-full h-full flex items-center justify-center ${tileSize(
                      tile.value
                    )}`}
                  >
                    {tile.value}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-2 flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <motion.button
              onClick={initializeGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-gradient-to-br from-[#8f7a66] to-[#7d6a56] text-white hover:bg-[#9f8a76] font-bold rounded-md shadow-md transition-all w-32 cursor-pointer"
            >
              New Game
            </motion.button>
            <motion.button
              onClick={() => setShowHelp(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-gradient-to-br from-[#8f7a66] to-[#7d6a56] hover:bg-[#9f8a76] text-white rounded-md flex items-center justify-center font-bold text-lg shadow-md transition-all cursor-pointer"
              aria-label="Help"
            >
              ?
            </motion.button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Use <span className="font-bold">arrow keys</span> to slide tiles.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
            onClick={() => {
              initializeGame();
              restoreFocus();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-gradient-to-br from-[#bbada0] to-[#a09080] p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-white/10 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-12 -right-12 w-24 h-24 bg-[#edc22e] rounded-full blur-xl z-0"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#f67c5f] rounded-full blur-xl z-0"
              />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <motion.h2
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-4xl font-bold text-white drop-shadow-md"
                  >
                    Game Over
                  </motion.h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setIsGameOver(false);
                      restoreFocus();
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
                  >
                    ✕
                  </motion.button>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-white mb-6 space-y-5 shadow-inner"
                >
                  <div className="flex items-start gap-4">
                    <div className="min-w-12 min-h-12 rounded-full bg-gradient-to-br from-[#f67c5f] to-[#e56e51] flex items-center justify-center text-white font-bold text-xl shadow-md">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">Your Score</h3>
                      <p className="text-white/90 text-3xl font-bold">
                        {score}
                        {score === bestScore && score > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="ml-2 inline-flex bg-gradient-to-r from-[#edc22e] to-[#edcc61] text-[#776e65] px-2 py-0.5 rounded-md text-sm font-bold"
                          >
                            New Best!
                          </motion.span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="min-w-12 min-h-12 rounded-full bg-gradient-to-br from-[#f2b179] to-[#f59563] flex items-center justify-center text-white font-bold text-xl shadow-md">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">Best Tile</h3>
                      <p className="text-white/90 text-3xl font-bold">
                        <span className="font-mono bg-gradient-to-r from-[#edc22e] to-[#edcc61] text-[#776e65] px-2 py-0.5 rounded-md">
                          {Math.max(...board.map((tile) => tile.value))}
                        </span>
                      </p>
                    </div>
                  </div>

                  {score === bestScore && score > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="min-w-12 min-h-12 rounded-full bg-gradient-to-br from-[#edcf72] to-[#edcc61] flex items-center justify-center text-white font-bold text-xl shadow-md">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-1">Achievement</h3>
                        <p className="text-white/90">
                          Congratulations! You've set a new personal record!
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-[#cdc1b4]/30 to-[#bbada0]/30 backdrop-blur-sm p-4 rounded-xl mb-6 shadow-inner"
                >
                  <h3 className="font-bold text-white text-center mb-3">
                    Keep Practicing
                  </h3>
                  <p className="text-white/80 text-center text-sm mb-2">
                    Try to reach higher tiles by keeping large values in the
                    corners!
                  </p>

                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [0, 5, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                    className="flex justify-center"
                  >
                    <svg
                      className="w-8 h-8 text-white/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  </motion.div>
                </motion.div>

                <motion.div className="flex gap-3 justify-center">
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      initializeGame();
                      restoreFocus();
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-[#8f7a66] to-[#7d6a56] text-white font-bold rounded-full shadow-lg transition-all cursor-pointer"
                  >
                    Play Again
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
            onClick={() => {
              setShowHelp(false);
              localStorage.setItem("hasSeenHelp", "true");
              restoreFocus();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-gradient-to-br from-[#bbada0] to-[#a09080] p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-white/10 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-12 -right-12 w-24 h-24 bg-[#edc22e] rounded-full blur-xl z-0"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#f67c5f] rounded-full blur-xl z-0"
              />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <motion.h2
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-4xl font-bold text-white drop-shadow-md"
                  >
                    How to Play
                  </motion.h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowHelp(false);
                      localStorage.setItem("hasSeenHelp", "true");
                      restoreFocus();
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
                  >
                    ✕
                  </motion.button>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-white mb-6 space-y-5 shadow-inner"
                >
                  <div className="flex items-start gap-4">
                    <div className="min-w-12 min-h-12 rounded-full bg-gradient-to-br from-[#f67c5f] to-[#e56e51] flex items-center justify-center text-white font-bold text-xl shadow-md">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">Goal</h3>
                      <p className="text-white/90">
                        Combine tiles to create the{" "}
                        <span className="font-mono bg-gradient-to-r from-[#edc22e] to-[#edcc61] text-[#776e65] px-2 py-0.5 rounded-md font-bold">
                          2048
                        </span>{" "}
                        tile!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="min-w-12 min-h-12 rounded-full bg-gradient-to-br from-[#f2b179] to-[#f59563] flex items-center justify-center text-white font-bold text-xl shadow-md">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">How to Move</h3>
                      <p className="text-white/90">
                        Use arrow keys{" "}
                        <span className="inline-flex gap-1 mx-1">
                          <motion.span
                            whileHover={{ y: -2 }}
                            className="w-6 h-6 bg-white/20 rounded flex items-center justify-center"
                          >
                            ←
                          </motion.span>
                          <motion.span
                            whileHover={{ y: -2 }}
                            className="w-6 h-6 bg-white/20 rounded flex items-center justify-center"
                          >
                            ↑
                          </motion.span>
                          <motion.span
                            whileHover={{ y: -2 }}
                            className="w-6 h-6 bg-white/20 rounded flex items-center justify-center"
                          >
                            →
                          </motion.span>
                          <motion.span
                            whileHover={{ y: -2 }}
                            className="w-6 h-6 bg-white/20 rounded flex items-center justify-center"
                          >
                            ↓
                          </motion.span>
                        </span>{" "}
                        to slide tiles.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="min-w-12 min-h-12 rounded-full bg-gradient-to-br from-[#edcf72] to-[#edcc61] flex items-center justify-center text-white font-bold text-xl shadow-md">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">Strategy</h3>
                      <p className="text-white/90">
                        Keep high-value tiles in corners and maintain clear
                        paths for merging.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-[#cdc1b4]/30 to-[#bbada0]/30 backdrop-blur-sm p-4 rounded-xl mb-6 shadow-inner"
                >
                  <h3 className="font-bold text-white text-center mb-3">
                    Example
                  </h3>
                  <div className="grid grid-cols-2 gap-3 max-w-[200px] mx-auto">
                    <motion.div className="bg-gradient-to-br from-[#eee6da] to-[#eee4da] text-[#776e65] p-3 rounded-md text-center font-bold shadow-md">
                      2
                    </motion.div>
                    <motion.div className="bg-gradient-to-br from-[#eee6da] to-[#eee4da] text-[#776e65] p-3 rounded-md text-center font-bold shadow-md">
                      2
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="col-span-2 flex items-center justify-center text-white"
                    >
                      <svg
                        className="w-6 h-6 animate-bounce"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className="bg-gradient-to-br from-[#ede2c8] to-[#ede0c8] text-[#776e65] p-3 rounded-md text-center font-bold shadow-md col-span-2"
                    >
                      4
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div className="flex justify-center">
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowHelp(false);
                      localStorage.setItem("hasSeenHelp", "true");
                      restoreFocus();
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-[#8f7a66] to-[#7d6a56] text-white font-bold rounded-full shadow-lg transition-all cursor-pointer"
                  >
                    Got it!
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
