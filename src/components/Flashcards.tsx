import React from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CloseIcon from '@mui/icons-material/Close';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { algorithmCards, type Flashcard, type FlashcardResult } from '../flashcards';
import { frontendCards } from '../frontendFlashcards';

const storageKey = 'flashcard-results';

type DeckName = 'algorithms' | 'frontend';

const decks: Record<DeckName, { label: string; cards: Flashcard[] }> = {
  algorithms: { label: 'Algorithms', cards: algorithmCards },
  frontend: { label: 'Front End', cards: frontendCards },
};

const getCategories = (cards: Flashcard[]) =>
  [...new Set(cards.map((c) => c.category))].sort();

// Show `backtick` spans in answers as inline code
const withCode = (text: string) =>
  text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Results are keyed by card title and kept across page reloads
const loadResults = (): Record<string, FlashcardResult> => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '{}');
  } catch {
    return {};
  }
};

// Index of the first card without a result, or the first card when every card has one
const firstUnseenIndex = (cards: Flashcard[], results: Record<string, FlashcardResult>) =>
  Math.max(
    cards.findIndex((c) => !results[c.title]),
    0,
  );

interface Props {
  onClose?: () => void;
}

export function Flashcards({ onClose }: Props) {
  const [deckName, setDeckName] = React.useState<DeckName>('algorithms');
  const source = decks[deckName].cards;
  const categories = getCategories(source);
  const [deck, setDeck] = React.useState(source);
  const [results, setResults] = React.useState(loadResults);
  // On page load, pick up where you left off at the first unseen card
  const [index, setIndex] = React.useState(() => firstUnseenIndex(source, results));
  const [revealed, setRevealed] = React.useState(false);
  const [category, setCategory] = React.useState('all');
  const [missedOnly, setMissedOnly] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(results));
  }, [results]);

  const visible = deck.filter(
    (c) =>
      (category === 'all' || c.category === category) &&
      (!missedOnly || results[c.title] === 'missed'),
  );
  // Keep the position valid when filters or marks shrink the visible deck
  const current = Math.min(index, Math.max(visible.length - 1, 0));
  const card = visible[current];

  const inCategory = source.filter((c) => category === 'all' || c.category === category);
  const gotCount = inCategory.filter((c) => results[c.title] === 'got').length;
  const missedCount = inCategory.filter((c) => results[c.title] === 'missed').length;

  // Every move to a new card hides its answer again
  const goTo = (next: number) => {
    setIndex(visible.length ? (next + visible.length) % visible.length : 0);
    setRevealed(false);
  };

  const resetPosition = () => {
    setIndex(0);
    setRevealed(false);
  };

  const shuffleDeck = () => {
    setDeck(shuffle(source));
    resetPosition();
  };

  const switchDeck = (next: DeckName) => {
    setDeckName(next);
    setDeck(decks[next].cards);
    setCategory('all');
    // Missed-only shows no unseen cards, so start from the top there
    setIndex(missedOnly ? 0 : firstUnseenIndex(decks[next].cards, results));
    setRevealed(false);
  };

  const mark = (result: FlashcardResult) => {
    setResults((prev) => ({ ...prev, [card.title]: result }));
    setRevealed(false);
    // In missed-only mode a card marked "got it" drops out, so the next card slides into place
    const leavesView = missedOnly && result === 'got';
    if (leavesView) {
      setIndex(current >= visible.length - 1 ? 0 : current);
    } else {
      setIndex((current + 1) % visible.length);
    }
  };

  const resetProgress = () => {
    setResults((prev) => {
      const next = { ...prev };
      for (const c of inCategory) delete next[c.title];
      return next;
    });
    resetPosition();
  };

  const emptyMessage = missedOnly
    ? 'No missed cards here — nice work!'
    : 'No cards match this filter.';

  return (
    <div className="flashcards">
      <div className="flashcards-header">
        <div className="flashcards-header-left">
          <div className="flashcards-title">Study Flashcards</div>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={deckName}
            onChange={(_, next: DeckName | null) => {
              if (next) switchDeck(next);
            }}
          >
            {Object.entries(decks).map(([name, { label }]) => (
              <ToggleButton key={name} value={name} style={{ textTransform: 'none' }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        <div className="flashcards-nav">
          <Button size="small" startIcon={<ShuffleIcon />} onClick={shuffleDeck}>
            Shuffle
          </Button>
          <IconButton
            size="small"
            aria-label="Previous card"
            disabled={!visible.length}
            onClick={() => goTo(current - 1)}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <span className="flashcards-count">
            {visible.length ? `${current + 1} / ${visible.length}` : '0 / 0'}
          </span>
          <IconButton
            size="small"
            aria-label="Next card"
            disabled={!visible.length}
            onClick={() => goTo(current + 1)}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
          {onClose && (
            <IconButton
              size="small"
              aria-label="Close flashcards"
              onClick={onClose}
              style={{ marginLeft: '0.5rem' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      </div>
      <div className="flashcards-toolbar">
        <TextField
          select
          size="small"
          label={deckName === 'algorithms' ? 'Pattern' : 'Topic'}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            resetPosition();
          }}
          style={{ minWidth: 200 }}
        >
          <MenuItem value="all">All</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={missedOnly}
              onChange={(e) => {
                setMissedOnly(e.target.checked);
                resetPosition();
              }}
            />
          }
          label="Missed only"
        />
        <div className="flashcards-progress">
          <span className="flashcards-got">✓ {gotCount} got it</span>
          <span className="flashcards-missed">✗ {missedCount} missed</span>
          <span>{inCategory.length - gotCount - missedCount} unseen</span>
          <Button
            size="small"
            onClick={resetProgress}
            disabled={gotCount + missedCount === 0}
          >
            Reset
          </Button>
        </div>
      </div>
      {card ? (
        <div className="flashcards-body">
          <div className="flashcards-side">
            <div className="flashcards-label">
              Question
              {results[card.title] && (
                <span
                  className={`flashcards-badge flashcards-badge-${results[card.title]}`}
                >
                  {results[card.title] === 'got' ? 'Got it' : 'Missed'}
                </span>
              )}
            </div>
            <div className="flashcards-card-title">{withCode(card.title)}</div>
            <div>{withCode(card.question)}</div>
          </div>
          <div className="flashcards-side">
            <div className="flashcards-label">Answer</div>
            {revealed ? (
              <>
                <div className="flashcards-pattern">{withCode(card.pattern)}</div>
                <div>{withCode(card.approach)}</div>
                {card.complexity && (
                  <div className="flashcards-complexity">{card.complexity}</div>
                )}
                <div className="flashcards-actions">
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => mark('missed')}
                  >
                    Missed it
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => mark('got')}
                  >
                    Got it
                  </Button>
                </div>
              </>
            ) : (
              <div className="flashcards-hidden">
                <Button variant="outlined" size="small" onClick={() => setRevealed(true)}>
                  Reveal
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flashcards-empty">{emptyMessage}</div>
      )}
    </div>
  );
}
