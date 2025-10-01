/**
 * Sound effects manager
 * Plays audio for various events in the application
 */

class SoundEffects {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== "undefined") {
      // Load sound preferences from localStorage
      const savedVolume = localStorage.getItem("soundVolume");
      const savedEnabled = localStorage.getItem("soundEnabled");

      if (savedVolume) {
        this.volume = parseFloat(savedVolume);
      }
      if (savedEnabled !== null) {
        this.enabled = savedEnabled === "true";
      }
    }
  }

  /**
   * Preload a sound
   */
  private preload(key: string, url: string) {
    if (typeof window === "undefined" || this.sounds.has(key)) {
      return;
    }

    const audio = new Audio(url);
    audio.volume = this.volume;
    audio.preload = "auto";
    this.sounds.set(key, audio);
  }

  /**
   * Play a sound effect
   */
  play(key: string, url?: string) {
    if (!this.enabled || typeof window === "undefined") {
      return;
    }

    // If URL is provided and sound not preloaded, preload it first
    if (url && !this.sounds.has(key)) {
      this.preload(key, url);
    }

    const audio = this.sounds.get(key);
    if (!audio) {
      console.warn(`Sound effect "${key}" not found`);
      return;
    }

    // Reset and play
    audio.currentTime = 0;
    audio.volume = this.volume;
    audio.play().catch((err) => {
      console.warn("Failed to play sound:", err);
    });
  }

  /**
   * Set volume (0 to 1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update all loaded sounds
    this.sounds.forEach((audio) => {
      audio.volume = this.volume;
    });

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("soundVolume", this.volume.toString());
    }
  }

  /**
   * Enable or disable sounds
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("soundEnabled", enabled.toString());
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Play mission completion sound
   */
  missionComplete() {
    // Using a data URL for a simple success sound
    const successSound = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwNUKXm8LZjHAU7k9n1zn0vBSN1xe/bkUMKE12y6OyqWRUJQ5zd8sFuJAUug9Dx3I4+ChVmu/DlnlESC06k5fCzYiAFN5DX88yAMQYfcsXv3pFEChFdsOjsqloWCUKb3POyah4FMIbQ8dt/NAoYabzw5J1QEgxMouTwsmEfBTmQ1vPMezAHIXPF8N6RRQoRXK/o7KpZFgo/mdvzs2sgBTCFz/HbfzULF2i88OSeTRIMSpzh8LJhH4Y3jdTwzHkwByFwwPPekUULElyx6eq3rhYKPpjc87RsHwY2hsjzx39ABhtrvuLonFcTDklx3vCyYyAGN43F88h4MwcicLbq3ZlHDBJbiK1mq1oXCz6Sw/O0bCAGN4bI88Z/QgcdbLrj6JxYFg5IceHwsmIhBjaOxfPIdzQHIm+15NuYSAoSWoeI"; // Placeholder - would need actual sound file
    
    // In production, you would use real sound files
    // this.play("mission-complete", "/sounds/mission-complete.mp3");
    
    console.log("🎵 Mission complete sound");
  }

  /**
   * Play rank up sound
   */
  rankUp() {
    // In production: this.play("rank-up", "/sounds/rank-up.mp3");
    console.log("🎵 Rank up fanfare");
  }

  /**
   * Play new mission available sound
   */
  newMission() {
    // In production: this.play("new-mission", "/sounds/notification.mp3");
    console.log("🎵 New mission ping");
  }

  /**
   * Play reward received sound
   */
  rewardReceived() {
    // In production: this.play("reward", "/sounds/reward.mp3");
    console.log("🎵 Reward chime");
  }

  /**
   * Play purchase sound
   */
  purchase() {
    // In production: this.play("purchase", "/sounds/purchase.mp3");
    console.log("🎵 Purchase sound");
  }

  /**
   * Play error sound
   */
  error() {
    // In production: this.play("error", "/sounds/error.mp3");
    console.log("🎵 Error sound");
  }

  /**
   * Play click sound
   */
  click() {
    // In production: this.play("click", "/sounds/click.mp3");
    console.log("🎵 Click sound");
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects();
