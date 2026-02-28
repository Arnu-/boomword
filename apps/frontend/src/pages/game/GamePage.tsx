import { useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Input, Button, message, Modal } from 'antd';
import { PauseOutlined, CloseOutlined } from '@ant-design/icons';
import { useGameStore, GameMode } from '@/stores/gameStore';
import { gameService } from '@/services/gameService';
import classNames from 'classnames';

const GamePage = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    status,
    mode,
    gameRecordId,
    currentWord,
    currentIndex,
    totalWords,
    score,
    correctCount,
    wrongCount,
    elapsedTime,
    wordStartTime,
    userInput,
    isInputShaking,
    startGame,
    setNextWord,
    setUserInput,
    shakeInput,
    updateElapsedTime,
    pauseGame,
    resumeGame,
    resetGame,
    endGame,
  } = useGameStore();

  // 初始化游戏
  useEffect(() => {
    const initGame = async () => {
      if (!sectionId) return;

      try {
        const gameMode = (searchParams.get('mode') as GameMode) || 'practice';
        const response = await gameService.startGame({
          sectionId,
          mode: gameMode,
        });

        startGame(
          response.gameRecordId,
          response.mode,
          response.totalWords,
          response.currentWord,
        );
      } catch (error) {
        message.error((error as Error).message);
        navigate(-1);
      }
    };

    initGame();

    return () => {
      resetGame();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sectionId]);

  // 计时器
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(updateElapsedTime, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // 聚焦输入框
  useEffect(() => {
    if (status === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status, currentWord]);

  // 提交答案
  const submitAnswer = useCallback(async () => {
    if (!gameRecordId || !currentWord || !userInput.trim()) return;

    const timeSpent = Date.now() - (wordStartTime || Date.now());

    try {
      const response = await gameService.submitAnswer({
        gameRecordId,
        wordId: currentWord.id,
        answer: userInput.trim(),
        timeSpent,
      });

      if (!response.isCorrect) {
        shakeInput();
      }

      setNextWord(response.nextWord, {
        isCorrect: response.isCorrect,
        score: response.wordScore,
      });

      // 游戏结束
      if (!response.hasNext) {
        const endResponse = await gameService.endGame({ gameRecordId });
        endGame();
        navigate(`/game/result/${gameRecordId}`, { replace: true });
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  }, [gameRecordId, currentWord, userInput, wordStartTime]);

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.trim()) {
      submitAnswer();
    }
  };

  // 退出确认
  const handleQuit = () => {
    Modal.confirm({
      title: '确定退出游戏？',
      content: '退出后当前进度将不会保存',
      okText: '确定退出',
      cancelText: '继续游戏',
      onOk: () => {
        resetGame();
        navigate(-1);
      },
    });
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'idle') {
    return (
      <div className="game-canvas flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="game-canvas">
      {/* 顶部状态栏 */}
      <div className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-gray-300">进度</span>
            <span className="ml-2 font-bold">
              {currentIndex + 1} / {totalWords}
            </span>
          </div>
          <div>
            <span className="text-gray-300">得分</span>
            <span className="ml-2 font-bold text-yellow-400">{score}</span>
          </div>
          <div>
            <span className="text-gray-300">正确</span>
            <span className="ml-2 font-bold text-green-400">{correctCount}</span>
          </div>
          <div>
            <span className="text-gray-300">错误</span>
            <span className="ml-2 font-bold text-red-400">{wrongCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xl">{formatTime(elapsedTime)}</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleQuit}
            className="text-white hover:text-red-400"
          />
        </div>
      </div>

      {/* 游戏主区域 */}
      <div className="flex flex-col items-center justify-center h-full pt-20 pb-40">
        {currentWord && (
          <>
            {/* 气泡 */}
            <div className="bubble w-64 h-64 animate-bubble-float mb-8">
              <div className="bubble-text text-2xl">
                <div>{currentWord.chinese}</div>
                {mode === 'practice' && currentWord.english && (
                  <div className="text-lg mt-2 opacity-70">
                    {currentWord.english}
                  </div>
                )}
              </div>
            </div>

            {/* 输入区域 */}
            <div className="w-80">
              <Input
                ref={inputRef as any}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入英文单词..."
                size="large"
                className={classNames(
                  'text-center text-xl',
                  { 'input-shake': isInputShaking },
                )}
                autoComplete="off"
                disabled={status !== 'playing'}
              />
              <Button
                type="primary"
                size="large"
                block
                className="mt-4"
                onClick={submitAnswer}
                disabled={!userInput.trim() || status !== 'playing'}
              >
                确认
              </Button>
            </div>
          </>
        )}
      </div>

      {/* 进度条 */}
      <div className="fixed bottom-0 left-0 right-0 h-2 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default GamePage;
