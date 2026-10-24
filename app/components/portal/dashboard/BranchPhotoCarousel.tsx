"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Button, Carousel } from "antd";
import { CaretRightOutlined, PauseOutlined } from "@ant-design/icons";
import type { DashboardPhoto } from "./types";
import styles from "./dashboard.module.css";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A small postcard of room cover photos beside the metrics — decoration, not a feature.
 * Fades slowly; stays still for people who ask the OS to reduce motion.
 */
export default function BranchPhotoCarousel({ photos }: { photos: DashboardPhoto[] }) {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];
  const canPlay = photos.length > 1 && !reduceMotion;

  return (
    <figure className={styles.postcard} aria-label="Hotel photos">
      {photos.length ? (
        <Carousel
          effect="fade"
          autoplay={canPlay && !paused}
          autoplaySpeed={6000}
          speed={1200}
          dots={false}
          draggable={false}
          pauseOnHover
          afterChange={setActive}
        >
          {photos.map((photo, index) => (
            <div key={photo.imageId}>
              <div className={styles.postcardPhoto}>
                <Image
                  src={photo.imageUrl}
                  alt={`${photo.branchName} · ${photo.imageCaption || "Hotel room"}`}
                  fill
                  sizes="320px"
                  loading={index === 0 ? "eager" : "lazy"}
                  unoptimized={!photo.imageUrl.startsWith("/")}
                  className={styles.postcardImage}
                />
              </div>
            </div>
          ))}
        </Carousel>
      ) : (
        <div className={styles.postcardPhoto} />
      )}
      <figcaption className={styles.postcardCaption}>
        <span className={styles.postcardText}>
          {current ? (
            <>
              <strong>{current.branchCode}</strong> · {current.imageCaption || "Hotel room"}
            </>
          ) : (
            "Sand & Sky"
          )}
        </span>
        {canPlay && (
          <Button
            type="text"
            size="small"
            icon={paused ? <CaretRightOutlined /> : <PauseOutlined />}
            aria-label={paused ? "Play hotel photos" : "Pause hotel photos"}
            onClick={() => setPaused((value) => !value)}
          />
        )}
      </figcaption>
    </figure>
  );
}
