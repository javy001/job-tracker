import type { Flashcard } from './flashcards';

// Front-end fundamentals: JavaScript, React and TypeScript concepts that come up in interviews
export const frontendCards: Flashcard[] = [
  // --- JavaScript ---
  {
    title: 'Closures',
    category: 'JavaScript',
    question: 'What is a closure, and when would you use one?',
    pattern: 'A function bundled with the scope it was created in',
    approach:
      'An inner function keeps access to variables from its outer function even after the outer function has returned. Common uses: private state (counters, module pattern), function factories, memoization, and callbacks that need to remember values. Classic gotcha: callbacks in a loop using `var` all share one variable; `let` creates a fresh binding per iteration.',
  },
  {
    title: 'The Event Loop',
    category: 'JavaScript',
    question:
      'Explain the event loop. In what order do sync code, Promise callbacks and setTimeout callbacks run?',
    pattern: 'Call stack → microtasks → next macrotask',
    approach:
      'JavaScript runs one call stack to completion. Then it drains the entire microtask queue (Promise .then/catch/finally, queueMicrotask, await continuations). Only then does it take the next macrotask (setTimeout, setInterval, I/O, UI events), and the browser may render between macrotasks. So: sync logs first, then Promise callbacks, then setTimeout(…, 0).',
  },
  {
    title: '`this` Binding',
    category: 'JavaScript',
    question: 'How is the value of `this` determined in JavaScript?',
    pattern: 'Decided by how a function is called (except arrow functions)',
    approach:
      'In priority order: `new` binds `this` to the new object; call/apply/bind set it explicitly; a method call `obj.fn()` sets it to `obj`; a plain call `fn()` gives `undefined` in strict mode (the global object otherwise). Arrow functions have no own `this` and use the enclosing scope’s, which is why they’re handy for callbacks.',
  },
  {
    title: 'var vs let vs const',
    category: 'JavaScript',
    question: 'What are the differences between var, let and const?',
    pattern: 'Function scope vs block scope, and reassignment',
    approach:
      '`var` is function-scoped and hoisted with an initial value of undefined. `let` and `const` are block-scoped and hoisted into a temporal dead zone, so accessing them before declaration throws. `const` prevents reassigning the binding, but the object it points to can still be mutated.',
  },
  {
    title: 'Hoisting',
    category: 'JavaScript',
    question: 'What is hoisting? What gets hoisted and how?',
    pattern: 'Declarations are registered before code runs',
    approach:
      'Function declarations are hoisted with their body, so they can be called before they appear. `var` declarations are hoisted and initialized to undefined. `let`, `const` and `class` are hoisted but uninitialized (temporal dead zone). Function expressions and arrow functions follow the rules of the variable they’re assigned to.',
  },
  {
    title: 'Prototypal Inheritance',
    category: 'JavaScript',
    question: 'How does inheritance work in JavaScript? How do classes relate to prototypes?',
    pattern: 'Objects delegate property lookups along a prototype chain',
    approach:
      'Each object has an internal [[Prototype]] link. If a property isn’t found on the object, the lookup continues up the chain until it reaches null. `class` syntax is sugar over this: methods live on `Class.prototype`, and `extends` links one prototype to another.',
  },
  {
    title: '== vs ===',
    category: 'JavaScript',
    question: 'What is the difference between == and ===?',
    pattern: 'Loose equality coerces types; strict equality does not',
    approach:
      '`===` requires the same type and value. `==` coerces types first, producing surprises like `0 == ""` and `null == undefined` being true. Prefer `===`; the common deliberate use of `==` is `x == null` to match both null and undefined.',
  },
  {
    title: 'Promises and async/await',
    category: 'JavaScript',
    question:
      'How do Promises work, and what is the difference between Promise.all, allSettled, race and any?',
    pattern: 'A placeholder for a future value: pending → fulfilled or rejected',
    approach:
      'async/await is syntax over Promises; `await` pauses the function and resumes as a microtask. Promise.all rejects as soon as any input rejects; allSettled waits for every result; race settles with the first to settle; any fulfills with the first success and only rejects if all fail. Run independent awaits in parallel with Promise.all instead of awaiting one after another.',
  },
  {
    title: 'Debounce vs Throttle',
    category: 'JavaScript',
    question: 'What is the difference between debouncing and throttling? Sketch a debounce.',
    pattern: 'Wait for a pause vs limit to a fixed rate',
    approach:
      'Debounce runs the function only after calls stop for N ms (search inputs, resize end). Throttle runs it at most once every N ms (scroll, mousemove). Debounce: keep a timer in a closure; on each call, clearTimeout the previous one and setTimeout a new one that calls fn with the latest arguments.',
  },
  {
    title: 'Event Delegation',
    category: 'JavaScript',
    question: 'What is event delegation and why is it useful?',
    pattern: 'One listener on a parent, using event bubbling',
    approach:
      'Events bubble from the target up through its ancestors. Attach a single listener to a parent and inspect `event.target` (often with `closest()`) to see which child was hit. It uses less memory and automatically handles children added later. Capture phase runs top-down before bubbling; `stopPropagation` halts it.',
  },
  {
    title: 'Shallow vs Deep Copy',
    category: 'JavaScript',
    question: 'How do you copy an object, and what is the difference between a shallow and deep copy?',
    pattern: 'Shallow copies share nested references',
    approach:
      'Spread (`{...obj}`), Object.assign and Array.slice copy only the top level, so nested objects are still shared. `structuredClone` makes a deep copy (handles Dates, Maps, cycles; not functions). `JSON.parse(JSON.stringify())` is a lossy deep copy that drops undefined, functions and Dates.',
  },
  {
    title: 'map vs forEach vs reduce',
    category: 'JavaScript',
    question: 'When would you use map, filter, forEach and reduce?',
    pattern: 'Transform, select, side effects, accumulate',
    approach:
      '`map` returns a new array of the same length with each item transformed. `filter` returns the items that pass a test. `forEach` returns undefined and is for side effects only. `reduce` folds the array into a single value (sum, object grouping), and you should pass an initial value.',
  },
  // --- React ---
  {
    title: 'Reconciliation and Keys',
    category: 'React',
    question: 'How does React decide what to update in the DOM, and why do list items need keys?',
    pattern: 'Diff the new element tree against the previous one',
    approach:
      'On render React builds a new tree and compares it with the last. A different element type at the same position remounts the subtree; the same type updates props in place. Keys identify list items across renders so React can reorder instead of recreating them. Using the array index as a key breaks state and focus when items are inserted, removed or reordered.',
  },
  {
    title: 'What Triggers a Re-render',
    category: 'React',
    question: 'When does a React component re-render?',
    pattern: 'Its state changes, its parent re-renders, or a context it reads changes',
    approach:
      'Setting state (with a new value by Object.is) schedules a render of that component and its children. Children re-render when the parent does, even if props are the same, unless wrapped in React.memo. Props changing alone doesn’t trigger a render: a parent render does. Consumers of a context re-render when its value changes.',
  },
  {
    title: 'useEffect',
    category: 'React',
    question: 'How does useEffect work, and what is the cleanup function for?',
    pattern: 'Synchronize with something outside React after render',
    approach:
      'The effect runs after the browser paints; the dependency array controls when it re-runs (none = every render, [] = mount only, [a, b] = when they change). The cleanup runs before the next effect and on unmount: use it to remove listeners, clear timers, and cancel requests. In dev StrictMode, effects run twice on mount to surface missing cleanups. Don’t use effects to derive data you could compute during render.',
  },
  {
    title: 'useMemo, useCallback and React.memo',
    category: 'React',
    question: 'What do useMemo, useCallback and React.memo do, and when are they worth it?',
    pattern: 'Memoization to skip recomputing or re-rendering',
    approach:
      'useMemo caches a computed value; useCallback caches a function identity; React.memo skips re-rendering a component when its props are shallow-equal. They help with expensive calculations or when passing stable props to memoized children or effect dependencies. They add overhead, so don’t wrap everything — measure first.',
  },
  {
    title: 'useRef',
    category: 'React',
    question: 'What is useRef for, and how is it different from state?',
    pattern: 'A mutable box that persists across renders without causing them',
    approach:
      'useRef returns `{ current }` that stays the same object for the component’s lifetime. Changing `.current` doesn’t trigger a re-render. Uses: accessing DOM nodes (focus, measuring), storing timer IDs, previous values, or any instance variable that shouldn’t affect what’s displayed.',
  },
  {
    title: 'Controlled vs Uncontrolled Inputs',
    category: 'React',
    question: 'What is the difference between controlled and uncontrolled form inputs?',
    pattern: 'React state vs the DOM as the source of truth',
    approach:
      'A controlled input gets `value` from state and updates it in `onChange`, making validation and formatting easy. An uncontrolled input keeps its own value in the DOM (`defaultValue`), read via a ref or FormData on submit; it’s simpler and has fewer renders. Switching a field between the two causes a React warning.',
  },
  {
    title: 'Stale Closures in Hooks',
    category: 'React',
    question:
      'Why might a setInterval inside useEffect keep logging an old state value, and how do you fix it?',
    pattern: 'The callback captured the value from an earlier render',
    approach:
      'Every render has its own props and state, and the effect’s callback closes over the ones from the render it was created in. Fixes: list the value in the dependency array so the effect re-subscribes, use the functional updater `setCount(c => c + 1)`, or store the latest value in a ref.',
  },
  {
    title: 'State Updates and Batching',
    category: 'React',
    question:
      'Calling setCount(count + 1) three times in one click handler only increments by one. Why?',
    pattern: 'State is a snapshot per render; updates are batched',
    approach:
      '`count` is fixed for the current render, so all three calls set the same value. React batches updates and re-renders once after the handler. Use the updater form `setCount(c => c + 1)` to queue changes based on the latest value. Since React 18, batching also applies in timeouts and promises.',
  },
  {
    title: 'Lifting State vs Context',
    category: 'React',
    question: 'How do you share state between components, and when should you use Context?',
    pattern: 'Lift to the closest common parent; Context avoids prop drilling',
    approach:
      'Start by moving state to the nearest common ancestor and passing it down as props. Use Context when many components at different depths need the same value (theme, current user, locale). Every consumer re-renders when the context value changes, so split contexts or memoize the value. Fast-changing or large state is often better in a dedicated store.',
  },
  {
    title: 'Custom Hooks',
    category: 'React',
    question: 'What is a custom hook and what are the rules of hooks?',
    pattern: 'A function starting with "use" that reuses stateful logic',
    approach:
      'Custom hooks bundle hooks such as useState and useEffect into reusable logic (useFetch, useDebounce); each caller gets its own state. Rules: only call hooks at the top level (not in conditions, loops or after early returns) and only from components or other hooks, because React matches hook state by call order.',
  },
  {
    title: 'Rendering Performance',
    category: 'React',
    question: 'A React page feels slow. How would you investigate and fix it?',
    pattern: 'Measure first, then reduce work per render',
    approach:
      'Profile with the React DevTools Profiler and browser Performance panel to find what renders and why. Fixes: move state down closer to where it’s used, memoize expensive children and values, virtualize long lists, code-split with React.lazy and Suspense, debounce rapid input, and use useTransition / useDeferredValue to keep typing responsive.',
  },
  // --- TypeScript ---
  {
    title: 'interface vs type',
    category: 'TypeScript',
    question: 'What is the difference between an interface and a type alias?',
    pattern: 'Mostly interchangeable for object shapes',
    approach:
      'Interfaces can be reopened and merged (declaration merging) and use `extends`. Type aliases can name anything: unions, tuples, primitives, mapped and conditional types; they combine with `&`. A common convention: interfaces for public object shapes, types for unions and computed types.',
  },
  {
    title: 'any vs unknown vs never',
    category: 'TypeScript',
    question: 'Explain any, unknown and never.',
    pattern: 'Opt out, safe top type, and the empty type',
    approach:
      '`any` turns off type checking for that value. `unknown` accepts anything but must be narrowed before use, making it the safe choice for untrusted input. `never` has no values: it’s the return type of functions that throw or never return, and the leftover type in exhaustive checks.',
  },
  {
    title: 'Generics',
    category: 'TypeScript',
    question: 'What are generics and why use them? What does a constraint do?',
    pattern: 'Type parameters that keep types connected',
    approach:
      'Generics let a function or type work over many types while preserving the relationship between input and output, e.g. `function first<T>(items: T[]): T | undefined`. A constraint like `<T extends { id: string }>` requires certain properties. `keyof` with generics, as in `get<T, K extends keyof T>(obj: T, key: K): T[K]`, enables type-safe property access.',
  },
  {
    title: 'Type Narrowing',
    category: 'TypeScript',
    question: 'How does TypeScript narrow a union type?',
    pattern: 'Control-flow analysis on runtime checks',
    approach:
      'TypeScript refines a type inside branches based on typeof, instanceof, the `in` operator, equality checks, and truthiness. You can write custom type guards with a `value is Foo` return type. Assertion functions (`asserts value is Foo`) narrow after they return.',
  },
  {
    title: 'Discriminated Unions',
    category: 'TypeScript',
    question: 'What is a discriminated union, and how do you make a switch over one exhaustive?',
    pattern: 'A union with a shared literal "tag" property',
    approach:
      'Each member has a common field with a literal type, e.g. `{ status: "loading" } | { status: "success"; data: T } | { status: "error"; error: Error }`. Switching on the tag narrows to that member. For exhaustiveness, assign the value to a `never` variable in the default case so adding a new member causes a compile error.',
  },
  {
    title: 'Utility Types',
    category: 'TypeScript',
    question: 'Name some built-in utility types and what they do.',
    pattern: 'Transform existing types instead of redefining them',
    approach:
      'Partial<T> makes every property optional; Required<T> makes them required; Readonly<T> prevents reassignment; Pick<T, K> and Omit<T, K> keep or remove keys; Record<K, V> maps keys to a value type; ReturnType<F> and Parameters<F> extract from function types; NonNullable<T> removes null and undefined; Awaited<T> unwraps a Promise.',
  },
  {
    title: 'Typing React Components',
    category: 'TypeScript',
    question: 'How do you type props, state, events and refs in a React component?',
    pattern: 'Props interface + inferred hooks + React event types',
    approach:
      'Define a Props interface and destructure it in the parameters; use `children: React.ReactNode`. useState infers from the initial value; pass a generic when it starts as null, e.g. `useState<User | null>(null)`. Events use types like `React.ChangeEvent<HTMLInputElement>`. Refs to DOM nodes: `useRef<HTMLDivElement>(null)`.',
  },
  {
    title: 'Structural Typing',
    category: 'TypeScript',
    question:
      'Why can you pass an object of one type to a function expecting a different named type?',
    pattern: 'Compatibility is based on shape, not name',
    approach:
      'TypeScript is structurally typed: if an object has all the required properties with compatible types, it fits, whatever its declared name. Extra properties are allowed when passing a variable, but object literals passed directly get “excess property” errors to catch typos. Branded types can simulate nominal typing when you need it.',
  },
];
