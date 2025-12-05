(function () {
    /**
     * AnimationEngine - A robust, class-based animation loop manager.
     * Handles time management, keyframe interpolation, and playback state.
     * Designed to be framework-agnostic but easily integrated with React.
     */

    const Easing = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        cubicBezier: (p1x, p1y, p2x, p2y) => t => t, // Placeholder suitable for expansion
        spring: (t) => {
            const p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        }
    };

    class AnimationEngine {
        constructor() {
            // State
            this.isPlaying = false;
            this.currentTime = 0;
            this.duration = 5000;
            this.lastFrameTime = 0;
            this.playbackSpeed = 1.0;
            this.loop = true;

            // Data
            this.shapes = []; // Reference to shapes (or local copy)
            this.activeAnimation = null;
            this.keyframeTracks = new Map(); // Optimization: Map<ShapeID.Property, SortedKeyframes>

            // Callbacks
            this.onUpdate = null; // Function to call with updates { id, props }
            this.onFrame = null;  // Function to call on every frame (e.g. for UI time update)
            this.onComplete = null;

            this._animationFrameId = null;
        }

        /**
         * Initialize or update the engine with new data
         */
        setData(shapes, animation) {
            this.shapes = shapes || [];
            if (animation) {
                this.activeAnimation = animation;
                this.duration = animation.duration || 5000;
                this._preprocessKeyframes(animation.keyframes || []);
            }
        }

        /**
         * Optimize keyframes into tracks for O(1) lookup + Interpolation
         */
        _preprocessKeyframes(keyframes) {
            this.keyframeTracks.clear();

            // Group by shapeId and property
            // structure: shapeId -> property -> [keyframes]
            const tempMap = new Map();

            keyframes.forEach(kf => {
                if (!tempMap.has(kf.shapeId)) {
                    tempMap.set(kf.shapeId, {});
                }
                const shapeProps = tempMap.get(kf.shapeId);

                Object.keys(kf.properties).forEach(prop => {
                    if (!shapeProps[prop]) shapeProps[prop] = [];
                    shapeProps[prop].push({
                        time: kf.time,
                        value: kf.properties[prop],
                        interpolation: kf.interpolation || 'linear'
                    });
                });
            });

            // Sort tracks
            this.keyframeTracks = tempMap;
            this.keyframeTracks.forEach((props, shapeId) => {
                Object.keys(props).forEach(prop => {
                    props[prop].sort((a, b) => a.time - b.time);
                });
            });
        }

        /**
         * Main Animation Loop
         */
        play() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            this.lastFrameTime = performance.now();
            this._loop();
        }

        pause() {
            this.isPlaying = false;
            if (this._animationFrameId) {
                cancelAnimationFrame(this._animationFrameId);
            }
        }

        stop() {
            this.pause();
            this.currentTime = 0;
            this.emitUpdate();
        }

        seek(time) {
            this.currentTime = Math.max(0, Math.min(time, this.duration));
            this.emitUpdate(); // Force update at this frame
        }

        _loop() {
            if (!this.isPlaying) return;

            const now = performance.now();
            const deltaTime = now - this.lastFrameTime;
            this.lastFrameTime = now;

            // Update Time
            this.currentTime += deltaTime * this.playbackSpeed;

            if (this.currentTime >= this.duration) {
                if (this.loop) {
                    this.currentTime = 0;
                } else {
                    this.currentTime = this.duration;
                    this.pause();
                    if (this.onComplete) this.onComplete();
                }
            }

            // Calculate & Emit Updates
            this.emitUpdate();

            // Request next frame
            this._animationFrameId = requestAnimationFrame(() => this._loop());
        }

        /**
         * Calculate interpolated values for the current time
         */
        emitUpdate() {
            const updates = [];

            // If we have an onFrame callback (e.g. for Timeline UI scrubbing)
            if (this.onFrame) {
                this.onFrame(this.currentTime);
            }

            // Interpolate values
            this.keyframeTracks.forEach((props, shapeId) => {
                const shapeUpdates = {};
                let hasUpdates = false;

                Object.keys(props).forEach(prop => {
                    const track = props[prop];
                    const value = this._interpolate(track, this.currentTime);
                    if (value !== null) {
                        shapeUpdates[prop] = value;
                        hasUpdates = true;
                    }
                });

                if (hasUpdates) {
                    updates.push({ id: shapeId, props: shapeUpdates });
                }
            });

            // Send batch update to consumer (React App)
            if (this.onUpdate && updates.length > 0) {
                this.onUpdate(updates);
            }
        }

        /**
         * Linear/Easing Interpolation logic
         */
        _interpolate(track, time) {
            if (!track || track.length === 0) return null;

            // Pre-loop boundary
            if (time <= track[0].time) return track[0].value;

            // Post-loop boundary
            if (time >= track[track.length - 1].time) return track[track.length - 1].value;

            // Find surrounding keyframes
            // Optimization: Could use binary search for large tracks, but linear is fine for <100 keys
            for (let i = 0; i < track.length - 1; i++) {
                const prev = track[i];
                const next = track[i + 1];

                if (time >= prev.time && time < next.time) {
                    const duration = next.time - prev.time;
                    if (duration === 0) return prev.value;

                    let t = (time - prev.time) / duration;

                    // Apply Easing
                    const type = prev.interpolation || 'linear';
                    if (Easing[type]) {
                        t = Easing[type](t);
                    }

                    // Number interpolation
                    if (typeof prev.value === 'number') {
                        return prev.value + (next.value - prev.value) * t;
                    }

                    // Color/String interpolation could go here
                    return prev.value;
                }
            }
            return null;
        }
    }

    // Expose to window
    window.AnimationEngine = AnimationEngine;

})();
