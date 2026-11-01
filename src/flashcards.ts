export interface Flashcard {
  title: string;
  category: string; // broad grouping used by the study filter
  question: string;
  pattern: string; // headline answer: the algorithm pattern or the key concept
  approach: string;
  complexity?: string;
  solution?: string; // reference implementation shown under the approach
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
    solution: `def two_sum(nums: list[int], target: int) -> list[int]:
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1
        else:
            right -= 1
    return []`,
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
    solution: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}  # value -> index
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []`,
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
    solution: `def length_of_longest_substring(s: str) -> int:
    last_seen: dict[str, int] = {}
    left = best = 0
    for right, char in enumerate(s):
        if last_seen.get(char, -1) >= left:
            left = last_seen[char] + 1
        last_seen[char] = right
        best = max(best, right - left + 1)
    return best`,
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
    solution: `from collections import Counter


def min_window(s: str, t: str) -> str:
    need = Counter(t)
    missing = len(t)
    left = 0
    best: tuple[int, int] = (0, 0)
    for right, char in enumerate(s, 1):
        if need[char] > 0:
            missing -= 1
        need[char] -= 1
        if missing == 0:
            # Shrink from the left while the window stays valid
            while need[s[left]] < 0:
                need[s[left]] += 1
                left += 1
            if best == (0, 0) or right - left < best[1] - best[0]:
                best = (left, right)
            need[s[left]] += 1
            missing += 1
            left += 1
    return s[best[0] : best[1]]`,
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
    solution: `def max_area(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        width = right - left
        best = max(best, width * min(height[left], height[right]))
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best`,
  },
  {
    title: '3Sum',
    category: 'Two Pointers',
    question: 'Find all unique triplets in an array that sum to zero.',
    pattern: 'Sorting + Two Pointers',
    approach:
      'Sort the array. Fix each element in turn, then run a two-pointer search on the rest for pairs summing to its negative. Skip duplicate values to keep triplets unique.',
    complexity: 'O(n²) time',
    solution: `def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    result: list[list[int]] = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue  # skip duplicate anchors
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
    return result`,
  },
  {
    title: 'Linked List Cycle',
    category: 'Fast & Slow Pointers',
    question: 'Determine whether a linked list contains a cycle.',
    pattern: 'Fast & Slow Pointers',
    approach:
      'Move one pointer one step and another two steps at a time. If they ever meet there is a cycle; if the fast pointer reaches null there is not.',
    complexity: 'O(n) time, O(1) space',
    solution: `class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next


def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
  },
  {
    title: 'Find the Middle of a Linked List',
    category: 'Fast & Slow Pointers',
    question: 'Return the middle node of a singly linked list in a single pass.',
    pattern: 'Fast & Slow Pointers',
    approach:
      'Advance slow by one and fast by two. When fast reaches the end, slow is at the middle.',
    complexity: 'O(n) time, O(1) space',
    solution: `class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next


def middle_node(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow`,
  },
  {
    title: 'Merge Intervals',
    category: 'Intervals',
    question: 'Given a list of intervals, merge all overlapping intervals.',
    pattern: 'Intervals (Sort + Sweep)',
    approach:
      'Sort by start time. Walk the list, extending the last merged interval when the current one overlaps it, otherwise starting a new merged interval.',
    complexity: 'O(n log n) time',
    solution: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda interval: interval[0])
    merged: list[list[int]] = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
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
    solution: `import heapq


def min_meeting_rooms(intervals: list[list[int]]) -> int:
    end_times: list[int] = []  # min-heap of end times for rooms in use
    for start, end in sorted(intervals):
        if end_times and end_times[0] <= start:
            heapq.heappop(end_times)  # reuse the room that frees up first
        heapq.heappush(end_times, end)
    return len(end_times)`,
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
    solution: `def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:  # left half is sorted
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:  # right half is sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1`,
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
    solution: `def min_eating_speed(piles: list[int], h: int) -> int:
    low, high = 1, max(piles)
    while low < high:
        speed = (low + high) // 2
        hours = sum((pile + speed - 1) // speed for pile in piles)  # ceil
        if hours <= h:
            high = speed
        else:
            low = speed + 1
    return low`,
  },
  {
    title: 'Kth Largest Element in an Array',
    category: 'Heap',
    question: 'Find the kth largest element in an unsorted array.',
    pattern: 'Top K Elements (Heap)',
    approach:
      'Keep a min-heap of size k. Push each number and pop whenever the heap exceeds k. The top of the heap is the kth largest. (Quickselect gives O(n) on average.)',
    complexity: 'O(n log k) time, O(k) space',
    solution: `import heapq


def find_kth_largest(nums: list[int], k: int) -> int:
    heap: list[int] = []  # min-heap of the k largest seen so far
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`,
  },
  {
    title: 'Merge K Sorted Lists',
    category: 'Heap',
    question: 'Merge k sorted linked lists into one sorted list.',
    pattern: 'K-Way Merge (Heap)',
    approach:
      'Push the head of each list into a min-heap. Repeatedly pop the smallest node, append it to the result, and push its next node.',
    complexity: 'O(N log k) time',
    solution: `import heapq


class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next


def merge_k_lists(lists: list[ListNode | None]) -> ListNode | None:
    # The list index breaks ties so nodes are never compared directly
    heap: list[tuple[int, int, ListNode]] = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))
    dummy = tail = ListNode()
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = node
        tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next`,
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
    solution: `def num_islands(grid: list[list[str]]) -> int:
    rows, cols = len(grid), len(grid[0])

    def sink(r: int, c: int) -> None:
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "0"  # mark visited
        sink(r + 1, c)
        sink(r - 1, c)
        sink(r, c + 1)
        sink(r, c - 1)

    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count`,
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
    solution: `from collections import deque


def oranges_rotting(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    queue: deque[tuple[int, int]] = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1

    minutes = 0
    while queue and fresh:
        minutes += 1
        for _ in range(len(queue)):  # one BFS level = one minute
            r, c = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
    return -1 if fresh else minutes`,
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
    solution: `from collections import deque


def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph: list[list[int]] = [[] for _ in range(num_courses)]
    in_degree = [0] * num_courses
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1

    queue = deque(c for c in range(num_courses) if in_degree[c] == 0)
    taken = 0
    while queue:
        prereq = queue.popleft()
        taken += 1
        for course in graph[prereq]:
            in_degree[course] -= 1
            if in_degree[course] == 0:
                queue.append(course)
    return taken == num_courses`,
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
    solution: `def count_components(n: int, edges: list[list[int]]) -> int:
    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path compression (halving)
            x = parent[x]
        return x

    components = n
    for a, b in edges:
        root_a, root_b = find(a), find(b)
        if root_a == root_b:
            continue
        if rank[root_a] < rank[root_b]:
            root_a, root_b = root_b, root_a
        parent[root_b] = root_a  # union by rank
        if rank[root_a] == rank[root_b]:
            rank[root_a] += 1
        components -= 1
    return components`,
  },
  {
    title: 'Binary Tree Level Order Traversal',
    category: 'Trees',
    question: 'Return the values of a binary tree grouped level by level.',
    pattern: 'Tree BFS',
    approach:
      'Use a queue. For each level, record the queue’s current size, pop that many nodes into a list, and enqueue their children.',
    complexity: 'O(n) time',
    solution: `from collections import deque


class TreeNode:
    def __init__(
        self,
        val: int = 0,
        left: "TreeNode | None" = None,
        right: "TreeNode | None" = None,
    ):
        self.val = val
        self.left = left
        self.right = right


def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    levels: list[list[int]] = []
    queue = deque([root])
    while queue:
        level: list[int] = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        levels.append(level)
    return levels`,
  },
  {
    title: 'Validate Binary Search Tree',
    category: 'Trees',
    question: 'Determine whether a binary tree is a valid binary search tree.',
    pattern: 'Tree DFS',
    approach:
      'Recurse with the allowed (min, max) range for each node. Going left tightens the max to the parent value; going right tightens the min.',
    complexity: 'O(n) time, O(h) space',
    solution: `class TreeNode:
    def __init__(
        self,
        val: int = 0,
        left: "TreeNode | None" = None,
        right: "TreeNode | None" = None,
    ):
        self.val = val
        self.left = left
        self.right = right


def is_valid_bst(root: TreeNode | None) -> bool:
    def check(node: TreeNode | None, low: float, high: float) -> bool:
        if not node:
            return True
        if not low < node.val < high:
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, float("-inf"), float("inf"))`,
  },
  {
    title: 'Lowest Common Ancestor of a Binary Tree',
    category: 'Trees',
    question: 'Find the lowest common ancestor of two nodes in a binary tree.',
    pattern: 'Tree DFS',
    approach:
      'Recurse into both subtrees. If a node is one of the targets, return it. If both sides return non-null, the current node is the LCA; otherwise pass up whichever side is non-null.',
    complexity: 'O(n) time',
    solution: `class TreeNode:
    def __init__(
        self,
        val: int = 0,
        left: "TreeNode | None" = None,
        right: "TreeNode | None" = None,
    ):
        self.val = val
        self.left = left
        self.right = right


def lowest_common_ancestor(
    root: TreeNode | None, p: TreeNode, q: TreeNode
) -> TreeNode | None:
    if root is None or root is p or root is q:
        return root
    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)
    if left and right:
        return root  # p and q are in different subtrees
    return left or right`,
  },
  {
    title: 'Subsets',
    category: 'Backtracking',
    question: 'Given an array of distinct integers, return all possible subsets.',
    pattern: 'Backtracking',
    approach:
      'Recurse through the array, choosing at each index to include or skip the element, adding the current path to the result at every step. Undo the choice after recursing.',
    complexity: 'O(n · 2ⁿ) time',
    solution: `def subsets(nums: list[int]) -> list[list[int]]:
    result: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int) -> None:
        result.append(path.copy())
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()  # undo the choice

    backtrack(0)
    return result`,
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
    solution: `def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    result: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int, remaining: int) -> None:
        if remaining == 0:
            result.append(path.copy())
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remaining:
                continue  # prune
            path.append(candidates[i])
            backtrack(i, remaining - candidates[i])  # i, not i + 1: reuse allowed
            path.pop()

    backtrack(0, target)
    return result`,
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
    solution: `def climb_stairs(n: int) -> int:
    one_back, two_back = 1, 1  # ways to reach step 1 and step 0
    for _ in range(n - 1):
        one_back, two_back = one_back + two_back, one_back
    return one_back`,
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
    solution: `def coin_change(coins: list[int], amount: int) -> int:
    dp = [0] + [amount + 1] * amount  # amount + 1 acts as infinity
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a:
                dp[a] = min(dp[a], dp[a - coin] + 1)
    return dp[amount] if dp[amount] <= amount else -1`,
  },
  {
    title: 'Longest Common Subsequence',
    category: 'Dynamic Programming',
    question: 'Return the length of the longest common subsequence of two strings.',
    pattern: 'Dynamic Programming (2D)',
    approach:
      'dp[i][j] is the LCS of the first i and j characters. If the characters match, dp[i][j] = dp[i−1][j−1] + 1; otherwise take the max of dropping one character from either string.',
    complexity: 'O(m × n) time',
    solution: `def longest_common_subsequence(text1: str, text2: str) -> int:
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]`,
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
    solution: `def daily_temperatures(temperatures: list[int]) -> list[int]:
    answer = [0] * len(temperatures)
    stack: list[int] = []  # indices of days still waiting for a warmer one
    for i, temp in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < temp:
            prev = stack.pop()
            answer[prev] = i - prev
        stack.append(i)
    return answer`,
  },
  {
    title: 'Valid Parentheses',
    category: 'Stack',
    question: 'Determine whether a string of brackets ()[]{} is properly opened and closed.',
    pattern: 'Stack',
    approach:
      'Push opening brackets. On a closing bracket, the top of the stack must be its matching opener; pop it. The string is valid if the stack is empty at the end.',
    complexity: 'O(n) time',
    solution: `def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for char in s:
        if char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
        else:
            stack.append(char)
    return not stack`,
  },
  {
    title: 'Subarray Sum Equals K',
    category: 'Hash Map',
    question: 'Count the contiguous subarrays whose sum equals k (values may be negative).',
    pattern: 'Prefix Sum + Hash Map',
    approach:
      'Track the running prefix sum and a map of how many times each prefix sum has occurred. At each index, add the count of (prefix − k) to the answer.',
    complexity: 'O(n) time, O(n) space',
    solution: `from collections import defaultdict


def subarray_sum(nums: list[int], k: int) -> int:
    counts: defaultdict[int, int] = defaultdict(int)
    counts[0] = 1  # the empty prefix
    prefix = total = 0
    for num in nums:
        prefix += num
        total += counts[prefix - k]
        counts[prefix] += 1
    return total`,
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
    solution: `def find_disappeared_numbers(nums: list[int]) -> list[int]:
    i = 0
    while i < len(nums):
        correct = nums[i] - 1  # index where this value belongs
        if nums[i] != nums[correct]:
            nums[i], nums[correct] = nums[correct], nums[i]
        else:
            i += 1
    return [idx + 1 for idx, num in enumerate(nums) if num != idx + 1]`,
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
    solution: `from typing import Any


def find_words(board: list[list[str]], words: list[str]) -> list[str]:
    # Trie as nested dicts; "$" holds the word that ends at a node
    trie: dict[str, Any] = {}
    for word in words:
        node = trie
        for char in word:
            node = node.setdefault(char, {})
        node["$"] = word

    rows, cols = len(board), len(board[0])
    found: list[str] = []

    def dfs(r: int, c: int, parent: dict[str, Any]) -> None:
        char = board[r][c]
        node = parent.get(char)
        if node is None:
            return  # prefix not in the trie (or cell already used)
        if "$" in node:
            found.append(node.pop("$"))  # pop so each word is reported once
        board[r][c] = "#"  # mark visited on this path
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols:
                dfs(nr, nc, node)
        board[r][c] = char

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, trie)
    return found`,
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
    solution: `def can_jump(nums: list[int]) -> bool:
    reach = 0  # farthest index reachable so far
    for i, jump in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + jump)
    return True`,
  },
];
