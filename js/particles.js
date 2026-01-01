/**
 * 高级粒子背景系统
 * 包含多种粒子效果、交互和动画
 */
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.animationId = null;
        
        // 配置参数
        this.config = {
            particleCount: 120,
            particleSize: { min: 0.5, max: 3 },
            particleSpeed: { min: 0.1, max: 0.8 },
            connectionDistance: 120,
            mouseConnectionDistance: 180,
            particleOpacity: { min: 0.3, max: 0.8 },
            connectionOpacity: { min: 0.1, max: 0.3 },
            glowEffect: true,
            pulseEffect: true,
            colorScheme: 'cyan' // cyan, purple, rainbow, matrix
        };
        
        // 颜色方案
        this.colorSchemes = {
            cyan: ['#00ffff', '#00cccc', '#0099ff', '#0066ff', '#00ffff'],
            purple: ['#ff00ff', '#cc00ff', '#9900ff', '#6600ff', '#ff00ff'],
            rainbow: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
            matrix: ['#00ff00', '#00cc00', '#009900', '#006600', '#00ff00']
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createParticles();
        this.setupEventListeners();
        this.animate();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
    }
    
    createParticles() {
        this.particles = [];
        const colors = this.colorSchemes[this.config.colorScheme];
        
        for (let i = 0; i < this.config.particleCount; i++) {
            const size = Math.random() * (this.config.particleSize.max - this.config.particleSize.min) + this.config.particleSize.min;
            const speedX = (Math.random() - 0.5) * this.config.particleSpeed.max;
            const speedY = (Math.random() - 0.5) * this.config.particleSpeed.max;
            const opacity = Math.random() * (this.config.particleOpacity.max - this.config.particleOpacity.min) + this.config.particleOpacity.min;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: size,
                originalSize: size,
                speedX: speedX,
                speedY: speedY,
                opacity: opacity,
                originalOpacity: opacity,
                color: color,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03,
                glowIntensity: Math.random() * 0.5 + 0.5,
                type: Math.random() > 0.8 ? 'special' : 'normal', // 20% 特殊粒子
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }
    
    setupEventListeners() {
        // 鼠标移动
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        // 鼠标离开
        document.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
        
        // 触摸事件
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            // 基础移动
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // 边界检测和反弹
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX = -particle.speedX;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY = -particle.speedY;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }
            
            // 脉冲效果
            if (this.config.pulseEffect) {
                particle.pulsePhase += particle.pulseSpeed;
                const pulseFactor = Math.sin(particle.pulsePhase) * 0.3 + 1;
                particle.size = particle.originalSize * pulseFactor;
                particle.opacity = particle.originalOpacity * pulseFactor;
            }
            
            // 旋转效果（特殊粒子）
            if (particle.type === 'special') {
                particle.rotation += particle.rotationSpeed;
            }
            
            // 鼠标交互
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouse.radius) {
                    const force = (1 - distance / this.mouse.radius) * 2;
                    particle.x -= (dx / distance) * force;
                    particle.y -= (dy / distance) * force;
                    
                    // 鼠标附近粒子发光增强
                    particle.glowIntensity = Math.min(1, particle.glowIntensity + 0.1);
                } else {
                    // 恢复原始发光强度
                    particle.glowIntensity = Math.max(0.5, particle.glowIntensity - 0.05);
                }
            }
        });
    }
    
    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制连线
        this.drawConnections();
        
        // 绘制粒子
        this.particles.forEach(particle => {
            this.ctx.save();
            
            // 设置透明度
            this.ctx.globalAlpha = particle.opacity;
            
            // 发光效果
            if (this.config.glowEffect) {
                this.ctx.shadowBlur = 10 * particle.glowIntensity;
                this.ctx.shadowColor = particle.color;
            }
            
            // 特殊粒子绘制（星形）
            if (particle.type === 'special') {
                this.drawStar(particle);
            } else {
                // 普通粒子（圆形）
                this.drawCircle(particle);
            }
            
            this.ctx.restore();
        });
    }
    
    drawCircle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color;
        this.ctx.fill();
        
        // 内部高光
        this.ctx.beginPath();
        this.ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fill();
    }
    
    drawStar(particle) {
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        const spikes = 5;
        const outerRadius = particle.size * 2;
        const innerRadius = particle.size;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = particle.color;
        this.ctx.fill();
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.config.connectionDistance) {
                    const opacity = (1 - distance / this.config.connectionDistance) * 
                                   this.config.connectionOpacity.max;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = opacity;
                    this.ctx.strokeStyle = this.particles[i].color;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
            
            // 鼠标连线
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.particles[i].x - this.mouse.x;
                const dy = this.particles[i].y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.config.mouseConnectionDistance) {
                    const opacity = (1 - distance / this.config.mouseConnectionDistance) * 0.5;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = opacity;
                    this.ctx.strokeStyle = this.particles[i].color;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }
    
    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // 公共方法
    setColorScheme(scheme) {
        if (this.colorSchemes[scheme]) {
            this.config.colorScheme = scheme;
            this.createParticles();
        }
    }
    
    setParticleCount(count) {
        this.config.particleCount = count;
        this.createParticles();
    }
    
    toggleGlowEffect() {
        this.config.glowEffect = !this.config.glowEffect;
    }
    
    togglePulseEffect() {
        this.config.pulseEffect = !this.config.pulseEffect;
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.resizeCanvas);
        document.removeEventListener('mousemove', this.setupEventListeners);
        document.removeEventListener('mouseleave', this.setupEventListeners);
    }
}

// 初始化粒子系统
document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new ParticleSystem();
    
    // 键盘快捷键切换效果
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    window.particleSystem.setColorScheme('cyan');
                    break;
                case '2':
                    e.preventDefault();
                    window.particleSystem.setColorScheme('purple');
                    break;
                case '3':
                    e.preventDefault();
                    window.particleSystem.setColorScheme('rainbow');
                    break;
                case '4':
                    e.preventDefault();
                    window.particleSystem.setColorScheme('matrix');
                    break;
                case 'g':
                    e.preventDefault();
                    window.particleSystem.toggleGlowEffect();
                    break;
                case 'p':
                    e.preventDefault();
                    window.particleSystem.togglePulseEffect();
                    break;
            }
        }
    });
});