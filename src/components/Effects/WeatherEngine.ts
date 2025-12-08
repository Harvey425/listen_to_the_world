
// Cinematic Weather Engine Logic
// Handles Particle Systems for Rain, Snow, and Lightning

interface Velocity {
    x: number;
    y: number;
}

export class Particle {
    x: number = 0;
    y: number = 0;
    z: number = 0; // 0 (far) to 1 (near)
    velocity: Velocity = { x: 0, y: 0 };
    radius: number = 0;
    alpha: number = 0;
    type: 'rain' | 'snow' | 'splash' | 'cloud' = 'rain';
    life: number = 100; // For Splash
    maxLife: number = 100;
    img: HTMLImageElement | null = null; // For cloud images

    constructor(width: number, height: number, type: 'rain' | 'snow' | 'cloud', depth: number, rainIntensity: number = 1) {
        this.reset(width, height, type, depth, rainIntensity);
    }

    reset(width: number, height: number, type: 'rain' | 'snow' | 'cloud', depth?: number, rainIntensity: number = 1) {
        this.type = type;
        this.x = Math.random() * width;
        this.y = Math.random() * -height; // Start above screen
        this.z = depth !== undefined ? depth : Math.random(); // Depth 0-1

        // Clouds override
        if (type === 'cloud') {
            this.x = Math.random() * width * 1.5 - (width * 0.25); // Wider spread
            this.y = Math.random() * (height * 0.6); // Upper 60% of screen
            this.alpha = 0.6 + Math.random() * 0.3; // Higher opacity for real images (0.6-0.9)
            this.radius = 200 + Math.random() * 300; // Large images

            // Pick Random Image
            if (WeatherSystem.cloudImages.length > 0) {
                this.img = WeatherSystem.cloudImages[Math.floor(Math.random() * WeatherSystem.cloudImages.length)];
            }

            this.velocity = {
                x: (0.05 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1), // Ultra slow drift
                y: 0
            };
            return;
        }
        // Near particles (z ~ 1) are faster, larger, more opaque
        const speedMultiplier = 1 + this.z * 1.5; // 1x to 2.5x speed

        // Rain Velocity Physics - TUNED DOWN (User Request)
        // Light (1) = 8-12 base, Moderate (2) = 13-18, Heavy (3) = 18-24
        const baseSpeed = 8 + (rainIntensity - 1) * 6; // Was 10 + (..)*10

        if (type === 'rain') {
            this.velocity = {
                x: (Math.random() - 0.5) * 0.5,
                y: (baseSpeed + Math.random() * 5) * speedMultiplier // Reduced random var from 10 to 5
            };
            this.alpha = 0.2 + this.z * 0.5; // 0.2 to 0.7
            this.radius = 0; // Not used for rain lines usually, uses length
        } else {
            // Snow
            this.velocity = {
                x: (Math.random() - 0.5) * 1.5, // Drift
                y: (1 + Math.random() * 2) * speedMultiplier
            };
            this.alpha = 0.4 + this.z * 0.4;
            this.radius = 1 + this.z * 3; // 1px to 4px
        }
    }

    update(width: number, height: number, globalWind: number) {
        this.x += this.velocity.x + globalWind * (1 + this.z); // Wind affects near particles more
        this.y += this.velocity.y;

        // Splash Logic: Only for Rain, Near Particles, hitting bottom
        if (this.type === 'rain' && this.y >= height && this.z > 0.7) {
            // Return "true" to signal splash creation
            const shouldSplash = Math.random() > 0.7; // 30% chance
            if (shouldSplash) return true;
        }

        if (this.type === 'cloud') {
            this.x += this.velocity.x;
            // Wrap around
            if (this.x > width + 300) {
                this.x = -300;
                this.y = Math.random() * (height * 0.6); // Randomize Y again
                // Randomize image again for variety
                if (WeatherSystem.cloudImages.length > 0) {
                    this.img = WeatherSystem.cloudImages[Math.floor(Math.random() * WeatherSystem.cloudImages.length)];
                }
            }
            if (this.x < -300) {
                this.x = width + 300;
                this.y = Math.random() * (height * 0.6);
                if (WeatherSystem.cloudImages.length > 0) {
                    this.img = WeatherSystem.cloudImages[Math.floor(Math.random() * WeatherSystem.cloudImages.length)];
                }
            }
            return false;
        }

        // Reset if out of bounds
        if (this.y > height || this.x > width || this.x < -100) {
            this.y = -20;
            this.x = Math.random() * width;
        }
        return false;
    }
}

export class SplashParticle extends Particle {
    constructor(x: number, y: number) {
        super(0, 0, 'rain', 1);
        this.type = 'splash';
        this.x = x;
        this.y = y;
        this.velocity = {
            x: (Math.random() - 0.5) * 4,
            y: -(Math.random() * 3 + 2) // Jump up
        };
        this.life = 10 + Math.random() * 10; // Short life
        this.maxLife = this.life;
        this.alpha = 0.6;
    }

    updateSplash() {
        this.velocity.y += 0.2; // Gravity
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life--;
        this.alpha = (this.life / this.maxLife) * 0.6;
        return this.life <= 0; // Return true if dead
    }
}

export class WeatherSystem {
    particles: Particle[] = [];
    splashes: SplashParticle[] = [];
    width: number = 0;
    height: number = 0;
    type: 'rain' | 'snow' | 'clear' | 'showers' | 'cloudy' = 'clear';
    intensity: number = 0; // 0 to 1

