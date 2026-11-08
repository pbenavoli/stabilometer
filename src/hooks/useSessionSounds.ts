/*
Copyright (C) 2026 Patrick Benavoli

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://gnu.org>.
*/

import { useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';

const startSound = require('../../assets/sounds/session-start.wav');
const endSound = require('../../assets/sounds/session-end.wav');

const MAX_LOAD_RETRIES = 5;
const RETRY_DELAY_MS = 300;
/** How long to wait before checking that playback actually started, ms. Must be less than the clip length. */
const PLAYBACK_VERIFY_DELAY_MS = 80;

/** Loads one audio cue and returns a play() that's safe to call repeatedly, back-to-back. */
function usePlayableSound(source: AudioSource, label: string) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  // If play() is requested before the asset finishes loading, remember to play it once ready.
  const pendingRef = useRef(false);
  const retryCountRef = useRef(0);

  const attemptPlay = (retryCount: number = 0) => {
    // pause() first: replaying a clip that just finished can silently no-op on iOS unless the
    // player is explicitly reset before scheduling playback again from position 0.
    // player.pause();
    player.seekTo(0);
    player.play();

    if (retryCount > 100) return; // avoid retrying forever if the device is genuinely silent/muted
    setTimeout(() => {
      if (!player.playing) {
        console.warn(`[useSessionSounds] "${label}" did not actually start playing — attempting retry "${retryCount + 1}"`);
        attemptPlay(retryCount + 1);
      }
    }, PLAYBACK_VERIFY_DELAY_MS);
  };

  const play = () => {
    if (!status.isLoaded) {
      pendingRef.current = true;
      return;
    }
    try {
      attemptPlay();
    } catch (err) {
      console.warn(`[useSessionSounds] "${label}" play() threw:`, err);
    }
  };

  // In Expo Go, local assets load over the dev-server network connection and can fail
  // transiently (especially right after a reload) — retry instead of staying silent forever.
  useEffect(() => {
    if (!status.error) return;
    console.warn(`[useSessionSounds] "${label}" failed to load:`, status.error);
    if (retryCountRef.current >= MAX_LOAD_RETRIES) {
      console.warn(`[useSessionSounds] "${label}" giving up after ${MAX_LOAD_RETRIES} retries`);
      return;
    }
    retryCountRef.current += 1;
    const attempt = retryCountRef.current;
    const timer = setTimeout(() => {
      player.replace(source);
    }, RETRY_DELAY_MS * attempt);
    return () => clearTimeout(timer);
  }, [status.error, label, player, source]);

  useEffect(() => {
    if (status.isLoaded) {
      retryCountRef.current = 0;
    }
    if (pendingRef.current && status.isLoaded) {
      pendingRef.current = false;
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.isLoaded]);

  return play;
}

/** Gap between repeated start blips, ms — long enough to sound like distinct beeps, not one blur. */
const START_REPEAT_GAP_MS = 1000;

/** Plays short, non-visual audio cues so a self-measuring user knows when recording starts/ends. */
export function useSessionSounds() {
  // Fixed number of hook calls, per Rules of Hooks — not a dynamic loop.
  // const startPlayers = [
  //   usePlayableSound(startSound, 'start beep 1'),
  //   usePlayableSound(startSound, 'start beep 2'),
  //   usePlayableSound(startSound, 'start beep 3'),
  // ];
  const startPlayer = usePlayableSound(startSound, 'start beep');
  const playEnd = usePlayableSound(endSound, 'end beep');

  /** Plays the start blip `count` times in a row (e.g. 2 blips for trial 2) so users can tell trials apart by ear. */
  // const playStart = (count: number = 1) => {
  //   for (let i = 0; i < count; i++) {
  //     const player = startPlayers[i % START_PLAYER_POOL_SIZE];
  //     setTimeout(player, i * START_REPEAT_GAP_MS);
  //   }
  // };
  const playStart = (count: number = 1) => {
    for (let i = 0; i < count; i++) {
      setTimeout(startPlayer, i * START_REPEAT_GAP_MS);
    }
  };

  return { playStart, playEnd };
}
