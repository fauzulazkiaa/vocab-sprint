import React, { useState, useMemo, useCallback } from 'react';
import { OxfordWord, VocabSprintStorage, QuizQuestion } from '../types';
import { speakWord } from '../services/speech';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Volume2, 
  Award, 
  ArrowRight,
  BrainCircuit,
  HelpCircle
} from 'lucide-react';

interface QuizViewProps {
  allWords: OxfordWord[];
  storage: VocabSprintStorage;
}

export const QuizView: React.FC<QuizViewProps> = ({
  allWords,
  storage,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ question: QuizQuestion; selected: string; isCorrect: boolean }[]>([]);

  const activeLevels = useMemo(() => new Set(storage.settings.levels), [storage.settings.levels]);
  const scopedWords = useMemo(() => {
    return allWords.filter(w => activeLevels.has(w.cefr));
  }, [allWords, activeLevels]);

  // Generate 10 randomized quiz questions
  const generateQuestions = useCallback((): QuizQuestion[] => {
    if (scopedWords.length < 4) return [];

    // Prioritize learning & known words if available, mixed with random pool
    const learnedWords: OxfordWord[] = [];
    const otherWords: OxfordWord[] = [];

    for (const w of scopedWords) {
      if (storage.cards[w.id]) {
        learnedWords.push(w);
      } else {
        otherWords.push(w);
      }
    }

    // Shuffle helper
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const questionPool = shuffle([...learnedWords, ...otherWords]).slice(0, 10);
    const questions: QuizQuestion[] = [];

    for (let i = 0; i < questionPool.length; i++) {
      const targetWord = questionPool[i];
      const typeChoice: 'word-to-def' | 'def-to-word' | 'cloze' = 
        targetWord.example && Math.random() > 0.4 ? 'cloze' : (i % 2 === 0 ? 'word-to-def' : 'def-to-word');

      // Pick 3 distractors from same or similar CEFR
      const distractors = shuffle(scopedWords.filter(w => w.id !== targetWord.id)).slice(0, 3);

      if (typeChoice === 'word-to-def') {
        const options = shuffle([targetWord.definition, ...distractors.map(d => d.definition)]);
        questions.push({
          word: targetWord,
          type: 'word-to-def',
          prompt: `Apa definisi dari kata "${targetWord.word}" (${targetWord.type})?`,
          options,
          correctAnswer: targetWord.definition,
        });
      } else if (typeChoice === 'cloze' && targetWord.example) {
        // Replace target word in example sentence with blank
        const regex = new RegExp(`\\b${targetWord.word}\\b`, 'gi');
        const blankedSentence = targetWord.example.replace(regex, '_______');
        const options = shuffle([targetWord.word, ...distractors.map(d => d.word)]);
        questions.push({
          word: targetWord,
          type: 'cloze',
          prompt: `Lengkapi kalimat berikut: "${blankedSentence}"`,
          options,
          correctAnswer: targetWord.word,
        });
      } else {
        const options = shuffle([targetWord.word, ...distractors.map(d => d.word)]);
        questions.push({
          word: targetWord,
          type: 'def-to-word',
          prompt: `Kata apa yang memiliki definisi: "${targetWord.definition}"?`,
          options,
          correctAnswer: targetWord.word,
        });
      }
    }

    return questions;
  }, [scopedWords, storage.cards]);

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuestions());

  const restartQuiz = () => {
    const newQs = generateQuestions();
    setQuestions(newQs);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizComplete(false);
    setUserAnswers([]);
  };

  const currentQ = questions[currentIdx] || null;

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQ || isAnswerSubmitted) return;

    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setUserAnswers(prev => [...prev, { question: currentQ, selected: selectedAnswer, isCorrect }]);
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizComplete(true);
    }
  };

  if (scopedWords.length < 4) {
    return (
      <div className="max-w-[960px] mx-auto py-12 px-4 text-center">
        <HelpCircle strokeWidth={1.5} className="w-12 h-12 text-app-accent mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-app-primary">Data Kosa Kata Belum Cukup</h2>
        <p className="text-xs text-app-secondary mt-1">
          Dibutuhkan minimal 4 kata untuk memulai kuis. Periksa filter level di Pengaturan.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto py-6 px-4 md:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-app-primary">
            Kuis Pemahaman Oxford 3000
          </h1>
          <p className="text-xs text-app-secondary mt-1">
            Uji daya ingat definisi, konteks kalimat, dan kosakata dengan 10 soal acak.
          </p>
        </div>
        <button
          onClick={restartQuiz}
          className="p-2 rounded-xl border border-app-border bg-app-surface hover:bg-app-bg text-app-secondary hover:text-app-primary transition-colors text-xs font-medium flex items-center space-x-1.5"
          title="Ulang Kuis Baru"
        >
          <RotateCcw strokeWidth={1.5} className="w-3.5 h-3.5" />
          <span>Kuis Baru</span>
        </button>
      </div>

      {!isQuizComplete && currentQ ? (
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Progress row */}
          <div className="flex items-center justify-between text-xs text-app-secondary">
            <span className="font-medium text-app-primary">
              Soal {currentIdx + 1} dari {questions.length}
            </span>
            <span className="font-mono">
              Skor Sementara: {score}
            </span>
          </div>

          <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden border border-app-border">
            <div 
              className="h-full bg-app-accent transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Prompt */}
          <div className="p-4 rounded-xl bg-app-bg border border-app-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-app-accent/10 text-app-accent">
                {currentQ.word.cefr.toUpperCase()} • {currentQ.word.type}
              </span>
              <button
                onClick={() => speakWord(currentQ.word.word)}
                className="p-1 rounded-md text-app-accent hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                title="Dengarkan kata"
              >
                <Volume2 strokeWidth={1.5} className="w-4 h-4" />
              </button>
            </div>
            <p className="text-base md:text-lg font-medium text-app-primary leading-relaxed">
              {currentQ.prompt}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectAnswer = opt === currentQ.correctAnswer;

              let btnStyle = 'border-app-border bg-app-surface text-app-primary hover:border-app-accent/50';
              if (isSelected && !isAnswerSubmitted) {
                btnStyle = 'border-app-accent bg-app-accent/10 text-app-accent font-medium';
              } else if (isAnswerSubmitted) {
                if (isCorrectAnswer) {
                  btnStyle = 'border-app-success bg-app-success/15 text-app-success font-semibold';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'border-red-500 bg-red-500/15 text-red-500 font-semibold';
                } else {
                  btnStyle = 'opacity-50 border-app-border bg-app-surface text-app-secondary';
                }
              }

              return (
                <button
                  key={i}
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all duration-150 flex items-center justify-between ${btnStyle}`}
                >
                  <span className="leading-snug">{opt}</span>
                  {isAnswerSubmitted && isCorrectAnswer && (
                    <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-app-success flex-shrink-0 ml-2" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle strokeWidth={1.5} className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex justify-end">
            {!isAnswerSubmitted ? (
              <button
                disabled={!selectedAnswer}
                onClick={handleSubmitAnswer}
                className="px-6 py-2.5 rounded-full bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Kunci Jawaban
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-full bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold transition-colors flex items-center space-x-2 shadow-sm"
              >
                <span>{currentIdx + 1 < questions.length ? 'Soal Berikutnya' : 'Lihat Hasil Akhir'}</span>
                <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Complete / Results Screen */
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 md:p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-app-accent/15 text-app-accent mx-auto flex items-center justify-center">
            <Award strokeWidth={1.5} className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-app-primary">Kuis Selesai!</h2>
            <p className="text-xs text-app-secondary mt-1">Hasil evaluasi 10 pertanyaan pilihan ganda</p>
          </div>

          <div className="p-4 rounded-xl bg-app-bg border border-app-border max-w-xs mx-auto">
            <p className="text-xs text-app-secondary font-medium">Skor Akhir</p>
            <div className="mt-1 flex items-baseline justify-center space-x-1">
              <span className="text-4xl font-extrabold text-app-accent">{score}</span>
              <span className="text-lg text-app-secondary">/ {questions.length}</span>
            </div>
            <p className="text-xs text-app-secondary mt-1 font-semibold">
              {score >= 8 ? 'Luar biasa! Penguasaan kosa kata sangat kuat.' : score >= 5 ? 'Bagus! Terus ulangi kosa kata yang belum mantap.' : 'Perlu latihan lebih sering di tab Hari Ini & Ulangan.'}
            </p>
          </div>

          {/* Breakdown of questions */}
          <div className="text-left space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-app-secondary">
              Rincian Jawaban:
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {userAnswers.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-app-border bg-app-bg text-xs space-y-1">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-app-primary">
                      {idx + 1}. {item.question.word.word} ({item.question.word.type})
                    </span>
                    <span className={item.isCorrect ? 'text-app-success font-semibold' : 'text-red-500 font-semibold'}>
                      {item.isCorrect ? 'Benar (+1)' : 'Salah'}
                    </span>
                  </div>
                  {!item.isCorrect && (
                    <p className="text-app-secondary">
                      Jawaban benar: <span className="font-semibold text-app-primary">{item.question.correctAnswer}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={restartQuiz}
              className="px-6 py-2.5 rounded-full bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold transition-colors shadow-sm"
            >
              Mulai Kuis Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
