# Borrow closed-lid hardware comparison

November 18, 2026 · Eastern time

Borrow 0.3.0 on Mac14,9 with macOS 27.0.1, on AC power with only the built-in display detected at preflight. Connectivity probing was off. An existing background keep-awake service was paused before the comparison and restored afterward. macOS separately confirmed that the Experimental AC system-sleep assertion belonged to Borrow’s helper.

| Mode | Sampled closed-lid window | Elapsed span | Closed samples | Largest gap between closed samples | Codex events between closed samples | Sleep / wake notifications during run | Borrow hold release |
|---|---|---:|---:|---:|---:|---:|---|
| Off comparison | 08:18:17–08:24:06 | 5m 49s | 30 | 299s | 0 | 1 / 1 | No hold requested |
| Experimental AC, short run | 08:30:25–08:32:47 | 2m 22s | 136 | 2s | 8 | 1 / 0 | Confirmed (deadline) |
| Experimental AC, repeat | 08:46:00–08:53:04 | 7m 4s | 405 | 2s | 10 | 1 / 1 | Confirmed (recorder stopped) |

The elapsed span measures the interval between the first and last closed-lid samples, including any intervening gaps. In Off mode, macOS reported sleep and wake notifications and Borrow recorded a long sampling gap.

The first Experimental AC attempt had a shorter closed interval because its deadline was already approaching when the lid closed. During the repeat, a clean Swift build and test run started and finished inside the sampled closed-lid window. The test runner discovered 73 tests. Of those, 70 passed and three opt-in integration tests were skipped. The build log was written from 08:46:55 to 08:47:12 ET.

Lifecycle events are counted when observed in the log. An event’s append time can lag execution. The clean build is separate evidence of completed local work. This comparison covers one Mac and setup. Provider connectivity, battery-only operation, and actual post-release sleep remain unverified. The global power settings snapshot matched before and after the repeat.