    // Lightning
    lightningTimer: number = 0;
    lightningIntensity: number = 0; // 0 to 1 opacity of flash
    cameraShake: { x: number, y: number } = { x: 0, y: 0 };

    static cloudImages: HTMLImageElement[] = [];
    static assetsLoaded = false;

    constructor() {
        if (!WeatherSystem.assetsLoaded) {
            this.loadCloudAssets();
        }
    }

    loadCloudAssets() {
        const cloudFiles = ['cloud1.webp', 'cloud2.webp', 'cloud3.webp', 'cloud4.webp', 'cloud5.webp', 'cloud6.webp'];
        cloudFiles.forEach(file => {
            const img = new Image();
            img.src = `/assets/weather/clouds/${file}`;
            WeatherSystem.cloudImages.push(img);
        });
        WeatherSystem.assetsLoaded = true;
    }

    init(width: number, height: number, type: 'rain' | 'snow' | 'clear' | 'showers' | 'cloudy', rainIntensity: number = 1) {
        this.width = width;
        this.height = height;
        this.type = type;
        this.particles = [];
        this.splashes = [];

        if (type === 'clear') return;

        // Base Count
        let count = 0;
        if (type === 'rain') count = 100 * (1 + (rainIntensity - 1) * 2.5); // 100, 350, 600
        else if (type === 'snow') count = 100;
        else if (type === 'showers') count = 150; // Reduced showers too
        else if (type === 'cloudy') count = 3; // Fewer, large real images (Less clutter)

        for (let i = 0; i < count; i++) {
            // Distribute z evenly
            this.particles.push(new Particle(width, height, type === 'cloudy' ? 'cloud' : (type === 'snow' ? 'snow' : 'rain'), Math.random(), rainIntensity));
        }
    }

    update(_deltaTime: number) {
        // 1. Showers Intensity Wave
        if (this.type === 'showers') {
            // Sine wave + Noise-ish
            const time = Date.now() * 0.0005;
            this.intensity = (Math.sin(time) + 1) / 2; // 0 to 1 smooth
            // Adjust particle visibility or recycling based on intensity
            // Simple approach: Only update/draw a subset roughly mapped to intensity?
            // Cinematic approach: Resetting particles out of bounds places them way above screen if intensity is low
        } else {
            this.intensity = 1;
        }

        // 2. Lightning Logic (Random Chance in heavy rain/showers)
        if (this.type === 'rain' && Math.random() < 0.002) { // 0.2% per frame (~once every 8s at 60fps)
            this.triggerLightning();
        }
        // Decay Lightning
        if (this.lightningIntensity > 0) {
            this.lightningIntensity *= 0.9; // Fast fade
            if (this.lightningIntensity < 0.01) this.lightningIntensity = 0;
        }

        // 3. Update Particles
        const wind = 0.5; // Constant slight wind
        this.particles.forEach(p => {
            const isSplash = p.update(this.width, this.height, wind);
            if (isSplash) {
                // Create Splash
                this.splashes.push(new SplashParticle(p.x, this.height));
                this.splashes.push(new SplashParticle(p.x, this.height));
            }
        });

        // 4. Update Splashes
        for (let i = this.splashes.length - 1; i >= 0; i--) {
            const dead = this.splashes[i].updateSplash();
            if (dead) this.splashes.splice(i, 1);
        }
    }

    triggerLightning() {
        this.lightningIntensity = 0.3 + Math.random() * 0.5; // Max 0.8
        this.cameraShake = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, this.width, this.height);

        // Lightning Flash Background
        if (this.lightningIntensity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningIntensity})`;
            ctx.fillRect(0, 0, this.width, this.height);
            // Apply Shake
            ctx.save();
            ctx.translate(this.cameraShake.x * this.lightningIntensity, this.cameraShake.y * this.lightningIntensity);
        }

        // Draw Particles
        // Optimization: Batch by type/style if possible, but loop is fine for <500 particles

        ctx.lineCap = 'round';

        this.particles.forEach(p => {
            // Culling for Showers Intensity
            if (this.type === 'showers' && Math.random() > this.intensity) return;

            if (p.type === 'rain') {
                ctx.beginPath();
                ctx.lineWidth = 0.5 + p.z * 0.5; // Thinner: 0.5px to 1px (Was 1-2)
                ctx.strokeStyle = `rgba(200, 220, 255, ${p.alpha})`; // Bluish tint

                // Motion Blur Length
                const len = p.velocity.y * (0.6 + p.z * 0.4); // Shorter trails (Was 1+z)
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.velocity.x * 2, p.y + len);
                ctx.stroke();
            } else if (p.type === 'snow') {
                // Snow
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'cloud' && p.img) {
                // Real Cloud Asset
                ctx.save();
                ctx.globalAlpha = p.alpha;
                // Draw image centered at p.x, p.y with radius scale
                // Aspect ratio is roughly maintained or just use radius as width/height
                // Assume 2:1 roughly? Or just use radius.
                const w = p.radius * 2;
                const h = p.radius * 1.2; // slightly flattened
                ctx.drawImage(p.img, p.x - w / 2, p.y - h / 2, w, h);
                ctx.restore();
            }
        });

        // Draw Splashes
        ctx.fillStyle = 'rgba(200, 220, 255, 0.6)';
        this.splashes.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        if (this.lightningIntensity > 0) {
            ctx.restore();
        }
    }
}
