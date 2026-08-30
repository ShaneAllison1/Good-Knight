class SoundManager {
  constructor() {
    this.musicMuted = false;
    this.sfxMuted = false;
    this.masterVolume = 0.5;
    //Audio assets
    this.sounds = {
      click: this.loadSound('./audio/buttonClick.wav', 0.4, false),
      swordSwing: this.loadSound('./audio/swordSwing.wav', 0.3, false),
      skeletonHit: this.loadSound('./audio/skeletonHit.wav', 0.2, false),
      buyUpgrade: this.loadSound('./audio/buyUpgrade.wav', 0.4, false),
      coinPickup: this.loadSound('./audio/coinPickup.wav', 0.3, false),
      gemPickup: this.loadSound('./audio/metal_clang.wav', 0.1, false),
      shardPickup: this.loadSound('./audio/shardPickup.mp3', 0.3, false),
      //Background music
      bgm: this.loadSound('./audio/bgm.mp3', 0.05, true),
      menuMusic: this.loadSound('./audio/MinigameMonkey.ogg', 0.05, true),
    };
  }

  //Method to instantiate audio assets
  loadSound(src, defaultVolume, isMusic) {
    const audio = new Audio();
    audio.src = src;
    audio.loop = isMusic;
    audio.volume = defaultVolume * this.masterVolume;
    if (isMusic) {
      audio.addEventListener(
        'ended',
        function () {
          this.currentTime = 0;
          this.play().catch((e) => console.log('Audio loop interrupted'));
        },
        false,
      );
    }
    return { audio, baseVolume: defaultVolume, isMusic };
  }

  //Set overall loudness
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    //Add adjustment to all audio
    Object.values(this.sounds).forEach((sound) => {
      sound.audio.volume = sound.baseVolume * this.masterVolume;
    });
  }

  //Play a sound instantly
  play(soundName) {
    if (this.muted) return;
    const soundConfig = this.sounds[soundName];
    if (!soundConfig) return;

    const audioAsset = soundConfig.audio;

    //If sound is already playing, allow overlap
    if (!audioAsset.paused) {
      const clone = audioAsset.cloneNode();
      clone.volume = soundConfig.baseVolume * this.masterVolume;
      clone.play().catch((e) => console.log('Audio blocked'));
    } else {
      audioAsset.currentTime = 0;
      audioAsset.play().catch((e) => console.log('Audio blocked'));
    }
  }

  //Play background music tracks
  playMusic(musicName) {
    const soundConfig = this.sounds[musicName];
    if (soundConfig) {
      soundConfig.audio.play().catch((e) => console.log('Music blocked'));
    }
  }

  stopMusic(musicName) {
    const soundConfig = this.sounds[musicName];
    if (soundConfig) {
      soundConfig.audio.pause();
      soundConfig.audio.currentTime = 0;
    }
  }

  //Toggle mute/unmute
  toggleMusicMute() {
    this.musicMuted = !this.musicMuted;
    //Stop background music if muted
    this.sounds.bgm.audio.muted = this.musicMuted;
    this.sounds.menuMusic.audio.muted = this.musicMuted;
    //if (!this.musicMuted) this.playMusic('bgm');
  }

  toggleSFXMute() {
    this.sfxMuted = !this.sfxMuted;
  }
}
