/* ==========================================================================
   FOUR PI SYSTEMS — 4π Sphere Radiation Animation
   ========================================================================== */
(function () {
    'use strict';

    var canvas = document.getElementById('sphereCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');

    /* --- State --- */
    var w, h, cx, cy, R;
    var rot = 0;
    var baseTilt = 0.35;
    var mInfX = 0, mInfY = 0, tgtMX = 0, tgtMY = 0;
    var particles = [];
    var impacts = [];
    var visible = true;
    var spawnAccum = 0;

    /* --- Config --- */
    var MAX_PARTICLES = 45;
    var SPAWN_RATE = 0.35;
    var ROT_SPEED = 0.002;
    var LAT = 6;
    var LON = 10;
    var SEG = 60;

    /* --- Colors --- */
    var PINK = [255, 45, 120];
    var AMBER = [255, 176, 32];

    /* --- Resize --- */
    function resize() {
        var par = canvas.parentElement;
        var rect = par.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var size = Math.min(rect.width, rect.height);

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        w = h = size;
        cx = w / 2;
        cy = h / 2;
        R = size * 0.37;
    }

    /* --- 3D Transform + Project --- */
    function transform(x, y, z) {
        var tilt = baseTilt + mInfY;
        var yaw = rot + mInfX;

        // Rotate X (tilt)
        var ct = Math.cos(tilt), st = Math.sin(tilt);
        var y1 = y * ct - z * st;
        var z1 = y * st + z * ct;

        // Rotate Y (yaw)
        var cy2 = Math.cos(yaw), sy = Math.sin(yaw);
        var x1 = x * cy2 + z1 * sy;
        var z2 = -x * sy + z1 * cy2;

        // Perspective
        var fov = 500;
        var s = fov / (fov + z2);
        return { x: x1 * s + cx, y: y1 * s + cy, s: s, z: z2 };
    }

    /* --- Wireframe --- */
    function drawWireframe() {
        ctx.lineWidth = 0.6;

        var i, j, phi, theta, sp, cp, cosT, sinT, p, prev;

        // Latitude lines
        for (i = 1; i < LAT; i++) {
            phi = (Math.PI * i) / LAT;
            sp = Math.sin(phi);
            cp = Math.cos(phi);
            ctx.beginPath();
            for (j = 0; j <= SEG; j++) {
                theta = (2 * Math.PI * j) / SEG;
                p = transform(R * sp * Math.cos(theta), R * cp, R * sp * Math.sin(theta));
                if (j === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = 'rgba(255, 45, 120, 0.06)';
            ctx.stroke();
        }

        // Longitude lines
        for (i = 0; i < LON; i++) {
            theta = (2 * Math.PI * i) / LON;
            cosT = Math.cos(theta);
            sinT = Math.sin(theta);
            ctx.beginPath();
            for (j = 0; j <= SEG; j++) {
                phi = (Math.PI * j) / SEG;
                p = transform(R * Math.sin(phi) * cosT, R * Math.cos(phi), R * Math.sin(phi) * sinT);
                if (j === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = 'rgba(255, 45, 120, 0.06)';
            ctx.stroke();
        }
    }

    /* --- Grid Intersection Dots --- */
    function drawDots() {
        var i, j, phi, sp, cp, theta, p, depth, alpha, sz;

        for (i = 1; i < LAT; i++) {
            phi = (Math.PI * i) / LAT;
            sp = Math.sin(phi);
            cp = Math.cos(phi);
            for (j = 0; j < LON; j++) {
                theta = (2 * Math.PI * j) / LON;
                p = transform(R * sp * Math.cos(theta), R * cp, R * sp * Math.sin(theta));
                depth = (p.z + R) / (2 * R);
                alpha = 0.06 + depth * 0.35;
                sz = (0.6 + depth * 1.8) * p.s;

                ctx.beginPath();
                ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 45, 120, ' + alpha + ')';
                ctx.fill();
            }
        }

        // Pole dots
        var top = transform(0, R, 0);
        var bot = transform(0, -R, 0);
        var td = (top.z + R) / (2 * R);
        var bd = (bot.z + R) / (2 * R);

        ctx.beginPath();
        ctx.arc(top.x, top.y, (0.6 + td * 1.8) * top.s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 45, 120, ' + (0.06 + td * 0.35) + ')';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bot.x, bot.y, (0.6 + bd * 1.8) * bot.s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 45, 120, ' + (0.06 + bd * 0.35) + ')';
        ctx.fill();
    }

    /* --- Center Glow --- */
    function drawCenterGlow(t) {
        var pulse = 1 + 0.12 * Math.sin(t * 0.002);
        var gr = 28 * pulse;

        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        g.addColorStop(0.12, 'rgba(255, 45, 120, 0.5)');
        g.addColorStop(0.45, 'rgba(255, 45, 120, 0.08)');
        g.addColorStop(1, 'rgba(255, 45, 120, 0)');

        ctx.beginPath();
        ctx.arc(cx, cy, gr, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
    }

    /* --- Particles --- */
    function spawnParticle() {
        // Uniform random direction on unit sphere
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos(2 * Math.random() - 1);

        particles.push({
            dx: Math.sin(phi) * Math.cos(theta),
            dy: Math.cos(phi),
            dz: Math.sin(phi) * Math.sin(theta),
            t: 0,
            speed: 0.003 + Math.random() * 0.005,
            size: 0.8 + Math.random() * 1.2
        });
    }

    function drawParticles() {
        // Spawn
        spawnAccum += SPAWN_RATE;
        while (spawnAccum >= 1 && particles.length < MAX_PARTICLES) {
            spawnParticle();
            spawnAccum--;
        }
        if (spawnAccum >= 1) spawnAccum = 0;

        ctx.globalCompositeOperation = 'lighter';

        var i, pt, d, p, r, g, b, a, sz;

        for (i = particles.length - 1; i >= 0; i--) {
            pt = particles[i];
            pt.t += pt.speed;

            if (pt.t >= 1) {
                // Spawn impact at surface
                impacts.push({
                    x: pt.dx * R,
                    y: pt.dy * R,
                    z: pt.dz * R,
                    life: 1,
                    decay: 0.022 + Math.random() * 0.02
                });
                particles.splice(i, 1);
                continue;
            }

            d = pt.t * R;
            p = transform(pt.dx * d, pt.dy * d, pt.dz * d);

            // Lerp pink → amber
            r = PINK[0] + (AMBER[0] - PINK[0]) * pt.t;
            g = PINK[1] + (AMBER[1] - PINK[1]) * pt.t;
            b = PINK[2] + (AMBER[2] - PINK[2]) * pt.t;
            a = 0.5 + 0.5 * (1 - pt.t);
            sz = pt.size * p.s;

            // Outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, sz * 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + (a * 0.1) + ')';
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a + ')';
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    /* --- Surface Impacts --- */
    function drawImpacts() {
        if (impacts.length === 0) return;

        ctx.globalCompositeOperation = 'lighter';

        var i, imp, p, ringR, a;

        for (i = impacts.length - 1; i >= 0; i--) {
            imp = impacts[i];
            imp.life -= imp.decay;

            if (imp.life <= 0) {
                impacts.splice(i, 1);
                continue;
            }

            p = transform(imp.x, imp.y, imp.z);
            ringR = (1 - imp.life) * 12 * p.s;
            a = imp.life;

            // Expanding ring
            ctx.beginPath();
            ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 176, 32, ' + (a * 0.35) + ')';
            ctx.lineWidth = 1.2 * p.s;
            ctx.stroke();

            // Center flash
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 * p.s, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (a * 0.6) + ')';
            ctx.fill();

            // Soft glow at impact point
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 * p.s, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 176, 32, ' + (a * 0.08) + ')';
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    /* --- Animation Loop --- */
    function frame(t) {
        requestAnimationFrame(frame);
        if (!visible) return;

        ctx.clearRect(0, 0, w, h);

        rot += ROT_SPEED;

        // Smooth mouse influence
        mInfX += (tgtMX - mInfX) * 0.04;
        mInfY += (tgtMY - mInfY) * 0.04;

        drawWireframe();
        drawDots();
        drawCenterGlow(t);
        drawParticles();
        drawImpacts();
    }

    /* --- Events --- */
    canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        tgtMX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.4;
        tgtMY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3;
    });

    canvas.addEventListener('mouseleave', function () {
        tgtMX = 0;
        tgtMY = 0;
    });

    // Pause when out of view
    var observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);

    // Reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        ROT_SPEED = 0;
        SPAWN_RATE = 0.1;
        MAX_PARTICLES = 15;
    }

    /* --- Init --- */
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
})();
