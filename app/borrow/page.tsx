import type { Metadata } from "next";
import Link from "next/link";
import styles from "./borrow.module.css";

export const metadata: Metadata = {
  title: "Borrow — Gio Fiore",
  description: "A Swift app for recording local commands and Codex activity, with a closed-lid hardware comparison.",
};

export default function BorrowPage() {
  return (
    <main className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.topbar}>
        <Link className={styles.back} href="/"><span aria-hidden="true">← </span>Gio Fiore</Link>
      </nav>

      <header className={styles.header}>
        <h1>Borrow</h1>
        <p className={styles.projectMeta}>Swift · macOS · 0.3.0 development preview</p>
        <p className={styles.lede}>
          Borrow records local commands and activity from a selected Codex session. It can request a temporary wake hold and saves its observations in a local report.
        </p>
        <dl className={styles.facts}>
          <div>
            <dt>Machine</dt>
            <dd>Mac14,9</dd>
          </div>
          <div>
            <dt>OS</dt>
            <dd>macOS 27.0.1</dd>
          </div>
          <div>
            <dt>Power</dt>
            <dd>Charger connected</dd>
          </div>
          <div>
            <dt>Display</dt>
            <dd>Built-in only at preflight</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>November 18, 2026</dd>
          </div>
        </dl>
      </header>

      <section className={styles.section} aria-labelledby="walkthrough-title">
        <h2 id="walkthrough-title">Native walkthrough</h2>
        <figure className={styles.figure}>
          <div className={styles.videoFrame}>
            <video
              className={styles.video}
              src="/projects/borrow-walkthrough.mp4"
              poster="/projects/borrow-walkthrough.jpg"
              controls
              preload="metadata"
              playsInline
              aria-label="Borrow walkthrough"
              aria-describedby="borrow-walkthrough-summary"
            >
              <p>
                Your browser cannot play this video. <a href="/projects/borrow-walkthrough.mp4">Open the walkthrough video</a>.
              </p>
            </video>
          </div>
          <figcaption className={styles.figcaption}>
            <p id="borrow-walkthrough-summary">An open-lid rehearsal shows the wake hold activate. A separate saved report shows the closed-lid hardware trial and confirms release.</p>
            <p className={styles.videoLink}>
              <a href="/projects/borrow-walkthrough.mp4">Open the walkthrough video (MP4)</a>
            </p>
          </figcaption>
        </figure>
      </section>

      <section className={styles.section} aria-labelledby="comparison-title">
        <h2 id="comparison-title">Off vs Experimental AC</h2>
        <p className={styles.prose}>
          Off requests no hold. In Experimental AC mode, macOS confirmed that Borrow’s helper held the system-sleep assertion. Hermes’s keep-awake service was paused for the trials. Connectivity checks were off.
        </p>
        <p className={styles.prose}>The comparison uses the longer Experimental AC repeat. The hardware report includes the earlier 2 minute 22 second attempt, which ended at its deadline. Each span includes any gaps between closed-lid samples.</p>
        <div className={styles.tableWrap}>
          <table className={styles.comparison}>
            <caption>Measured Off and Experimental AC spans</caption>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Off</th>
                <th scope="col">Experimental AC</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Sampled closed-lid span</th>
                <td>5m 49s</td>
                <td>7m 04s</td>
              </tr>
              <tr>
                <th scope="row">Closed samples</th>
                <td>30</td>
                <td>405</td>
              </tr>
              <tr>
                <th scope="row">Longest gap</th>
                <td>299 s</td>
                <td>2 s</td>
              </tr>
              <tr>
                <th scope="row">Codex events between closed samples</th>
                <td>0</td>
                <td>10</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className={styles.notes}>
          <li>macOS logged before-sleep and wake notifications in both runs. Only Off showed a long sampling gap.</li>
          <li>The workload was uncontrolled, and Codex events can appear in the log after they occur.</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="build-title">
        <h2 id="build-title">Build and test run</h2>
        <p className={styles.prose}>
          During the Experimental AC repeat, a clean Borrow build and test run finished with the lid closed. The suite passed 70 tests and skipped three opt-in tests. Borrow confirmed hold release when the recorder stopped.
        </p>
        <p className={styles.prose}>The result covers one Mac on charger power. Provider connectivity, battery-only use, and actual sleep after release remain unverified.</p>
        <p className={styles.prose}><a href="/projects/borrow-hardware-comparison.md" download>Download the hardware report (.md)</a></p>
      </section>
    </main>
  );
}
