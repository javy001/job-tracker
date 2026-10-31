export interface Flashcard {
  title: string;
  category: string; // broad grouping used by the study filter
  question: string;
  pattern: string; // headline answer: the algorithm pattern or the key concept
  approach: string;
  complexity?: string;
}

export type FlashcardResult = 'got' | 'missed';

// Classic coding interview problems: the question on one side, the pattern and approach on the other
export const algorithmCards: Flashcard[] = [
  {
    title: 'Two Sum (sorted array)',
    category: 'Two Pointers',
    question:
      'Given a sorted array of integers and a target, return the indices of the two numbers that add up to the target.',
    pattern: 'Two Pointers',
    approach:
      'Start one pointer at each end. If the sum is too small, move the left pointer right; if too large, move the right pointer left; stop when the sum equals the target.',
    complexity: 'O(n) time, O(1) space',
  },
  {
    title: 'Two Sum (unsorted array)',
    category: 'Hash Map',
    question:
      'Given an unsorted array of integers and a target, return the indices of the two numbers that add up to the target.',
    pattern: 'Hash Map',
    approach:
      'Walk the array once, storing each value → index in a map. For each number, check whether target − number is already in the map; if so, you have your pair.',
    complexity: 'O(n) time, O(n) space',
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    category: 'Sliding Window',
    question:
      'Given a string, find the length of the longest substring that contains no repeated characters.',
    pattern: 'Sliding Window',
    approach:
      'Grow a window with a right pointer, tracking the last index of each character. When you hit a repeat inside the window, jump the left pointer past its previous occurrence. Track the max window size.',
    complexity: 'O(n) time, O(k) space for the character set',
  },
  {
    title: 'Minimum Window Substring',
    category: 'Sliding Window',
    question:
      'Given strings s and t, return the smallest substring of s that contains every character of t (including duplicates).',
    pattern: 'Sliding Window',
    approach:
      'Count the characters needed from t. Expand the right pointer until the window covers all of them, then shrink from the left while it stays valid, recording the smallest valid window.',
    complexity: 'O(|s| + |t|) time',
  },
  {
    title: 'Container With Most Water',
    category: 'Two Pointers',
    question:
      'Given an array of heights of vertical lines, pick two lines that together with the x-axis hold the most water.',
    pattern: 'Two Pointers',
    approach:
      'Start at both ends and compute the area. Always move the pointer at the shorter line inward, since moving the taller one can never produce a larger area.',
    complexity: 'O(n) time, O(1) space',
  },
  {
    title: '3Sum',
    category: 'Two Pointers',
    question: 'Find all unique triplets in an array that sum to zero.',
    pattern: 'Sorting + Two Pointers',
    approach:
      'Sort the array. Fix each element in turn, then run a two-pointer search on the rest for pairs summing to its negative. Skip duplicate values to keep triplets unique.',
    complexity: 'O(n²) time',
  },
  {
    title: 'Linked List Cycle',
    category: 'Fast & Slow Pointers',
    question: 'Determine whether a linked list contains a cycle.',
    pattern: 'Fast & Slow Pointers',
    approach:
      'Move one pointer one step and another two steps at a time. If they ever meet there is a cycle; if the fast pointer reaches null there is not.',
    complexity: 'O(n) time, O(1) space',
  },
  {
    title: 'Find the Middle of a Linked List',
    category: 'Fast & Slow Pointers',
    question: 'Return the middle node of a singly linked list in a single pass.',
    pattern: 'Fast & Slow Pointers',
    approach:
      'Advance slow by one and fast by two. When fast reaches the end, slow is at the middle.',
    complexity: 'O(n) time, O(1) space',
  },
  {
    title: 'Merge Intervals',
    category: 'Intervals',
    question: 'Given a list of intervals, merge all overlapping intervals.',
    pattern: 'Intervals (Sort + Sweep)',
    approach:
      'Sort by start time. Walk the list, extending the last merged interval when the current one overlaps it, otherwise starting a new merged interval.',
    complexity: 'O(n log n) time',
  },
  {
    title: 'Meeting Rooms II',
    category: 'Intervals',
    question:
      'Given meeting time intervals, find the minimum number of conference rooms required.',
    pattern: 'Intervals + Min Heap',
    approach:
      'Sort meetings by start. Keep a min-heap of end times for rooms in use; pop when the earliest-ending room is free before the next meeting starts, then push the new end time. The heap’s max size is the answer.',
    complexity: 'O(n log n) time',
  },
  {
    title: 'Search in Rotated Sorted Array',
    category: 'Binary Search',
    question:
      'A sorted array has been rotated at an unknown pivot. Find the index of a target value in O(log n).',
    pattern: 'Modified Binary Search',
    approach:
      'At each step, one half of the range is sorted. Check which half is sorted and whether the target lies inside it; recurse into that half, otherwise the other.',
    complexity: 'O(log n) time',
  },
  {
    title: 'Koko Eating Bananas',
    category: 'Binary Search',
    question:
      'Given piles of bananas and h hours, find the minimum eating speed that finishes all piles in time.',
    pattern: 'Binary Search on the Answer',
    approach:
      'The answer lies between 1 and the largest pile. Binary search the speed: for each candidate, compute the hours needed and move left if it fits within h, right otherwise.',
    complexity: 'O(n log max) time',
  },
  {
    title: 'Kth Largest Element in an Array',
    category: 'Heap',
    question: 'Find the kth largest element in an unsorted array.',
    pattern: 'Top K Elements (Heap)',
    approach:
      'Keep a min-heap of size k. Push each number and pop whenever the heap exceeds k. The top of the heap is the kth largest. (Quickselect gives O(n) on average.)',
    complexity: 'O(n log k) time, O(k) space',
  },
  {
    title: 'Merge K Sorted Lists',
    category: 'Heap',
    question: 'Merge k sorted linked lists into one sorted list.',
    pattern: 'K-Way Merge (Heap)',
    approach:
      'Push the head of each list into a min-heap. Repeatedly pop the smallest node, append it to the result, and push its next node.',
    complexity: 'O(N log k) time',
  },
  {
    title: 'Number of Islands',
    category: 'Graphs',
    question:
      'Given a 2D grid of land and water, count the number of islands (groups of connected land cells).',
    pattern: 'Graph Traversal (DFS/BFS)',
    approach:
      'Scan every cell. When you find unvisited land, increment the count and flood-fill (DFS or BFS) to mark the whole island visited.',
    complexity: 'O(rows × cols) time',
  },
  {
    title: 'Rotting Oranges',
    category: 'Graphs',
    question:
      'In a grid, rotten oranges spread to adjacent fresh oranges every minute. Return the minutes until none are fresh, or -1 if impossible.',
    pattern: 'Multi-Source BFS',
    approach:
      'Enqueue every rotten orange at once and BFS level by level, where each level is one minute. At the end, if any fresh orange remains return -1.',
    complexity: 'O(rows × cols) time',
  },
  {
    title: 'Course Schedule',
    category: 'Graphs',
    question:
      'Given a number of courses and prerequisite pairs, determine whether you can finish all courses.',
    pattern: 'Topological Sort',
    approach:
      'Build a graph and in-degree counts. Start a queue with all courses that have no prerequisites, removing edges as you process them (Kahn’s algorithm). If you process every course there is no cycle.',
    complexity: 'O(V + E) time',
  },
  {
    title: 'Number of Connected Components',
    category: 'Graphs',
    question:
      'Given n nodes and a list of undirected edges, count the connected components.',
    pattern: 'Union Find',
    approach:
      'Start with every node as its own set. Union the endpoints of each edge, decrementing the component count whenever two different sets merge. Use path compression and union by rank.',
    complexity: 'O(E · α(n)) time',
  },
  {
    title: 'Binary Tree Level Order Traversal',
    category: 'Trees',
    question: 'Return the values of a binary tree grouped level by level.',
    pattern: 'Tree BFS',
    approach:
      'Use a queue. For each level, record the queue’s current size, pop that many nodes into a list, and enqueue their children.',
    complexity: 'O(n) time',
  },
  {
    title: 'Validate Binary Search Tree',
    category: 'Trees',
    question: 'Determine whether a binary tree is a valid binary search tree.',
    pattern: 'Tree DFS',
    approach:
      'Recurse with the allowed (min, max) range for each node. Going left tightens the max to the parent value; going right tightens the min.',
    complexity: 'O(n) time, O(h) space',
  },
  {
    title: 'Lowest Common Ancestor of a Binary Tree',
    category: 'Trees',
    question: 'Find the lowest common ancestor of two nodes in a binary tree.',
    pattern: 'Tree DFS',
    approach:
      'Recurse into both subtrees. If a node is one of the targets, return it. If both sides return non-null, the current node is the LCA; otherwise pass up whichever side is non-null.',
    complexity: 'O(n) time',
  },
  {
    title: 'Subsets',
    category: 'Backtracking',
    question: 'Given an array of distinct integers, return all possible subsets.',
    pattern: 'Backtracking',
    approach:
      'Recurse through the array, choosing at each index to include or skip the element, adding the current path to the result at every step. Undo the choice after recursing.',
    complexity: 'O(n · 2ⁿ) time',
  },
  {
    title: 'Combination Sum',
    category: 'Backtracking',
    question:
      'Given candidate numbers (reusable) and a target, return all unique combinations that sum to the target.',
    pattern: 'Backtracking',
    approach:
      'DFS with a running sum and a start index (so combinations aren’t repeated in different orders). Allow reusing the current number, and prune when the sum exceeds the target.',
    complexity: 'Exponential in the worst case',
  },
  {
    title: 'Climbing Stairs',
    category: 'Dynamic Programming',
    question:
      'You can climb 1 or 2 steps at a time. How many distinct ways are there to reach step n?',
    pattern: 'Dynamic Programming (1D)',
    approach:
      'ways(n) = ways(n − 1) + ways(n − 2), the same recurrence as Fibonacci. Keep only the last two values.',
    complexity: 'O(n) time, O(1) space',
  },
  {
    title: 'Coin Change',
    category: 'Dynamic Programming',
    question:
      'Given coin denominations and an amount, return the fewest coins needed to make that amount, or -1.',
    pattern: 'Dynamic Programming (Unbounded Knapsack)',
    approach:
      'dp[a] = min over coins c of dp[a − c] + 1, with dp[0] = 0 and everything else starting at infinity. Build up from 1 to the amount.',
    complexity: 'O(amount × coins) time',
  },
  {
    title: 'Longest Common Subsequence',
    category: 'Dynamic Programming',
    question: 'Return the length of the longest common subsequence of two strings.',
    pattern: 'Dynamic Programming (2D)',
    approach:
      'dp[i][j] is the LCS of the first i and j characters. If the characters match, dp[i][j] = dp[i−1][j−1] + 1; otherwise take the max of dropping one character from either string.',
    complexity: 'O(m × n) time',
  },
  {
    title: 'Daily Temperatures',
    category: 'Stack',
    question:
      'For each day, find how many days you have to wait for a warmer temperature (0 if never).',
    pattern: 'Monotonic Stack',
    approach:
      'Keep a stack of indices with decreasing temperatures. For each new day, pop every colder day off the stack and record the distance; then push the current day.',
    complexity: 'O(n) time',
  },
  {
    title: 'Valid Parentheses',
    category: 'Stack',
    question: 'Determine whether a string of brackets ()[]{} is properly opened and closed.',
    pattern: 'Stack',
    approach:
      'Push opening brackets. On a closing bracket, the top of the stack must be its matching opener; pop it. The string is valid if the stack is empty at the end.',
    complexity: 'O(n) time',
  },
  {
    title: 'Subarray Sum Equals K',
    category: 'Hash Map',
    question: 'Count the contiguous subarrays whose sum equals k (values may be negative).',
    pattern: 'Prefix Sum + Hash Map',
    approach:
      'Track the running prefix sum and a map of how many times each prefix sum has occurred. At each index, add the count of (prefix − k) to the answer.',
    complexity: 'O(n) time, O(n) space',
  },
  {
    title: 'Find All Missing Numbers',
    category: 'Cyclic Sort',
    question:
      'An array of length n contains numbers from 1 to n, some repeated. Find all numbers that are missing without extra space.',
    pattern: 'Cyclic Sort',
    approach:
      'Place each number at index value − 1 by swapping until every position holds its correct value or a duplicate. Indices whose value doesn’t match are the missing numbers. (Or mark seen values by negating.)',
    complexity: 'O(n) time, O(1) space',
  },
  {
    title: 'Implement Trie / Word Search II',
    category: 'Backtracking',
    question:
      'Given a grid of letters and a list of words, find every word that can be formed from adjacent cells.',
    pattern: 'Trie + Backtracking',
    approach:
      'Insert all words into a trie. DFS from each cell, following trie children as you go and stopping as soon as the prefix isn’t in the trie. Record words when you reach a word-ending node.',
    complexity: 'O(cells × 4^L) worst case',
  },
  {
    title: 'Jump Game',
    category: 'Greedy',
    question:
      'Each element is your max jump length from that position. Can you reach the last index?',
    pattern: 'Greedy',
    approach:
      'Walk the array tracking the farthest index reachable so far. If you ever stand on an index beyond that reach, return false; if the reach covers the last index, return true.',
    complexity: 'O(n) time, O(1) space',
  },
];
