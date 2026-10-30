"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useMotion } from "../MotionProvider";
import { featuredProjects } from "./projects";
import styles from "./featured-projects.module.css";

export default function FeaturedProjects() {
  const section = useRef<HTMLElement>(null);
  const { paused, togglePaused } = useMotion();
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [viewportRef, carousel] = useEmblaCarousel({
    align: "start",
    loop: true,
    watchDrag: (_api, event) => !(event.target instanceof Element && event.target.closest("video, a, button, pre")),
  });
  const running = !paused && visible && pageVisible;

  useEffect(() => {
    if (!carousel) return;
    const update = () => setSelected(carousel.selectedScrollSnap());
    const startDrag = () => setDragging(true);
    const endDrag = () => setDragging(false);
    update();
    carousel.on("select", update).on("reInit", update).on("pointerDown", startDrag).on("pointerUp", endDrag);
    return () => {
      carousel.off("select", update).off("reInit", update).off("pointerDown", startDrag).off("pointerUp", endDrag);
    };
  }, [carousel]);

  useEffect(() => {
    if (!section.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(section.current);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", updateVisibility); };
  }, []);

  useEffect(() => {
    if (!carousel || !running || dragging) return;
    const timer = window.setTimeout(() => {
      carousel.scrollNext(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [carousel, selected, running, dragging]);

  useEffect(() => {
    section.current?.querySelectorAll("video").forEach(video => {
      if (running && video.closest("article")?.getAttribute("aria-hidden") === "false") {
        video.muted = true;
        void video.play().catch(() => {});
      } else video.pause();
    });
  }, [selected, running]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof Element && event.target.closest("pre"))) return;
    const destinations: Record<string, number> = {
      ArrowLeft: (selected - 1 + featuredProjects.length) % featuredProjects.length,
      ArrowRight: (selected + 1) % featuredProjects.length,
      Home: 0,
      End: featuredProjects.length - 1,
    };
    if (event.key in destinations) {
      event.preventDefault();
      const index = destinations[event.key];
      carousel?.scrollTo(index, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setAnnouncement(featuredProjects[index].name);
    }
  }

  return (
    <section ref={section} className={styles.section} aria-labelledby="featured-projects-title" aria-roledescription="carousel" onKeyDown={handleKeyDown}>
      <div className="column-heading">
        <h2 id="featured-projects-title">Featured projects</h2>
        <a className="subtle-link" href="https://github.com/Figo5?tab=repositories" target="_blank" rel="noopener noreferrer">All projects</a>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div className={styles.viewport} ref={viewportRef} tabIndex={0} role="group" aria-label="Project examples. Swipe or use left and right arrow keys to change projects.">
        <div className={styles.track}>
          {featuredProjects.map((project, index) => (
            <article className={styles.slide} key={project.url} aria-roledescription="slide" aria-label={`${index + 1} of ${featuredProjects.length}: ${project.name}`} aria-hidden={index !== selected} inert={index !== selected}>
              <div className={styles.details}>
                <h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a></h3>
                <p className={styles.description}>{project.description}</p>
                <div className={styles.meta}>
                  <p className={styles.stack}>{project.stack}{project.stage && ` · ${project.stage}`}</p>
                  <div className={styles.links}>
                    {project.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.name}: ${link.label}`}>{link.label}</a>)}
                  </div>
                </div>
              </div>
              <figure className={styles.visual}>
                <div className={`${styles.media}${project.media.type === "code" ? ` ${styles.terminal}` : ""}`}>
                  {project.media.type === "image" ? (
                    <img src={project.media.src} alt={project.media.alt} width={project.media.width} height={project.media.height} loading={index === 0 ? "eager" : "lazy"} decoding="async" draggable={false} />
                  ) : project.media.type === "video" ? (
                    <video src={index === selected ? project.media.src : undefined} poster={project.media.poster} width={project.media.width} height={project.media.height} aria-label={project.media.label} autoPlay={index === selected && running} muted loop playsInline preload="none">
                      <a href={project.media.src}>Open the AgentOps demo</a>
                    </video>
                  ) : (
                    <pre className={styles.output} tabIndex={0} role="region" aria-label={`${project.name} CLI example`}><code><span className={styles.command}>{project.media.command}</span>{"\n\n"}{project.media.output}</code></pre>
                  )}
                </div>
                <figcaption className="sr-only">{project.caption}</figcaption>
              </figure>
            </article>
          ))}
        </div>
      </div>
      <div className={styles.footer}><button className={styles.pause} type="button" aria-pressed={paused} onClick={togglePaused}>{paused ? "Resume motion" : "Pause motion"}</button></div>
    </section>
  );
}
