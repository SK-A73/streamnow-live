import {
  Room,
  RoomEvent,
  VideoPresets,
  createLocalVideoTrack,
  createLocalAudioTrack,
  Track
} from 'livekit-client';

/**
 * Service to manage LiveKit room connections and tracks
 */
export class LiveKitStreamManager {
  constructor() {
    this.room = null;
    this.localVideoTrack = null;
    this.localAudioTrack = null;
  }

  /**
   * Acquire local preview video track (for testing webcam before going live)
   */
  async getLocalPreview() {
    try {
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
      }
      this.localVideoTrack = await createLocalVideoTrack({
        resolution: VideoPresets.h720.resolution,
        facingMode: 'user'
      });
      return this.localVideoTrack;
    } catch (err) {
      console.error('Failed to get local camera track:', err);
      throw err;
    }
  }

  /**
   * Connect and start publishing as Streamer
   */
  async startBroadcast({ url, token, videoElement }) {
    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution
        }
      });

      // Prepare tracks if not already created
      if (!this.localVideoTrack) {
        this.localVideoTrack = await createLocalVideoTrack({
          resolution: VideoPresets.h720.resolution,
          facingMode: 'user'
        });
      }

      if (!this.localAudioTrack) {
        this.localAudioTrack = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true
        });
      }

      // Attach local preview to video element
      if (videoElement && this.localVideoTrack) {
        this.localVideoTrack.attach(videoElement);
      }

      // Connect to LiveKit Room
      await this.room.connect(url, token);
      console.log('✅ Connected to LiveKit Room as Streamer:', this.room.name);

      // Publish Video & Audio tracks
      await this.room.localParticipant.publishTrack(this.localVideoTrack);
      await this.room.localParticipant.publishTrack(this.localAudioTrack);
      console.log('✅ Published local camera & microphone tracks to LiveKit');

      return {
        room: this.room,
        videoTrack: this.localVideoTrack,
        audioTrack: this.localAudioTrack
      };
    } catch (err) {
      console.error('Failed to start broadcast:', err);
      this.cleanup();
      throw err;
    }
  }

  /**
   * Connect as Visitor and subscribe to stream tracks
   */
  async watchBroadcast({ url, token, videoElement, audioElement, onTrackSubscribed, onDisconnected }) {
    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log(`📡 Track Subscribed: kind=${track.kind}, from=${participant.identity}`);
        if (track.kind === Track.Kind.Video && videoElement) {
          track.attach(videoElement);
        } else if (track.kind === Track.Kind.Audio && audioElement) {
          track.attach(audioElement);
        }

        if (onTrackSubscribed) {
          onTrackSubscribed(track, publication, participant);
        }
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track) => {
        console.log(`🔌 Track Unsubscribed: kind=${track.kind}`);
        track.detach();
      });

      this.room.on(RoomEvent.Disconnected, (reason) => {
        console.log('Room disconnected:', reason);
        if (onDisconnected) {
          onDisconnected(reason);
        }
      });

      await this.room.connect(url, token);
      console.log('✅ Connected to LiveKit Room as Visitor:', this.room.name);

      // Handle any tracks already published by participants currently in room
      for (const participant of this.room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (publication.track) {
            if (publication.track.kind === Track.Kind.Video && videoElement) {
              publication.track.attach(videoElement);
            } else if (publication.track.kind === Track.Kind.Audio && audioElement) {
              publication.track.attach(audioElement);
            }
            if (onTrackSubscribed) {
              onTrackSubscribed(publication.track, publication, participant);
            }
          }
        }
      }

      return this.room;
    } catch (err) {
      console.error('Failed to watch broadcast:', err);
      this.cleanup();
      throw err;
    }
  }

  /**
   * Toggle camera video
   */
  toggleCamera(enabled) {
    if (this.localVideoTrack) {
      if (enabled) {
        this.localVideoTrack.unmute();
      } else {
        this.localVideoTrack.mute();
      }
      return !this.localVideoTrack.isMuted;
    }
    return false;
  }

  /**
   * Toggle microphone audio
   */
  toggleMicrophone(enabled) {
    if (this.localAudioTrack) {
      if (enabled) {
        this.localAudioTrack.unmute();
      } else {
        this.localAudioTrack.mute();
      }
      return !this.localAudioTrack.isMuted;
    }
    return false;
  }

  /**
   * Cleanup and disconnect everything
   */
  cleanup() {
    if (this.localVideoTrack) {
      try {
        this.localVideoTrack.stop();
        this.localVideoTrack.detach();
      } catch (e) {
        console.warn('Error stopping video track:', e);
      }
      this.localVideoTrack = null;
    }

    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop();
        this.localAudioTrack.detach();
      } catch (e) {
        console.warn('Error stopping audio track:', e);
      }
      this.localAudioTrack = null;
    }

    if (this.room) {
      try {
        this.room.disconnect();
      } catch (e) {
        console.warn('Error disconnecting room:', e);
      }
      this.room = null;
    }
  }
}
