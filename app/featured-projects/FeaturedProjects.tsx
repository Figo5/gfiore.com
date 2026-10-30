"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { featuredProjects } from "./projects";
import styles from "./featured-projects.module.css";

export default function FeaturedProjects() {
  const [selected, setSelected] = useState(0);
  const [viewportRef, carousel] = useEmblaCarousel({
    align: "start",
    loop: false,
    watchDrag: (_api, event) => !(event.target instanceof Element && event.target.closest("video, a, button, pre")),
  });

  useEffect(() => {
    if (!carousel) return;
    function update() {
      if (!carousel) return;
      const next = carousel.selectedScrollSnap();
      setSelected(next);
      carousel.slideNodes().forEach((slide, index) => {
        if (index !== next) slide.querySelector("video")?.pause();
      });
    }
    update();
    carousel.on("select", update).on("reInit", update);
    return () => { carousel.off("select", update).off("reInit", update); };
  }, [carousel]);

  function select(index: number) {
    carousel?.scrollTo(index, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof Element && event.target.closest("video, pre"))) return;
    const destinations: Record<string, number> = { ArrowLeft: Math.max(0, selected - 1), ArrowRight: Math.min(featuredProjects.length - 1, selected + 1), Home: 0, End: featuredProjects.length - 1 };
    if (event.key in destinations) {
      event.preventDefault();
      select(destinations[event.key]);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="featured-projects-title" aria-roledescription="carousel">
      <div className="column-heading">
        <h2 id="featured-projects-title">Featured projects</h2>
        <a className="subtle-link" href="https://github.com/Figo5?tab=repositories" target="_blank" rel="noopener noreferrer">All projects</a>
      </div>
      <div className={styles.controls}>
        <select className={styles.picker} aria-label="Choose a featured project" aria-controls="featured-project-slides" value={selected} onChange={event => select(Number(event.target.value))}>
          {featuredProjects.map((project, index) => <option key={project.url} value={index}>{project.name}</option>)}
        </select>
        <div className={styles.navigation}>
          <button type="button" aria-label="Previous project" disabled={!carousel || selected === 0} onClick={() => select(selected - 1)}>Previous</button>
          <span className={styles.counter} aria-hidden="true">{selected + 1} / {featuredProjects.length}</span>
          <button type="button" aria-label="Next project" disabled={!carousel || selected === featuredProjects.length - 1} onClick={() => select(selected + 1)}>Next</button>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{featuredProjects[selected].name}, project {selected + 1} of {featuredProjects.length}.</p>
      <div className={styles.viewport} ref={viewportRef} tabIndex={0} role="group" aria-label="Project examples. Use left and right arrow keys to change projects." onKeyDown={handleKeyDown}>
        <div className={styles.track} id="featured-project-slides">
          {featuredProjects.map((project, index) => (
            <article className={styles.slide} key={project.url} aria-roledescription="slide" aria-label={`${index + 1} of ${featuredProjects.length}: ${project.name}`} aria-hidden={index !== selected} inert={index !== selected}>
              <figure className={styles.visual}>
                <div className={styles.media}>
                  {project.media.type === "image" ? (
                    <img src={project.media.src} alt={project.media.alt} width={project.media.width} height={project.media.height} loading={index === 0 ? "eager" : "lazy"} decoding="async" draggable={false} />
                  ) : project.media.type === "video" ? (
                    <video src={index === selected ? project.media.src : undefined} poster={project.media.poster} width={project.media.width} height={project.media.height} aria-label={project.media.label} controls playsInline preload="none">
                      <a href={project.media.src}>Open the AgentOps demo</a>
                    </video>
                  ) : (
                    <pre className={styles.output} tabIndex={0} role="region" aria-label={`${project.name} CLI example`}><code><span className={styles.command}>{project.media.command}</span>{"\n\n"}{project.media.output}</code></pre>
                  )}
                </div>
                <figcaption className="sr-only">{project.caption}</figcaption>
              </figure>
              <div className={styles.details}>
                <div>
                  <h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a></h3>
                  <p className={styles.description}>{project.description}</p>
                  <p className={styles.stack}>{project.stack}{project.stage && ` · ${project.stage}`}</p>
                </div>
                <div className={styles.links}>
                  {project.media.type === "image" && <a href={project.media.src} target="_blank" rel="noopener noreferrer" aria-label={`${project.name}: view full-size image`}>Full-size image</a>}
                  {project.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.name}: ${link.label}`}>{link.label}</a>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
