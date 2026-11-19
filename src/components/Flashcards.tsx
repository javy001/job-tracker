import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ShuffleIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { algorithmCards, type Flashcard, type FlashcardResult } from '../flashcards';
import { frontendCards } from '../frontendFlashcards';
import { systemDesignCards } from '../systemDesignFlashcards';
import { CodeBlock } from './CodeBlock';

const storageKey = 'flashcard-results';

type DeckName = 'algorithms' | 'frontend' | 'systemDesign';

const decks: Record<DeckName, { label: string; cards: Flashcard[] }> = {
  algorithms: { label: 'Algorithms', cards: algorithmCards },
  frontend: { label: 'Front End', cards: frontendCards },
  systemDesign: { label: 'System Design', cards: systemDesignCards },
};

const getCategories = (cards: Flashcard[]) =>
  [...new Set(cards.map((c) => c.category))].sort();

// Show `backtick` spans in answers as inline code
const withCode = (text: string) =>
  text.split('`').map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded-[4px] bg-accent px-1 py-px font-mono text-[0.85em] text-foreground">
        {part}
      </code>
    ) : (
      part
    ),
  );

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

  const side = 'flex min-h-40 flex-col gap-2 rounded-md border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed';
  const sideLabel = 'flex items-center gap-2 text-[11px] font-medium text-subtle-foreground';

  return (
    <div>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold">Study flashcards</div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={deckName}
            onValueChange={(next) => {
              if (next) switchDeck(next as DeckName);
            }}
          >
            {Object.entries(decks).map(([name, { label }]) => (
              <ToggleGroupItem key={name} value={name} className="px-2.5 text-xs">
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={shuffleDeck}>
            <ShuffleIcon />
            Shuffle
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous card"
            disabled={!visible.length}
            onClick={() => goTo(current - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-[60px] text-center text-[13px] font-medium tabular-nums">
            {visible.length ? `${current + 1} / ${visible.length}` : '0 / 0'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next card"
            disabled={!visible.length}
            onClick={() => goTo(current + 1)}
          >
            <ChevronRightIcon />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close flashcards"
              onClick={onClose}
              className="ml-2"
            >
              <XIcon />
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              resetPosition();
            }}
          >
            <SelectTrigger
              aria-label={deckName === 'algorithms' ? 'Pattern' : 'Topic'}
              className="min-w-[200px]"
            >
              <span className="text-muted-foreground">
                {deckName === 'algorithms' ? 'Pattern:' : 'Topic:'}
              </span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="flashcards-missed-only"
              checked={missedOnly}
              onCheckedChange={(checked) => {
                setMissedOnly(checked);
                resetPosition();
              }}
            />
            <Label htmlFor="flashcards-missed-only" className="text-[13px] font-normal">
              Missed only
            </Label>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
            <span className="text-success">✓ {gotCount} got it</span>
            <span className="text-destructive">✗ {missedCount} missed</span>
            <span>{inCategory.length - gotCount - missedCount} unseen</span>
            <Button variant="ghost" size="sm" onClick={resetProgress} disabled={gotCount + missedCount === 0}>
              Reset
            </Button>
          </div>
        </div>
        {card ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className={side}>
              <div className={sideLabel}>
                Question
                {results[card.title] && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[11px] font-medium',
                      results[card.title] === 'got'
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/15 text-destructive',
                    )}
                  >
                    {results[card.title] === 'got' ? 'Got it' : 'Missed'}
                  </span>
                )}
              </div>
              <div className="text-[15px] font-semibold">{withCode(card.title)}</div>
              <div>{withCode(card.question)}</div>
            </div>
            <div className={side}>
              <div className={sideLabel}>Answer</div>
              {revealed ? (
                <>
                  <div className="text-[15px] font-semibold">{withCode(card.pattern)}</div>
                  <div>{withCode(card.approach)}</div>
                  {card.solution && <CodeBlock code={card.solution} />}
                  {card.complexity && (
                    <div className="text-xs text-muted-foreground">{card.complexity}</div>
                  )}
                  <div className="mt-auto flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => mark('missed')}
                    >
                      Missed it
                    </Button>
                    <Button
                      className="bg-success text-white hover:bg-success/90"
                      onClick={() => mark('got')}
                    >
                      Got it
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <Button variant="outline" onClick={() => setRevealed(true)}>
                    Reveal
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-8 text-center text-[13px] text-subtle-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
